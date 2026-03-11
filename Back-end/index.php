<?php

include("conexao.php");


?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Busca</title>
</head>
<body>
    <h1>Sistema de Busca de Utilizadores</h1>
    <form action="">
        <input name="busca" value="<?php echo isset($_GET['busca']) ? $_GET['busca'] : ''; ?>" placeholder="Digite o nome do usuário" type="text" >
        <button type="submit">Pesquisar</button>
    </form>
    <table width="600px" border="1">
        <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Email</th>
        </tr>
        <?php
        if (!isset($_GET["busca"])) {
        ?>
        
        <tr>
            <td colspan="3">Digite o nome do usuário</td>
        </tr>
        <?php
        } else {
            $pesquisa = $mysqli->real_escape_string($_GET["busca"]);
            $sql_code = "SELECT * FROM utilizador 
            WHERE ut_nome LIKE '%$pesquisa%'
            OR ut_email LIKE '%$pesquisa%'
            OR ut_id LIKE '%$pesquisa%'
            OR ut_datareg LIKE '%$pesquisa%'
            OR ut_password LIKE '%$pesquisa%'";
            $sql_query = $mysqli->query($sql_code) or die("Erro ao consultar o banco de dados: " . $mysqli->error);
            
            if ($sql_query->num_rows == 0) {
                 ?>
            <tr>
                <td colspan="3">Nenhum resultado encontrado...</td>
            </tr>
            <?php
            } else {     
                while ($bancodedados = $sql_query->fetch_assoc()) {
                    ?>
                    <tr>
                        <td><?php echo $bancodedados["ut_id"]; ?></td>
                        <td><?php echo $bancodedados["ut_nome"]; ?></td>
                        <td><?php echo $bancodedados["ut_email"]; ?></td>
                        <td><?php echo $bancodedados["ut_password"]; ?></td>
                        <td><?php echo $bancodedados["ut_datareg"]; ?></td>

                    </tr>
                    <?php
                }
            } 
        ?>   
        <?php
        } ?>
    <table> 
</body>
</html>