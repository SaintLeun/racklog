<?php

function generateQuoteConfirmation(array $data, string $quoteRef): string {
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

    $productsHtml = '';
    foreach ($products as $i => $product) {
        $productsHtml .= "<div style='padding:15px; margin-bottom:15px; border-left:4px solid #ff9800; background-color:#f9f9f9; border-radius:4px;'>";
        $productsHtml .= "<div style='font-size:16px; font-weight:600; color:#333; margin-bottom:8px; padding-bottom:5px; border-bottom:1px dashed #ddd;'>" 
            . ($i + 1) . ". " . esc($product['name']) . "</div>";
        
        $productsHtml .= "<div style='display:flex; justify-content:space-between; margin-bottom:10px;'>";
        $productsHtml .= "<span>Cantidad: <strong>" . esc($product['quantity']) . "</strong></span>";
        // Eliminamos la visualización de precios unitarios
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
                    'pintado' => $value === 'si' ? 'Sí, con pintura electrostática' : 'No',
                    default => esc($value)
                };
                
                $productsHtml .= "<div style='font-size:13px; color:#555; margin-bottom:5px;'>";
                $productsHtml .= "<span style='color:#ff9800; margin-right:5px;'>•</span> <strong>" . esc($label) . ":</strong> {$displayValue}";
                $productsHtml .= "</div>";
            }
            
            $productsHtml .= "</div>";
        }
        
        // Eliminamos la sección de subtotales por producto
        $productsHtml .= "</div>";
    }

    // Información de contacto
    $contactInfo = "
    <div style='background-color:#f5f5f5; padding:20px; border-radius:6px; margin:25px 0;'>
        <p>Para solicitar precios o más información sobre estos productos, no dude en contactarnos:</p>
        <div style='margin:10px 0;'>
            <span style='display:inline-block; width:20px; text-align:center; margin-right:8px;'>📞</span> 
            <strong>+56 9 3240 3819</strong>
        </div>
        <div style='margin:10px 0;'>
            <span style='display:inline-block; width:20px; text-align:center; margin-right:8px;'>✉️</span> 
            <strong>contacto@racklog.cl</strong>
        </div>
    </div>";

    // Datos del cliente en formato tabla
    $customerInfoHtml = '';
    if (!empty($customerName) || !empty($customerEmail) || !empty($customerPhone) || !empty($customerCompany)) {
        $customerInfoHtml = "
        <div style='margin-bottom:25px; padding-bottom:20px; border-bottom:1px solid #f0f0f0;'>
            <div style='background-color:#f8f8f8; color:#ff9800; font-size:16px; font-weight:bold; padding:10px 15px; border-radius:4px; margin-bottom:15px;'>
                DATOS DEL CLIENTE
            </div>
            <table style='width:100%;'>
                <tr>
                    <td style='padding:5px 15px 5px 0; font-weight:bold; width:120px;'>Nombre:</td>
                    <td style='padding:5px 0;'>" . esc($customerName) . "</td>
                </tr>";
                
        if (!empty($customerCompany)) {
            $customerInfoHtml .= "
                <tr>
                    <td style='padding:5px 15px 5px 0; font-weight:bold;'>Empresa:</td>
                    <td style='padding:5px 0;'>" . esc($customerCompany) . "</td>
                </tr>";
        }
                
        $customerInfoHtml .= "
                <tr>
                    <td style='padding:5px 15px 5px 0; font-weight:bold;'>Email:</td>
                    <td style='padding:5px 0;'>" . esc($customerEmail) . "</td>
                </tr>
                <tr>
                    <td style='padding:5px 15px 5px 0; font-weight:bold;'>Teléfono:</td>
                    <td style='padding:5px 0;'>" . esc($customerPhone) . "</td>
                </tr>
            </table>
        </div>";
    }

    // Los comentarios del cliente no se repiten en la confirmacion: es texto libre
    // y permitiria usar este correo para enviar contenido arbitrario a terceros.
    // El equipo interno los recibe completos en la plantilla de cotizacion.
    $commentsHtml = '';

    // Productos section title
    $productsSectionTitle = "
    <div style='background-color:#f8f8f8; color:#ff9800; font-size:16px; font-weight:bold; padding:10px 15px; border-radius:4px; margin-bottom:15px;'>
        DETALLE DE PRODUCTOS
    </div>";
    
    // Sección de precio a consultar
    $priceSection = "
    <div style='background-color:#f0f7ff; padding:15px; border-radius:4px; margin:20px 0; border-left:4px solid #2196f3;'>
        <p style='margin:0; font-weight:500;'>Los precios de esta selección de productos serán proporcionados por nuestro equipo comercial. Nos pondremos en contacto a la brevedad para ofrecerle una cotización personalizada.</p>
    </div>";

    return "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <style>{$styles}</style>
        <title>Cotización de Productos - Racklog</title>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <img src='{$logoUrl}' class='logo' alt='Racklog'>
                <h1>Cotización de Productos</h1>
                <p>Fecha: {$today} | Ref: {$quoteRef}</p>
            </div>
            <div class='content'>
                <p style='font-size:17px; margin-bottom:20px;'>Estimado/a <strong>" . esc($customerName) . "</strong>,</p>
                
                <p>Gracias por su interés en nuestros productos de almacenamiento industrial. Hemos recibido su solicitud de cotización y a continuación le presentamos un detalle de los productos configurados. Un asesor comercial se pondrá en contacto con usted para proporcionarle los precios específicos y resolver cualquier consulta adicional.</p>
                
                {$customerInfoHtml}
                
                {$commentsHtml}
                
                {$productsSectionTitle}
                {$productsHtml}
                
                {$priceSection}
                
                <div style='background-color:#e8f5e9; padding:12px 15px; border-radius:4px; margin:20px 0; font-size:14px; color:#2e7d32; border-left:4px solid #4caf50;'>
                    <strong>Nota:</strong> Una vez enviada la cotización con precios, esta tendrá una validez de 15 días a partir de la fecha de envío. Los precios están sujetos a confirmación de stock al momento de realizar el pedido.
                </div>
                
                {$contactInfo}
                
                <p>Agradecemos su preferencia y confianza en Racklog. Estamos comprometidos a ofrecerle soluciones de almacenamiento de la más alta calidad para optimizar sus espacios industriales.</p>
                
                <p>Atentamente,<br><strong>Equipo Comercial Racklog</strong></p>
            </div>
            <div class='footer'>
                © {$year} Racklog - Soluciones de Almacenamiento Industrial - Todos los derechos reservados
            </div>
        </div>
    </body>
    </html>";
}
