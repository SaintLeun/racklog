<?php

require_once __DIR__ . '/escape.php';
require_once __DIR__ . '/../partials/baseStyles.php';
require_once __DIR__ . '/../partials/template_quote.php';
require_once __DIR__ . '/../partials/template_quote_confirmation.php';
require_once __DIR__ . '/../partials/template_contact.php';
require_once __DIR__ . '/../partials/template_contact_confirmation.php';
require_once __DIR__ . '/../partials/template_continuar.php';


/** Lista de archivos adjuntos para el correo interno (los archivos van adjuntos al mismo correo) */
function attachmentsSection(array $data, string $color): string {
    $names = $data['adjuntos'] ?? [];
    if (!$names) {
        return '';
    }
    $items = implode('', array_map(fn($n) => '<li>' . esc($n) . '</li>', $names));
    return "
    <div style='margin-bottom:25px;'>
        <div style='background-color:#f8f8f8; color:{$color}; font-size:16px; font-weight:bold; padding:10px 15px; border-radius:4px; margin-bottom:15px;'>
            ARCHIVOS ADJUNTOS (" . count($names) . ")
        </div>
        <ul style='margin:0; padding-left:20px; line-height:1.7;'>{$items}</ul>
        <p style='margin:8px 0 0; font-size:13px; color:#757575;'>Van adjuntos a este correo.</p>
    </div>";
}

function generateEmailTemplate(?array $data, string $type, string $ref): string {
    $data = $data ?? [];
    $type = strtolower(trim($type)); // normaliza espacios y mayúsculas

    switch ($type) {
        case 'quote':
            return generateQuote($data, $ref);
        case 'quote_confirmation':
            return generateQuoteConfirmation($data, $ref);
        case 'contact':
            return generateContact($data, $ref);
        case 'contact_confirmation':
            return generateContactConfirmation($data, $ref);
        case 'continuar':
            return generateContinuar($data, $ref);
        default:
            return "<html><body><p>Plantilla no válida para tipo: <strong>" . esc($type) . "</strong></p></body></html>";
    }
}