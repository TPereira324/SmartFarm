<?php
session_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

include(__DIR__ . "/conexao.php");

$respond = function (array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit();
};

$method = strtoupper($_SERVER["REQUEST_METHOD"] ?? "GET");
$pathInfo = $_SERVER["PATH_INFO"] ?? "";
$path = trim($pathInfo, "/");

if ($path === "") {
    $respond([
        "success" => true,
        "message" => "API online",
    ]);
}

$segments = array_values(array_filter(explode("/", $path), fn($s) => $s !== ""));
$resource = $segments[0] ?? "";
$action = $segments[1] ?? "";
$id = $segments[2] ?? null;

$rawBody = file_get_contents("php://input");
$jsonBody = json_decode($rawBody ?: "", true);
$body = is_array($jsonBody) ? $jsonBody : [];
if (!empty($_POST)) {
    $body = array_merge($body, $_POST);
}

$forumCategoryLabel = static function (?string $category): string {
    return match ($category) {
        'duvidas' => 'Dúvida',
        'dicas' => 'Dica',
        'experiencias' => 'Experiência',
        default => 'Outro',
    };
};

if ($resource === "parcelas" && $action === "listar" && $method === "GET") {
    $utId = $id !== null ? (int)$id : (int)($_GET["ut_id"] ?? 0);
    if ($utId <= 0) {
        $respond(["success" => false, "message" => "ut_id inválido."], 400);
    }

    $stmt = $mysqli->prepare(
        "SELECT 
            p.par_id,
            p.par_nome,
            p.par_area,
            p.par_estado,
            c.cult_id,
            c.cult_nome,
            pc.pc_metodo_cultivo,
            pc.pc_objetivo
        FROM parcela p
        LEFT JOIN parcela_cultivo pc ON pc.pc_par_id = p.par_id
        LEFT JOIN cultivo c ON c.cult_id = pc.pc_cult_id
        WHERE p.par_ut_id = ?
        ORDER BY p.par_id DESC"
    );
    if (!$stmt) {
        $respond(["success" => false, "message" => "Erro ao preparar query."], 500);
    }
    $stmt->bind_param("i", $utId);
    $stmt->execute();
    $result = $stmt->get_result();
    $rows = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    $stmt->close();

    $parcelasById = [];
    foreach ($rows as $r) {
        $parId = (int)$r["par_id"];
        if (!isset($parcelasById[$parId])) {
            $parcelasById[$parId] = [
                "id" => $parId,
                "nome" => $r["par_nome"],
                "area_m2" => isset($r["par_area"]) ? (float)$r["par_area"] : null,
                "estado" => $r["par_estado"],
                "cultivos" => [],
            ];
        }
        if (!empty($r["cult_id"])) {
            $parcelasById[$parId]["cultivos"][] = [
                "id" => (int)$r["cult_id"],
                "nome" => $r["cult_nome"],
                "metodo" => $r["pc_metodo_cultivo"],
                "objetivo" => $r["pc_objetivo"],
            ];
        }
    }

    $respond([
        "success" => true,
        "data" => array_values($parcelasById),
    ]);
}

