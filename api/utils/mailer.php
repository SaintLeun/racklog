<?php

require_once __DIR__ . '/templates.php';

function sendEmail(string $to, $content, string $type, string $referenceId): string {
    // Función especial de depuración - sólo agrégala temporalmente
    file_put_contents(
        __DIR__ . '/mail_debug.log', 
        date('Y-m-d H:i:s') . " - To: $to, Type: $type\n" . print_r($content, true) . "\n\n", 
        FILE_APPEND
    );

    $sender = 'contacto@racklog.cl';
    
    // Normalizar el tipo y verificar su valor preciso
    $normalizedType = strtolower(trim($type));
    
    // Usar strcmp para comparación exacta en el match
    $subject = match ($normalizedType) {
        'quote' => '[Cotización] desde Sitio Web - Racklog',
        'quote_confirmation' => 'Cotización de Productos - Racklog',
        'contact' => '[Contacto] desde Sitio Web - Racklog',
        'contact_confirmation' => 'Hemos recibido tu mensaje - Racklog',
        default => 'Mensaje desde Racklog'
    };

    // Agregar registro para depuración
    error_log("sendEmail: type={$normalizedType}, subject={$subject}, to={$to}");

    $headers = [
        'From' => "Racklog <{$sender}>",
        'Reply-To' => $sender,
        'X-Mailer' => 'PHP/' . phpversion(),
        'MIME-Version' => '1.0',
        'Content-Type' => 'text/html; charset=UTF-8'
    ];

    $isJson = false;
    $jsonData = null;

    // Determine content type
    if (is_array($content)) {
        $jsonData = $content;
        $isJson = true;
    } elseif (is_string($content) && str_starts_with(trim($content), '{')) {
        $jsonData = json_decode($content, true);
        $isJson = $jsonData !== null;
    }

    $isHtml = !$isJson && is_string($content) && str_contains($content, '<html');

    // Generate email content from template
    $htmlMessage = generateEmailTemplate($jsonData, $normalizedType, $referenceId);

    $success = mail(
        $to,
        $subject,
        $htmlMessage,
        implode("\r\n", array_map(
            fn($v, $k) => "$k: $v",
            $headers,
            array_keys($headers)
        ))
    );

    return json_encode([
        'success' => $success,
        'message' => $success
            ? "Email enviado exitosamente a {$to}"
            : "Error al enviar el correo. Verifique la configuración del servidor.",
        'type' => $normalizedType,
        'reference' => $referenceId,
        'subject' => $subject // Incluir el asunto en la respuesta para verificación
    ]);
}
