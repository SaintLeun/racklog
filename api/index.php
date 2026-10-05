<?php

// Configuraciones generales
require_once __DIR__ . '/config/cors.php';
// Kommo es opcional: sin token.php (o con el valor de ejemplo) los leads solo van a la intranet
if (is_file(__DIR__ . '/config/token.php')) {
    require_once __DIR__ . '/config/token.php';
} else {
    $BEARER_TOKEN = getenv('KOMMO_BEARER_TOKEN') ?: null;
}

// Utilidades y plantillas
require_once __DIR__ . '/utils/logger.php';
require_once __DIR__ . '/utils/mailer.php';
require_once __DIR__ . '/utils/templates.php';
require_once __DIR__ . '/utils/kommo.php';

// Endpoints
require_once __DIR__ . '/endpoints/send_email.php';
require_once __DIR__ . '/endpoints/health.php';

// Manejo centralizado de errores: se registran en el log y el cliente
// recibe siempre un JSON generico, nunca trazas internas
set_exception_handler(function (Throwable $e): void {
    logEvent('error', 'uncaught_exception', [
        'class' => get_class($e),
        'message' => $e->getMessage(),
        'file' => basename($e->getFile()) . ':' . $e->getLine(),
    ]);
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json');
    }
    echo json_encode(['error' => 'Internal server error', 'request_id' => requestId()]);
});

register_shutdown_function(function (): void {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        logEvent('error', 'fatal_error', [
            'message' => $error['message'],
            'file' => basename($error['file']) . ':' . $error['line'],
        ]);
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Internal server error', 'request_id' => requestId()]);
        }
    }
});

header('X-Request-Id: ' . requestId());

// Routing
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path_parts = explode('/', trim($path, '/'));

// Si comienza con /api, lo eliminamos
if (count($path_parts) > 0 && $path_parts[0] === 'api') {
    array_shift($path_parts);
}

$endpoint = implode('/', $path_parts);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

switch ($endpoint) {
    case 'send-email':
        handleSendEmail($method);
        break;

    case 'health':
        handleHealth($method);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}
