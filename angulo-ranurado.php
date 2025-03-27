
<!-- 
	MODAL COTIZAR 
-->
<div class="modal fade" id="modal-angulo-ranurado">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-body" style="padding-top: 0px;">
				<div style="background: #363636; color: #FFF"  class="row">
					<div style="text-align: left;" class="col-xs-11">
						<h3>ÁNGULO RANURADO <br> <small>ESTANTERÍAS</small></h3>
					</div>
					<div class="col-xs-1">
						<button type="button" class="close" style="color: #FFF;" data-dismiss="modal"><span aria-hidden="true">&times;</span></button>
					</div>
				</div>
				<div class="row">
					<div class="col-sm-4 col-xs-12">
						<form id="cotizar-angulo-ranurado">
							<div class="form-group label-floating">
								<label class="control-label">Tipo Estantería <small>(requerido)</small></label>
								<select name="tipo" id="tipo" class="form-control">
									<option disabled="" selected=""></option>
									<option value="SIMPLE" >Simple</option>
									<option value="DOBLE" >Doble</option>
								</select>
							</div>
							<div class="form-group label-floating">
								<label for="bandeja" class="control-label">Tipo Bandeja <small>(requerido)</small></label>
								<select name="bandeja" id="bandeja" class="form-control">
									<option disabled="" selected=""></option>
									<option value="300">300 mm x 920 mm</option>
									<option value="400">400 mm x 920 mm</option>
									<option value="460">460 mm x 920 mm</option>
									<option value="600">600 mm x 920 mm</option>
								</select>
							</div>
							<div class="form-group label-floating">
								<label for="pcarga" class="control-label">Cantidad de Bandejas <small>(requerido)</small></label>
								<select name="pcarga" id="pcarga" class="form-control">
									<option disabled="" selected=""></option>
									<?php 
										for( $i=3 ; $i<=6 ; $i++ ){
											echo "<option value='$i'>$i</option>";
										}
									?>
								</select>
							</div>
							<div class="form-group label-floating">
								<label class="control-label">Cuerpos <small>(requerido)</small></label>
								<select name="cuerpos" id="cuerpos" class="form-control">
									<option disabled="" selected=""></option>
									<?php 
										for( $i=1 ; $i<=10 ; $i++ ){
											echo "<option value='$i'>$i</option>";
										}
									?>
								</select>
							</div>
							<div class="form-group label-floating">
								<label class="control-label">Alto (mm) <small>(opcional)</small></label>
								<select name="alto" id="alto-ar" class="form-control">
									<option disabled="" selected=""></option>
									<option value="2000">2000 mm</option>
									<option value="2500">2500 mm</option>
									<option value="3000">3000 mm</option>
								</select>
							</div>
							<div class="form-group label-floating">
								<label class="control-label">Carga (kg) <small>(opcional)</small></label>
								<select name="carga" id="peso-ar" class="form-control">
									<option disabled="" selected=""></option>
									<option value="90">90 Kg.</option>
									<option value="150">150 Kg.</option>
									<option value="250">250 Kg.</option>
								</select>
							</div>
							<button class="btn btn-block btn-primary">GENERAR</button>
						</form>
					</div>
					
					<div class="col-sm-8 col-xs-12">
						<div class="alertbox">
							
						</div>
						<div class="medidas-angulo-ranurado">
							
						</div>
					</div>
				</div>
			</div>
		</div><!-- /.modal-content -->
	</div><!-- /.modal-dialog -->
</div><!-- /.modal -->  


