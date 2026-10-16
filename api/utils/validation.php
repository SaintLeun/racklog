<?php

/**
 * Validacion y normalizacion de los datos que llegan desde los formularios.
 * Cada funcion devuelve [datosLimpios, null] o [null, 'mensaje de error'].
 */

function cleanString($value, int $maxLength, bool $required = false): ?string {
    if ($value === null || $value === '') {
        return $required ? null : '';
    }
    if (!is_string($value) && !is_int($value) && !is_float($value)) {
        return null;
    }
    $value = trim((string) $value);
    // Quitar caracteres de control (excepto saltos de linea y tab)
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    if ($required && $value === '') {
        return null;
    }
    return mb_substr($value, 0, $maxLength);
}

function cleanEmail($value): ?string {
    if (!is_string($value)) {
        return null;
    }
    $value = trim($value);
    if (strlen($value) > 254 || !filter_var($value, FILTER_VALIDATE_EMAIL)) {
        return null;
    }
    return $value;
}

/** RUT chileno: cuerpo + digito verificador (modulo 11), con o sin puntos y guion */
function validRut(string $rut): bool {
    $clean = strtoupper(preg_replace('/[^0-9kK]/', '', $rut) ?? '');
    if (!preg_match('/^(\d{7,8})([0-9K])$/', $clean, $m)) {
        return false;
    }
    $sum = 0;
    $factor = 2;
    for ($i = strlen($m[1]) - 1; $i >= 0; $i--) {
        $sum += (int) $m[1][$i] * $factor;
        $factor = $factor === 7 ? 2 : $factor + 1;
    }
    $expected = 11 - ($sum % 11);
    $dv = $expected === 11 ? '0' : ($expected === 10 ? 'K' : (string) $expected);
    return $m[2] === $dv;
}

// Adjuntos: mismos limites que el formulario (ContactModal.vue)
const ATTACHMENT_MAX_FILES = 3;
const ATTACHMENT_MAX_TOTAL_BYTES = 5 * 1024 * 1024;
const ATTACHMENT_TYPES = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
    'application/pdf' => 'pdf',
];

/**
 * Lee los archivos de $_FILES['attachments'] (campo attachments[] del formulario)
 * @return array [[['name', 'content'], ...], null] o [null, 'mensaje de error']
 */
function readUploadedFiles($upload): array {
    if (!is_array($upload) || !is_array($upload['name'] ?? null)) {
        return [[], null];
    }
    if (count($upload['name']) > ATTACHMENT_MAX_FILES) {
        return [null, 'Adjuntos invalidos'];
    }
    $files = [];
    foreach (array_keys($upload['name']) as $i) {
        $error = $upload['error'][$i] ?? UPLOAD_ERR_NO_FILE;
        if ($error === UPLOAD_ERR_INI_SIZE || $error === UPLOAD_ERR_FORM_SIZE) {
            return [null, 'Adjuntos demasiado grandes'];
        }
        if ($error !== UPLOAD_ERR_OK || !is_uploaded_file($upload['tmp_name'][$i])) {
            return [null, 'Adjunto invalido'];
        }
        $files[] = ['name' => (string) $upload['name'][$i], 'content' => file_get_contents($upload['tmp_name'][$i])];
    }
    return [$files, null];
}

/**
 * Valida los archivos adjuntos. El tipo se toma del contenido real, no del que declara el navegador.
 * @param array|null $raw [['name', 'content'], ...]
 * @return array [[['name', 'type', 'content'], ...], null] o [null, 'mensaje de error']
 */
function validateAttachments($raw): array {
    if ($raw === null || $raw === []) {
        return [[], null];
    }
    if (!is_array($raw) || $raw !== array_values($raw) || count($raw) > ATTACHMENT_MAX_FILES) {
        return [null, 'Adjuntos invalidos'];
    }

    $files = [];
    $total = 0;
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    foreach ($raw as $i => $item) {
        $content = is_array($item) ? ($item['content'] ?? false) : false;
        if (!is_string($content) || $content === '') {
            return [null, 'Adjunto invalido'];
        }
        $total += strlen($content);
        if ($total > ATTACHMENT_MAX_TOTAL_BYTES) {
            return [null, 'Adjuntos demasiado grandes'];
        }
        $type = $finfo->buffer($content);
        $ext = ATTACHMENT_TYPES[$type] ?? null;
        if ($ext === null) {
            return [null, 'Tipo de adjunto no permitido'];
        }
        // Nombre seguro para el correo, con la extension que corresponde al contenido
        $base = pathinfo(is_string($item['name'] ?? null) ? $item['name'] : '', PATHINFO_FILENAME);
        $base = trim(preg_replace('/[^\p{L}\p{N} ._-]+/u', '_', $base) ?? '', ' ._');
        $base = mb_substr($base, 0, 80) ?: 'adjunto-' . ($i + 1);
        $files[] = ['name' => "{$base}.{$ext}", 'type' => $type, 'content' => $content];
    }
    return [$files, null];
}

