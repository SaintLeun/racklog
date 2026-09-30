<?php

require_once __DIR__ . '/logger.php';

/**
 * Directorio donde se guardan los contadores. Usa el temporal del sistema y,
 * si no se puede escribir, una carpeta propia de la API (bloqueada por .htaccess).
 */
function rateLimitStorageDir(): ?string {
    static $resolved = false;
    static $dir = null;
    if ($resolved) {
        return $dir;
    }
    $resolved = true;

    foreach ([sys_get_temp_dir() . '/racklog_ratelimit', __DIR__ . '/../storage/ratelimit'] as $candidate) {
        if ((is_dir($candidate) || @mkdir($candidate, 0700, true)) && is_writable($candidate)) {
            $dir = $candidate;
            break;
        }
    }
    return $dir;
}

/**
 * Limitador simple basado en archivos (sin dependencias externas).
 * Devuelve true si la solicitud puede continuar, false si excede el limite.
 */
function checkRateLimit(string $bucket, string $key, int $maxHits, int $windowSeconds): bool {
    $dir = rateLimitStorageDir();
    $fp = $dir === null ? false : @fopen($dir . '/' . $bucket . '_' . hash('sha256', $key) . '.json', 'c+');
    if ($fp === false) {
        // Sin almacenamiento no hay limite posible. Se deja pasar para no perder
        // leads reales, pero queda registrado y /health responde "degraded".
        logEvent('error', 'rate_limit_storage_unavailable', ['bucket' => $bucket]);
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

    // Limpieza ocasional de contadores viejos (1 de cada 100 solicitudes)
    if (random_int(1, 100) === 1) {
        foreach (glob($dir . '/*.json') ?: [] as $file) {
            if (@filemtime($file) < $now - 86400) {
                @unlink($file);
            }
        }
    }

    return $allowed;
}
