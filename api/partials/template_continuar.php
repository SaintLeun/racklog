<?php

/** Correo "Continúa tu diseño": el link al flujo con el diseño guardado */
function generateContinuar(array $data, string $ref): string {
    $year = date('Y');
    $logoUrl = 'https://racklog.cl/assets/images/logo.png';
    $styles = $GLOBALS['baseStyles'];
    $nombre = esc($data['nombre'] ?? '');
    $link = esc($data['link'] ?? '');
    $saludo = $nombre !== '' ? "Hola {$nombre}," : 'Hola,';
    return "
    <!DOCTYPE html>
    <html>
    <head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>Tu diseño de bodega - Racklog</title><style>{$styles}</style></head>
    <body>
        <div class='container'>
            <div class='header' style='background:linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding:25px 20px; text-align:center; color:white;'>
                <img src='{$logoUrl}' class='logo' style='max-width:160px; margin-bottom:10px;' alt='Racklog'>
                <h1 style='margin:0; font-size:24px; font-weight:600;'>Tu diseño quedó guardado</h1>
            </div>
            <div style='padding:25px;'>
                <p>{$saludo}</p>
                <p>Guardamos tu diseño de bodega. Con este botón sigues donde lo dejaste:</p>
                <p style='text-align:center; margin:28px 0;'>
                    <a href='{$link}' style='background:#ea580c; color:#fff; padding:14px 26px; border-radius:10px; text-decoration:none; font-weight:600;'>Continuar mi diseño</a>
                </p>
                <p>Cuando pidas tu cotización, nuestro equipo comercial te la envía en máximo 24 horas.</p>
                <p style='font-size:12px; color:#757575;'>Ref.: " . esc($ref) . "</p>
            </div>
            <div style='text-align:center; font-size:12px; color:#9e9e9e; padding:15px;'>© {$year} Racklog</div>
        </div>
    </body>
    </html>";
}
