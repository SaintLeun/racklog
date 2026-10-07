<?php
/**
 * Reenvia a Kommo los leads de leads_web que no llegaron (kommo_lead_id vacio).
 * Uso unico, solo por terminal. Ver docs/REENVIO_KOMMO.md.
 *
 *   php scripts/reenviar_kommo.php pendientes.json            muestra lo que enviaria (no envia nada)
 *   php scripts/reenviar_kommo.php pendientes.json --enviar   crea los leads en Kommo
 *
 * pendientes.json es la exportacion de Supabase (consulta en docs/REENVIO_KOMMO.md).
 * Escribe pendientes.resultado.json (para no duplicar si se vuelve a ejecutar) y
 * pendientes.update.sql (para guardar el id de Kommo en leads_web).
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

date_default_timezone_set('America/Santiago');

$apiDir = dirname(__DIR__);
require_once $apiDir . '/utils/rate_limit.php';
require_once $apiDir . '/utils/kommo.php';

// El token sale de config/token.php; KOMMO_BEARER_TOKEN lo reemplaza (para ejecutarlo fuera del servidor)
$BEARER_TOKEN = getenv('KOMMO_BEARER_TOKEN') ?: null;
if ($BEARER_TOKEN === null && is_file($apiDir . '/config/token.php')) {
    $BEARER_TOKEN = require $apiDir . '/config/token.php';
}

$args = array_slice($argv, 1);
$enviar = in_array('--enviar', $args, true);
$archivo = current(array_filter($args, fn($a) => !str_starts_with($a, '--')));

if (!$archivo || !is_file($archivo)) {
    fwrite(STDERR, "Uso: php scripts/reenviar_kommo.php pendientes.json [--enviar]\n");
    exit(1);
}

$leads = json_decode(file_get_contents($archivo), true);
if (!is_array($leads)) {
    fwrite(STDERR, "$archivo no es un JSON valido (debe ser el arreglo que exporta la consulta).\n");
    exit(1);
}

$base = preg_replace('/\.json$/i', '', $archivo);
$archivoResultado = $base . '.resultado.json';
$archivoSql = $base . '.update.sql';

// Leads ya creados en una ejecucion anterior: no se vuelven a enviar
$resultado = is_file($archivoResultado) ? (json_decode(file_get_contents($archivoResultado), true) ?: []) : [];

$pendientes = [];
foreach ($leads as $i => $lead) {
    $ref = $lead['referencia'] ?? '';
    $tipo = $lead['tipo'] ?? '';
    // La referencia termina en el SQL: solo se acepta el formato que genera la API
    if (!preg_match('/^(CT|QT)-\d{8}-[0-9a-f]{4}$/', $ref) || !in_array($tipo, ['contact', 'quote'], true)
        || !is_array($lead['datos'] ?? null)) {
        fwrite(STDERR, "Fila $i ignorada: referencia, tipo o datos no validos.\n");
        continue;
    }
    if (isset($resultado[$ref]['kommo_lead_id'])) {
        echo "$ref ya creado antes (Kommo {$resultado[$ref]['kommo_lead_id']}), se omite.\n";
        continue;
    }
    $pendientes[] = $lead;
}

echo count($pendientes) . " lead(s) por enviar a Kommo:\n";
foreach ($pendientes as $lead) {
    $tipo = $lead['tipo'] === 'quote' ? 'quote' : 'contact';
    echo "  {$lead['referencia']}  {$lead['creado_en']}  " . determineLeadName($lead['datos'], $tipo) . "\n";
}

if (!$enviar) {
    echo "\nNo se envio nada. Para crearlos en Kommo agrega --enviar.\n";
    exit(0);
}

if (kommoTokenAccepted() !== true) {
    fwrite(STDERR, "\nKommo no acepta el token (o no respondio). Revisa config/token.php antes de reenviar.\n");
    exit(1);
}

$fallidos = 0;
foreach ($pendientes as $lead) {
    $ref = $lead['referencia'];
    $recibido = strtotime($lead['creado_en'] ?? '') ?: null;

    // IP y navegador originales en el detalle del lead (formatLeadDetails los toma de $_SERVER)
    $_SERVER['REMOTE_ADDR'] = $lead['ip'] ?? null;
    $_SERVER['HTTP_USER_AGENT'] = $lead['user_agent'] ?? null;

    $r = createLead($lead['datos'], $lead['tipo'], $ref, $recibido);
    $estado = kommoEstado($r);

    if ($estado === 'creado') {
        $resultado[$ref] = ['kommo_lead_id' => $r['id'], 'reenviado' => date('c')];
        echo "OK     $ref -> Kommo {$r['id']}\n";
    } else {
        $fallidos++;
        echo "ERROR  $ref -> $estado" . ($r['error'] ? " ({$r['error']})" : '') . "\n";
        if ($estado === 'http_401' || $estado === 'http_403') {
            fwrite(STDERR, "Kommo rechazo el token; se detiene el reenvio.\n");
            break;
        }
    }

    // Guardar despues de cada lead: si se corta a mitad, la siguiente ejecucion no duplica
    file_put_contents($archivoResultado, json_encode($resultado, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    usleep(300000); // Kommo admite hasta 7 solicitudes por segundo
}

$sql = "-- Guardar en leads_web el id de los leads reenviados a Kommo (" . date('Y-m-d H:i') . ")\n";
foreach ($resultado as $ref => $r) {
    $sql .= sprintf(
        "update public.leads_web set kommo_lead_id = %d, kommo_estado = 'creado' where referencia = '%s' and kommo_lead_id is null;\n",
        $r['kommo_lead_id'],
        $ref
    );
}
file_put_contents($archivoSql, $sql);

echo "\nCreados en total: " . count($resultado) . ". Fallidos en esta ejecucion: $fallidos.\n";
echo "Ejecuta $archivoSql en Supabase > SQL Editor.\n";
exit($fallidos > 0 ? 2 : 0);
