<?php

require_once __DIR__ . '/conexao.php';




$query = "SELECT 1 AS test_value";
$result = $mysqli->query($query);

if ($result) {
    $row = $result->fetch_assoc();
    echo "✅ Consulta de teste bem-sucedida. A base de dados retornou: " . $row['test_value'] . "";
} else {
    
    $result = $mysqli->query("SELECT 1 AS teste");
    if ($result) {
        $row = $result->fetch_assoc();
        echo " - base conectada (teste: " . $row['teste'] . ")";
    }
}

