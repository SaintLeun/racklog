<?php
// Plantilla para api/config/token.php
// 1) Copia este archivo como token.php (en el mismo servidor, NO en git).
// 2) Reemplaza el valor con el token vigente generado en Kommo.
// 3) token.php está en .gitignore: nunca debe subirse al repositorio.

$BEARER_TOKEN = getenv('KOMMO_BEARER_TOKEN') ?: 'PON_AQUI_EL_TOKEN_ROTADO';

return $BEARER_TOKEN;
