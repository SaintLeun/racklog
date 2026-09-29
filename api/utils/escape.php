<?php

/**
 * Escapa cualquier valor para insertarlo en HTML (contenido o atributos).
 * Acepta valores no string (numeros, arrays, null) sin lanzar errores.
 */
function esc($value): string {
    if (is_array($value) || is_object($value)) {
        $value = json_encode($value, JSON_UNESCAPED_UNICODE);
    }
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
