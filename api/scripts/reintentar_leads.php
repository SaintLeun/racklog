<?php
/**
 * Reintenta los leads que quedaron en la cola (storage/leads_pendientes) porque al recibir
 * el formulario no llegaron a Kommo o a la intranet (p. ej. el servidor sin salida a internet).
 * Solo por terminal; en el servidor corre con un cron cada 5 minutos (ver docs/MAINTENANCE.md):
 *
 *   php scripts/reintentar_leads.php
 *
 * Primero Kommo y despues la intranet, para que la intranet guarde el id de Kommo.
 * Avisa a contacto@ cuando los registra y, una sola vez, si un lead lleva mas de una hora pendiente.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

date_default_timezone_set('America/Santiago');

$apiDir = dirname(__DIR__);
// El token de Kommo sale de config/token.php, igual que en la API
$BEARER_TOKEN = getenv('KOMMO_BEARER_TOKEN') ?: null;
if (is_file($apiDir . '/config/token.php')) {
    require $apiDir . '/config/token.php';
}
require_once $apiDir . '/utils/logger.php';
require_once $apiDir . '/utils/rate_limit.php';
require_once $apiDir . '/utils/kommo.php';
require_once $apiDir . '/utils/supabase.php';
require_once $apiDir . '/utils/mailer.php';
require_once $apiDir . '/utils/lead_queue.php';

$files = leadQueueFiles();
if (!$files) {
    exit(0);
}

// Evitar dos ejecuciones a la vez si una se demora mas de 5 minutos
$lock = fopen(leadQueueDir() . '/.lock', 'c');
if ($lock === false || !flock($lock, LOCK_EX | LOCK_NB)) {
    exit(0);
}

$registrados = [];
$revisarKommo = [];
$atrasados = [];
$kommoBloqueado = false;    // token rechazado: no insistir con los demas en esta pasada
$intranetBloqueada = false;

foreach ($files as $file) {
    $pendiente = json_decode((string) @file_get_contents($file), true);
    if (!is_array($pendiente['lead'] ?? null)) {
        logEvent('error', 'lead_queue_invalid', ['file' => basename($file)]);
        continue;
    }
    $lead = &$pendiente['lead'];
    $ref = $lead['referencia'];
    $errores = [];
    $kommoId = null;

    if ($pendiente['pendiente_kommo'] && !$kommoBloqueado) {
        // IP y navegador originales en el detalle del lead (formatLeadDetails los toma de $_SERVER)
        $_SERVER['REMOTE_ADDR'] = $lead['ip'];
        $_SERVER['HTTP_USER_AGENT'] = $lead['user_agent'];
        $r = createLead($lead['datos'], $lead['tipo'], $ref, strtotime($lead['creado_en']) ?: null);
        $estado = kommoEstado($r);

        if ($estado === 'creado') {
            $kommoId = $r['id'];
            $lead['kommo_lead_id'] = $r['id'];
            $lead['kommo_estado'] = 'creado';
            // Lead del tour: nota y tarea a 24 h (los archivos quedaron solo en el correo)
            $tour = procesarLeadTour($lead['datos'], $lead['tipo'], $ref, $r);
            if ($tour !== null && $tour['errores']) {
                logEvent('error', 'kommo_tour', ['ref' => $ref, 'kommo_lead_id' => $r['id']] + $tour);
            }
            $pendiente['pendiente_kommo'] = false;
            // Reenviar a la intranet para que guarde el id (registrar_lead_web lo completa si ya existia)
            $pendiente['pendiente_intranet'] = $pendiente['pendiente_intranet'] || intranetConfigured();
        } elseif (kommoReintentable($r)) {
            $errores[] = 'Kommo: ' . ($r['error'] ?? $estado);
            $kommoBloqueado = in_array($r['status'], [401, 403], true);
        } else {
            // Respuesta ambigua: reintentar podria duplicar el lead en Kommo
            $pendiente['pendiente_kommo'] = false;
            $lead['kommo_estado'] = $estado;
            $revisarKommo[] = "{$ref}  {$lead['nombre']}  ({$estado}" . ($r['error'] ? ", {$r['error']}" : '') . ')';
        }
    }

    if ($pendiente['pendiente_intranet'] && !$intranetBloqueada) {
        $r = sendLeadToIntranet($lead);
        if ($r['error'] === null) {
            $pendiente['pendiente_intranet'] = false;
        } else {
            $errores[] = 'intranet: ' . $r['error'];
            $intranetBloqueada = in_array($r['error'], ['no autorizado', 'not_configured'], true);
        }
    }

    if (!$pendiente['pendiente_kommo'] && !$pendiente['pendiente_intranet']) {
        unlink($file);
        $registrados[] = "{$ref}  {$lead['nombre']}  (recibido {$lead['creado_en']})"
            . ($lead['kommo_lead_id'] ? "  Kommo {$lead['kommo_lead_id']}" : '');
        logEvent('info', 'lead_queue_done', ['ref' => $ref, 'kommo_lead_id' => $lead['kommo_lead_id'],
            'intentos' => $pendiente['intentos'] + 1]);
        echo "OK     $ref\n";
        unset($lead);
        continue;
    }

    $pendiente['intentos']++;
    if ($errores) {
        $pendiente['ultimo_error'] = implode('; ', $errores);
    }
    if (empty($pendiente['aviso_atraso']) && strtotime($pendiente['encolado']) < time() - 3600) {
        $pendiente['aviso_atraso'] = date('c');
        $atrasados[] = "{$ref}  {$lead['nombre']}  (falta " . queuedLeadDestinos($pendiente)
            . ", {$pendiente['intentos']} intentos, ultimo error: {$pendiente['ultimo_error']})";
    }
    saveQueuedLead($pendiente);
    logEvent('error', 'lead_queue_retry_failed', ['ref' => $ref, 'kommo_lead_id' => $kommoId,
        'error' => $pendiente['ultimo_error']]);
    echo "ERROR  $ref -> {$pendiente['ultimo_error']}\n";
    unset($lead);
}

if ($registrados) {
    sendInternalAlert(
        count($registrados) . ' lead(s) pendientes ya quedaron registrados',
        "Se registraron los formularios que habian fallado:\n\n" . implode("\n", $registrados)
    );
}
if ($revisarKommo) {
    sendInternalAlert(
        count($revisarKommo) . ' lead(s) para revisar en Kommo',
        "Kommo respondio de forma ambigua y no se reintentan para no duplicarlos. Buscalos en Kommo por\n"
        . "la referencia y, si no estan, crealos a mano con los datos del correo \"desde Sitio Web\":\n\n"
        . implode("\n", $revisarKommo)
    );
}
if ($atrasados) {
    sendInternalAlert(
        count($atrasados) . ' lead(s) llevan mas de una hora pendientes',
        "Estos formularios siguen sin registrarse y se siguen reintentando cada 5 minutos.\n"
        . "Revisa la conexion del servidor, el token de Kommo (config/token.php) o Supabase (config/supabase.php).\n\n"
        . implode("\n", $atrasados)
    );
}

exit($kommoBloqueado || $intranetBloqueada || count(leadQueueFiles()) > 0 ? 2 : 0);
