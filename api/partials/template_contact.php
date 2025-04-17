<?php

function generateContact(array $data, string $contactRef): string {
    $today = date('d/m/Y');
    $year = date('Y');
    $logoUrl = 'https://racklog.cl/assets/images/logo.png';
    $styles = $GLOBALS['baseStyles'];

    // Extraer datos
    $name = $data['name'] ?? 'Usuario';
    $email = $data['email'] ?? '';
    $phone = $data['phone'] ?? 'No proporcionado';
    $subject = $data['subject'] ?? 'Contacto';
    $message = $data['message'] ?? '';
    $serviceInfo = $data['serviceInfo'] ?? '';
    
    // Información de contacto con formato de tabla
    $contactInfoTable = "
    <div style='margin-bottom:25px; padding-bottom:20px; border-bottom:1px solid #f0f0f0;'>
        <div style='background-color:#f8f8f8; color:#ff9800; font-size:16px; font-weight:bold; padding:10px 15px; border-radius:4px; margin-bottom:15px;'>
            INFORMACIÓN DE CONTACTO
        </div>
        <table style='width:100%; border-collapse:collapse;'>
            <tr>
                <td style='width:30%; padding:8px 12px; background-color:#f5f5f5; text-align:left; font-weight:600;'>Nombre:</td>
                <td style='padding:8px 12px;'><strong>" . htmlspecialchars($name) . "</strong></td>
            </tr>
            <tr>
                <td style='padding:8px 12px; background-color:#f5f5f5; text-align:left; font-weight:600;'>Email:</td>
                <td style='padding:8px 12px;'><a href='mailto:" . htmlspecialchars($email) . "' style='color:#ff9800; text-decoration:none;'>" . htmlspecialchars($email) . "</a></td>
            </tr>
            <tr>
                <td style='padding:8px 12px; background-color:#f5f5f5; text-align:left; font-weight:600;'>Teléfono:</td>
                <td style='padding:8px 12px;'>" . htmlspecialchars($phone) . "</td>
            </tr>
            <tr>
                <td style='padding:8px 12px; background-color:#f5f5f5; text-align:left; font-weight:600;'>Asunto:</td>
                <td style='padding:8px 12px;'>" . htmlspecialchars($subject) . "</td>
            </tr>";
    
    // Agregar información de servicio si existe
    if (!empty($serviceInfo)) {
        $contactInfoTable .= "
            <tr>
                <td style='padding:8px 12px; background-color:#f5f5f5; text-align:left; font-weight:600;'>Servicio:</td>
                <td style='padding:8px 12px;'>" . htmlspecialchars($serviceInfo) . "</td>
            </tr>";
    }
    
    $contactInfoTable .= "
        </table>
    </div>";

    // Sección de mensaje con un diseño mejorado
    $messageSection = "
    <div style='margin-bottom:25px; padding-bottom:20px;'>
        <div style='background-color:#f8f8f8; color:#ff9800; font-size:16px; font-weight:bold; padding:10px 15px; border-radius:4px; margin-bottom:15px;'>
            MENSAJE
        </div>
        <div style='background-color:#f9f9f9; border-left:4px solid #ff9800; padding:20px; margin:15px 0; border-radius:4px; line-height:1.7;'>
            " . nl2br(htmlspecialchars($message)) . "
        </div>
    </div>";
    
    // Sección de instrucciones para el receptor del email
    $instructionsSection = "
    <div style='background-color:#e3f2fd; border-left:4px solid #2196f3; padding:15px; border-radius:4px; margin:20px 0;'>
        <p style='margin-top:0; font-weight:500;'>Recomendaciones:</p>
        <ul style='margin-bottom:0; padding-left:20px;'>
            <li>Responder dentro de las próximas 24 horas</li>
            <li>Guardar esta referencia: <strong>{$contactRef}</strong> para seguimiento interno</li>
            <li>Añadir a CRM si corresponde a una oportunidad de venta</li>
        </ul>
    </div>";

    return "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>Nuevo Mensaje de Contacto - Racklog</title>
        <style>{$styles}</style>
    </head>
    <body>
        <div class='container' style='max-width:650px; margin:0 auto; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 3px 10px rgba(0,0,0,0.05);'>
            <div class='header' style='background:linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding:25px 20px; text-align:center; color:white;'>
                <img src='{$logoUrl}' class='logo' style='max-width:160px; margin-bottom:10px;' alt='Racklog'>
                <h1 style='margin:0; font-size:24px; font-weight:600;'>Nuevo Mensaje de Contacto</h1>
                <p style='margin:5px 0 0; opacity:0.9;'>Fecha: {$today} | Ref: {$contactRef}</p>
            </div>
            
            <div class='content' style='padding:30px 25px;'>
                <p style='font-size:16px; line-height:1.6;'>Se ha recibido un nuevo mensaje de contacto a través del sitio web de Racklog. A continuación, se detallan los datos proporcionados por el usuario:</p>
                
                {$contactInfoTable}
                
                {$messageSection}
                
                {$instructionsSection}
                
                <p style='margin-top:25px;'>Para responder directamente a este contacto, puede hacerlo respondiendo a este correo o contactando al usuario a través de los datos proporcionados.</p>
            </div>
            
            <div class='footer' style='margin-top:30px; padding:20px; background-color:#f9f9f9; text-align:center; font-size:14px; color:#777; border-radius:0 0 8px 8px;'>
                <p style='margin:0 0 10px 0;'>Este mensaje fue enviado desde el formulario de contacto en el sitio web de Racklog.</p>
                <p style='margin:0;'>© {$year} Racklog - Soluciones de Almacenamiento Industrial - Todos los derechos reservados</p>
            </div>
        </div>
    </body>
    </html>";
}
