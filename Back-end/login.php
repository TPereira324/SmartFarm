<?php
session_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

include("conexao.php");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: /Front-end/pages/login.php?erro=metodo_invalido");
    exit();
}

$email = $mysqli->real_escape_string($_POST["email"] ?? "");
$senha = $_POST["password"] ?? $_POST["senha"] ?? "";

if (empty($email) || empty($senha)) {
    header("Location: /Front-end/pages/login.php?erro=campos_obrigatorios");
    exit();
}

$result = $mysqli->query("SELECT * FROM utilizador WHERE ut_email = '$email'");

if ($result && $result->num_rows > 0) {
    $user = $result->fetch_assoc();
    if (password_verify($senha, $user["ut_password"])) {
        $_SESSION["user_id"]    = $user["ut_id"];
        $_SESSION["user_nome"]  = $user["ut_nome"];
        $_SESSION["user_email"] = $user["ut_email"];
        header("Location: /Front-end/pages/dashboard.html");
        exit();
    } else {
        header("Location: /Front-end/pages/login.php?erro=senha_incorreta");
        exit();
    }
} else {
    header("Location: /Front-end/pages/login.php?erro=utilizador_nao_encontrado");
    exit();
}
?>
