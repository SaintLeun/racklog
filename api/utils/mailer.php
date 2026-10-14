<?php

require_once __DIR__ . '/templates.php';

function sendEmail(string $to, array $data, string $type, string $referenceId): bool {
    $sender = 'contacto@racklog.cl';
    $normalizedType = strtolower(trim($type));

    $subject = match ($normalizedType) {
        'quote' => '[Cotización] desde Sitio Web - Racklog',
        'quote_confirmation' => 'Cotización de Productos - Racklog',
        'contact' => '[Contacto] desde Sitio Web - Racklog',
        'contact_confirmation' => 'Hemos recibido tu mensaje - Racklog',
        default => 'Mensaje desde Racklog'
    };

    $headers = [
        'From' => "Racklog <{$sender}>",
        'Reply-To' => $sender,
        'MIME-Version' => '1.0',
        'Content-Type' => 'text/html; charset=UTF-8'
    ];

    $htmlMessage = generateEmailTemplate($data, $normalizedType, $referenceId);

    // Codificar el asunto para que los acentos lleguen bien en todos los clientes
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

    return mail(
        $to,
        $encodedSubject,
        $htmlMessage,
        implode("\r\n", array_map(
            fn($v, $k) => "$k: $v",
            $headers,
            array_keys($headers)
        ))
    );
}

/** Aviso interno en texto plano a contacto@ (fallas que alguien debe saber) */
function sendInternalAlert(string $subject, string $body): bool {
    $sender = 'contacto@racklog.cl';
    $headers = "From: Racklog API <{$sender}>\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8";
    return mail($sender, '=?UTF-8?B?' . base64_encode('[Aviso API] ' . $subject) . '?=', $body, $headers);
}