function validateContactData($data): array {
    if (!is_array($data)) {
        return [null, 'Datos de contacto invalidos'];
    }

    $email = cleanEmail($data['email'] ?? null);
    $name = cleanString($data['name'] ?? null, 100, true);
    if ($email === null) {
        return [null, 'Email invalido'];
    }
    if ($name === null) {
        return [null, 'Nombre requerido'];
    }
    // Opcional (el formulario rapido de la portada no lo pide), pero si viene debe ser valido
    $rut = cleanString($data['rut'] ?? null, 12) ?? '';
    if ($rut !== '' && !validRut($rut)) {
        return [null, 'RUT invalido'];
    }

    return [[
        'name' => $name,
        'email' => $email,
        'phone' => cleanString($data['phone'] ?? null, 30) ?? '',
        'company' => cleanString($data['company'] ?? null, 150) ?? '',
        'rut' => $rut,
        'subject' => cleanString($data['subject'] ?? null, 150) ?? '',
        'message' => cleanString($data['message'] ?? null, 5000) ?? '',
        'serviceInfo' => cleanString($data['serviceInfo'] ?? null, 150) ?? '',
    ], null];
}

function validateQuoteData($data): array {
    if (!is_array($data)) {
        return [null, 'Datos de cotizacion invalidos'];
    }

    $email = cleanEmail($data['customerEmail'] ?? null);
    $name = cleanString($data['customerName'] ?? null, 100, true);
    if ($email === null) {
        return [null, 'Email invalido'];
    }
    if ($name === null) {
        return [null, 'Nombre requerido'];
    }

    $rut = cleanString($data['customerRut'] ?? null, 12) ?? '';
    if ($rut !== '' && !validRut($rut)) {
        return [null, 'RUT invalido'];
    }

    $rawProducts = $data['products'] ?? [];
    if (!is_array($rawProducts) || count($rawProducts) > 50) {
        return [null, 'Lista de productos invalida'];
    }

    $products = [];
    foreach (array_values($rawProducts) as $product) {
        if (!is_array($product)) {
            return [null, 'Producto invalido'];
        }
        $productName = cleanString($product['name'] ?? null, 120, true);
        $quantity = filter_var($product['quantity'] ?? 1, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 100000]]);
        $price = filter_var($product['price'] ?? 0, FILTER_VALIDATE_FLOAT);
        if ($productName === null || $quantity === false || $price === false || $price < 0) {
            return [null, 'Producto invalido'];
        }

        $config = [];
        if (is_array($product['config'] ?? null)) {
            foreach (array_slice($product['config'], 0, 30, true) as $key => $value) {
                $cleanKey = cleanString((string) $key, 50);
                $cleanValue = is_scalar($value) ? cleanString($value, 100) : null;
                if ($cleanKey !== null && $cleanKey !== '' && $cleanValue !== null) {
                    $config[$cleanKey] = $cleanValue;
                }
            }
        }

        $products[] = [
            'name' => $productName,
            'quantity' => $quantity,
            'price' => $price,
            'quoteOnly' => !empty($product['quoteOnly']),
            'config' => $config,
        ];
    }

    $cartTotal = filter_var($data['cartTotal'] ?? 0, FILTER_VALIDATE_FLOAT);

    return [[
        'customerName' => $name,
        'customerEmail' => $email,
        'customerPhone' => cleanString($data['customerPhone'] ?? null, 30) ?? '',
        'customerCompany' => cleanString($data['customerCompany'] ?? null, 150) ?? '',
        'customerRut' => $rut,
        'customerComments' => cleanString($data['customerComments'] ?? null, 5000) ?? '',
        'products' => $products,
        'cartTotal' => $cartTotal === false ? 0 : max(0, $cartTotal),
    ], null];
}