if ($resource === "parcelas" && $action === "adicionar" && $method === "POST") {
    $utId = (int)($body["ut_id"] ?? $body["usuario_id"] ?? 0);
    if ($utId <= 0) {
        $respond(["success" => false, "message" => "ut_id obrigatório."], 401);
    }

    $parNome = trim((string)($body["par_nome"] ?? $body["nome"] ?? ""));
    $parEstado = trim((string)($body["par_estado"] ?? $body["estado"] ?? "ativo"));

    $largura = isset($body["largura"]) ? (float)$body["largura"] : null;
    $comprimento = isset($body["comprimento"]) ? (float)$body["comprimento"] : null;
    $parArea = isset($body["par_area"]) ? (float)$body["par_area"] : null;

    if ($parArea === null && $largura !== null && $comprimento !== null) {
        $parArea = $largura * $comprimento;
    }

    if ($parNome === "") {
        $parNome = "Parcela";
    }
    if ($parArea === null || $parArea <= 0) {
        $respond(["success" => false, "message" => "Área inválida."], 400);
    }

    $cultivoNome = trim((string)($body["cultivo"] ?? $body["tipo"] ?? $body["cult_nome"] ?? ""));
    $metodo = trim((string)($body["metodo"] ?? $body["pc_metodo_cultivo"] ?? ""));
    $objetivo = trim((string)($body["objetivo"] ?? $body["pc_objetivo"] ?? ""));

    try {
        $mysqli->begin_transaction();

        $stmtPar = $mysqli->prepare("INSERT INTO parcela (par_nome, par_area, par_estado, par_ut_id) VALUES (?, ?, ?, ?)");
        if (!$stmtPar) {
            throw new Exception("Erro ao preparar INSERT parcela.");
        }
        $stmtPar->bind_param("sdsi", $parNome, $parArea, $parEstado, $utId);
        if (!$stmtPar->execute()) {
            throw new Exception("Erro ao inserir parcela.");
        }
        $parId = (int)$mysqli->insert_id;
        $stmtPar->close();

        $cultId = null;
        if ($cultivoNome !== "") {
            $stmtCultSel = $mysqli->prepare("SELECT cult_id FROM cultivo WHERE cult_nome = ? LIMIT 1");
            if (!$stmtCultSel) {
                throw new Exception("Erro ao preparar SELECT cultivo.");
            }
            $stmtCultSel->bind_param("s", $cultivoNome);
            $stmtCultSel->execute();
            $resCult = $stmtCultSel->get_result();
            $rowCult = $resCult ? $resCult->fetch_assoc() : null;
            $stmtCultSel->close();

            if ($rowCult && isset($rowCult["cult_id"])) {
                $cultId = (int)$rowCult["cult_id"];
            } else {
                $stmtCultIns = $mysqli->prepare("INSERT INTO cultivo (cult_nome, cult_descricao) VALUES (?, ?)");
                if (!$stmtCultIns) {
                    throw new Exception("Erro ao preparar INSERT cultivo.");
                }
                $cultDesc = "";
                $stmtCultIns->bind_param("ss", $cultivoNome, $cultDesc);
                if (!$stmtCultIns->execute()) {
                    throw new Exception("Erro ao inserir cultivo.");
                }
                $cultId = (int)$mysqli->insert_id;
                $stmtCultIns->close();
            }
        }

        if ($cultId !== null) {
            $stmtPC = $mysqli->prepare("INSERT INTO parcela_cultivo (pc_par_id, pc_cult_id, pc_metodo_cultivo, pc_objetivo) VALUES (?, ?, ?, ?)");
            if (!$stmtPC) {
                throw new Exception("Erro ao preparar INSERT parcela_cultivo.");
            }
            $stmtPC->bind_param("iiss", $parId, $cultId, $metodo, $objetivo);
            if (!$stmtPC->execute()) {
                throw new Exception("Erro ao inserir parcela_cultivo.");
            }
            $stmtPC->close();
        }

        $mysqli->commit();

        $respond([
            "success" => true,
            "message" => "Parcela criada com sucesso!",
            "data" => [
                "par_id" => $parId,
                "cult_id" => $cultId,
            ],
        ], 201);
    } catch (Exception $e) {
        $mysqli->rollback();
        $respond(["success" => false, "message" => $e->getMessage()], 500);
    }
}

if ($resource === "forum" && $action === "listar" && $method === "GET") {
    $sql = "SELECT
                p.post_id,
                p.post_titulo,
                p.post_conteudo,
                p.post_categoria,
                p.post_data,
                u.ut_id,
                u.ut_nome,
                COUNT(c.com_id) AS comentarios
            FROM post p
            INNER JOIN utilizador u ON u.ut_id = p.post_ut_id
            LEFT JOIN comentario c ON c.com_post_id = p.post_id
            GROUP BY p.post_id, p.post_titulo, p.post_conteudo, p.post_categoria, p.post_data, u.ut_id, u.ut_nome
            ORDER BY p.post_data DESC";
    $result = $mysqli->query($sql);
    if (!$result) {
        $respond(["success" => false, "message" => "Erro ao carregar publicações."], 500);
    }

    $posts = [];
    while ($row = $result->fetch_assoc()) {
        $posts[] = [
            "id" => (int)$row["post_id"],
            "titulo" => $row["post_titulo"],
            "conteudo" => $row["post_conteudo"],
            "categoria" => $row["post_categoria"],
            "categoria_label" => $forumCategoryLabel($row["post_categoria"] ?? null),
            "data" => $row["post_data"],
            "comentarios" => (int)$row["comentarios"],
            "autor" => [
                "id" => (int)$row["ut_id"],
                "nome" => $row["ut_nome"],
            ],
        ];
    }

    $respond([
        "success" => true,
        "data" => $posts,
    ]);
}

