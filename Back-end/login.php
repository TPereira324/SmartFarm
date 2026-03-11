<?php
session_start();
include("conexao.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $mysqli->real_escape_string($_POST["email"]);
    $senha = $_POST["senha"];

    $sql = "SELECT * FROM utilizador WHERE ut_email = '$email'";
    $result = $mysqli->query($sql);

    if ($result->num_rows > 0) {
        $usuario = $result->fetch_assoc();
        if (password_verify($senha, $usuario["ut_password"])) {
            $_SESSION["usuario"] = $usuario["ut_nome"];
            echo "Login realizado com sucesso!";
            // Redirecionar para área restrita, se desejar
        } else {
            echo "Senha incorreta!";
        }
    } else {
        echo "Usuário não encontrado!";
    }
}
?>