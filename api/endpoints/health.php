<?php

/**
 * Sonda de disponibilidad para monitoreo de uptime (GET /api/health).
 * Revisa lo que necesita el formulario: token de Kommo, mail() y
 * almacenamiento para el rate limit. No expone valores, solo el estado.
 */
function handleHealth(string $method): void {
    if ($method !== 'GET') {
        header('Allow: GET');
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    global $BEARER_TOKEN;
    $checks = [
        'kommo_token' => is_string($BEARER_TOKEN) && strlen($BEARER_TOKEN) > 20
            && $BEARER_TOKEN !== 'PON_AQUI_EL_TOKEN_ROTADO',
        'mail' => function_exists('mail'),
        'storage' => rateLimitStorageDir() !== null,
    ];
    $ok = !in_array(false, $checks, true);

    header('Cache-Control: no-store');
    http_response_code($ok ? 200 : 503);
    echo json_encode(['status' => $ok ? 'ok' : 'degraded', 'checks' => $checks]);
}
