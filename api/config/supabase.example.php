<?php
// Plantilla para api/config/supabase.php (base de la intranet, proyecto cierre-mes-intranet)
// 1) Ejecuta docs/supabase_leads_web.sql en el SQL Editor de Supabase y copia el token que devuelve.
// 2) Copia este archivo como supabase.php (en el mismo servidor, NO en git) y completa los valores.
//    URL y clave publicable (anon): Supabase > Project Settings > API. NO uses la clave service_role.
// 3) Sin este archivo la API sigue funcionando (correo + Kommo), solo no guarda en la intranet.

$SUPABASE_URL = getenv('SUPABASE_URL') ?: 'https://PON_AQUI_EL_ID.supabase.co';
$SUPABASE_ANON_KEY = getenv('SUPABASE_ANON_KEY') ?: 'PON_AQUI_LA_CLAVE_PUBLICABLE';
$SUPABASE_LEAD_TOKEN = getenv('SUPABASE_LEAD_TOKEN') ?: 'PON_AQUI_EL_TOKEN_DEL_SQL';
