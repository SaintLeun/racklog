<?php

require_once __DIR__ . '/../utils/mailer.php';
require_once __DIR__ . '/../utils/rate_limit.php';

function handleSendEmail(string $method): void {
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $inputJSON = file_get_contents('php://input');
    $input = json_decode($inputJSON, true);

    $to = $input['to'] ?? $_POST['to'] ?? '';
    $content = $input['data'] ?? $input['text'] ?? $_POST['text'] ?? '';
    $type = strtolower(trim($input['type'] ?? $_POST['type'] ?? 'quote'));

    if (empty($to) || empty($content)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required parameters (to, data/text)']);
        return;
    }

    // Honeypot: los bots suelen rellenar campos ocultos que un usuario real no ve
    if (!empty($input['website'] ?? $input['honeypot'] ?? '')) {
        http_response_code(200);
        echo json_encode(['status' => 'success', 'message' => 'Email sent successfully']);
        return;
    }

    // Validar destinatario y tamano del contenido
    if (!is_string($to) || strlen($to) > 254 || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email address']);
        return;
    }

    if (strlen(is_string($content) ? $content : json_encode($content)) > 20000) {
        http_response_code(413);
        echo json_encode(['error' => 'Payload too large']);
        return;
    }

    // Limites de uso: por IP, por destinatario y global
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (
        !checkRateLimit('ip', $ip, 5, 600) ||
        !checkRateLimit('to', strtolower($to), 3, 3600) ||
        !checkRateLimit('global', 'all', 200, 3600)
    ) {
        http_response_code(429);
        header('Retry-After: 600');
        echo json_encode(['error' => 'Too many requests']);
        return;
    }

    // Registrar para depuración
    error_log("handleSendEmail: tipo recibido: {$type}");

    // Email interno
    $internalEmail = 'contacto@racklog.cl';
    $ref = null;
    $internalResult = null;
    $clientResult = null;

    // Usar elseif para evitar que se ejecuten ambos bloques
    if($type === 'quote') {
        $ref = 'QT-' . date('Ymd') . '-' . substr(uniqid(), -4);
        
        error_log("Procesando cotización con ref: {$ref}");
        
        // correo interno para cotización
        $internalResult = sendEmail($internalEmail, $content, 'quote', $ref);
        
        // correo al cliente para cotización
        $clientResult = sendEmail($to, $content, 'quote_confirmation', $ref);
    }
    elseif ($type === 'contact') {
        $ref = 'CT-' . date('Ymd') . '-' . substr(uniqid(), -4);
        
        error_log("Procesando contacto con ref: {$ref}");
        
        // correo interno para contacto
        $internalResult = sendEmail($internalEmail, $content, 'contact', $ref);
        
        // correo al cliente para contacto
        $clientResult = sendEmail($to, $content, 'contact_confirmation', $ref);
    }
    else {
        http_response_code(400);
        echo json_encode(['error' => 'Tipo no válido: ' . $type]);
        return;
    }

    // Asegurarnos de que el contenido pasado a createLead es un array
    $leadData = is_array($content) ? $content : $input;
    $leadResult = createLead($leadData, $type, $ref);
    $leadOk = ($leadResult['error'] ?? null) === null
        && ($leadResult['status'] ?? 0) >= 200 && ($leadResult['status'] ?? 0) < 300;
    if (!$leadOk) {
        // El correo ya salio; dejamos rastro para no perder el lead sin aviso
        error_log("createLead fallo ref={$ref} status=" . ($leadResult['status'] ?? 'n/a')
            . " error=" . ($leadResult['error'] ?? 'none')
            . " response=" . json_encode($leadResult['response'] ?? null));
    }

    // Incluir más información en la respuesta para ayudar a la depuración
    http_response_code(200);
    echo json_encode([
        'status' => 'success', 
        'message' => 'Email sent successfully',
        'reference' => $ref,
        'type' => $type,
        'lead_created' => $leadOk,
        'internal_result' => json_decode($internalResult, true),
        'client_result' => json_decode($clientResult, true)
    ]);
}
