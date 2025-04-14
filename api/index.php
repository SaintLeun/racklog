<?php
// Set proper CORS headers (add these at the very top before any output)
header('Access-Control-Allow-Origin: *'); // Allow requests from any origin in development
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Just exit with 200 OK status for preflight requests
    http_response_code(200);
    exit();
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

// Function to fetch Kommo data
function fetchKommoData() {
    // ... (Your Kommo data fetching function)
}

// Function to fetch angulo ranurado list
function fetchAnguloRanuradoList() {
    // ... (Your angulo ranurado list fetching function)
}

// Function to send email with fixed title and sender
function sendEmail($to, $text) {
    // Fixed email parameters
    $sender = 'contacto@racklog.cl';
    $subject = 'Cotización de Productos - Racklog';
    
    // Email headers
    $headers = [
        'From' => $sender,
        'Reply-To' => $sender,
        'X-Mailer' => 'PHP/' . phpversion(),
        'MIME-Version' => '1.0',
        'Content-Type' => 'text/html; charset=UTF-8'
    ];
    
    // Format message as HTML
    $htmlMessage = "
    <html>
    <head>
        <title>{$subject}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f8f8; padding: 10px; border-bottom: 2px solid #ddd; }
            .footer { margin-top: 20px; font-size: 12px; color: #777; }
            .logo { max-height: 60px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <img src='https://qa.racklog.cl/images/logorack.png' alt='Racklog' class='logo'>
                <h2>{$subject}</h2>
            </div>
            
            <div class='content'>
                " . nl2br(htmlspecialchars($text)) . "
            </div>
            
            <div class='footer'>
                <p>Este email fue enviado desde el sistema de cotizaciones de Racklog.</p>
                <p>© " . date('Y') . " Racklog - Todos los derechos reservados</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    // Try to send the email
    $success = mail($to, $subject, $htmlMessage, implode("\r\n", array_map(
        function ($v, $k) { return "$k: $v"; },
        $headers,
        array_keys($headers)
    )));
    
    // Return result
    if ($success) {
        return json_encode([
            'success' => true,
            'message' => "Email sent successfully to {$to}"
        ]);
    } else {
        return json_encode([
            'success' => false,
            'message' => "Failed to send email. Please check server configuration."
        ]);
    }
}

$request_uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

$path = parse_url($request_uri, PHP_URL_PATH);
$path_parts = explode('/', trim($path, '/'));

// Remove the first element if it's 'api'
if (count($path_parts) > 0 && $path_parts[0] === 'api') {
    array_shift($path_parts);
}

$endpoint = implode('/', $path_parts);

switch ($endpoint) {
    case 'test':
        if ($method == 'GET') {
            echo json_encode(['message' => 'PHP API test successful']);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;

    case 'kommo-data':
        if ($method == 'GET') {
            echo fetchKommoData();
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;

    case 'angulo-ranurado-list':
        if ($method == 'GET') {
            echo fetchAnguloRanuradoList();
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        } 
        break;

    case 'send-email':
        if ($method == 'POST') {
            // Get the JSON input
            $inputJSON = file_get_contents('php://input');
            $input = json_decode($inputJSON, TRUE);
            
            // Try to get parameters from JSON first, then fallback to POST
            $to = $input['to'] ?? ($_POST['to'] ?? '');
            $text = $input['text'] ?? ($_POST['text'] ?? '');

            if (empty($to) || empty($text)) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing required parameters (to, text)']);
            } else {
                echo sendEmail($to, $text);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;

    case '': // Handle /api/ or /api
    case '/':
        if ($method == 'GET') {
            echo json_encode(['message' => 'API Root Accessed']);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found: ' . $endpoint]);
        break;
}
?>