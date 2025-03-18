

<!-- 

	MODAL COTIZAR 

-->

<div class="modal fade" id="modal-rack-selectivo">

	<div class="modal-dialog modal-lg">

		<div class="modal-content">

			<div class="modal-body" style="padding-top: 0px;">

				<div style="background: #363636; color: #FFF"  class="row">

				   <div style="text-align: left;" class="col-xs-10">

						<h3>RACK SELECTIVO <small>RACKING</small></h3>

					</div> 

				   <div class="col-xs-2">

				   	<button type="button" class="close" style="color: #FFF;" data-dismiss="modal"><span aria-hidden="true">&times;</span></button>

				   </div> 

				</div>

				<div class="row">

					<div class="col-sm-4 col-xs-12">

						<form id="cotizar-rack-selectivo">

							<div class="form-group label-floating">

								<label class="control-label">Tipo Rack</label>

								<select name="tipo" id="tipo" class="form-control">

									<option disabled="" selected=""></option>

									<option value="SIMPLE" >Simple</option>

									<option value="DOBLE" >Doble</option>

								</select>

							</div>

							<div class="form-group label-floating">

								<label for="pcarga" class="control-label">Niveles de Viga</label>

								<select name="pcarga" id="pcarga" class="form-control">

									<option disabled="" selected=""></option>

									<?php 

										for( $i=1 ; $i<=7 ; $i++ ){

											echo "<option value='$i'>$i</option>";

										}

									?>

								</select>

							</div>

							<div class="form-group label-floating">

								<label class="control-label">Cuerpos</label>

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

								<label class="control-label">Frente Pallet (mm)</label>

								<select name="frente" class="form-control">

									<option disabled="" selected=""></option>

									<option value="1000">1000 mm</option>

									<option value="1200">1200 mm</option>

								</select>

							</div>

							<div class="form-group label-floating">

								<label class="control-label">Fondo Pallet (mm)</label>

								<select name="fondo" class="form-control">

									<option disabled="" selected=""></option>

									<option value="1000">1000 mm</option>

									<option value="1200">1200 mm</option>

								</select>

							</div>

							<div class="form-group label-floating">

								<label class="control-label">Alto Pallet (mm)</label>

								<select name="alto" class="form-control">

									<option disabled="" selected=""></option>

									<?php 

										for( $i=250 ; $i<=2000 ; $i+=250 ){

											echo "<option value='$i'>$i mm</option>";

										}

									?>

								</select>

							</div>

							<div class="form-group label-floating">

								<label class="control-label">Carga Pallet (kg)</label>

								<select name="carga" id="peso-ar" class="form-control">

									<option disabled="" selected=""></option>

									<?php 

										for( $i=100 ; $i<=1000 ; $i+=100 ){

											echo "<option value='$i'>$i kg</option>";

										}

									?>

								</select>

							</div>

							<button class="btn btn-block btn-primary">GENERAR</button>

						</form>

					</div>

					<div class="col-sm-8 col-xs-12">

						<div class="alertbox">

							

						</div>

						<div class="medidas-rack-selectivo">

							

						</div>

					</div>

				</div>

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





<!-- CONTROL COTIZAR -->



<script>

//info cliente



$(function() {

	

	$("[name=options]").click(function(){

            $('.toHide').hide();

            $("#box-"+$(this).val()).show().addClass('fadeInLeft');



    });

	

  $("#cotizar-rack-selectivo").validate({

    // Specify validation rules

    rules: {

      tipo: "required",

	  pcarga: "required",

	  cuerpos: "required",

	  frente: "required",

	  fondo: "required",

	  alto: "required",

	  carga: "required",

    },

	messages:{

		required: "Este campo es requerido"	

	},

    submitHandler: function(form) {
		$.ajax({
		url: "http://racklog.cl/assets/funciones.php",
		type: "POST",
		data: "action=createProduct&cod=RS&"+$("#cotizar-rack-selectivo").serialize(),
		success: function(data){
			datos = JSON.parse(data);
			$('.medidas-rack-selectivo').html(datos.card);
			loadModel(datos.producto,'rack-selectivo');
			}
		});
    }

  });

});

	

function loadModel(product,tipo){

	var token = "25db9134e517485aaf0ff2868e8c4a2b";

	var user = "daniel_racklog.cl";	





	if(tipo=="rack-selectivo"){

	     var iframe = document.getElementById( 'api-frame-rack-selectivo' );

	}else{

         var iframe = document.getElementById( 'api-frame-angulo-ranurado' );

	}





	var version = '1.0.0';

	var client = new Sketchfab( version, iframe );

	

	modelo = getModelName(product,tipo);





	$.ajax({

		beforeSend: function ( xhr ) {

			xhr.setRequestHeader('Authorization', 'Token ' + token );

		},

		url: "https://api.sketchfab.com/v3/search?token="+token+"&type=models&q="+modelo+"&user="+user,

		type: "GET",

		success: function(resultData) {

			//console.log(resultData);

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



	

function getModelName(product,tipo){

	if(tipo == 'rack-selectivo'){

		var modelname = 'RS';

	}else{

		var modelname = 'AR';

	}

	

	if (product.tipo == 'SIMPLE'){

		modelname += ''

	}

	if (product.tipo == 'DOBLE'){

		modelname += '2'

	}

	modelname +='_'+product.cuerpos+'M';

	modelname +='_'+product.pcarga+'E';



	return modelname;

}

	

function addCotiCartRackSelectivo(){
	$.ajax({

		url: "http://racklog.cl/assets/funciones.php",
		type: "POST",
		data: "action=addCoti",
		success: function(result){
			if (result == true){
				$('.medidas-rack-selectivo').html("<div class='animated fadeIn'><div style='margin-top:10px' class='alert alert-success'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong><i class='fa fa-check'></i> Exito! </strong>Producto añadido. <a href='../cotizacion.php'><strong>Ir a Cotización</strong></a></div></div>");
			}else{
				$('.medidas-rack-selectivo').html("<div style='margin-top:10px' class='alert alert-warning animated fadeIn'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong><i class='fa fa-exclamation-triangle'></i> Error! </strong>Producto no ha podido ser añadido a la Cotización.</div>");
			}
			}
		});

}

</script>









