<?php

require_once __DIR__ . '/../utils/mailer.php';
require_once __DIR__ . '/../utils/rate_limit.php';
require_once __DIR__ . '/../utils/validation.php';
require_once __DIR__ . '/../utils/logger.php';
require_once __DIR__ . '/../utils/supabase.php';
require_once __DIR__ . '/../utils/lead_queue.php';

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

    // Proteccion contra CSRF: un formulario HTML de otro sitio no puede enviar JSON ni cabeceras
    // propias sin pasar por el preflight de CORS
    $contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
    $rawAttachments = null;
    if (str_starts_with($contentType, 'multipart/form-data')) {
        // Con adjuntos: el firewall del hosting (ModSecurity) corta los JSON de mas de 1 MB,
        // pero deja pasar archivos subidos como multipart
        if (($_SERVER['HTTP_X_RACKLOG_FORM'] ?? '') !== '1') {
            jsonResponse(415, ['error' => 'Missing form header']);
            return;
        }
        // Si se supera post_max_size, PHP descarta todo el cuerpo
        if (empty($_POST) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
            jsonResponse(413, ['error' => 'Payload too large']);
            return;
        }
        $input = json_decode(is_string($_POST['payload'] ?? null) ? $_POST['payload'] : '', true);
        [$rawAttachments, $uploadError] = readUploadedFiles($_FILES['attachments'] ?? null);
        if ($uploadError !== null) {
            jsonResponse($uploadError === 'Adjuntos demasiado grandes' ? 413 : 422, ['error' => $uploadError]);
            return;
        }
    } elseif (str_starts_with($contentType, 'application/json')) {
        $raw = file_get_contents('php://input');
        if (strlen($raw) > 1100000) {
            jsonResponse(413, ['error' => 'Payload too large']);
            return;
        }
        $input = json_decode($raw, true);
        // Version anterior del formulario (en cache): adjuntos en base64 dentro del JSON
        if (is_array($input) && is_array($input['attachments'] ?? null)) {
            $rawAttachments = array_map(fn($a) => [
                'name' => $a['name'] ?? '',
                'content' => is_string($a['data'] ?? null) ? base64_decode($a['data'], true) : false,
            ], array_filter($input['attachments'], 'is_array'));
        }
    } else {
        jsonResponse(415, ['error' => 'Content-Type must be application/json']);
        return;
    }

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

    if ($error === null) {
        [$attachments, $error] = validateAttachments($rawAttachments);
    }

    if ($error !== null) {
        jsonResponse($error === 'Adjuntos demasiado grandes' ? 413 : 422, ['error' => $error]);
        return;
    }
    // A Kommo, la intranet y las plantillas solo van los nombres; los archivos van en el correo interno
    $data['adjuntos'] = array_column($attachments, 'name');

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
    $internalSent = sendEmail($internalEmail, $data, $type, $ref, $attachments);
    $confirmationSent = sendEmail($recipient, $data, $type . '_confirmation', $ref);

    $leadResult = createLead($data, $type, $ref);
    $leadOk = $leadResult['error'] === null && $leadResult['status'] >= 200 && $leadResult['status'] < 300;

    // Tour "Planifica tu bodega": nota con UTM/rol/puntaje, tarea a 24 h y plano adjunto en Kommo.
    // Un fallo aqui solo se registra: el correo y el lead ya estan.
    $tourResult = null;
    if ($leadOk) {
        try {
            $tourResult = procesarLeadTour($data, $type, $ref, $leadResult, $attachments);
        } catch (Throwable $e) {
            $tourResult = ['errores' => ['excepcion: ' . $e->getMessage()]];
        }
        if ($tourResult !== null && !empty($tourResult['errores'])) {
            logEvent('error', 'kommo_tour', ['ref' => $ref, 'kommo_lead_id' => $leadResult['id'] ?? null] + $tourResult);
        }
    }

    $intranetLead = buildIntranetLead($data, $type, $ref, $leadResult);
    $intranetResult = sendLeadToIntranet($intranetLead);
    $intranetOk = $intranetResult['error'] === null;

    // Un destino sin configurar (p. ej. sin Kommo) no es un error; si lo es que falle uno configurado
    $kommoFailed = !$leadOk && $leadResult['error'] !== 'not_configured';
    $intranetFailed = !$intranetOk && $intranetResult['error'] !== 'not_configured';

    // Lo que fallo y se puede reintentar sin duplicar queda en cola (scripts/reintentar_leads.php)
    $kommoRetry = $kommoFailed && kommoReintentable($leadResult);
    $queued = ($kommoRetry || $intranetFailed) && queueLead(
        $intranetLead,
        $kommoRetry,
        $intranetFailed,
        implode('; ', array_filter([
            $kommoRetry ? 'Kommo: ' . ($leadResult['error'] ?? 'http_' . $leadResult['status']) : null,
            $intranetFailed ? 'intranet: ' . $intranetResult['error'] : null,
        ]))
    );
    if ($queued) {
        sendInternalAlert(
            "Lead {$ref} pendiente",
            "El formulario {$ref} no llego a " . implode(' ni a ', array_filter([
                $kommoRetry ? 'Kommo' : null,
                $intranetFailed ? 'la intranet' : null,
            ])) . ".\n"
            . "Los datos completos estan en el correo \"desde Sitio Web\" con esa referencia.\n"
            . "La API lo reintenta sola cada 5 minutos y avisara cuando quede registrado."
        );
    }
    // Fallo de Kommo que no se puede reintentar sin riesgo de duplicar: lo revisa una persona
    if ($kommoFailed && !$kommoRetry) {
        sendInternalAlert(
            "Revisar lead {$ref} en Kommo",
            "Kommo no confirmo el lead {$ref} (" . kommoEstado($leadResult)
            . ($leadResult['error'] ? ", {$leadResult['error']}" : '') . ").\n"
            . "Puede que se haya creado igual: buscalo en Kommo por la referencia y, si no esta, crealo a mano\n"
            . "con los datos del correo \"desde Sitio Web\"."
        );
    }

    logEvent($internalSent && !$kommoFailed && !$intranetFailed ? 'info' : 'error', 'form_submission', [
        'ref' => $ref,
        'type' => $type,
        'recipient' => maskEmail($recipient),
        'attachments' => count($attachments),
        'internal_email' => $internalSent,
        'confirmation_email' => $confirmationSent,
        'lead_created' => $leadOk,
        'kommo_status' => $leadResult['status'],
        'kommo_error' => $leadResult['error'],
        'kommo_lead_id' => $leadResult['id'] ?? null,
        'kommo_tarea' => $tourResult['tarea'] ?? null,
        'kommo_archivos' => $tourResult['archivos'] ?? null,
        'intranet_saved' => $intranetOk,
        'intranet_status' => $intranetResult['status'],
        'intranet_error' => $intranetResult['error'],
        'queued' => $queued,
    ]);

    // Si no llego ni el correo interno ni el lead ni la intranet (ni quedo en cola), la solicitud se perdio: avisar al usuario
    if (!$internalSent && !$leadOk && !$intranetOk && !$queued) {
        jsonResponse(502, ['error' => 'No se pudo registrar la solicitud', 'reference' => $ref]);
        return;
    }

    jsonResponse(200, [
        'status' => 'success',
        'reference' => $ref,
        'confirmation_sent' => $confirmationSent,
    ]);
}
