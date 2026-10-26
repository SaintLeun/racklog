<?php
// Servidor falso de Kommo para las pruebas (php -S 127.0.0.1:PUERTO api/tests/mock_kommo.php).
// Guarda cada solicitud en MOCK_KOMMO_LOG y responde lo minimo que devuelve Kommo.
if (PHP_SAPI !== 'cli-server') {
    http_response_code(404);
    exit;
}
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
$body = file_get_contents('php://input');
file_put_contents(getenv('MOCK_KOMMO_LOG'), json_encode([
    'method' => $method,
    'path' => $path,
    'query' => $_SERVER['QUERY_STRING'] ?? '',
    'auth' => $_SERVER['HTTP_AUTHORIZATION'] ?? '',
    // Las partes de archivo son binarias: van en base64 para que el registro siga siendo JSON
    'body' => mb_check_encoding($body, 'UTF-8') ? $body : 'base64:' . base64_encode($body),
]) . "\n", FILE_APPEND | LOCK_EX);

header('Content-Type: application/json');
$host = 'http://' . $_SERVER['HTTP_HOST'];
$falla = getenv('MOCK_KOMMO_FALLA') ?: '';

if ($falla !== '' && str_contains($path, $falla)) {
    http_response_code(500);
    echo '{"title":"error"}';
} elseif ($method === 'POST' && $path === '/api/v4/leads') {
    echo json_encode(['_embedded' => ['leads' => [['id' => 555001]]]]);
} elseif ($method === 'GET' && $path === '/api/v4/leads/555001') {
    echo json_encode(['id' => 555001, 'responsible_user_id' => 777]);
} elseif ($method === 'POST' && $path === '/api/v4/tasks') {
    echo json_encode(['_embedded' => ['tasks' => [['id' => 9001]]]]);
} elseif ($method === 'POST' && $path === '/api/v4/leads/notes') {
    echo json_encode(['_embedded' => ['notes' => [['id' => 8001]]]]);
} elseif ($method === 'GET' && $path === '/api/v4/account') {
    echo json_encode(['id' => 1, 'drive_url' => $host . '/drive']);
} elseif ($method === 'POST' && $path === '/drive/v1.0/sessions') {
    echo json_encode(['session_id' => 1, 'upload_url' => $host . '/drive/upload/1', 'max_part_size' => 4]);
} elseif ($method === 'POST' && str_starts_with($path, '/drive/upload/')) {
    // Partes de 4 bytes: la ultima devuelve el uuid
    $n = (int) basename($path);
    $total = (int) (getenv('MOCK_KOMMO_PARTES') ?: 1);
    echo json_encode($n < $total ? ['next_url' => $host . '/drive/upload/' . ($n + 1)] : ['uuid' => 'uuid-plano']);
} elseif ($method === 'PUT' && $path === '/api/v4/leads/555001/files') {
    echo json_encode(['_embedded' => ['files' => [['file_uuid' => 'uuid-plano']]]]);
} else {
    http_response_code(404);
    echo '{"title":"not found"}';
}
