<?php

$config = require __DIR__ . "/config/app.php";
$dbConfig = $config["db"] ?? [];
$host = (string)($dbConfig["host"] ?? "127.0.0.1");
$bancodedados = (string)($dbConfig["name"] ?? "coco_db");
$user = (string)($dbConfig["user"] ?? "root");
$passwords = $dbConfig["password_candidates"] ?? [$dbConfig["password"] ?? ""];
$ports = $dbConfig["ports"] ?? [3306];
$charset = (string)($dbConfig["charset"] ?? "utf8mb4");

$mysqli = null;
foreach ($passwords as $pass) {
    foreach ($ports as $port) {
        $candidate = new mysqli($host, $user, $pass, $bancodedados, $port);
        if (!$candidate->connect_errno) {
            $mysqli = $candidate;
            $mysqli->set_charset($charset);
            break 2;
        }
    }
}

if (!$mysqli) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Falha ao conectar com o banco de dados. Verifica o ficheiro Back-end/config.local.php."]);
    exit();
}
