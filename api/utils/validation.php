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

    return [[
        'name' => $name,
        'email' => $email,
        'phone' => cleanString($data['phone'] ?? null, 30) ?? '',
        'company' => cleanString($data['company'] ?? null, 150) ?? '',
        'rut' => cleanString($data['rut'] ?? null, 12) ?? '',
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
        'customerRut' => cleanString($data['customerRut'] ?? null, 12) ?? '',
        'customerComments' => cleanString($data['customerComments'] ?? null, 5000) ?? '',
        'products' => $products,
        'cartTotal' => $cartTotal === false ? 0 : max(0, $cartTotal),
    ], null];
}
