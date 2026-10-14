<?php

/**
 * Sonda de disponibilidad para monitoreo de uptime (GET /api/health).
 * Revisa lo que necesita el formulario: al menos un destino de leads
 * (Kommo o la intranet en Supabase), mail(), almacenamiento para el
 * rate limit y que no haya leads atascados en la cola de la intranet.
 * Si hay token de Kommo, comprueba que Kommo lo acepte (kommo_auth:
 * false = token vencido o revocado). No expone valores, solo el estado.
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
        'kommo_auth' => kommoTokenAccepted(),
        'intranet' => intranetConfigured(),
        'mail' => function_exists('mail'),
        'storage' => rateLimitStorageDir() !== null,
        // Leads en cola hace mas de 30 min: la intranet sigue caida o el cron de reintento no corre
        'intranet_atrasados' => count(array_filter(intranetQueueFiles(), fn($f) => filemtime($f) < time() - 1800)),
    ];
    // kommo_auth null (sin token o Kommo sin respuesta) no degrada; un token rechazado si
    $ok = ($checks['kommo_token'] || $checks['intranet']) && $checks['kommo_auth'] !== false
        && $checks['mail'] && $checks['storage'] && $checks['intranet_atrasados'] === 0;

    header('Cache-Control: no-store');
    http_response_code($ok ? 200 : 503);
    echo json_encode(['status' => $ok ? 'ok' : 'degraded', 'checks' => $checks]);
}
