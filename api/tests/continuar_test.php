<?php
// php api/tests/continuar_test.php — validacion del link de "Continuar donde quede"
require_once __DIR__ . '/../endpoints/continuar.php';
$casos = [
    ['https://racklog.cl/planifica-tu-bodega/disena?d=abc', true],
    ['https://www.racklog.cl/planifica-tu-bodega/disena/?d=abc', true],
    ['http://localhost/planifica-tu-bodega/disena?d=x', true],
    ['http://racklog.cl/planifica-tu-bodega/disena?d=x', false],
    ['https://evil.com/planifica-tu-bodega/disena?d=x', false],
    ['https://racklog.cl/otra-pagina', false],
    ['javascript:alert(1)', false],
    [str_repeat('a', 9000), false],
];
$fallas = 0;
foreach ($casos as [$link, $esperado]) {
    $ok = linkDeDiseno($link) !== null;
    if ($ok !== $esperado) { $fallas++; echo "FALLA: " . substr($link, 0, 60) . "\n"; }
}
echo $fallas ? "$fallas fallas\n" : count($casos) . " pruebas ok\n";
exit($fallas ? 1 : 0);
