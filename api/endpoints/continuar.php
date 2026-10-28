<?php
// "Continuar donde quede": envia al cliente el link a su diseño del flujo Planifica tu bodega.
// Solo links al flujo de racklog.cl (no sirve para mandar enlaces a otros sitios) y con limite por IP.

require_once __DIR__ . '/../utils/mailer.php';
require_once __DIR__ . '/../utils/rate_limit.php';
require_once __DIR__ . '/../utils/validation.php';
require_once __DIR__ . '/../utils/logger.php';

function handleContinuar(string $method): void {
    if ($method !== 'POST') {
        header('Allow: POST, OPTIONS');
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    if (!str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) {
        http_response_code(415);
        echo json_encode(['error' => 'Content-Type must be application/json']);
        return;
    }
    $raw = file_get_contents('php://input');
    $input = strlen($raw) <= 12000 ? json_decode($raw, true) : null;
    $email = cleanEmail($input['email'] ?? null);
    $nombre = cleanString($input['nombre'] ?? '', 80) ?? '';
    $link = linkDeDiseno($input['link'] ?? null);
    if (!$email || !$link) {
        http_response_code(422);
        echo json_encode(['error' => 'Datos inválidos']);
        return;
    }
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'desconocida';
    if (!checkRateLimit('continuar', $ip, 5, 3600)) {
        http_response_code(429);
        echo json_encode(['error' => 'Demasiados envíos, intenta más tarde']);
        return;
    }
    $ok = sendEmail($email, ['nombre' => $nombre, 'link' => $link], 'continuar', requestId());
    logEvent($ok ? 'info' : 'error', 'continuar_diseno', ['enviado' => $ok]);
    http_response_code($ok ? 200 : 502);
    echo json_encode($ok ? ['ok' => true] : ['error' => 'No se pudo enviar el correo']);
}
