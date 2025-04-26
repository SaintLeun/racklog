<?php

require_once __DIR__ . '/../utils/mailer.php';

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
    createLead($leadData, $type, $ref);

    // Incluir más información en la respuesta para ayudar a la depuración
    http_response_code(200);
    echo json_encode([
        'status' => 'success', 
        'message' => 'Email sent successfully',
        'reference' => $ref,
        'type' => $type,
        'internal_result' => json_decode($internalResult, true),
        'client_result' => json_decode($clientResult, true)
    ]);
}
