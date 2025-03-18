<?php
 
include('conexion.php');

$function=$_POST['function'];

switch($function){
	case 'getPrice':{
		$nombre=$_POST['nombre'];
		$bandejas=$_POST['bandejas'];
		$modelo=$nombre."_".$bandejas."B";

		$query1="SELECT * FROM productos_web WHERE modelo = '$modelo'";
		$rs=mysql_query($query1);
		while($row=mysql_fetch_assoc($rs)){
			echo $row['precio'];
		}
		break;
	}
	case 'getPriceStock':{
		$nombre=$_POST['nombre'];
		$bandejas=$_POST['bandejas'];
		$modelo=$nombre."_".$bandejas."B";

		$query1="SELECT * FROM productos_web WHERE modelo = '$modelo'";
		$rs=mysql_query($query1);
		while($row=mysql_fetch_assoc($rs)){
			$arr = array ('nombre' => $row['nombre'],'precio' => $row['precio']);
			echo json_encode($arr);
			
		}
		break;
	}
	case 'getStock':{
		$nombre=$_POST['nombre'];
		$bandejas=$_POST['bandejas'];
		$modelo=$nombre."_".$bandejas."B";
		$cantidad=$_POST['cantidad'];
		$query1="SELECT * FROM productos_web WHERE modelo = '$modelo'";
	
		$rs=mysql_query($query1);
		$row=mysql_fetch_assoc($rs);
			
		$query2="SELECT cantidad FROM productos WHERE productoCodigo = '".$row['bandeja']."' ";
		$rs=mysql_query($query2);
		$stockBandeja=mysql_fetch_assoc($rs);
		
		$query2="SELECT cantidad FROM productos WHERE productoCodigo = '".$row['angulo']."' ";
		$rs=mysql_query($query2);
		$stockAngulo=mysql_fetch_assoc($rs);
		
		$reqBandeja= intval($stockBandeja['cantidad']/($cantidad*$bandejas));
		$reqAngulo= intval($stockAngulo['cantidad']/($cantidad*4));
	
		if($reqAngulo&&$reqBandeja >= 1){
			echo 0;
		}else{
			$today = time();
			$query3="SELECT fecha_entrega FROM stock_fecha WHERE id=(SELECT max(id) FROM stock_fecha) ";
			$rs=mysql_query($query3);
			$stockFecha=mysql_fetch_assoc($rs);
			$dateStock=strtotime($stockFecha['fecha_entrega']);
			if($today<$dateStock){
				$datediff =  $dateStock - $today;
				echo floor($datediff / (60*60*24));
			}
		}
		break;
	}
}



?>