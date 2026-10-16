<?php

require_once __DIR__ . '/templates.php';

/**
 * @param array $attachments Archivos de validateAttachments(): [['name', 'type', 'content'], ...]
 */
function sendEmail(string $to, array $data, string $type, string $referenceId, array $attachments = []): bool {
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

    if ($attachments) {
        // multipart/mixed: el HTML y luego cada archivo en base64
        $boundary = 'racklog-' . bin2hex(random_bytes(12));
        $headers['Content-Type'] = "multipart/mixed; boundary=\"{$boundary}\"";
        $body = "--{$boundary}\r\n"
            . "Content-Type: text/html; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: base64\r\n\r\n"
            . chunk_split(base64_encode($htmlMessage)) . "\r\n";
        foreach ($attachments as $file) {
            $encodedName = '=?UTF-8?B?' . base64_encode($file['name']) . '?=';
            $body .= "--{$boundary}\r\n"
                . "Content-Type: {$file['type']}; name=\"{$encodedName}\"\r\n"
                . "Content-Transfer-Encoding: base64\r\n"
                . "Content-Disposition: attachment; filename=\"{$encodedName}\"\r\n\r\n"
                . chunk_split(base64_encode($file['content'])) . "\r\n";
        }
        $htmlMessage = $body . "--{$boundary}--";
    }

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
