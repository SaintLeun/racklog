<?php

// Configuraciones generales
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/token.php';

// Utilidades y plantillas
require_once __DIR__ . '/utils/mailer.php';
require_once __DIR__ . '/utils/templates.php';

// Endpoints
require_once __DIR__ . '/endpoints/kommo.php';
require_once __DIR__ . '/endpoints/send_email.php';

// Routing
$request_uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

$path = parse_url($request_uri, PHP_URL_PATH);
$path_parts = explode('/', trim($path, '/'));

// Si comienza con /api, lo eliminamos
if (count($path_parts) > 0 && $path_parts[0] === 'api') {
    array_shift($path_parts);
}

$endpoint = implode('/', $path_parts);

// Ruteo por endpoint
switch ($endpoint) {
    case 'create-lead':
        handleCreateLead($method);
        break;

    case 'send-email':
        handleSendEmail($method);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => "Endpoint not found: {$endpoint}"]);
        break;
}
