<?php

function generateQuote(array $data, string $quoteRef): string {
    $today = date('d/m/Y');
    $year = date('Y');
    $logoUrl = 'https://racklog.cl/assets/images/logo.png';
    $styles = $GLOBALS['baseStyles'];

    $products = $data['products'] ?? [];
    $customerName = $data['customerName'] ?? 'Cliente';
    $customerEmail = $data['customerEmail'] ?? '';
    $customerPhone = $data['customerPhone'] ?? '';
    $customerCompany = $data['customerCompany'] ?? '';
    $customerComments = $data['customerComments'] ?? '';
    
    // Calcular urgencia basada en el valor total aproximado (si existe)
    $urgencyLevel = "Normal";
    $urgencyColor = "#4caf50";
    $cartTotal = $data['cartTotal'] ?? 0;
    
    if ($cartTotal > 3000000) { // 3 millones
        $urgencyLevel = "Alta";
        $urgencyColor = "#f44336";
    } elseif ($cartTotal > 1500000) { // 1.5 millones
        $urgencyLevel = "Media";
        $urgencyColor = "#ff9800";
    }

    $productsHtml = '';
    foreach ($products as $i => $product) {
        $productsHtml .= "<div style='padding:15px; margin-bottom:15px; border-left:4px solid #3f51b5; background-color:#f9f9f9; border-radius:4px;'>";
        $productsHtml .= "<div style='font-size:16px; font-weight:600; color:#333; margin-bottom:8px; padding-bottom:5px; border-bottom:1px dashed #ddd;'>" 
            . ($i + 1) . ". " . htmlspecialchars($product['name']) . "</div>";
        
        $productsHtml .= "<div style='display:flex; justify-content:space-between; margin-bottom:10px;'>";
        $productsHtml .= "<span>Cantidad: <strong>" . htmlspecialchars($product['quantity']) . "</strong></span>";
        
        // Para uso interno, sí mostramos precios si están disponibles
        if (isset($product['price']) && (!isset($product['quoteOnly']) || !$product['quoteOnly'])) {
            $price = number_format($product['price'], 0, ',', '.');
            $subtotal = number_format($product['price'] * $product['quantity'], 0, ',', '.');
            $productsHtml .= "<br><span>Precio: <strong>$" . $price . "</strong> | Subtotal: <strong>$" . $subtotal . "</strong></span>";
        } else {
            $productsHtml .= "<br><span style='color:#e91e63; font-weight:600;'>Requiere cotización manual</span>";
        }
        
        $productsHtml .= "</div>";

        // Configuración del producto con mejor formato
        if (isset($product['config']) && is_array($product['config']) && !empty($product['config'])) {
            $productsHtml .= "<div style='margin-top:10px; padding:12px; background-color:#fff; border-radius:4px; border:1px solid #eee;'>";
            $productsHtml .= "<div style='font-weight:600; margin-bottom:8px; color:#555; font-size:14px;'>Especificaciones técnicas:</div>";
            
            foreach ($product['config'] as $key => $value) {
                if (empty($value)) continue;
                
                // Formatear etiquetas para mejor legibilidad
                $label = match ($key) {
                    'tipo' => 'Tipo',
                    'niveles' => 'Niveles',
                    'cuerpos' => 'Cuerpos',
                    'carga' => 'Capacidad de carga',
                    'pintado' => 'Acabado',
                    'bandeja' => 'Ancho de bandeja',
                    'frentePallet' => 'Frente',
                    'fondoPallet' => 'Fondo',
                    'altoPallet' => 'Alto',
                    default => ucfirst(str_replace(['_', '-'], ' ', $key))
                };
                
                // Formatear valores específicos
                $displayValue = match ($key) {
                    'tipo' => $value === 'simple' ? 'Simple' : 'Doble',
                    'pintado' => $value === 'galvanizado' ? 'galvanizado' : 'Pintado',
                    default => htmlspecialchars($value)
                };
                
                $productsHtml .= "<div style='font-size:13px; color:#555; margin-bottom:5px;'>";
                $productsHtml .= "<span style='color:#3f51b5; margin-right:5px;'>•</span> <strong>{$label}:</strong> {$displayValue}";
                $productsHtml .= "</div>";
            }
            
            $productsHtml .= "</div>";
        }
        
        $productsHtml .= "</div>";
    }

    // Datos del cliente en formato más detallado para ventas
    $customerInfoHtml = '';
    if (!empty($customerName) || !empty($customerEmail) || !empty($customerPhone) || !empty($customerCompany)) {
        $customerInfoHtml = "
        <div style='margin-bottom:25px; padding-bottom:20px; border-bottom:1px solid #f0f0f0;'>
            <div style='background-color:#f8f8f8; color:#3f51b5; font-size:16px; font-weight:bold; padding:10px 15px; border-radius:4px; margin-bottom:15px;'>
                DATOS DEL CLIENTE
            </div>
            <table style='width:100%; border-collapse:collapse;'>
                <tr>
                    <td style='width:30%; padding:8px 12px; background-color:#f5f5f5; text-align:left; font-weight:600;'>Nombre:</td>
                    <td style='padding:8px 12px;'><strong>" . htmlspecialchars($customerName) . "</strong></td>
                </tr>";
                
        if (!empty($customerCompany)) {
            $customerInfoHtml .= "
                <tr>
                    <td style='padding:8px 12px; background-color:#f5f5f5; text-align:left; font-weight:600;'>Empresa:</td>
                    <td style='padding:8px 12px;'>" . htmlspecialchars($customerCompany) . "</td>
                </tr>";
        }
                
        $customerInfoHtml .= "
                <tr>
                    <td style='padding:8px 12px; background-color:#f5f5f5; text-align:left; font-weight:600;'>Email:</td>
                    <td style='padding:8px 12px;'><a href='mailto:" . htmlspecialchars($customerEmail) . "' style='color:#3f51b5; text-decoration:none;'>" . htmlspecialchars($customerEmail) . "</a></td>
                </tr>
                <tr>
                    <td style='padding:8px 12px; background-color:#f5f5f5; text-align:left; font-weight:600;'>Teléfono:</td>
                    <td style='padding:8px 12px;'><a href='tel:" . htmlspecialchars($customerPhone) . "' style='color:#3f51b5; text-decoration:none;'>" . htmlspecialchars($customerPhone) . "</a></td>
                </tr>
                <tr>
                    <td style='padding:8px 12px; background-color:#f5f5f5; text-align:left; font-weight:600;'>Fecha solicitud:</td>
                    <td style='padding:8px 12px;'>" . $today . "</td>
                </tr>
                <tr>
                    <td style='padding:8px 12px; background-color:#f5f5f5; text-align:left; font-weight:600;'>Referencia:</td>
                    <td style='padding:8px 12px; font-weight:bold;'>" . $quoteRef . "</td>
                </tr>
                <tr>
                    <td style='padding:8px 12px; background-color:#f5f5f5; text-align:left; font-weight:600;'>Prioridad:</td>
                    <td style='padding:8px 12px;'><span style='background-color:" . $urgencyColor . "; color:white; font-weight:bold; padding:3px 8px; border-radius:4px;'>" . $urgencyLevel . "</span></td>
                </tr>
            </table>
        </div>";
    }

    // Comentarios del cliente
    $commentsHtml = '';
    if (!empty($customerComments)) {
        $commentsHtml = "
        <div style='margin-bottom:25px; padding-bottom:20px; border-bottom:1px solid #f0f0f0;'>
            <div style='background-color:#f8f8f8; color:#3f51b5; font-size:16px; font-weight:bold; padding:10px 15px; border-radius:4px; margin-bottom:15px;'>
                COMENTARIOS DEL CLIENTE
            </div>
            <div style='background-color:#fff8e1; border-left:4px solid #ffc107; padding:15px; border-radius:4px;'>
                " . nl2br(htmlspecialchars($customerComments)) . "
            </div>
        </div>";
    }

    // Sección de productos con total calculado
    $productsSectionTitle = "
    <div style='background-color:#f8f8f8; color:#3f51b5; font-size:16px; font-weight:bold; padding:10px 15px; border-radius:4px; margin-bottom:15px;'>
        DETALLE DE PRODUCTOS SOLICITADOS
    </div>";
    
    // Total para el equipo de ventas
    $totalSection = '';
    if (isset($data['cartTotal']) && $data['cartTotal'] > 0) {
        $totalFormatted = number_format($data['cartTotal'], 0, ',', '.');
        $totalSection = "
        <div style='background-color:#f5f5f5; padding:15px; border-radius:4px; margin:20px 0; text-align:right;'>
            <div style='font-size:14px; color:#666; margin-bottom:5px;'>Total calculado automáticamente:</div>
            <div style='font-size:22px; font-weight:700; color:#3f51b5;'>$" . $totalFormatted . "</div>
            <div style='font-size:13px; color:#666; margin-top:5px;'>Nota: Este valor podría requerir ajustes según políticas comerciales o disponibilidad.</div>
        </div>";
    } else {
        $totalSection = "
        <div style='background-color:#f5f5f5; padding:15px; border-radius:4px; margin:20px 0; text-align:center;'>
            <div style='font-size:16px; font-weight:600; color:#e91e63;'>Esta solicitud requiere cotización manual completa</div>
        </div>";
    }
    
    // Sección de instrucciones para el equipo de ventas
    $instructionsSection = "
    <div style='background-color:#e3f2fd; border-left:4px solid #2196f3; padding:15px; border-radius:4px; margin:20px 0;'>
        <p style='margin-top:0; font-weight:500;'>Instrucciones para el seguimiento:</p>
        <ul style='margin-bottom:0; padding-left:20px;'>
            <li>Contactar al cliente dentro de las próximas <strong>24 horas hábiles</strong></li>
            <li>Utilizar siempre la referencia <strong>{$quoteRef}</strong> en todas las comunicaciones</li>
            <li>Registrar esta solicitud en CRM con estado 'Nueva oportunidad'</li>
            <li>Preparar cotización formal según las especificaciones y enviar al cliente</li>
            <li>Actualizar estado en sistema cuando se envíe la cotización final</li>
        </ul>
    </div>";

    return "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <style>{$styles}</style>
        <title>[VENTAS] Nueva solicitud de cotización - {$quoteRef}</title>
    </head>
    <body>
        <div class='container'>
            <div class='header' style='background:linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%); padding:25px 20px; text-align:center; color:white;'>
                <img src='{$logoUrl}' class='logo' style='max-width:160px; margin-bottom:10px;' alt='Racklog'>
                <h1 style='margin:0; font-size:24px; font-weight:600;'>Nueva solicitud de cotización</h1>
                <p style='margin:5px 0 0; opacity:0.9;'>Fecha: {$today} | Ref: {$quoteRef}</p>
            </div>
            <div class='content' style='padding:30px 25px;'>
                <p style='font-size:16px; line-height:1.6;'><strong>Equipo de Ventas:</strong></p>
                
                <p style='background-color:#f1f8e9; padding:10px; border-left:4px solid #7cb342; margin-bottom:20px;'>
                    Se ha recibido una nueva solicitud de cotización a través del sitio web. Esta solicitud ya ha sido confirmada al cliente y está esperando su seguimiento.
                </p>
                
                {$customerInfoHtml}
                
                {$commentsHtml}
                
                {$productsSectionTitle}
                {$productsHtml}
                
                {$totalSection}
                
                {$instructionsSection}
                
                <p style='margin-top:25px;'>Para responder al cliente, puede utilizar los datos de contacto proporcionados o responder directamente desde CRM utilizando la plantilla de cotización formal.</p>
            </div>
            <div class='footer' style='margin-top:30px; padding:20px; background-color:#f9f9f9; text-align:center; font-size:14px; color:#777; border-radius:0 0 8px 8px;'>
                <p style='margin:0 0 10px 0;'>Email interno - No reenviar directamente al cliente</p>
                <p style='margin:0;'>© {$year} Racklog - Sistema de Gestión Comercial</p>
            </div>
        </div>
    </body>
    </html>";
}