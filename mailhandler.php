<?php
// Import PHPMailer classes into the global namespace
// These must be at the top of your script, not inside a function
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'Exception.php';
require 'PHPMailer.php';
//require 'mail/SMTP.php';
$body = "<h2>Contacto Web</h2>";
// verify captcha
/*
if(isset($_POST['tipo']) and $_POST['tipo'] != 'contacto'){
	if(isset($_POST['g-recaptcha-response']) and $_POST['g-recaptcha-response'] != ''){
		$captchaResponse = $_POST['g-recaptcha-response'];
		$captchaSecret = '6Lc0BzkUAAAAADQuPUjE4oaMlbxywVjCB8rRdpAk';
		$url = 'https://www.google.com/recaptcha/api/siteverify';

		$myvars = 'secret=' . $captchaSecret . '&response=' . $captchaResponse;

		$ch = curl_init( $url );
		curl_setopt( $ch, CURLOPT_POST, 1);
		curl_setopt( $ch, CURLOPT_POSTFIELDS, $myvars);
		curl_setopt( $ch, CURLOPT_FOLLOWLOCATION, 1);
		curl_setopt( $ch, CURLOPT_HEADER, 0);
		curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1);

		$response = curl_exec( $ch );
	}
	if (!$captchaResponse){
		echo ('Porfavor verifique el Captcha');
		exit;
	}
}
*/
// Fetch data from form
if(isset($_POST['nombre']) and $_POST['nombre'] != ''){
	$nombre = $_POST['nombre'];
	$body .="<p>Nombre: $nombre</p>";
}

if(isset($_POST['email']) and $_POST['email'] != ''){
	$email = $_POST['email'];
	$body .="<p>Email: $email</p>";
}

if(isset($_POST['telefono']) and $_POST['telefono'] != ''){
	$telefono = $_POST['telefono'];
	$body .="<p>Telefono: $telefono</p>";
}

if(isset($_POST['asunto']) and $_POST['asunto'] != ''){
	$asunto = $_POST['asunto'];
	$body .="<p>Asunto: $asunto</p>";
} else{
	$asunto = 'Contacto';
}
if(isset($_POST['mensaje']) and $_POST['mensaje'] != ''){
	$mensaje = $_POST['mensaje'];
	$body .="<p>Mensaje: $mensaje</p>";
}
if(isset($_POST['texto']) and $_POST['texto'] != ''){
	$texto = $_POST['texto'];
	$body .="<p>Mensaje: $texto</p>";
}
if(isset($_POST['producto']) and $_POST['producto'] != ''){
	$body .= "<p>" . 'Producto' . "</p>";
	$data = json_decode(stripslashes($_POST['producto']));
	foreach ($data as $key => $value ){
		$body .= '<p>' . $key . ': ' . $value . '</p>';
	}
}
if(isset($_POST['cotizacion']) and $_POST['cotizacion'] != ''){
	$body .= 'Detalle: ' . $_POST['cotizacion'];
}

$mail = new PHPMailer(true);                              // Passing `true` enables exceptions

try {
    //Server settings
    //$mail->SMTPDebug = 2;                                 // Enable verbose debug output
    //$mail->isSMTP();                                      // Set mailer to use SMTP
    //$mail->Host = 'smtp1.example.com;smtp2.example.com';  // Specify main and backup SMTP servers
    //$mail->SMTPAuth = true;                               // Enable SMTP authentication
    //$mail->Username = 'user@example.com';                 // SMTP username
    //$mail->Password = 'secret';                           // SMTP password
    //$mail->SMTPSecure = 'tls';                            // Enable TLS encryption, `ssl` also accepted
    //$mail->Port = 587;                                    // TCP port to connect to

    //Recipients
    $mail->setFrom('contacto@racklog.cl', 'Contacto');
	$mail->addAddress("contacto@racklog.cl");    				// Add a recipient
    $mail->addCC('tracking@boxproject.cl');
    // $mail->addBCC('bcc@example.com');
    //Attachments
    // $mail->addAttachment('/var/tmp/file.tar.gz');         // Add attachments
    // $mail->addAttachment('/tmp/image.jpg', 'new.jpg');    // Optional name

    //Content
    $mail->isHTML(true);                                  // Set email format to HTML
    $mail->Subject = "$asunto : $nombre ";
    $mail->Body    = $body;
    //$mail->AltBody = 'This is the body in plain text for non-HTML mail clients';
	$mail->send();
    
} catch (Exception $e) {
    echo 'Message could not be sent.';
    echo 'Mailer Error: ' . $mail->ErrorInfo;
}