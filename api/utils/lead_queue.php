<?php

require_once __DIR__ . '/logger.php';

/*
 * Cola de leads que no llegaron a Kommo o a la intranet al recibir el formulario
 * (p. ej. el servidor sin salida a internet). Un archivo JSON por referencia;
 * scripts/reintentar_leads.php los reintenta con un cron y avisa a contacto@.
 */

/** Carpeta de la cola (fuera del temporal del sistema: no debe borrarse sola) */
function leadQueueDir(): ?string {
    $dir = __DIR__ . '/../storage/leads_pendientes';
    return (is_dir($dir) || @mkdir($dir, 0700, true)) && is_writable($dir) ? $dir : null;
}

function leadQueueFile(string $ref): ?string {
    $dir = leadQueueDir();
    return $dir !== null && preg_match('/^(CT|QT)-\d{8}-[0-9a-f]{4}$/', $ref) ? "$dir/$ref.json" : null;
}

/**
 * Deja el lead en la cola
 * @param array $lead Registro armado por buildIntranetLead() (incluye los datos del formulario)
 */
function queueLead(array $lead, bool $pendienteKommo, bool $pendienteIntranet, string $error): bool {
    $pendiente = [
        'lead' => $lead,
        'pendiente_kommo' => $pendienteKommo,
        'pendiente_intranet' => $pendienteIntranet,
        'encolado' => date('c'),
        'intentos' => 1,
        'ultimo_error' => $error,
    ];
    if (!saveQueuedLead($pendiente)) {
        logEvent('error', 'lead_queue_unavailable', ['ref' => $lead['referencia']]);
        return false;
    }
    return true;
}

function saveQueuedLead(array $pendiente): bool {
    $file = leadQueueFile($pendiente['lead']['referencia']);
    if ($file === null || @file_put_contents($file, json_encode($pendiente, JSON_UNESCAPED_UNICODE), LOCK_EX) === false) {
        return false;
    }
    @chmod($file, 0600);
    return true;
}

/** @return string[] Archivos de la cola, del mas antiguo al mas nuevo */
function leadQueueFiles(): array {
    $dir = leadQueueDir();
    $files = $dir === null ? [] : (glob($dir . '/*.json') ?: []);
    usort($files, fn($a, $b) => filemtime($a) <=> filemtime($b));
    return $files;
}

/** Cuantos leads llevan en cola mas de $segundos (segun cuando entraron, no el ultimo reintento) */
function leadQueueOlderThan(int $segundos): int {
    return count(array_filter(leadQueueFiles(), function (string $file) use ($segundos): bool {
        $encolado = json_decode((string) @file_get_contents($file), true)['encolado'] ?? null;
        return is_string($encolado) && strtotime($encolado) < time() - $segundos;
    }));
}

/** Que destinos le faltan a un lead pendiente, para los avisos */
function queuedLeadDestinos(array $pendiente): string {
    return implode(' y ', array_keys(array_filter([
        'Kommo' => $pendiente['pendiente_kommo'],
        'intranet' => $pendiente['pendiente_intranet'],
    ])));
}
