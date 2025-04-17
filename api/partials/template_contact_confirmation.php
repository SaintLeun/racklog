<?php

function generateContactConfirmation(array $data, string $contactRef): string {
    $today = date('d/m/Y');
    $year = date('Y');
    $logoUrl = 'https://racklog.cl/assets/images/logo.png';
    $styles = $GLOBALS['baseStyles'];

    // Extraer datos
    $name = $data['name'] ?? 'Usuario';
    $email = $data['email'] ?? '';
    $subject = $data['subject'] ?? 'Contacto';

    return "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>Hemos recibido tu mensaje - Racklog</title>
        <style>{$styles}</style>
    </head>
    <body>
        <div class='container'>
            <div class='header' style='background:linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding:25px 20px; text-align:center; color:white;'>
                <img src='{$logoUrl}' class='logo' style='max-width:160px; margin-bottom:10px;' alt='Racklog'>
                <h1 style='margin:0; font-size:24px; font-weight:600;'>¡Gracias por contactarnos!</h1>
                <p style='margin:5px 0 0; opacity:0.9;'>Fecha: {$today}</p>
            </div>
            
            <div class='content' style='padding:30px 25px;'>
                <p style='font-size:17px; margin-bottom:20px;'>Estimado/a <strong>" . htmlspecialchars($name) . "</strong>,</p>
                
                <p style='line-height:1.7;'>Queremos confirmarte que hemos recibido tu mensaje correctamente. Gracias por tomarte el tiempo de contactarnos.</p>
                
                <div style='background-color:#f9f9f9; border-radius:6px; padding:20px; margin:25px 0; border:1px solid #eee;'>
                    <div style='border-bottom:1px solid #eee; padding-bottom:12px; margin-bottom:12px;'>
                        <p style='margin:0 0 5px 0; font-size:14px; color:#777;'>Referencia de tu mensaje:</p>
                        <p style='margin:0; font-size:18px; font-weight:600; color:#ff9800;'>{$contactRef}</p>
                    </div>
                    
                    <div>
                        <p style='margin:0 0 5px 0; font-size:14px; color:#777;'>Asunto:</p>
                        <p style='margin:0; font-weight:500;'>" . htmlspecialchars($subject) . "</p>
                    </div>
                </div>
                
                <div style='background-color:#e8f5e9; padding:15px; border-radius:4px; margin:25px 0; border-left:4px solid #4caf50;'>
                    <p style='margin:0 0 10px 0; font-weight:600; color:#2e7d32;'>¿Qué sigue?</p>
                    <p style='margin:0; color:#333;'>Un miembro de nuestro equipo revisará tu mensaje y se pondrá en contacto contigo a la brevedad, generalmente dentro de las próximas 24 horas hábiles.</p>
                </div>
                
                <div style='background-color:#f5f5f5; padding:20px; border-radius:6px; margin:25px 0;'>
                    <p style='margin:0 0 15px 0;'>Si tienes alguna consulta adicional, puedes contactarnos directamente:</p>
                    
                    <div style='margin:10px 0;'>
                        <span style='display:inline-block; width:20px; text-align:center; margin-right:8px;'>📞</span> 
                        Teléfono: <strong>+56 9 7863 2154</strong>
                    </div>
                    
                    <div style='margin:10px 0;'>
                        <span style='display:inline-block; width:20px; text-align:center; margin-right:8px;'>✉️</span> 
                        Email: <strong>contacto@racklog.cl</strong>
                    </div>
                    
                    <p style='margin:15px 0 0 0; font-size:13px; color:#666;'>Horario de atención: Lunes a Viernes de 9:00 a 18:00 hrs.</p>
                </div>
                
                <p>Agradecemos tu interés en Racklog y esperamos poder ayudarte con tus requerimientos de almacenamiento industrial.</p>
                
                <p style='margin-bottom:0;'>Saludos cordiales,<br><strong>Equipo Racklog</strong></p>
            </div>
            
            <div class='footer' style='margin-top:30px; padding:20px; background-color:#f9f9f9; text-align:center; font-size:14px; color:#777; border-radius:0 0 8px 8px;'>
                <p style='margin:0 0 10px 0;'>Este es un mensaje automático, por favor no respondas a este correo.</p>
                <p style='margin:0;'>© {$year} Racklog - Soluciones de Almacenamiento Industrial - Todos los derechos reservados</p>
            </div>
        </div>
    </body>
    </html>";
}
