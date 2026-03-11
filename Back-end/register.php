<?php
include("conexao.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nome = $mysqli->real_escape_string($_POST["nome"]);
    $email = $mysqli->real_escape_string($_POST["email"]);
    $senha = password_hash($_POST["senha"], PASSWORD_DEFAULT);

    $sql = "INSERT INTO utilizador (ut_nome, ut_email, ut_password) VALUES ('$nome', '$email', '$senha')";
    if ($mysqli->query($sql)) {
        echo "Usuário cadastrado com sucesso!";
    } else {
        echo "Erro: " . $mysqli->error;
    }
}
?>