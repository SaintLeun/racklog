<?php

/**
 * Log estructurado en JSON (una linea por evento) hacia el log del servidor.
 * Niveles: debug, info, warn, error. Incluye un request_id para correlacion.
 */

function requestId(): string {
    static $id = null;
    if ($id === null) {
        $id = bin2hex(random_bytes(8));
    }
    return $id;
}

function logEvent(string $level, string $message, array $context = []): void {
    error_log(json_encode([
        'ts' => date('c'),
        'level' => $level,
        'request_id' => requestId(),
        'message' => $message,
        'context' => $context,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

/** Enmascara un email para no guardar datos personales completos en el log. */
function maskEmail(string $email): string {
    $parts = explode('@', $email, 2);
    if (count($parts) !== 2) {
        return '***';
    }
    return mb_substr($parts[0], 0, 1) . '***@' . $parts[1];
}
