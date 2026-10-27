<?php
// Pruebas del lead del tour en Kommo, contra un Kommo falso local (nunca el real).
// Uso: php api/tests/kommo_tour_test.php

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

// Mismo formato que arma components/flujo/PasoCotiza.vue + ContactModal.vue
[$tour] = validateQuoteData([
    'customerName' => 'Ana Pérez',
    'customerEmail' => 'ana@example.com', 'customerRut' => '76.086.428-5',
    'customerPhone' => '+56 9 1234 5678',
    'linkDiseno' => 'https://racklog.cl/planifica-tu-bodega/disena?d=abc&recorrido=1',
    'products' => [[
        'name' => 'Diseño de bodega (Planifica tu bodega)',
        'quantity' => 1,
        'price' => 0,
        'quoteOnly' => true,
        'config' => [
            'Origen' => 'Planifica tu bodega (landing)',
            'Rol' => 'Jefe de bodega',
            'Industria' => 'Retail',
            'Bodega' => '20 × 40 m',
            'Flags' => 'urgente, crecimiento',
            'Campaña' => 'utm_source=google · utm_medium=cpc · utm_campaign=bodega-oct · fbclid=abc123',
            'Etiqueta' => 'tour-logistico',
            'Puntaje del lead' => '72/100',
        ],
    ]],
]);
$tour['adjuntos'] = ['plano.png'];

echo "Deteccion y datos\n";
check('lead del tour detectado', esLeadTour($tour, 'quote'));
check('un contacto no es del tour', !esLeadTour(['name' => 'x'], 'contact'));
[$otro] = validateQuoteData(['customerName' => 'B', 'customerEmail' => 'b@example.com',
    'products' => [['name' => 'Rack selectivo', 'config' => ['alto' => '4m']]]]);
check('cotizacion normal no es del tour', !esLeadTour($otro, 'quote'));
$d = datosTour($tour);
check('rol e industria', $d['rol'] === 'Jefe de bodega' && $d['industria'] === 'Retail');
check('puntaje 72', $d['puntaje'] === 72);
check('UTM separados', $d['utm'] === ['utm_source' => 'google', 'utm_medium' => 'cpc', 'utm_campaign' => 'bodega-oct', 'fbclid' => 'abc123']);

echo "Validacion conserva etiqueta y puntaje con muchos pares\n";
$config = ['Origen' => 'Planifica tu bodega (landing)'];
for ($i = 1; $i <= 35; $i++) $config["Pallet P{$i}"] = "10 u · 1,2 m";
$config['Etiqueta'] = 'tour-logistico';
$config['Puntaje del lead'] = '80/100';
$config['Campaña'] = str_repeat('utm_campaign=larga · ', 8);
[$grande] = validateQuoteData(['customerName' => 'C', 'customerEmail' => 'c@example.com', 'customerRut' => '76.086.428-5',
    'products' => [['name' => 'Diseño', 'config' => $config]]]);
check('Etiqueta y Puntaje no se cortan', ($grande['products'][0]['config']['Etiqueta'] ?? '') === 'tour-logistico'
    && ($grande['products'][0]['config']['Puntaje del lead'] ?? '') === '80/100');
check('Campaña de mas de 100 caracteres entera', mb_strlen($grande['products'][0]['config']['Campaña']) > 100);

echo "createLead agrega la etiqueta y los campos configurados\n";
$KOMMO_CAMPOS_TOUR = ['rol' => 1001, 'industria' => 1002, 'puntaje' => 1003, 'utm_source' => 1004, 'flags' => 0];
solicitudes();
$lead = createLead($tour, 'quote', 'QT-20261021-abcd');
$reqs = solicitudes();
$post = buscar($reqs, 'POST', '/api/v4/leads');
$payload = json_decode($post['body'] ?? '[]', true)[0] ?? [];
check('lead creado con id', $lead['id'] === 555001);
check('etiqueta tour-logistico', ($payload['_embedded']['tags'] ?? null) === [['name' => 'tour-logistico']]);
$campos = array_column($payload['custom_fields_values'] ?? [], 'values', 'field_id');
check('campo rol', ($campos[1001][0]['value'] ?? null) === 'Jefe de bodega');
check('campo puntaje numerico', ($campos[1003][0]['value'] ?? null) === 72);
check('campo utm_source', ($campos[1004][0]['value'] ?? null) === 'google');
check('field_id 0 se ignora', !isset($campos[0]));
check('campos originales intactos', isset($campos[760802], $campos[760600], $campos[760598]));
check('token en la cabecera', ($post['auth'] ?? '') === 'Bearer ' . $BEARER_TOKEN);

