<?php

function createLead(array $data, string $tipo, string $referencia): array {
    $apiUrl = 'https://comercialracklogcl.kommo.com/api/v4/leads';
    $bearerToken = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjE3NzkwMjRkNjE0Y2EwNzg0OGRhM2Y1Yzg2YWEzYzk2MjQ4NDgyNzM1ZDMyMzE3NDc4Y2YyM2Q5NDI1MzhkYmRhZTQ3YTg4M2VmOWE3NmEyIn0.eyJhdWQiOiIwNWQzMDEzMS1kN2FlLTQ2YzItOTRhZi1hYzY5NjEwNmQ1NWEiLCJqdGkiOiIxNzc5MDI0ZDYxNGNhMDc4NDhkYTNmNWM4NmFhM2M5NjI0ODQ4MjczNWQzMjMxNzQ3OGNmMjNkOTQyNTM4ZGJkYWU0N2E4ODNlZjlhNzZhMiIsImlhdCI6MTc0MTM1NDI3NSwibmJmIjoxNzQxMzU0Mjc1LCJleHAiOjE4MTE4MDgwMDAsInN1YiI6IjExOTAwNzM1IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMzNDQ1ODcxLCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiYjBjNmZmNWQtN2NlZS00MTQwLTk3ZWYtYjQ2MGNiNGU3MzA2IiwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.BZ64siPa8QSQKT-oXvyND0M5lSEKii51z6vIeD2smqjrdirELSRTHjsAof-pdXw86tfWbkp_IxWOcSIGykQ57dNI48prNdZbhDsKlMmXjIHlLSK9yZKpkNxF4Uy701nDmo2WFskgvSUR47eoDxocYFaNH5IkC3KcIW19tPZIsu3UO-cEgqM7xCfEpt10FFCPNDilZozJks99iAVWomMvIuLVIy3USAb7i7-B6wKGmxpAnccrzctH5d3ddINxkTZDAU637ccMafXxzkA_OS4gI7VUmZ1bBHL7qFzTO8qUC2_HR31SRnhggooG4Y5FbEcztmm-DQ_bDxQ_I-W8srMjdA';

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
                    'values' => [[ 'value' => $tipo === 'quote'? 'Cotizacion' : 'Contacto' ]]
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

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch); 

    return [
        'status' => $httpCode,
        'response' => json_decode($response, true),
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
                
                $output .= "   Solo cotización: " . ($product['quoteOnly'] ? 'Sí' : 'No') . "\n";
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