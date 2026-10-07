<?php

// Configuracion opcional: si no existe supabase.php en el servidor, no se guarda en la intranet
if (is_file(__DIR__ . '/../config/supabase.php')) {
    require_once __DIR__ . '/../config/supabase.php';
} else {
    $SUPABASE_URL = getenv('SUPABASE_URL') ?: null;
    $SUPABASE_ANON_KEY = getenv('SUPABASE_ANON_KEY') ?: null;
    $SUPABASE_LEAD_TOKEN = getenv('SUPABASE_LEAD_TOKEN') ?: null;
}

function intranetConfigured(): bool {
    global $SUPABASE_URL, $SUPABASE_ANON_KEY, $SUPABASE_LEAD_TOKEN;
    foreach ([$SUPABASE_URL, $SUPABASE_ANON_KEY, $SUPABASE_LEAD_TOKEN] as $value) {
        if (!is_string($value) || $value === '' || str_contains($value, 'PON_AQUI')) {
            return false;
        }
    }
    return true;
}

/**
 * Guarda el lead en la base de la intranet (Supabase) via la funcion registrar_lead_web
 * @return array ['status' => int, 'error' => ?string]; status 0 si no esta configurado o no hubo respuesta
 */
function saveLeadToIntranet(array $data, string $tipo, string $referencia, ?int $kommoLeadId = null): array {
    global $SUPABASE_URL, $SUPABASE_ANON_KEY, $SUPABASE_LEAD_TOKEN;

    if (!intranetConfigured()) {
        return ['status' => 0, 'error' => 'not_configured'];
    }

    $isQuote = $tipo === 'quote';
    $lead = [
        'referencia' => $referencia,
        'tipo' => $tipo,
        'nombre' => $isQuote ? $data['customerName'] : $data['name'],
        'email' => $isQuote ? $data['customerEmail'] : $data['email'],
        'telefono' => $isQuote ? $data['customerPhone'] : $data['phone'],
        'empresa' => $isQuote ? $data['customerCompany'] : $data['company'],
        'rut' => $isQuote ? $data['customerRut'] : $data['rut'],
        'asunto' => $isQuote ? '' : $data['subject'],
        'mensaje' => $isQuote ? $data['customerComments'] : $data['message'],
        'servicio' => $isQuote ? '' : $data['serviceInfo'],
        'productos' => $isQuote ? $data['products'] : null,
        'total' => $isQuote ? $data['cartTotal'] : null,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
        'kommo_lead_id' => $kommoLeadId,
        'datos' => $data,
    ];

    $ch = curl_init(rtrim($SUPABASE_URL, '/') . '/rest/v1/rpc/registrar_lead_web');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $SUPABASE_ANON_KEY,
        'Authorization: Bearer ' . $SUPABASE_ANON_KEY,
        'Accept: application/json',
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['p_token' => $SUPABASE_LEAD_TOKEN, 'p_lead' => $lead]));
    // Si Supabase no responde, no dejar colgado el formulario del usuario
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $response = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if (!$error && ($httpCode < 200 || $httpCode >= 300)) {
        $body = is_string($response) ? json_decode($response, true) : null;
        $error = is_array($body) ? substr((string) ($body['message'] ?? 'http_error'), 0, 200) : 'http_error';
    }

    return ['status' => $httpCode, 'error' => $error ?: null];
}
