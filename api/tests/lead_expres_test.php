<?php
// Lead de la via expres y de la visita tecnica (prompt de conversion), contra un Kommo falso local.
// Uso: php api/tests/lead_expres_test.php [payload.json]
//   payload.json = el cuerpo que arma lib/flujo/conversion.js (payloadLead + leadExpres); lo genera
//   tests/flujo/prueba-lead-expres.mjs. Sin archivo se usa uno fijo con el mismo formato.

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
date_default_timezone_set('America/Santiago');

$api = dirname(__DIR__);
$log = tempnam(sys_get_temp_dir(), 'kommo_mock_');
$port = 18000 + random_int(0, 999);
putenv("MOCK_KOMMO_LOG={$log}");
putenv('MOCK_KOMMO_PARTES=3');
$server = proc_open(
    [PHP_BINARY, '-S', "127.0.0.1:{$port}", __DIR__ . '/mock_kommo.php'],
    [1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']],
    $pipes
);
register_shutdown_function(function () use ($server, $log) {
    proc_terminate($server);
    @unlink($log);
});
for ($i = 0; $i < 50 && !@fsockopen('127.0.0.1', $port); $i++) {
    usleep(100000);
}

putenv("KOMMO_API_URL=http://127.0.0.1:{$port}/api/v4/leads");
$BEARER_TOKEN = str_repeat('x', 40);
require_once $api . '/utils/logger.php';
require_once $api . '/utils/rate_limit.php';
require_once $api . '/utils/validation.php';
require_once $api . '/utils/kommo.php';

$fallos = 0;
function check(string $nombre, bool $ok): void {
    global $fallos;
    echo ($ok ? '  ok   ' : '  FALLA ') . $nombre . "\n";
    if (!$ok) $fallos++;
}
function solicitudes(): array {
    global $log;
    $r = array_map(fn($l) => json_decode($l, true), array_filter(explode("\n", (string) file_get_contents($log))));
    file_put_contents($log, '');
    return array_values($r);
}
function buscar(array $reqs, string $method, string $path): ?array {
    foreach ($reqs as $r) {
        if ($r['method'] === $method && $r['path'] === $path) return $r;
    }
    return null;
}


function payload(?string $archivo, array $base): array {
    if ($archivo && is_file($archivo)) {
        return json_decode((string) file_get_contents($archivo), true)['data'] ?? [];
    }
    return $base;
}
$fijo = [
    'customerName' => 'Ana Pérez', 'customerEmail' => 'ana@empresa.cl',
    'products' => [[ 'name' => 'Cotización exprés (Planifica tu bodega)', 'quantity' => 1, 'price' => 0, 'quoteOnly' => true, 'config' => [
        'Origen' => 'Planifica tu bodega (vía exprés)', 'Vía' => 'exprés', 'Comuna' => 'Quilicura (RM)', 'Precisión' => 'media (66 %)',
        'Datos por confirmar' => 'peso del pallet; medidas de la bodega', 'Visita técnica' => 'solicitada (RM)', 'Etiqueta' => 'tour-logistico',
    ]]],
];
[$lead, $err] = validateQuoteData(payload($argv[1] ?? null, $fijo));
check('payload valido para la API', $err === null);
$config = $lead['products'][0]['config'] ?? [];
$confirmar = array_filter(array_map('trim', explode(';', (string) ($config['Datos por confirmar'] ?? ''))));
$visitaRM = str_starts_with((string) ($config['Visita técnica'] ?? ''), 'solicitada');
echo "Via expres" . ($visitaRM ? ' con visita tecnica (RM)' : '') . ": " . count($confirmar) . " datos por confirmar\n";

check('es lead del tour', esLeadTour($lead, 'quote'));
solicitudes();
$creado = createLead($lead, 'quote', 'QT-20261023-expr');
$reqs = solicitudes();
$post = json_decode(buscar($reqs, 'POST', '/api/v4/leads')['body'] ?? '[]', true)[0] ?? [];
$tags = array_column($post['_embedded']['tags'] ?? [], 'name');
check('etiqueta tour-logistico', in_array('tour-logistico', $tags, true));
check('etiqueta via-expres', in_array('via-expres', $tags, true));
check('visita-tecnica solo si la pidio en la RM', in_array('visita-tecnica', $tags, true) === $visitaRM);

$ahora = 1792500000;
$res = procesarLeadTour($lead, 'quote', 'QT-20261023-expr', $creado, [], $ahora);
$reqs = solicitudes();
check('sin errores', $res !== null && $res['errores'] === []);
$nota = json_decode(buscar($reqs, 'POST', '/api/v4/leads/notes')['body'] ?? '[]', true)[0]['params']['text'] ?? '';
check('nota dice via expres', str_contains($nota, 'vía exprés'));
check('nota con la lista de datos por confirmar', str_contains($nota, 'Datos por confirmar (el cliente marcó "No lo sé"'));
foreach ($confirmar as $c) {
    check("  - {$c}", str_contains($nota, "- {$c}"));
}
check('nota con la comuna', str_contains($nota, 'Comuna: ' . ($config['Comuna'] ?? '')));
$tareas = array_merge(...array_map(fn($r) => json_decode($r['body'], true), array_values(array_filter($reqs, fn($r) => $r['method'] === 'POST' && $r['path'] === '/api/v4/tasks'))));
$textos = array_column($tareas, 'text');
check('tarea de cotizacion a 24 h', in_array('Enviar cotización (promesa máximo 24 horas)', $textos, true));
check('tarea "Coordinar visita técnica" solo con visita en la RM', in_array('Coordinar visita técnica', $textos, true) === $visitaRM);
check('todas las tareas vencen en 24 h', $tareas && array_unique(array_column($tareas, 'complete_till')) === [$ahora + 86400]);
check('la nota no promete fecha de visita', !preg_match('/\b(lunes|martes|miércoles|jueves|viernes|mañana|\d{1,2}[-\/]\d{1,2})\b/u', $nota));

// Fuera de la RM: sin etiqueta visita-tecnica, tarea de validar a distancia
$fuera = $lead;
$fuera['products'][0]['config']['Comuna'] = 'Temuco (Araucanía)';
$fuera['products'][0]['config']['Visita técnica'] = 'validar por videollamada o fotos';
solicitudes();
$c2 = createLead($fuera, 'quote', 'QT-20261023-regi');
$tags2 = array_column(json_decode(buscar(solicitudes(), 'POST', '/api/v4/leads')['body'] ?? '[]', true)[0]['_embedded']['tags'] ?? [], 'name');
check('regiones: sin visita-tecnica', !in_array('visita-tecnica', $tags2, true) && in_array('via-expres', $tags2, true));
procesarLeadTour($fuera, 'quote', 'QT-20261023-regi', $c2, [], $ahora);
$textos2 = array_column(array_merge(...array_map(fn($r) => json_decode($r['body'], true), array_values(array_filter(solicitudes(), fn($r) => $r['path'] === '/api/v4/tasks')))), 'text');
check('regiones: tarea de validar por videollamada o fotos', in_array('Validar medidas por videollamada o fotos', $textos2, true));

// Via diseño: sin via-expres
$diseno = $lead;
$diseno['products'][0]['config']['Vía'] = 'diseño';
unset($diseno['products'][0]['config']['Visita técnica']);
check('via diseño: solo tour-logistico', etiquetasTour($diseno) === ['tour-logistico']);

// Correo de confirmacion al cliente: la ingenieria como garantia y sin campos internos
require_once $api . '/utils/escape.php';
require_once $api . '/partials/baseStyles.php';
require_once $api . '/partials/template_quote_confirmation.php';
$conPuntaje = $lead;
$conPuntaje['products'][0]['config']['Puntaje del lead'] = '72/100';
$correo = generateQuoteConfirmation($conPuntaje, 'QT-20261023-expr');
check('correo: ingeniería valida con NCh2369 y ANSI MH16.1', str_contains($correo, 'NCh2369') && str_contains($correo, 'ANSI MH16.1'));
check('correo: sin puntaje ni etiqueta internos', !str_contains($correo, '72/100') && !str_contains($correo, 'tour-logistico'));

echo $fallos ? "\n{$fallos} pruebas fallaron\n" : "\nTodas las pruebas pasaron\n";
exit($fallos ? 1 : 0);
