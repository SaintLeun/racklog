<?php

function kommoConfigured(): bool {
    global $BEARER_TOKEN;
    return is_string($BEARER_TOKEN) && strlen($BEARER_TOKEN) > 20
        && $BEARER_TOKEN !== 'PON_AQUI_EL_TOKEN_ROTADO';
}

/**
 * Crea el lead en Kommo
 * @return array ['status' => int, 'id' => ?int, 'response' => ?array, 'error' => ?string]; status 0 si no esta configurado o no hubo respuesta
 */
function createLead(array $data, string $tipo, string $referencia): array {
    global $BEARER_TOKEN;

    if (!kommoConfigured()) {
        return ['status' => 0, 'id' => null, 'response' => null, 'error' => 'not_configured'];
    }

    // KOMMO_API_URL permite apuntar a un servidor de prueba en desarrollo
    $apiUrl = getenv('KOMMO_API_URL') ?: 'https://comercialracklogcl.kommo.com/api/v4/leads';
    $bearerToken = 'Bearer ' . $BEARER_TOKEN;

    // Normalizar el tipo para comparaciones consistentes
    $tipoNormalizado = strtolower(trim($tipo));
    
    // Formatear los datos según el tipo y estructura específica
    $detalleTexto = formatLeadDetails($data, $tipoNormalizado);
    
    // Determinar el nombre del lead según la estructura específica
    $nombre = determineLeadName($data, $tipoNormalizado);

    $payload = [
        [
            'pipeline_id' => 10967819,
            'name' => $nombre,
            'created_by' => 0,
            'custom_fields_values' => [
                [
                    'field_id' => 760802,
                    'values' => [[ 'value' => $detalleTexto ]]
                ],
                [
                    'field_id' => 760600,
                    'values' => [[ 'value' => $tipoNormalizado === 'quote' ? 'Cotizacion' : 'Contacto' ]]
                ],
                [
                    'field_id' => 760598,
                    'values' => [[ 'value' => $referencia ]]
                ]
            ]
        ]
    ];

    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: ' . $bearerToken,
        'Accept: application/json',
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    // Si Kommo no responde, no dejar colgado el formulario del usuario
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch); 

    $body = is_string($response) ? json_decode($response, true) : null;
    $id = $body['_embedded']['leads'][0]['id'] ?? null;

    return [
        'status' => (int) $httpCode,
        'id' => is_int($id) ? $id : null,
        'response' => $body,
        'error' => $error ?: null
    ];
}

/**
 * Determina el nombre del lead basado en el tipo y la estructura de datos
 * @param array $data Datos del lead
 * @param string $tipo Tipo de lead normalizado
 * @return string Nombre del lead para Kommo
 */
function determineLeadName(array $data, string $tipo): string {

    if ($tipo === 'contacto' || $tipo === 'contact') {
        // Estructura de contacto
        return $data['name'] ?? 'Contacto sin nombre';
    } else {
        // Estructura de cotización - puede tener data anidada
        return $data['customerName'] ?? 'Contacto sin nombre';
    }
}

/**
 * Formatea los datos del lead para un mejor display en Kommo
 * Maneja las diferentes estructuras que pueden llegar del frontend
 * @param array $data Datos del lead
 * @param string $tipo Tipo de lead normalizado
 * @return string Texto formateado para mostrar en Kommo
 */
