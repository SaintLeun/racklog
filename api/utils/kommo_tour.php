<?php

/*
 * Leads del tour "Planifica tu bodega" (racklog.cl/planifica-tu-bodega).
 *
 * Al crear el lead en Kommo (createLead) se le agrega la etiqueta tour-logistico y, si estan
 * configurados, los campos propios (rol, industria, flags, puntaje, UTM). Despues de crearlo,
 * procesarLeadTour() agrega:
 *   - una nota con UTM, rol, industria, flags y puntaje (siempre, aunque no haya campos),
 *   - una TAREA "Enviar cotizacion" que vence en 24 h, para el responsable del lead,
 *   - los archivos del formulario (el plano) subidos al Drive de Kommo y vinculados al lead.
 *
 * Nada de esto puede romper el formulario: cada paso devuelve su error y send_email.php solo lo registra.
 *
 * Configuracion opcional (en api/config/token.php, junto a $BEARER_TOKEN, o como variables de entorno):
 *   $KOMMO_CAMPOS_TOUR = ['rol' => 123, 'industria' => 124, 'flags' => 125, 'puntaje' => 126,
 *                         'utm_source' => 127, 'utm_medium' => 128, 'utm_campaign' => 129];
 *     (o KOMMO_CAMPOS_TOUR='{"rol":123,...}'). Campos de texto en Kommo; puntaje puede ser numerico.
 *   $KOMMO_RESPONSABLE_TOUR = 987654;  (o KOMMO_RESPONSABLE_TOUR) vendedor fijo para estos leads;
 *     sin el, la tarea va al responsable que Kommo le asigno al lead.
 *   $KOMMO_ADJUNTOS = false;  (o KOMMO_ADJUNTOS=0) no subir los archivos a Kommo (siguen en el correo).
 *
 * Prompt de conversion (docs/AVANCE-CONVERSION.md): la via expres (4 preguntas) entra al mismo circuito con la
 * etiqueta via-expres. Si el cliente se atasco y pidio la visita tecnica en la RM, el lead lleva la etiqueta
 * visita-tecnica y una segunda tarea de 24 h "Coordinar visita tecnica" (fuera de la RM: validar por
 * videollamada o fotos). La nota lista los "Datos por confirmar" (valores que el cliente dejo en "No lo se").
 *
 * Modo prueba (racklog.cl/planifica-tu-bodega/disena?prueba=1): el formulario llega completo, pero el lead
 * lleva la etiqueta PRUEBA, no se le asigna vendedor ni se crea la tarea de 24 h. Solo vale si el correo
 * es de prueba (algo+prueba@racklog.cl), para que un cliente real nunca quede marcado como prueba.
 */

const TOUR_ETIQUETA = 'tour-logistico';
const TOUR_TAREA_TEXTO = 'Enviar cotización (promesa máximo 24 horas)';
const TOUR_TAREA_HORAS = 24;
const TOUR_ETIQUETA_PRUEBA = 'PRUEBA';
const TOUR_ETIQUETA_EXPRES = 'via-expres';
const TOUR_ETIQUETA_VISITA = 'visita-tecnica';
const TOUR_TAREA_VISITA = 'Coordinar visita técnica';
const TOUR_TAREA_REMOTA = 'Validar medidas por videollamada o fotos';

/** Lead de prueba: lo pide el formulario (?prueba=1) y el correo es +prueba@racklog.cl */
function esPruebaTour(array $data): bool {
    $config = configTour($data) ?? [];
    $correo = strtolower(trim((string) ($data['customerEmail'] ?? '')));
    return in_array(strtolower((string) ($config['Prueba'] ?? '')), ['sí', 'si', '1'], true)
        && preg_match('/\+prueba@racklog\.cl$/', $correo) === 1;
}

/** Configuracion: variable global (token.php) o de entorno */
function kommoConfigTour(string $nombre) {
    if (array_key_exists($nombre, $GLOBALS) && $GLOBALS[$nombre] !== null) {
        return $GLOBALS[$nombre];
    }
    $env = getenv($nombre);
    if ($env === false || $env === '') {
        return null;
    }
    $json = json_decode($env, true);
    return $json ?? $env;
}

