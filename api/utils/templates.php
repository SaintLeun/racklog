<?php

require_once __DIR__ . '/../partials/baseStyles.php';
require_once __DIR__ . '/../partials/template_quote.php';
require_once __DIR__ . '/../partials/template_quote_confirmation.php';
require_once __DIR__ . '/../partials/template_contact.php';
require_once __DIR__ . '/../partials/template_contact_confirmation.php';
require_once __DIR__ . '/../utils/kommo.php'; // integración modularizada para crear leads


function generateEmailTemplate(array $data, string $type, string $ref): string {
    $type = strtolower(trim($type)); // normaliza espacios y mayúsculas

    switch ($type) {
        case 'quote':
            return generateQuote($data, $ref);;
        case 'quote_confirmation':
            return generateQuoteConfirmation($data, $ref);
        case 'contact':
            return generateContact($data, $ref);
        case 'contact_confirmation':
            return generateContactConfirmation($data, $ref);
        default:
            return "<html><body><p>Plantilla no válida para tipo: <strong>{$type}</strong></p></body></html>";
    }
}