function formatLeadDetails(array $data, string $tipo): string {
    $output = "";
    
    // Verificar si estamos trabajando con la estructura anidada {"to":..., "data":...}
    if (isset($data['data']) && is_array($data['data'])) {
        $actualData = $data['data'];
    } else {
        $actualData = $data;
    }

    // Formateo según el tipo de lead
    if ($tipo === 'cotizacion' || $tipo === 'quote') {
        // Datos principales del cliente
        $output .= "SOLICITUD DE COTIZACIÓN\n";
        $output .= "───────────────────────────\n\n";
        
        $output .= "DATOS DEL CLIENTE\n";
        $output .= "Nombre: " . ($actualData['customerName'] ?? 'No especificado') . "\n";
        $output .= "Email: " . ($actualData['customerEmail'] ?? 'No especificado') . "\n";
        $output .= "Teléfono: " . ($actualData['customerPhone'] ?? 'No especificado') . "\n";
        $output .= "Empresa: " . ($actualData['customerCompany'] ?? 'No especificado') . "\n\n";
        
        // Comentarios adicionales
        if (!empty($actualData['customerComments'])) {
            $output .= "COMENTARIOS\n";
            $output .= $actualData['customerComments'] . "\n\n";
        }
        
        // Lista de productos
        if (!empty($actualData['products']) && is_array($actualData['products'])) {
            $output .= "PRODUCTOS SOLICITADOS\n";
            $output .= "───────────────────────────\n";
            
            $total = 0;
            foreach ($actualData['products'] as $index => $product) {
                $productTotal = ($product['price'] ?? 0) * ($product['quantity'] ?? 1);
                $total += $productTotal;
                
                $output .= ($index + 1) . ". " . ($product['name'] ?? 'Producto sin nombre') . "\n";
                $output .= "   Cantidad: " . ($product['quantity'] ?? 1) . "\n";
                
                if (isset($product['price']) && $product['price'] > 0) {
                    $output .= "   Precio: $" . number_format($product['price'], 0, ',', '.') . "\n";
                    $output .= "   Subtotal: $" . number_format($productTotal, 0, ',', '.') . "\n";
                } else {
                    $output .= "   Precio: Solicitud de cotización\n";
                }
                
                // Formatear la configuración para mostrarla de manera legible
                if (!empty($product['config']) && is_array($product['config'])) {
                    $output .= "   Configuración:\n";
                    foreach ($product['config'] as $configKey => $configValue) {
                        if (!empty($configValue)) {
                            $output .= "      - " . ucfirst($configKey) . ": " . $configValue . "\n";
                        }
                    }
                } elseif (!empty($product['config'])) {
                    $output .= "   Configuración: " . $product['config'] . "\n";
                }
                
                $output .= "   Solo cotización: " . (!empty($product['quoteOnly']) ? 'Sí' : 'No') . "\n";
                $output .= "\n";
            }
            
            // Total de la cotización
            if ($total > 0) {
                $output .= "TOTAL: $" . number_format($total, 0, ',', '.') . "\n\n";
            } else {
                $output .= "TOTAL: Solicitud de cotización sin precios definidos\n\n";
            }
        }
        
    } else { // contacto/contact
        // Datos de contacto
        $output .= "SOLICITUD DE CONTACTO\n";
        $output .= "───────────────────────────\n\n";
        
        $output .= "DATOS DEL INTERESADO\n";
        $output .= "Nombre: " . ($actualData['name'] ?? 'No especificado') . "\n";
        $output .= "Email: " . ($actualData['email'] ?? 'No especificado') . "\n";
        $output .= "Teléfono: " . ($actualData['phone'] ?? 'No especificado') . "\n\n";
        
        // Asunto y mensaje
        $output .= "DETALLES DE LA CONSULTA\n";
        if (!empty($actualData['subject'])) {
            $output .= "Asunto: " . $actualData['subject'] . "\n";
        }
        if (!empty($actualData['message'])) {
            $output .= "Mensaje:\n" . $actualData['message'] . "\n\n";
        }
        
        // Información de servicio relacionado
        if (!empty($actualData['serviceInfo'])) {
            $output .= "SERVICIO RELACIONADO\n";
            $output .= $actualData['serviceInfo'] . "\n\n";
        }
    }
    
    // Referencia - mostrar la que viene en los datos o la que se pasó como parámetro
    $ref = $actualData['contactRef'] ?? $actualData['quoteRef'] ?? null;
    if ($ref) {
        $output .= "REFERENCIA: " . $ref . "\n\n";
    }
    
    // Información técnica
    $output .= "───────────────────────────\n";
    $output .= "ORIGEN: Sitio web - " . date('d/m/Y H:i:s') . "\n";
    
    // Solo agregar la IP y User Agent si están disponibles
    if (isset($_SERVER['REMOTE_ADDR'])) {
        $output .= "IP: " . $_SERVER['REMOTE_ADDR'] . "\n";
    }
    if (isset($_SERVER['HTTP_USER_AGENT'])) {
        $output .= "Navegador: " . $_SERVER['HTTP_USER_AGENT'] . "\n";
    }
    
    return $output;
}