/** Base de la API v4 (https://<cuenta>.kommo.com/api/v4), derivada de kommoApiUrl() */
function kommoBaseUrl(): string {
    return preg_replace('#/leads/?$#', '', kommoApiUrl());
}

/**
 * Solicitud HTTP a Kommo con el token. En pruebas se reemplaza con $GLOBALS['KOMMO_HTTP_MOCK']
 * (callable con la misma firma), asi nunca se llama a Kommo de verdad.
 * @return array ['status' => int, 'body' => ?array, 'error' => ?string]
 */
function kommoHttp(string $method, string $url, ?string $body = null, string $contentType = 'application/json'): array {
    if (is_callable($GLOBALS['KOMMO_HTTP_MOCK'] ?? null)) {
        return ($GLOBALS['KOMMO_HTTP_MOCK'])($method, $url, $body, $contentType);
    }
    global $BEARER_TOKEN;
    $ch = curl_init($url);
    $headers = ['Authorization: Bearer ' . $BEARER_TOKEN, 'Accept: application/json'];
    if ($body !== null) {
        $headers[] = 'Content-Type: ' . $contentType;
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    return [
        'status' => $status,
        'body' => is_string($response) ? json_decode($response, true) : null,
        'error' => $error ?: null,
    ];
}

function kommoOk(array $r): bool {
    return $r['error'] === null && $r['status'] >= 200 && $r['status'] < 300;
}

/** Configuracion del producto del tour (pares etiqueta => valor que arma PasoCotiza.vue) */
function configTour(array $data): ?array {
    foreach ($data['products'] ?? [] as $product) {
        $config = is_array($product['config'] ?? null) ? $product['config'] : [];
        $origen = (string) ($config['Origen'] ?? '');
        if (
            ($config['Etiqueta'] ?? null) === TOUR_ETIQUETA
            || str_starts_with($origen, 'Planifica tu bodega')
            || ($config['lead_origin'] ?? null) === 'planifica-tu-bodega'
        ) {
            return $config;
        }
    }
    return null;
}

function esLeadTour(array $data, string $tipo): bool {
    return in_array(strtolower(trim($tipo)), ['quote', 'cotizacion'], true) && configTour($data) !== null;
}

/**
 * Datos del tour para Kommo
 * @return array ['rol', 'industria', 'flags', 'puntaje' => ?int, 'utm' => [clave => valor], 'origen']
 */
function datosTour(array $data): array {
    $config = configTour($data) ?? [];
    $utm = [];
    // 'Campaña' llega como "utm_source=google · utm_medium=cpc · fbclid=..."
    foreach (preg_split('/\s*·\s*/u', (string) ($config['Campaña'] ?? '')) ?: [] as $par) {
        if (preg_match('/^([A-Za-z0-9_]+)=(.*)$/', trim($par), $m)) {
            $utm[strtolower($m[1])] = trim($m[2]);
        }
    }
    $puntaje = preg_match('/(\d+)/', (string) ($config['Puntaje del lead'] ?? ''), $m) ? (int) $m[1] : null;
    $visita = (string) ($config['Visita técnica'] ?? '');
    $confirmar = (string) ($config['Datos por confirmar'] ?? $config['Confirmar con el cliente'] ?? '');
    return [
        'origen' => (string) ($config['Origen'] ?? 'Planifica tu bodega'),
        'via' => str_starts_with(mb_strtolower((string) ($config['Vía'] ?? '')), 'expr') ? 'expres' : 'diseno',
        'comuna' => (string) ($config['Comuna'] ?? $config['Comuna de instalación'] ?? ''),
        'precision' => (string) ($config['Precisión'] ?? ''),
        'confirmar' => array_values(array_filter(array_map('trim', preg_split('/\s*[;,]\s*/u', $confirmar) ?: []), 'strlen')),
        // 'solicitada (RM)' = visita en terreno; cualquier otro valor = validar a distancia
        'visita' => $visita === '' ? null : (str_starts_with($visita, 'solicitada') ? 'terreno' : 'remota'),
        'rol' => (string) ($config['Rol'] ?? ''),
        'industria' => (string) ($config['Industria'] ?? ''),
        'flags' => (string) ($config['Flags'] ?? ''),
        'puntaje' => $puntaje,
        'utm' => $utm,
    ];
}

/** Etiqueta y campos propios que se agregan al crear el lead (createLead) */
function extrasLeadTour(array $data, string $tipo): array {
    if (!esLeadTour($data, $tipo)) {
        return ['tags' => [], 'campos' => [], 'responsable' => null];
    }
    $t = datosTour($data);
    $valores = ['rol' => $t['rol'], 'industria' => $t['industria'], 'flags' => $t['flags'], 'puntaje' => $t['puntaje']] + $t['utm'];
    $campos = [];
    $mapa = kommoConfigTour('KOMMO_CAMPOS_TOUR');
    foreach (is_array($mapa) ? $mapa : [] as $clave => $fieldId) {
        $valor = $valores[$clave] ?? null;
        if ((int) $fieldId > 0 && $valor !== null && $valor !== '') {
            $campos[] = ['field_id' => (int) $fieldId, 'values' => [['value' => $valor]]];
        }
    }
    $tags = array_map(fn($t) => ['name' => $t], etiquetasTour($data));
    if (esPruebaTour($data)) {
        return ['tags' => $tags, 'campos' => $campos, 'responsable' => null];
    }
    $responsable = (int) (kommoConfigTour('KOMMO_RESPONSABLE_TOUR') ?? 0);
    return ['tags' => $tags, 'campos' => $campos, 'responsable' => $responsable > 0 ? $responsable : null];
}

/** Etiquetas del lead: tour-logistico, via-expres, visita-tecnica (solo en terreno, RM) y PRUEBA */
function etiquetasTour(array $data): array {
    $t = datosTour($data);
    $tags = [TOUR_ETIQUETA];
    if ($t['via'] === 'expres') {
        $tags[] = TOUR_ETIQUETA_EXPRES;
    }
    if ($t['visita'] === 'terreno') {
        $tags[] = TOUR_ETIQUETA_VISITA;
    }
    if (esPruebaTour($data)) {
        $tags[] = TOUR_ETIQUETA_PRUEBA;
    }
    return $tags;
}

function textoNotaTour(array $data, string $referencia): string {
    $t = datosTour($data);
    $lineas = [
        (esPruebaTour($data) ? 'PRUEBA (no cotizar): ' : '') . 'Lead del tour Planifica tu bodega' . ($t['via'] === 'expres' ? ' — vía exprés' : '') . " ({$referencia})",
        'Etiqueta: ' . implode(', ', etiquetasTour($data)),
        'Vía: ' . ($t['via'] === 'expres' ? 'exprés (4 preguntas, cotizamos nosotros)' : 'diseño (el cliente armó su layout)'),
        'Comuna: ' . ($t['comuna'] ?: 'sin dato'),
        'Rol: ' . ($t['rol'] ?: 'sin dato'),
        'Industria: ' . ($t['industria'] ?: 'sin dato'),
        'Puntaje: ' . ($t['puntaje'] !== null ? "{$t['puntaje']}/100" : 'sin dato'),
        'Flags: ' . ($t['flags'] ?: 'ninguno'),
    ];
    if ($t['utm']) {
        $lineas[] = 'Campaña: ' . implode(' · ', array_map(fn($k, $v) => "{$k}={$v}", array_keys($t['utm']), $t['utm']));
    } else {
        $lineas[] = 'Campaña: directo (sin UTM)';
    }
    if ($t['precision'] !== '') {
        $lineas[] = 'Precisión de la cotización: ' . $t['precision'];
    }
    if ($t['confirmar']) {
        $lineas[] = 'Datos por confirmar (el cliente marcó "No lo sé"; quedó un valor estimado):';
        foreach ($t['confirmar'] as $c) {
            $lineas[] = "- {$c}";
        }
    } else {
        $lineas[] = 'Datos por confirmar: ninguno';
    }
    if ($t['visita'] === 'terreno') {
        $lineas[] = 'Visita técnica: SOLICITADA (RM). Coordinar fecha con el cliente; la web no prometió fecha.';
    } elseif ($t['visita'] === 'remota') {
        $lineas[] = 'Validar medidas por videollamada o con fotos/plano (fuera de la RM).';
    }
    if (!empty($data['adjuntos'])) {
        $lineas[] = 'Archivos: ' . implode(', ', $data['adjuntos']);
    }
    if (!empty($data['linkDiseno'])) {
        $lineas[] = 'Video recorrido: abre el diseño, pulsa "Descargar video" y envíaselo al cliente: ' . $data['linkDiseno'];
    }
    $lineas[] = 'Promesa: cotización en máximo 24 horas.';
    return implode("\n", $lineas);
}

/** Responsable del lead: el configurado o el que Kommo le asigno */
function responsableLead(int $leadId): ?int {
    $fijo = (int) (kommoConfigTour('KOMMO_RESPONSABLE_TOUR') ?? 0);
    if ($fijo > 0) {
        return $fijo;
    }
    $r = kommoHttp('GET', kommoBaseUrl() . "/leads/{$leadId}");
    $id = kommoOk($r) ? ($r['body']['responsible_user_id'] ?? null) : null;
    return is_int($id) && $id > 0 ? $id : null;
}

function crearTareaTour(int $leadId, ?int $responsable, int $ahora, string $texto = TOUR_TAREA_TEXTO): array {
    $tarea = [
        'task_type_id' => 1, // Seguimiento
        'text' => $texto,
        'complete_till' => $ahora + TOUR_TAREA_HORAS * 3600,
        'entity_id' => $leadId,
        'entity_type' => 'leads',
    ];
    if ($responsable !== null) {
        $tarea['responsible_user_id'] = $responsable;
    }
    return kommoHttp('POST', kommoBaseUrl() . '/tasks', json_encode([$tarea], JSON_UNESCAPED_UNICODE));
}

function crearNotaTour(int $leadId, string $texto): array {
    return kommoHttp('POST', kommoBaseUrl() . '/leads/notes', json_encode([[
        'entity_id' => $leadId,
        'note_type' => 'common',
        'params' => ['text' => $texto],
    ]], JSON_UNESCAPED_UNICODE));
}

/**
 * Sube los archivos al Drive de Kommo y los vincula al lead (pestaña Archivos del lead).
 * Flujo de Kommo: GET /account?with=drive_url -> POST {drive}/v1.0/sessions -> partes al upload_url
 * -> PUT /leads/{id}/files con los uuid.
 * @param array $archivos [['name', 'type', 'content'], ...] ya validados por validateAttachments()
 * @return array ['subidos' => int, 'error' => ?string]
 */
function adjuntarArchivosLead(int $leadId, array $archivos): array {
    if (!$archivos) {
        return ['subidos' => 0, 'error' => null];
    }
    $flag = kommoConfigTour('KOMMO_ADJUNTOS');
    if ($flag === false || $flag === 0 || $flag === '0') {
        return ['subidos' => 0, 'error' => 'desactivado'];
    }
    $cuenta = kommoHttp('GET', kommoBaseUrl() . '/account?with=drive_url');
    $drive = kommoOk($cuenta) ? ($cuenta['body']['drive_url'] ?? null) : null;
    if (!is_string($drive) || $drive === '') {
        return ['subidos' => 0, 'error' => 'sin drive_url (http_' . $cuenta['status'] . ')'];
    }

    $uuids = [];
    foreach ($archivos as $a) {
        $sesion = kommoHttp('POST', rtrim($drive, '/') . '/v1.0/sessions', json_encode([
            'file_name' => $a['name'],
            'file_size' => strlen($a['content']),
            'content_type' => $a['type'],
        ]));
        $url = kommoOk($sesion) ? ($sesion['body']['upload_url'] ?? null) : null;
        $parte = max(1, (int) ($sesion['body']['max_part_size'] ?? 524288));
        if (!is_string($url)) {
            return ['subidos' => count($uuids), 'error' => "sesion de subida {$a['name']} (http_{$sesion['status']})"];
        }
        $uuid = null;
        for ($offset = 0; $offset < strlen($a['content']) && is_string($url); $offset += $parte) {
            $r = kommoHttp('POST', $url, substr($a['content'], $offset, $parte), 'application/octet-stream');
            if (!kommoOk($r)) {
                return ['subidos' => count($uuids), 'error' => "subida {$a['name']} (http_{$r['status']})"];
            }
            $uuid = $r['body']['uuid'] ?? null;
            $url = $r['body']['next_url'] ?? null;
        }
        if (!is_string($uuid)) {
            return ['subidos' => count($uuids), 'error' => "subida {$a['name']} sin uuid"];
        }
        $uuids[] = ['file_uuid' => $uuid];
    }

    $r = kommoHttp('PUT', kommoBaseUrl() . "/leads/{$leadId}/files", json_encode($uuids));
    return kommoOk($r)
        ? ['subidos' => count($uuids), 'error' => null]
        : ['subidos' => 0, 'error' => 'vincular archivos (http_' . $r['status'] . ')'];
}

/**
 * Pasos posteriores a crear un lead del tour. No lanza excepciones.
 * @return ?array null si no es lead del tour; si no, el resultado de cada paso para el log
 */
function procesarLeadTour(array $data, string $tipo, string $referencia, array $leadResult, array $archivos = [], ?int $ahora = null): ?array {
    if (!esLeadTour($data, $tipo) || !kommoConfigured() || !is_int($leadResult['id'] ?? null)) {
        return null;
    }
    $leadId = $leadResult['id'];
    $resultado = ['nota' => null, 'tarea' => null, 'tarea_vence' => null, 'responsable' => null, 'archivos' => null, 'errores' => []];
    try {
        $nota = crearNotaTour($leadId, textoNotaTour($data, $referencia));
        $resultado['nota'] = kommoOk($nota);
        if (!$resultado['nota']) {
            $resultado['errores'][] = 'nota: ' . ($nota['error'] ?? 'http_' . $nota['status']);
        }

        $ahora = $ahora ?? time();
        if (esPruebaTour($data)) {
            // Prueba: sin vendedor ni tarea de 24 h (la nota y el plano si, para revisar que llegan)
            $resultado['prueba'] = true;
            $adj = adjuntarArchivosLead($leadId, $archivos);
            $resultado['archivos'] = $adj['subidos'];
            return $resultado;
        }
        $responsable = responsableLead($leadId);
        $tarea = crearTareaTour($leadId, $responsable, $ahora);
        $resultado['responsable'] = $responsable;
        $resultado['tarea'] = kommoOk($tarea) ? ($tarea['body']['_embedded']['tasks'][0]['id'] ?? true) : false;
        $resultado['tarea_vence'] = date('c', $ahora + TOUR_TAREA_HORAS * 3600);
        if ($resultado['tarea'] === false) {
            $resultado['errores'][] = 'tarea: ' . ($tarea['error'] ?? 'http_' . $tarea['status']);
        }
        // Rescate: el cliente pidio que midamos (RM) o validar a distancia (regiones)
        $visita = datosTour($data)['visita'];
        if ($visita !== null) {
            $tv = crearTareaTour($leadId, $responsable, $ahora, $visita === 'terreno' ? TOUR_TAREA_VISITA : TOUR_TAREA_REMOTA);
            $resultado['tarea_visita'] = kommoOk($tv) ? ($tv['body']['_embedded']['tasks'][0]['id'] ?? true) : false;
            if ($resultado['tarea_visita'] === false) {
                $resultado['errores'][] = 'tarea visita: ' . ($tv['error'] ?? 'http_' . $tv['status']);
            }
        }

        $adj = adjuntarArchivosLead($leadId, $archivos);
        $resultado['archivos'] = $adj['subidos'];
        if ($adj['error'] !== null && $adj['error'] !== 'desactivado') {
            $resultado['errores'][] = 'archivos: ' . $adj['error'];
        }
    } catch (Throwable $e) {
        $resultado['errores'][] = 'excepcion: ' . $e->getMessage();
    }
    return $resultado;
}
