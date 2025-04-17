<?php

require_once __DIR__ . '/../utils/kommo.php';

function handleCreateLead(string $method): void {
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid input']);
        return;
    }

    $tipo = $input['type'] ?? 'Cotizacion';
    $result = createLead($input, $tipo);

    http_response_code($result['status'] ?? 200);
    echo json_encode($result);
}
