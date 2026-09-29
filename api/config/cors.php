<?php

// Solo los sitios propios pueden llamar a la API desde un navegador
$allowedOrigins = [
    'https://racklog.cl',
    'https://www.racklog.cl',
    'http://localhost:3000', // desarrollo local (nuxt dev)
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
header('Vary: Origin');
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(in_array($origin, $allowedOrigins, true) ? 204 : 403);
    exit();
}

// No exponer errores de PHP al publico; quedan en el log del servidor
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
header('Content-Type: application/json');
