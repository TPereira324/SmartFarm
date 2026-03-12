<?php
include("conexao.php");

$response = array();
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $mysqli->real_escape_string($_POST["email"]);
    $senha = $_POST["senha"];

    $sql = "SELECT * FROM utilizador WHERE ut_email = '$email'";
    $result = $mysqli->query($sql);

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        if (password_verify($senha, $user["ut_password"])) {
            $response["success"] = true;
            $response["message"] = "Login bem-sucedido!";

        } else {
            $response["success"] = false;
            $response["message"] = "Senha incorreta.";
        }
    } else {
        $response["success"] = false;
        $response["message"] = "Usuário não encontrado.";
    }
} else {
    $response["success"] = false;
    $response["message"] = "Método de requisição inválido. Use POST.";
}