createLead($otro, 'quote', 'QT-20261021-0000');
$payloadOtro = json_decode(buscar(solicitudes(), 'POST', '/api/v4/leads')['body'] ?? '[]', true)[0] ?? [];
check('cotizacion normal sin etiqueta ni campos del tour', !isset($payloadOtro['_embedded']) && count($payloadOtro['custom_fields_values']) === 3);
$KOMMO_CAMPOS_TOUR = null;

echo "procesarLeadTour: nota, tarea a 24 h y plano\n";
$ahora = 1792500000;
$plano = [['name' => 'plano.png', 'type' => 'image/png', 'content' => '0123456789']]; // 3 partes de 4 bytes
$res = procesarLeadTour($tour, 'quote', 'QT-20261021-abcd', $lead, $plano, $ahora);
$reqs = solicitudes();
check('sin errores', $res !== null && $res['errores'] === []);
$tarea = json_decode(buscar($reqs, 'POST', '/api/v4/tasks')['body'] ?? '[]', true)[0] ?? [];
check('tarea sobre el lead', ($tarea['entity_type'] ?? '') === 'leads' && ($tarea['entity_id'] ?? 0) === 555001);
check('tarea para el responsable del lead', ($tarea['responsible_user_id'] ?? null) === 777);
check('vence en 24 h', ($tarea['complete_till'] ?? 0) === $ahora + 86400);
check('texto de la tarea', ($tarea['text'] ?? '') === 'Enviar cotización (promesa máximo 24 horas)');
check('id de la tarea en el resultado', $res['tarea'] === 9001);
$nota = json_decode(buscar($reqs, 'POST', '/api/v4/leads/notes')['body'] ?? '[]', true)[0]['params']['text'] ?? '';
foreach (['Rol: Jefe de bodega', 'Industria: Retail', 'Puntaje: 72/100', 'Flags: urgente, crecimiento', 'utm_source=google', 'fbclid=abc123', 'tour-logistico', 'plano.png'] as $t) {
    check("nota con \"{$t}\"", str_contains($nota, $t));
}
$partes = array_filter($reqs, fn($r) => str_starts_with($r['path'], '/drive/upload/'));
check('plano subido en 3 partes', count($partes) === 3 && implode('', array_column($partes, 'body')) === '0123456789');
$sesion = json_decode(buscar($reqs, 'POST', '/drive/v1.0/sessions')['body'] ?? '{}', true);
check('sesion con nombre, tamaño y tipo', $sesion === ['file_name' => 'plano.png', 'file_size' => 10, 'content_type' => 'image/png']);
check('plano vinculado al lead', json_decode(buscar($reqs, 'PUT', '/api/v4/leads/555001/files')['body'] ?? '[]', true) === [['file_uuid' => 'uuid-plano']]);
check('1 archivo en el resultado', $res['archivos'] === 1);

echo "Responsable fijo y adjuntos desactivados\n";
$KOMMO_RESPONSABLE_TOUR = 4242;
$KOMMO_ADJUNTOS = false;
$res = procesarLeadTour($tour, 'quote', 'QT-20261021-abcd', $lead, $plano, $ahora);
$reqs = solicitudes();
check('tarea al responsable configurado', (json_decode(buscar($reqs, 'POST', '/api/v4/tasks')['body'], true)[0]['responsible_user_id'] ?? null) === 4242);
check('sin GET del lead', buscar($reqs, 'GET', '/api/v4/leads/555001') === null);
check('sin subir archivos', buscar($reqs, 'POST', '/drive/v1.0/sessions') === null && $res['errores'] === []);
$KOMMO_RESPONSABLE_TOUR = null;
$KOMMO_ADJUNTOS = null;

