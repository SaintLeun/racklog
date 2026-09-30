<?php

require_once __DIR__ . '/../utils/mailer.php';
require_once __DIR__ . '/../utils/rate_limit.php';
require_once __DIR__ . '/../utils/validation.php';
require_once __DIR__ . '/../utils/logger.php';

function jsonResponse(int $status, array $body): void {
    http_response_code($status);
    echo json_encode($body);
}

function handleSendEmail(string $method): void {
    if ($method !== 'POST') {
        header('Allow: POST, OPTIONS');
        jsonResponse(405, ['error' => 'Method not allowed']);
        return;
    }

    // Solo JSON: un formulario HTML de otro sitio no puede enviar este Content-Type
    // sin pasar por el preflight de CORS (proteccion contra CSRF)
    $contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
    if (!str_starts_with($contentType, 'application/json')) {
        jsonResponse(415, ['error' => 'Content-Type must be application/json']);
        return;
    }

    $raw = file_get_contents('php://input');
    if (strlen($raw) > 20000) {
        jsonResponse(413, ['error' => 'Payload too large']);
        return;
    }

    $input = json_decode($raw, true);
    if (!is_array($input)) {
        jsonResponse(400, ['error' => 'Invalid JSON']);
        return;
    }

    // Honeypot: los bots suelen rellenar campos ocultos que un usuario real no ve
    if (!empty($input['website'] ?? $input['honeypot'] ?? '')) {
        jsonResponse(200, ['status' => 'success']);
        return;
    }

    $type = is_string($input['type'] ?? null) ? strtolower(trim($input['type'])) : '';
    if ($type === 'contact') {
        [$data, $error] = validateContactData($input['data'] ?? null);
        $recipient = $data['email'] ?? null;
        $prefix = 'CT';
    } elseif ($type === 'quote') {
        [$data, $error] = validateQuoteData($input['data'] ?? null);
        $recipient = $data['customerEmail'] ?? null;
        $prefix = 'QT';
    } else {
        jsonResponse(400, ['error' => 'Invalid type']);
        return;
    }

    if ($error !== null) {
        jsonResponse(422, ['error' => $error]);
        return;
    }

    // Limites de uso: por IP, por destinatario y global
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (
        !checkRateLimit('ip', $ip, 5, 600) ||
        !checkRateLimit('to', strtolower($recipient), 3, 3600) ||
        !checkRateLimit('global', 'all', 200, 3600)
    ) {
        header('Retry-After: 600');
        jsonResponse(429, ['error' => 'Too many requests']);
        return;
    }

    $ref = $prefix . '-' . date('Ymd') . '-' . substr(bin2hex(random_bytes(3)), 0, 4);
    $internalEmail = 'contacto@racklog.cl';

    // La confirmacion va siempre al email del formulario, nunca a un destinatario libre
    $internalSent = sendEmail($internalEmail, $data, $type, $ref);
    $confirmationSent = sendEmail($recipient, $data, $type . '_confirmation', $ref);

    $leadResult = createLead($data, $type, $ref);
    $leadOk = $leadResult['error'] === null && $leadResult['status'] >= 200 && $leadResult['status'] < 300;

    logEvent($internalSent && $leadOk ? 'info' : 'error', 'form_submission', [
        'ref' => $ref,
        'type' => $type,
        'recipient' => maskEmail($recipient),
        'internal_email' => $internalSent,
        'confirmation_email' => $confirmationSent,
        'lead_created' => $leadOk,
        'kommo_status' => $leadResult['status'],
        'kommo_error' => $leadResult['error'],
    ]);

    // Si no llego ni el correo interno ni el lead, la solicitud se perdio: avisar al usuario
    if (!$internalSent && !$leadOk) {
        jsonResponse(502, ['error' => 'No se pudo registrar la solicitud', 'reference' => $ref]);
        return;
    }

    jsonResponse(200, [
        'status' => 'success',
        'reference' => $ref,
        'confirmation_sent' => $confirmationSent,
    ]);
}