<div class="modal fade" id="product-form">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
        <h4 class="modal-title">Solicite su Cupón de Pago</h4>
      </div>
      <div class="modal-body">
      	<div class="row clearfix">
			<div class="col-xs-12 col-sm-6">
				<div class="alert alert-info">
					<h4>Comprando en Racklog.cl</h4>
					<p style="text-align: justify;">Al solicitar tu Cupón de Pago uno de nuestros vendedores <strong>te enviará un correo en un plazo máximo de 2Hrs.</strong><small> <br>¡verifica que tu correo sea correcto antes de enviar!</small></p>
					<p style="text-align: justify;"> Tenemos expertos dispuestos a asistir en tu compra, no dudes en solicitar asistencia, modificación del pedido o cambio en la forma de entrega. </p>
				</div>
				
				<ul class="list-group">
					<li class="list-group-item">
					<div id="carro" class="row">
						
					</div>
						
					</li>
					
				</ul>
				
				<div class="alert alert-warning entrega">
					<p><strong>Plazo de Entrega:</strong><br>
					<small>El plazo es calculado en base al Stock o al Proceso de Fabricación</small></p>
					<p>Retiro en Bodega: <strong id="bodega"></strong></br>
					Despacho a Domicilio: <strong id="domicilio"></strong></p>
				</div>
			</div>
			<div class="col-xs-12 col-sm-6 col-md-6">
				<div class="panel panel-default">
					<div class="panel-heading">
						<h3 style="color:#363636" class="panel-title">Ingresa tus Datos</h3>
					</div>
					<div class="panel-body">
						<form id="comprar">
							<div class="form-group">
								<input type="text" name="nombre" id="nombre" class="form-control input-sm" placeholder="Nombre">
							</div>
							<div class="form-group">
								<input type="email" name="email" id="email" class="form-control input-sm" placeholder="Correo">
							</div>
							<div class="form-group">
								<input type="telefono" name="telefono" id="telefono" class="form-control input-sm" placeholder="Teléfono">
							</div>
							<div class="enbodega">
								<div class="alert alert-info">
									<strong>Retiro en Bodega:</strong> </br> Hoevel 5401, Quinta Normal, Santiago.
								</div>
							</div>
							<ul class="list-group">
								<li class="list-group-item">
									Despacho a Domicilio <small>(costo adicional)</small>
									<div class="material-switch pull-right">
										<input id="checkDomicilio" name="checkDomicilio" type="checkbox"/>
										<label for="checkDomicilio" class="label-warning"></label>
									</div>
								</li>
							</ul>
							<div class="adomicilio">
								<div class="row">
									<div class="col-xs-6 col-sm-6 col-md-6">
										<div class="form-group">
											<select name="regiones" class="form-control" id="regiones"></select>
										</div>
									</div>
									<div class="col-xs-6 col-sm-6 col-md-6">
										<div class="form-group">
											<select name="comunas" class="form-control" id="comunas"></select>
										</div>
									</div>
								</div>
								<div class="form-group">
									<input type="text" name="direccion" id="direccion" class="form-control input-sm" placeholder="Dirección">
								</div>
							</div>
							<input type="submit" value="Solicitar Cupón de Pago" class="btn btn-block btn-success">
							<img style="margin-top: 10px;" src="../images/dineromail.png" class="img-responsive" alt="">

						</form>
					</div>
				</div>
			</div>
      	</div>
	</div>
	<div class="modal-footer">
		<a href="#product-view" class="btn btn-primary" data-toggle="modal" data-dismiss="modal">Volver</a>
	</div>
    </div><!-- /.modal-content -->
  </div><!-- /.modal-dialog -->
</div><!-- /.modal -->  
</html>
<!-- FANCYBOX -->
<script>
$(document).ready(function() {
	$(".fancybox-thumb").fancybox({
		helpers	: {
			title	: {
				type: 'none'
			},
			thumbs	: {
				width	: 50,
				height	: 50
			}
		}
	});
});
</script>

<!-- MODAL CONTROL -->
<script>
$('body').on('hidden.bs.modal', function () {
    if($('.modal.in').length > 0)
    {
        $('body').addClass('modal-open');
    }
});
</script>

<!-- THUMBS CONTROL -->
<script>
$('a.thumbs').each(function(){
    $(this).click(function(){
        var src = $(this).attr('href');
        if (src != $('img#imgGrande').attr('src')) {
            $('img#imgGrande').stop().animate({opacity:'0'},function(){
                    $(this).attr('src',src);
            }).load(function(){
                    $(this).stop().animate({opacity:'1'});
            });
        }
        return false;
    });
});
</script>

<!-- Tooltips -->
<script>
$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip(); 
});
</script>

<!-- ANIMACIONES -->
<script>
$(function(){
	$('div.product-chooser').not('.disabled').find('div.product-chooser-item').on('click', function(){
		$(this).parent().parent().find('div.product-chooser-item').removeClass('selected');
		$(this).addClass('selected');
		$(this).find('input[type="radio"]').prop("checked", true);
		
		
	});
	
	$("[name=options]").click(function(){
            $('.toHide').hide();
            $("#box-"+$(this).val()).show().addClass('fadeInLeft');
    });
});
	
function addCommas(nStr){
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}
</script>


<!-- FORM CONTROL -->

<script>
	var producto = {};