echo "Modo prueba: etiqueta PRUEBA, sin vendedor ni tarea\n";
$prueba = $tour;
$prueba['customerEmail'] = 'comercial+prueba@racklog.cl';
$prueba['products'][0]['config']['Prueba'] = 'sí';
$KOMMO_RESPONSABLE_TOUR = 4242;
check('lead de prueba detectado', esPruebaTour($prueba));
solicitudes();
$leadP = createLead($prueba, 'quote', 'QT-20261021-prue');
$payloadP = json_decode(buscar(solicitudes(), 'POST', '/api/v4/leads')['body'] ?? '[]', true)[0] ?? [];
check('etiquetas tour-logistico y PRUEBA', ($payloadP['_embedded']['tags'] ?? null) === [['name' => 'tour-logistico'], ['name' => 'PRUEBA']]);
check('sin vendedor asignado', !isset($payloadP['responsible_user_id']));
$res = procesarLeadTour($prueba, 'quote', 'QT-20261021-prue', $leadP, [], $ahora);
$reqs = solicitudes();
check('sin tarea de 24 h', buscar($reqs, 'POST', '/api/v4/tasks') === null && $res['tarea'] === null && ($res['prueba'] ?? false));
$notaP = json_decode(buscar($reqs, 'POST', '/api/v4/leads/notes')['body'] ?? '[]', true)[0]['params']['text'] ?? '';
check('nota marcada PRUEBA', str_starts_with($notaP, 'PRUEBA'));
$falso = $prueba; $falso['customerEmail'] = 'cliente@empresa.cl';
check('con correo real no es prueba (ni con ?prueba=1)', !esPruebaTour($falso));
$KOMMO_RESPONSABLE_TOUR = null;

echo "Errores no rompen\n";
check('sin lead no hace nada', procesarLeadTour($tour, 'quote', 'QT-1', ['id' => null]) === null && solicitudes() === []);
check('lead normal no hace nada', procesarLeadTour($otro, 'quote', 'QT-1', $lead) === null);
$GLOBALS['KOMMO_HTTP_MOCK'] = fn($m, $u) => str_ends_with($u, '/tasks')
    ? ['status' => 500, 'body' => null, 'error' => null]
    : ($m === 'GET' ? ['status' => 0, 'body' => null, 'error' => 'Connection timed out'] : ['status' => 200, 'body' => [], 'error' => null]);
$res = procesarLeadTour($tour, 'quote', 'QT-1', $lead, $plano, $ahora);
check('tarea fallida queda registrada', $res['tarea'] === false && in_array('tarea: http_500', $res['errores'], true));
check('sin responsable la tarea igual se intenta', $res['responsable'] === null);
check('sin drive_url el adjunto falla sin excepcion', (bool) array_filter($res['errores'], fn($e) => str_starts_with($e, 'archivos: sin drive_url')));
$GLOBALS['KOMMO_HTTP_MOCK'] = function () { throw new RuntimeException('caida'); };
$res = procesarLeadTour($tour, 'quote', 'QT-1', $lead, [], $ahora);
check('excepcion atrapada', in_array('excepcion: caida', $res['errores'], true));
unset($GLOBALS['KOMMO_HTTP_MOCK']);

echo "Video recorrido (dueño 27-10: lo envía el ejecutivo)\n";
check('link del diseño aceptado', $tour['linkDiseno'] === 'https://racklog.cl/planifica-tu-bodega/disena?d=abc&recorrido=1');
check('nota de Kommo con el link del recorrido', str_contains(textoNotaTour($tour, 'QT-1'), 'Video recorrido: ') && str_contains(textoNotaTour($tour, 'QT-1'), 'recorrido=1'));
[$ajeno] = validateQuoteData(['customerName' => 'D', 'customerEmail' => 'd@example.com', 'linkDiseno' => 'https://otro.cl/planifica-tu-bodega/disena?d=x',
    'products' => [['name' => 'Rack', 'quantity' => 1, 'price' => 0]]]);
check('link a otro sitio descartado', $ajeno['linkDiseno'] === '');
require_once __DIR__ . '/../utils/escape.php';
require_once __DIR__ . '/../partials/template_quote.php';
check('correo interno con el botón del recorrido', str_contains(recorridoSection($tour), 'Abrir diseño y grabar el recorrido') && recorridoSection($ajeno) === '');

$BEARER_TOKEN = 'PON_AQUI_EL_TOKEN_ROTADO';
check('sin token no hace nada', procesarLeadTour($tour, 'quote', 'QT-1', $lead) === null);

echo $fallos ? "\n{$fallos} prueba(s) fallaron\n" : "\nTodas las pruebas pasaron\n";
exit($fallos ? 1 : 0);
