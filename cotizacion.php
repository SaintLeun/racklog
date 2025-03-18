<!doctype html>
<html lang="es">
<head>
<title>Racklog - Cotizando con nosotros, Estanteìas, Racks, Cajas plásticas, Transpaletas</title>
<!-- META TAGS -->
<meta charset="utf-8">
<meta name="format-detection" content="telephone=no"/>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" 
	content="Al cotizar con nostros serás atendido por uno de nuestros expertos, quien será el encargado de tomar tu requerimiento y en menos de 48 hrs enviar la cotización con el mejor precio y plazo de entrega.">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/fancybox/2.1.7/css/jquery.fancybox.min.css" />

<link href="https://www.racklog.cl/cotizacion.php" rel="canonical">
<link rel="alternate" hreflang="x-default" href="http://www.racklog.cl/cotizacion.php">	

<!-- CSS -->
<link rel="icon" href="images/favicon.ico" type="image/x-icon">
<link rel="stylesheet" href="css/bootstrap.min.css">
<link rel="stylesheet" href="css/racklog.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
<link rel="alternate"  hreflang="es" href="http://www.racklog.cl/">
<link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet" integrity="sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN" crossorigin="anonymous">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.5.2/animate.min.css" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.0.47/jquery.fancybox.min.css" />

<!-- JS -->
<script src="js/jquery.js"></script>  
<script src="js/bootstrap.min.js"></script>
<script src="js/regionesycomunas.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/waypoints/4.0.1/jquery.waypoints.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/fancybox/2.1.7/js/jquery.fancybox.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-validate/1.16.0/jquery.validate.min.js"></script>

  <!-- Hotjar Tracking Code for www.racklog.cl -->
<script>
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:336353,hjsv:5};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'//static.hotjar.com/c/hotjar-','.js?sv=');
</script>
  
  <!-- ANALYTICS -->
	<script>
	  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

	  ga('create', 'UA-81753001-2', 'auto');
	  ga('send', 'pageview');

	</script>
  
</head>
<body>
<?php 
	include 'assets/header.php';
?>
<main>
<div class="container">
    <div class="row">
        <div class="col-xs-12 col-sm-8">
           <h1>Cotización</h1>
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th> </th>
                    </tr>
                </thead>
                <tbody id="coti">
                  
                </tbody>
            </table>
            
        </div>
        <div class="col-xs-12 col-sm-4">
        	<div class="panel panel-default" style="margin-top:15px;">
					<div class="panel-heading">
						<h3 style="color:#363636" class="panel-title">Ingresa tus Datos</h3>
					</div>
					<div class="panel-body">
						<form id="cotizar_form">
							<div class="form-group">
								<input type="text" name="nombre" id="nombre" class="form-control input-sm" placeholder="Nombre">
							</div>
							<div class="form-group">
								<input type="email" name="email" id="email" class="form-control input-sm" placeholder="Correo">
							</div>
							<div class="form-group">
								<input type="telefono" name="telefono" id="telefono" class="form-control input-sm" placeholder="Teléfono">
							</div>
							<div class="form-group">
								<textarea rows="5" name="mensaje" id="mensaje" class="form-control input-sm" placeholder="Ingrese comentarios"></textarea>
							</div>
							<input type="submit" value="Solicitar Cotización" class="btn btn-block btn-warning">
							
						</form>
					</div>
				</div>
        </div>
        </div>
    </div>
</main>
<?php include 'assets/footer.php' ?>
</body>
<?php include 'assets/modal-contacto.php' ?>

<script>
$(document).ready(function() {
	showCoti();
	cotiCount();
});
	
$(function() {
  $("#cotizar_form").validate({
    // Specify validation rules
    rules: {
      nombre: "required",
	  email: {
		  required: true,
		  email: true,
	  },
	  telefono: {
		  required: true,
		  number: true,
	  },
    },
    submitHandler: function(form) {
		
		$.ajax({
			url: "assets/funciones.php",
			type: "POST",
			data: "action=getItemList",
			success: function(data){
				$.ajax({
					type: 'POST',
					url: 'assets/mail/mailhandler.php',
					data: $('#cotizar_form').serialize()+"&cotizacion="+data+"&mail=cotizacion",
					success: function (response) {
                                                $.ajax({
                                                     type: 'POST',
                                                     url: 'assets/registro_admin.php',
                                                     data: $('#cotizar_form').serialize() + "&sitioOrigen=Sitio Principal&modo=Cotizador",
                                                     success: function(respuesta_bd){
                                                         //alert(respuesta_bd);
						         $.ajax({
							     type: 'POST',
							     url: 'assets/funciones.php',
							     data: "action=destroyCoti",
							     success: function (response) {
								   showCoti();
								   cotiCount();
							     }
						         });
						         alert('Mensaje enviado con exito');
                                                     }
                                                });
					}
				});
			}
		});
		
    }
  });
});

function showCoti(){
	$.ajax({
		url: "assets/funciones.php",
		type: "POST",
		data: "action=showCoti",
		success: function(data){
			$('#coti').html(data);
		}
	});
}
function delCoti(id){
	$.ajax({
		url: "assets/funciones.php",
		type: "POST",
		data: "action=delCoti&id="+id,
		success: function(data){
			showCoti();
			cotiCount();
		}
	});
}

		   
</script>