$(function() {
  $("#comprar").validate({
    // Specify validation rules
    rules: {
      nombre: "required",
      email: {
        required: true,
        email: true
      },
	  telefono:{
		  number: true
	  },
	  regiones:{
		  required: function(){
			  if($("#checkDomicilio").is(":checked")){
				  return true;
			  }else{ return false; }
			  
		  }
	  },
		comunas:{
		  required: function(){
			  if($("#checkDomicilio").is(":checked")){
				  return true;
			  }else{ return false; }
			  
		  }
	  },
		direccion:{
		  required: function(){
			  if($("#checkDomicilio").is(":checked")){
				  return true;
			  }else{ return false; }
			  
		  }
	  }
    },
    // Specify validation error messages
    messages: {
      nombre: "Porfavor ingresa tu nombre",
      email: "Porfavor verifica tu correo",
	  telefono: "Porfavor verifica tu teléfono",
	  regiones: "Ingrese su región",
	  comunas: "Ingrese su comuna",
	  direccion: "Porfavor verifica tu dirección"
    },
    submitHandler: function(form) {
		$.ajax({
			type: 'POST',
			url: '../assets/mail/mailhandler.php',
			data: "mail=venta&"+$('#comprar').serialize()+"&producto="+JSON.stringify(producto),
			success: function (response) {
				console.log(response);
				alert('Mensaje enviado con exito');
			}
		});
    }
  });
});
	
$(".adomicilio").hide();
$("#checkDomicilio").click(function() {
    if($(this).is(":checked")) {
        $(".adomicilio").show(300);
		$(".enbodega").hide(100);
    } else {
        $(".adomicilio").hide(200);
		$(".enbodega").show(100);
    }
});
	
</script>


<!-- CONTROL COTIZAR -->

<script>
//info cliente

$(function() {
	
  $("#cotizar-angulo-ranurado").validate({
    // Specify validation rules
    rules: {
      tipo: "required",
	  pcarga: "required",
	  bandeja: "required",
	  cuerpos: "required",
	  alto: "required",
	  carga: "required",
    },
    submitHandler: function(form) {
		$.ajax({
		url: "http://racklog.cl/assets/funciones.php",
		type: "POST",
		data: "action=createProduct&cod=AR&"+$("#cotizar-angulo-ranurado").serialize(),
		success: function(data){
			datos = JSON.parse(data);
			$('.medidas-angulo-ranurado').html(datos.card);
			loadModel(datos.producto,'angulo-ranurado');
			}
		});
    }
  });
});
	
function loadModelAnguloRanurado(product){
	var token = "25db9134e517485aaf0ff2868e8c4a2b";
	var user = "daniel_racklog.cl";	
	var iframe = document.getElementById( 'api-frame' );
	var version = '1.0.0';
	var client = new Sketchfab( version, iframe );
	
	modelo = getModelNameAnguloRanurado(product);
	
	$.ajax({
		beforeSend: function ( xhr ) {
			xhr.setRequestHeader('Authorization', 'Token ' + token );
		},
		url: "https://api.sketchfab.com/v3/search?token="+token+"&type=models&q="+modelo+"&user="+user,
		type: "GET",
		success: function(resultData) {
			console.log(resultData);
			client.init( resultData["results"][0]["uid"], {
				success: function onSuccess( api ){
				},
				error: function onError() {
					console.log( 'Error en el Visor 3D' );
				},
				autostart: 0,
				ui_controls: 0,
				ui_infos: 0,
			} );

			return resultData["results"];
		},
		error : function(jqXHR, textStatus, errorThrown) {
			return ("Hubo un error en la búsqueda"+errorThrown);
		}
	});
}

	
function getModelNameAnguloRanurado(product){
	var modelname = 'AR';
	if (product.tipo == 'SIMPLE'){
		modelname += ''
	}
	if (product.tipo == 'DOBLE'){
		modelname += '2'
	}
	fix = product.pcarga-1;
	modelname +='_'+product.cuerpos+'M';
	modelname +='_'+fix+'E';
	return modelname;
}
	
function addCotiCart(){
	
	$.ajax({
		url: "http://racklog.cl/assets/funciones.php",
		type: "POST",
		data: "action=addCoti",
		success: function(result){
			if (result == true){
				$('.medidas-angulo-ranurado').html("<div class='animated fadeIn'><div style='margin-top:10px' class='alert alert-success'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong><i class='fa fa-check'></i> Exito! </strong>Producto añadido. <a href='../cotizacion.php'><strong>Ir a Cotización</strong></a></div></div>");
			}else{
				$('.medidas-angulo-ranurado').html("<div style='margin-top:10px' class='alert alert-warning animated fadeIn'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong><i class='fa fa-exclamation-triangle'></i> Error! </strong>Producto no ha podido ser añadido a la Cotización.</div>");
			}
			}
		});
}
</script>