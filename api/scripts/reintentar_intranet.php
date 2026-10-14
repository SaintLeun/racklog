<?php
/**
 * Reintenta guardar en la intranet los leads que quedaron en la cola
 * (storage/intranet_pendientes) porque Supabase fallo al recibir el formulario.
 * Solo por terminal; en el servidor corre con un cron cada 5 minutos (ver docs/MAINTENANCE.md):
 *
 *   php scripts/reintentar_intranet.php
 *
 * Avisa a contacto@ cuando los guarda y, una sola vez, si un lead lleva mas de una hora sin poder guardarse.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

date_default_timezone_set('America/Santiago');

$apiDir = dirname(__DIR__);
require_once $apiDir . '/utils/logger.php';
require_once $apiDir . '/utils/kommo.php';
require_once $apiDir . '/utils/supabase.php';
require_once $apiDir . '/utils/mailer.php';

$files = intranetQueueFiles();
if (!$files) {
    exit(0);
}

// Evitar dos ejecuciones a la vez si una se demora mas de 5 minutos
$lock = fopen(intranetQueueDir() . '/.lock', 'c');
if ($lock === false || !flock($lock, LOCK_EX | LOCK_NB)) {
    exit(0);
}

$guardados = [];
$atrasados = [];
$fallidos = 0;

foreach ($files as $file) {
    $pendiente = json_decode((string) @file_get_contents($file), true);
    if (!is_array($pendiente['lead'] ?? null)) {
        logEvent('error', 'intranet_queue_invalid', ['file' => basename($file)]);
        continue;
    }
    $lead = $pendiente['lead'];
    $ref = $lead['referencia'];

    $r = sendLeadToIntranet($lead);
    if ($r['error'] === null) {
        unlink($file);
        $guardados[] = "{$ref}  {$lead['nombre']}  (recibido {$lead['creado_en']})";
        logEvent('info', 'intranet_queue_saved', ['ref' => $ref, 'intentos' => $pendiente['intentos'] + 1]);
        echo "OK     $ref\n";
        continue;
    }

    $fallidos++;
    $pendiente['intentos']++;
    $pendiente['ultimo_error'] = $r['error'];
    if (empty($pendiente['aviso_atraso']) && strtotime($pendiente['encolado']) < time() - 3600) {
        $pendiente['aviso_atraso'] = date('c');
        $atrasados[] = "{$ref}  {$lead['nombre']}  ({$pendiente['intentos']} intentos, ultimo error: {$r['error']})";
    }
    file_put_contents($file, json_encode($pendiente, JSON_UNESCAPED_UNICODE), LOCK_EX);
    logEvent('error', 'intranet_queue_retry_failed', ['ref' => $ref, 'error' => $r['error']]);
    echo "ERROR  $ref -> {$r['error']}\n";

    // Si la intranet rechaza el token o no esta configurada, los demas fallaran igual
    if ($r['error'] === 'no autorizado' || $r['error'] === 'not_configured') {
        break;
    }
}

if ($guardados) {
    sendInternalAlert(
        count($guardados) . ' lead(s) pendientes ya estan en la intranet',
        "Se guardaron en la intranet los formularios que habian fallado:\n\n" . implode("\n", $guardados)
    );
}
if ($atrasados) {
    sendInternalAlert(
        count($atrasados) . ' lead(s) llevan mas de una hora sin guardarse en la intranet',
        "Estos formularios siguen sin poder guardarse en la intranet. Se siguen reintentando cada 5 minutos;\n"
        . "revisa la configuracion de Supabase (config/supabase.php) o la funcion registrar_lead_web.\n\n"
        . implode("\n", $atrasados)
    );
}

exit($fallidos > 0 ? 2 : 0);
