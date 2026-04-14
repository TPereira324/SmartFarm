<?php
$erros = [
    "campos_obrigatorios" => "Preenche todos os campos obrigatórios.",
    "email_existe"        => "Este email já está registado.",
    "erro_servidor"       => "Erro no servidor. Tenta novamente.",
    "metodo_invalido"     => "Pedido inválido.",
];

$erro = isset($_GET["erro"]) ? ($erros[$_GET["erro"]] ?? "Erro desconhecido.") : null;
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registo - CocoRoot</title>
    <link rel="stylesheet" href="../css/wireframe.css">
</head>
<body class="auth-page">
    <div class="auth-img img-ph" style="overflow:hidden;padding:0;"></div>

    <div class="auth-form">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;">
            <a href="principal.html" class="back-link">← Home</a>
            <a href="login.php" class="nav-btn">Entrar</a>
        </div>

        <div class="auth-logo">
            <span style="display:flex;align-items:center;gap:10px;">
                <span>CocoRoot</span>
            </span>
        </div>

        <?php if ($erro): ?>
            <p style="color:red;margin-bottom:12px;"><?php echo htmlspecialchars($erro); ?></p>
        <?php endif; ?>

        <form id="register-form" action="/Back-end/registrar.php" method="POST">
            <div class="register-step" id="step-1">
                <div class="form-group">
                    <label for="fullname">Nome completo</label>
                    <input type="text" id="fullname" name="fullname" placeholder="Digite o seu nome completo" required>
                </div>
                <div class="btn-group">
                    <button type="button" class="btn full next-step">Próximo</button>
                    <a href="welcomeScreen.html" class="btn full">Voltar</a>
                </div>
            </div>

            <div class="register-step hidden" id="step-2">
                <div class="form-group">
                    <label for="email">E-mail</label>
                    <input type="email" id="email" name="email" placeholder="Digite o seu e-mail" required>
                </div>
                <div class="btn-group">
                    <button type="button" class="btn full next-step">Próximo</button>
                    <button type="button" class="btn full prev-step">Anterior</button>
                </div>
            </div>

            <div class="register-step hidden" id="step-3">
                <div class="form-group">
                    <label for="phone">Número de telefone</label>
                    <input type="tel" id="phone" name="phone" placeholder="Digite o seu número de telefone">
                </div>
                <div class="btn-group">
                    <button type="button" class="btn full next-step">Próximo</button>
                    <button type="button" class="btn full prev-step">Anterior</button>
                </div>
            </div>

            <div class="register-step hidden" id="step-4">
                <div class="form-group">
                    <label for="farm_name">Nome da sua fazenda</label>
                    <input type="text" id="farm_name" name="farm_name" placeholder="Digite o nome da sua fazenda">
                </div>
                <div class="btn-group">
                    <button type="button" class="btn full next-step">Próximo</button>
                    <button type="button" class="btn full prev-step">Anterior</button>
                </div>
            </div>

            <div class="register-step hidden" id="step-5">
                <div class="form-group">
                    <label for="password">Palavra-passe</label>
                    <input type="password" id="password" name="password" placeholder="Crie uma palavra-passe" required>
                </div>
                <div class="form-group">
                    <label for="confirm_password">Confirmar palavra-passe</label>
                    <input type="password" id="confirm_password" name="confirm_password" placeholder="Confirme a sua palavra-passe" required>
                </div>
                <div class="btn-group">
                    <button type="submit" class="btn full">Finalizar Registo</button>
                    <button type="button" class="btn full prev-step">Anterior</button>
                </div>
            </div>
        </form>
    </div>

    <script src="../js/models/utilizadorModel.js"></script>
    <script src="../js/views/utilizadorView.js"></script>
    <script src="../js/controllers/utilizadorController.js"></script>
    <script src="../js/load.js"></script>
    <script src="../js/layout.js"></script>
    <script>
    // Validação das passwords antes de submeter
    document.getElementById('register-form').addEventListener('submit', function(e) {
        var p1 = document.getElementById('password').value;
        var p2 = document.getElementById('confirm_password').value;
        if (p1 !== p2) {
            e.preventDefault();
            alert('As palavras-passe não coincidem.');
        }
    });
    </script>
</body>
</html>
