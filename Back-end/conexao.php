<?php

$host = "localhost";
$bancodedados = "coco_db";
$user = "root";
$pass = "root";

$mysqli = new mysqli($host, $user, $pass, $bancodedados);
if ($mysqli->connect_errno) {
    echo "Falha ao conectar com o banco de dados: ";
} else {
    echo "Conexão com o banco de dados bem-sucedida!";
}
echo"";