if ($resource === "forum" && $action === "detalhe" && $method === "GET") {
    $postId = (int)$id;
    if ($postId <= 0) {
        $respond(["success" => false, "message" => "Publicação inválida."], 400);
    }

    $stmt = $mysqli->prepare(
        "SELECT
            p.post_id,
            p.post_titulo,
            p.post_conteudo,
            p.post_categoria,
            p.post_data,
            u.ut_id,
            u.ut_nome,
            COUNT(c.com_id) AS comentarios
        FROM post p
        INNER JOIN utilizador u ON u.ut_id = p.post_ut_id
        LEFT JOIN comentario c ON c.com_post_id = p.post_id
        WHERE p.post_id = ?
        GROUP BY p.post_id, p.post_titulo, p.post_conteudo, p.post_categoria, p.post_data, u.ut_id, u.ut_nome
        LIMIT 1"
    );
    if (!$stmt) {
        $respond(["success" => false, "message" => "Erro ao preparar detalhe da publicação."], 500);
    }

    $stmt->bind_param("i", $postId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result ? $result->fetch_assoc() : null;
    $stmt->close();

    if (!$row) {
        $respond(["success" => false, "message" => "Publicação não encontrada."], 404);
    }

    $respond([
        "success" => true,
        "data" => [
            "id" => (int)$row["post_id"],
            "titulo" => $row["post_titulo"],
            "conteudo" => $row["post_conteudo"],
            "categoria" => $row["post_categoria"],
            "categoria_label" => $forumCategoryLabel($row["post_categoria"] ?? null),
            "data" => $row["post_data"],
            "comentarios" => (int)$row["comentarios"],
            "autor" => [
                "id" => (int)$row["ut_id"],
                "nome" => $row["ut_nome"],
            ],
        ],
    ]);
}

if ($resource === "forum" && $action === "comentarios" && $method === "GET") {
    $postId = (int)$id;
    if ($postId <= 0) {
        $respond(["success" => false, "message" => "Publicação inválida."], 400);
    }

    $stmt = $mysqli->prepare(
        "SELECT
            c.com_id,
            c.com_conteudo,
            c.com_data,
            u.ut_id,
            u.ut_nome
        FROM comentario c
        INNER JOIN utilizador u ON u.ut_id = c.com_ut_id
        WHERE c.com_post_id = ?
        ORDER BY c.com_data ASC"
    );
    if (!$stmt) {
        $respond(["success" => false, "message" => "Erro ao preparar comentários."], 500);
    }

    $stmt->bind_param("i", $postId);
    $stmt->execute();
    $result = $stmt->get_result();
    $comments = [];
    while ($row = $result ? $result->fetch_assoc() : null) {
        $comments[] = [
            "id" => (int)$row["com_id"],
            "conteudo" => $row["com_conteudo"],
            "data" => $row["com_data"],
            "autor" => [
                "id" => (int)$row["ut_id"],
                "nome" => $row["ut_nome"],
            ],
        ];
    }
    $stmt->close();

    $respond([
        "success" => true,
        "data" => $comments,
    ]);
}

if ($resource === "forum" && $action === "comentar" && $method === "POST") {
    $postId = (int)$id;
    $utId = (int)($body["ut_id"] ?? $body["usuario_id"] ?? 0);
    $conteudo = trim((string)($body["conteudo"] ?? ""));

    if ($postId <= 0) {
        $respond(["success" => false, "message" => "Publicação inválida."], 400);
    }
    if ($utId <= 0) {
        $respond(["success" => false, "message" => "Utilizador inválido."], 401);
    }
    if ($conteudo === "") {
        $respond(["success" => false, "message" => "Comentário vazio."], 400);
    }

    $stmt = $mysqli->prepare("INSERT INTO comentario (com_post_id, com_ut_id, com_conteudo) VALUES (?, ?, ?)");
    if (!$stmt) {
        $respond(["success" => false, "message" => "Erro ao preparar comentário."], 500);
    }

    $stmt->bind_param("iis", $postId, $utId, $conteudo);
    $success = $stmt->execute();
    $commentId = (int)$mysqli->insert_id;
    $stmt->close();

    if (!$success) {
        $respond(["success" => false, "message" => "Erro ao guardar comentário."], 500);
    }

    $respond([
        "success" => true,
        "message" => "Comentário enviado com sucesso!",
        "data" => [
            "id" => $commentId,
        ],
    ], 201);
}

if ($resource === "tarefas" && $action === "listar" && $method === "GET") {
    $utId = $id !== null ? (int)$id : (int)($_GET["ut_id"] ?? 0);
    if ($utId <= 0) {
        $respond(["success" => false, "message" => "ut_id inválido."], 400);
    }

    $stmt = $mysqli->prepare(
        "SELECT
            t.tar_id,
            t.tar_titulo,
            t.tar_descricao,
            t.tar_data_inicio,
            t.tar_data_fim,
            t.tar_estado,
            t.tar_prioridade,
            p.par_nome AS parcela_nome
        FROM tarefa t
        LEFT JOIN parcela p ON p.par_id = t.tar_par_id
        WHERE t.tar_ut_id = ?
        ORDER BY t.tar_data_inicio ASC"
    );
    if (!$stmt) {
        $respond(["success" => false, "message" => "Erro ao preparar query de tarefas."], 500);
    }
    $stmt->bind_param("i", $utId);
    $stmt->execute();
    $result = $stmt->get_result();
    $tarefas = [];
    while ($row = $result ? $result->fetch_assoc() : null) {
        $tarefas[] = [
            "id"           => (int)$row["tar_id"],
            "titulo"       => $row["tar_titulo"],
            "descricao"    => $row["tar_descricao"],
            "data_inicio"  => $row["tar_data_inicio"],
            "data_fim"     => $row["tar_data_fim"],
            "estado"       => $row["tar_estado"],
            "prioridade"   => $row["tar_prioridade"],
            "parcela_nome" => $row["parcela_nome"],
        ];
    }
    $stmt->close();

    $respond(["success" => true, "data" => $tarefas]);
}

if ($resource === "alertas" && $action === "listar" && $method === "GET") {
    $utId = $id !== null ? (int)$id : (int)($_GET["ut_id"] ?? 0);
    if ($utId <= 0) {
        $respond(["success" => false, "message" => "ut_id inválido."], 400);
    }

    $stmt = $mysqli->prepare(
        "SELECT
            a.alt_id,
            a.alt_tipo,
            a.alt_mensagem,
            a.alt_data,
            p.par_nome AS parcela_nome
        FROM alerta a
        INNER JOIN parcela p ON p.par_id = a.alt_par_id
        WHERE p.par_ut_id = ?
        ORDER BY a.alt_data DESC"
    );
    if (!$stmt) {
        $respond(["success" => false, "message" => "Erro ao preparar query de alertas."], 500);
    }
    $stmt->bind_param("i", $utId);
    $stmt->execute();
    $result = $stmt->get_result();
    $alertas = [];
    while ($row = $result ? $result->fetch_assoc() : null) {
        $alertas[] = [
            "id"           => (int)$row["alt_id"],
            "tipo"         => $row["alt_tipo"],
            "mensagem"     => $row["alt_mensagem"],
            "data"         => $row["alt_data"],
            "parcela_nome" => $row["parcela_nome"],
        ];
    }
    $stmt->close();

    $respond(["success" => true, "data" => $alertas]);
}

if ($resource === "forum" && $action === "publicar" && $method === "POST") {
    $utId = (int)($body["ut_id"] ?? $body["usuario_id"] ?? 0);
    $titulo = trim((string)($body["titulo"] ?? ""));
    $conteudo = trim((string)($body["conteudo"] ?? ""));
    $categoria = trim((string)($body["categoria"] ?? "outros"));

    if ($utId <= 0) {
        $respond(["success" => false, "message" => "Utilizador inválido."], 401);
    }
    if ($titulo === "") {
        $respond(["success" => false, "message" => "Título obrigatório."], 400);
    }
    if ($conteudo === "") {
        $respond(["success" => false, "message" => "Conteúdo obrigatório."], 400);
    }

    $stmt = $mysqli->prepare("INSERT INTO post (post_ut_id, post_titulo, post_conteudo, post_categoria) VALUES (?, ?, ?, ?)");
    if (!$stmt) {
        $respond(["success" => false, "message" => "Erro ao preparar publicação."], 500);
    }

    $stmt->bind_param("isss", $utId, $titulo, $conteudo, $categoria);
    $success = $stmt->execute();
    $postId = (int)$mysqli->insert_id;
    $stmt->close();

    if (!$success) {
        $respond(["success" => false, "message" => "Erro ao publicar tópico."], 500);
    }

    $respond([
        "success" => true,
        "message" => "Tópico publicado com sucesso!",
        "data" => [
            "id" => $postId,
        ],
    ], 201);
}

$respond(["success" => false, "message" => "Endpoint não encontrado."], 404);
