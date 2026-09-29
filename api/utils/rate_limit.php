<?php

/**
 * Limitador simple basado en archivos (sin dependencias externas).
 * Devuelve true si la solicitud puede continuar, false si excede el limite.
 */
function checkRateLimit(string $bucket, string $key, int $maxHits, int $windowSeconds): bool {
    $dir = sys_get_temp_dir() . '/racklog_ratelimit';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        // Si no se puede escribir, no bloqueamos el formulario legitimo
        return true;
    }

    $file = $dir . '/' . $bucket . '_' . hash('sha256', $key) . '.json';
    $fp = @fopen($file, 'c+');
    if ($fp === false) {
        return true;
    }

    flock($fp, LOCK_EX);
    $now = time();
    $hits = json_decode(stream_get_contents($fp), true);
    $hits = is_array($hits) ? $hits : [];
    $hits = array_values(array_filter($hits, fn($t) => is_int($t) && $t > $now - $windowSeconds));

    $allowed = count($hits) < $maxHits;
    if ($allowed) {
        $hits[] = $now;
    }

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($hits));
    flock($fp, LOCK_UN);
    fclose($fp);

    return $allowed;
}
