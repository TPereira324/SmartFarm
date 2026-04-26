<?php

// --- CONFIGURAÇÃO DA BASE DE DADOS ---
// Se a tua instalação MySQL usar uma password diferente, altera MYSQL_PASS
// ou define a variável de ambiente MYSQL_PASS antes de iniciar o servidor.
$host         = getenv("MYSQL_HOST") ?: "127.0.0.1";
$bancodedados = "coco_db";
$user         = getenv("MYSQL_USER") ?: "root";

// Tenta a password definida por env; se não existir tenta "root" e depois "" (XAMPP sem password)
$envPass      = getenv("MYSQL_PASS");
$passwords    = $envPass !== false ? [$envPass] : ["root", ""];

$ports = [];
$envPort = getenv("MYSQL_PORT");
if ($envPort !== false && $envPort !== "") {
    $ports[] = (int)$envPort;
}
$ports[] = 3306;   // MAMP PRO MySQL (porta confirmada em my.ini)
$ports = array_values(array_unique(array_filter($ports, fn($p) => is_int($p) && $p > 0)));

$mysqli = null;
foreach ($passwords as $pass) {
    foreach ($ports as $port) {
        $candidate = new mysqli($host, $user, $pass, $bancodedados, $port);
        if (!$candidate->connect_errno) {
            $mysqli = $candidate;
            $mysqli->set_charset("utf8mb4");
            break 2;
        }
    }
}

if (!$mysqli) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Falha ao conectar com o banco de dados. Verifica as credenciais em Back-end/conexao.php."]);
    exit();
}
