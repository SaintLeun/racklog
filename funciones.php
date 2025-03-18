<?php 
require_once('objetos/anguloRanurado.php');
require_once('objetos/rackSelectivo.php');
require_once('objetos/cart.class.php');

$cotizacion = new Cart();
$cart = new Cart();

$action = (isset($_POST['action'])) ? $_POST['action'] : '';

switch($action){
	case 'createProduct':{
	
		if ($_POST['cod'] == 'AR'){
			$cod = $_POST['cod'];
			$tipo = (isset($_POST['tipo'])) ? $_POST['tipo'] : ''; 
			$bandeja = (isset($_POST['bandeja'])) ? $_POST['bandeja'] : '';
			$pcarga = (isset($_POST['pcarga'])) ? $_POST['pcarga'] : '';
			$cuerpos = (isset($_POST['cuerpos'])) ? $_POST['cuerpos'] : '';
			$alto = (isset($_POST['alto'])) ? $_POST['alto'] : '';
			$carga = (isset($_POST['carga'])) ? $_POST['carga'] : '';

			$producto = new anguloRanurado($tipo, $bandeja, $pcarga, $cuerpos, $alto, '920', $carga);
			$producto-> set_id($cod.$tipo.$bandeja.'N'.$pcarga.'C'.$cuerpos.'A'.$alto.'K'.$carga);
			$producto-> set_nombre("$cod$bandeja");
		}
		
		if ($_POST['cod'] == 'RS'){
			$cod = $_POST['cod'];
			$tipo = (isset($_POST['tipo'])) ? $_POST['tipo'] : ''; 
			$pcarga = (isset($_POST['pcarga'])) ? $_POST['pcarga'] : '';
			$cuerpos = (isset($_POST['cuerpos'])) ? $_POST['cuerpos'] : '';
			$pallet_frente = (isset($_POST['frente'])) ? $_POST['frente'] : '';
			$pallet_fondo = (isset($_POST['fondo'])) ? $_POST['fondo'] : '';
			$pallet_alto = (isset($_POST['alto'])) ? $_POST['alto'] : '';
			$carga = (isset($_POST['carga'])) ? $_POST['carga'] : '';

			$producto = new rackSelectivo($tipo, $pcarga, $cuerpos, $pallet_frente, $pallet_fondo, $pallet_alto, $carga);
			$producto-> set_id($cod.$tipo.'N'.$pcarga.'C'.$cuerpos.'PFR'.$pallet_frente.'PFO'.$pallet_fondo.'PAL'.$pallet_alto.'K'.$carga);
			$producto-> set_nombre("$cod");
		}
		
		$_SESSION['producto'] = $producto;
		$productoArray = (array) $producto;
		echo json_encode(array("producto"=>$productoArray, "card"=>createCard($producto)));
		break;
	}
	
	case 'addCoti':{
		if($_SESSION['producto'] instanceof anguloRanurado){
			try{
				$producto = $_SESSION['producto'];
				$cart->add($producto->get_id(), '1');
				$cart->setAttribute($producto->get_id(),'nombre', 'Ángulo Ranurado');
				$cart->setAttribute($producto->get_id(),'descripcion', 
					"<ul class='racklog-item'>
						<li>Tipo Estantería: {$producto->get_tipo()} </li>
						<li>Tipo Bandeja: {$producto->get_bandeja()} mm x 920 mm</li>
						<li>Alto: {$producto->get_alto()} mm</li>
						<li>Frente: {$producto->get_frente()} mm</li>
						<li>Fondo: {$producto->get_fondo()} mm</li>
						<li>Niveles: {$producto->get_pcarga()}</li>
						<li>Cuerpos: {$producto->get_cuerpos()}</li>
						<li>Carga por Bandeja: {$producto->get_carga()} kg</li>
					</ul>");
				echo true;
			} catch (Exception $e){
				echo 'Error al ingresar Producto:', $e->getMessage(), "\n";
			}
		} elseif($_SESSION['producto'] instanceof rackSelectivo){
			try{
				$producto = $_SESSION['producto'];
				$cart->add($producto->get_id(), '1');
				$cart->setAttribute($producto->get_id(),'nombre', 'Rack Selectivo');
				$cart->setAttribute($producto->get_id(),'descripcion', 
					"<ul class='racklog-item'>
						<li>Tipo Rack: {$producto->get_tipo()}</li>
						<li>Niveles: {$producto->get_pcarga()}</li>
						<li>Cuerpos: {$producto->get_cuerpos()}</li>
						<li>Frente Pallet: {$producto->get_pallet_frente()} mm</li>
						<li>Fondo Pallet: {$producto->get_pallet_fondo()} mm</li>
						<li>Alto Pallet: {$producto->get_pallet_alto()} mm</li>
						<li>Carga Pallet: {$producto->get_carga()} kg</li>
					</ul>");
				echo true;
			} catch (Exception $e){
				echo 'Error al ingresar Producto:' , $e->getMessage(), "\n";
			}
		}
		else{
			echo "Hubo un error al añadir el producto";
		}
		break;
	}
		
	case 'delCoti':{
		
		$id = (isset($_POST['id'])) ? $_POST['id'] : 0;
		try{
			$cart->remove($id);
		}
		catch (Exception $e){
			echo 'Error al eliminar del Carro '.$e;
		}
		break;
	}
	
	case 'showCoti':{
		$items = $cart->getItems();
		if (!empty($items)){
		foreach ($items as $id => $qty){
				echo "<tr>";
				echo "<th class='col-xs-10'> 
				<h4 style='margin-top: 2px'>".$cotizacion->getAttribute($id, 'nombre')."</h4>
				<p>".$cotizacion->getAttribute($id, 'descripcion')."</p>
				</th>";
				echo "<th class='col-xs-1' style='text-align: center'> 
                        <input type='number' id='quantity' name='quantity' class='form-control input-number' value='$qty' min='1' max='100'>
					</th>";
				echo "<th class='col-xs-1'>
						<button onClick='delCoti(\"$id\")' class='btn btn-danger'>x</button>
					</th>";
				echo "</tr>";
			}
		}else{
			echo "
			<h4>Debes añadir productos primero para poder solicitar una cotización!</h4>
			<p><a href='productos/rack-selectivo.php' class='btn btn-warning'>Rack Selectivo</a></p>
			<p><a href='productos/estanterias-angulo-ranurado.php' class='btn btn-warning'>Estantería Angulo Ranurado</a></p>";
		}
		break;
	}
		
	case 'getItemList':{
		$items = $cart->getItems();
		foreach ($items as $id => $qty){
				echo "<p>Nombre: ".$cotizacion->getAttribute($id, 'nombre')."</p>";
				echo "<p>".str_replace($strip,'',$cotizacion->getAttribute($id, 'descripcion'))."</p>";
				echo "Cantidad: $qty \n";
			}
		break;
	}
	
	case 'destroyCoti':{
		$cart->destroy();
		break;
	}
	
	case 'cotiCount':{
		echo $cart->totalCount();
	}
}

function createCard($product){
	if($product instanceof anguloRanurado){
		$frente_t = $product->cuerpos*920;
		
		if ($product->tipo == 'SIMPLE'){
			$fondo_t = $product->bandeja;

		}elseif($product->tipo  == 'DOBLE'){
			$fondo_t = $product->bandeja*2;
		}
		$card = "<div class='product-card animated fadeIn'>
					<button type='button' class='close delete' onClick=\"$(this).parent().parent().html('');\"><span aria-hidden='true'>&times;</span></button>
					<h3 style='margin-top: 5px;'> $product->nombre </h3>
					<table class='table table-condensed'>
						<tbody>
							<tr>
								<td>Tipo Estantería</td>
								<td class='text-right'>$product->tipo</td>
							</tr>
							<tr>
								<td>Tipo Bandeja</td>
								<td class='text-right'>AR$product->bandeja</td>
							</tr>
							<tr>
								<td>Cantidad de Bandejas</td>
								<td class='text-right'>$product->pcarga</td>
							</tr>
							<tr>
								<td>Cantidad de Cuerpos</td>
								<td class='text-right'>$product->cuerpos</td>
							</tr>
							<tr>
								<td>Capacidad de Carga por Nivel</td>
								<td class='text-right'>$product->carga kg</td>
							</tr>
							<tr>
								<td>Alto Total</td>
								<td class='text-right'>$product->alto mm</td>
							</tr>
							<tr>
								<td>Frente Total</td>
								<td class='text-right'>$frente_t mm</td>
							</tr>
							<tr>
								<td>Fondo Total</td>
								<td class='text-right'>$fondo_t mm</td>
							</tr>
						</tbody>
					</table>
					<div class='embed-responsive embed-responsive-16by9'>
						<div class='sketchfab-embed-wrapper'>
							<div class='loading'>
								<i class='fa fa-spinner fa-pulse fa-3x fa-fw'></i>
								<span class='sr-only'>Loading...</span>
							</div>
							<iframe src='' id='api-frame-angulo-ranurado' style='padding-top: 5px; padding-bottom: 5px;' frameBorder='0' allowfullscreen mozallowfullscreen='true' webkitallowfullscreen='true'></iframe>
						</div>		
					</div>
					<button onClick='addCotiCart();' style='margin-bottom: 5px;' class='btn btn-warning btn-block'>Añadir a Cotización >></button>
				</div>";
	}
	
	if($product instanceof rackSelectivo){
		$frente_t 	= ($product->cuerpos*(($product->pallet_frente*2)+300) + (($product->cuerpos*100)+100));
		$alto_t 	= ceil(($product->pcarga * ($product->pallet_alto + 200))/500)*500;
		$posiciones = $product->cuerpos  *( ( $product->pcarga * 2 ) + 2 );
		if ($product->tipo == 'SIMPLE'){
			$fondo_t = $product->pallet_fondo - 200;
 
		}elseif($product->tipo  == 'DOBLE'){
			$fondo_t = (($product->pallet_fondo - 200)*2)+300;
			$posiciones = $posiciones*2;
		}
		
		$card = "<div class='product-card animated fadeIn'>
					<button type='button' class='close delete' onClick=\"$(this).parent().parent().html('');\"><span aria-hidden='true'>&times;</span></button>
					<h3 style='margin-top: 5px;'> $product->nombre </h3>
					<table class='table table-condensed'>
						<tbody>
							<tr>
								<td>Tipo Rack</td>
								<td class='text-right'>$product->tipo</td>
							</tr>
							<tr>
								<td>Planos de Carga</td>
								<td class='text-right'>$product->pcarga</td>
							</tr>
							<tr>
								<td>Cuerpos</td>
								<td class='text-right'>$product->cuerpos</td>
							</tr>
							<tr>
								<td>Capacidad de Carga por Nivel</td>
								<td class='text-right'>".$product->carga*2 ." kg</td>
							</tr>
							<tr>
								<td>Alto Total</td>
								<td class='text-right'>$alto_t mm</td>
							</tr>
							<tr>
								<td>Frente Total</td>
								<td class='text-right'>$frente_t mm</td>
							</tr>
							<tr>
								<td>Fondo Total</td>
								<td class='text-right'>$fondo_t mm</td>
							</tr>
							<tr>
								<td>Cantidad de Posiciones</td>
								<td class='text-right'>$posiciones Pos.</td>
							</tr>
						</tbody>
					</table>
					<div class='embed-responsive embed-responsive-16by9'>
						<div class='sketchfab-embed-wrapper'>
							<div class='loading'>
								<i class='fa fa-spinner fa-pulse fa-3x fa-fw'></i>
								<span class='sr-only'>Loading...</span>
							</div>
							<iframe src='' id='api-frame-rack-selectivo' style='padding-top: 5px; padding-bottom: 5px;' frameBorder='0' allowfullscreen mozallowfullscreen='true' webkitallowfullscreen='true'></iframe>
						</div>		
					</div>
					<button onClick='addCotiCartRackSelectivo();' style='margin-bottom: 5px;' class='btn btn-warning btn-block'>Añadir a Cotización >></button>
				</div>";
	}
	return $card;
}




?>