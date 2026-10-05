<?php

/**
 * Sonda de disponibilidad para monitoreo de uptime (GET /api/health).
 * Revisa lo que necesita el formulario: al menos un destino de leads
 * (Kommo o la intranet en Supabase), mail() y almacenamiento para el
 * rate limit. No expone valores, solo el estado.
 */
function handleHealth(string $method): void {
    if ($method !== 'GET') {
        header('Allow: GET');
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $checks = [
        'kommo_token' => kommoConfigured(),
        'intranet' => intranetConfigured(),
        'mail' => function_exists('mail'),
        'storage' => rateLimitStorageDir() !== null,
    ];
    $ok = ($checks['kommo_token'] || $checks['intranet']) && $checks['mail'] && $checks['storage'];

    header('Cache-Control: no-store');
    http_response_code($ok ? 200 : 503);
    echo json_encode(['status' => $ok ? 'ok' : 'degraded', 'checks' => $checks]);
}
