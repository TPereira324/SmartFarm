<?php

namespace App\Repository;

use App\Config\Conexao;
use PDO;

class ForumRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Conexao::getConexao();
    }

    public function buscarPorId(int $id): ?array {
        $stmt = $this->db->prepare(
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
        $stmt->execute([$id]);
        $dados = $stmt->fetch() ?: null;
        if (!$dados) {
            return null;
        }
        return $this->mapPost($dados);
    }

    public function listarTodos(): array {
        $stmt = $this->db->query(
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
            GROUP BY p.post_id, p.post_titulo, p.post_conteudo, p.post_categoria, p.post_data, u.ut_id, u.ut_nome
            ORDER BY p.post_data DESC"
        );
        return array_map(fn(array $dados) => $this->mapPost($dados), $stmt->fetchAll());
    }

    public function publicar(int $usuarioId, string $titulo, string $conteudo, string $categoria): int {
        $stmt = $this->db->prepare(
            "INSERT INTO post (post_ut_id, post_titulo, post_conteudo, post_categoria)
             VALUES (?, ?, ?, ?)"
        );
        $stmt->execute([$usuarioId, $titulo, $conteudo, $categoria]);
        return (int)$this->db->lastInsertId();
    }

    public function listarComentarios(int $postId): array {
        $stmt = $this->db->prepare(
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
        $stmt->execute([$postId]);

        return array_map(static fn(array $row) => [
            'id' => (int)$row['com_id'],
            'conteudo' => $row['com_conteudo'],
            'data' => $row['com_data'],
            'autor' => [
                'id' => (int)$row['ut_id'],
                'nome' => $row['ut_nome'],
            ],
        ], $stmt->fetchAll());
    }

    public function comentar(int $postId, int $usuarioId, string $conteudo): int {
        $stmt = $this->db->prepare(
            "INSERT INTO comentario (com_post_id, com_ut_id, com_conteudo)
             VALUES (?, ?, ?)"
        );
        $stmt->execute([$postId, $usuarioId, $conteudo]);
        return (int)$this->db->lastInsertId();
    }

    private function mapPost(array $row): array {
        return [
            'id' => (int)$row['post_id'],
            'titulo' => $row['post_titulo'],
            'conteudo' => $row['post_conteudo'],
            'categoria' => $row['post_categoria'],
            'categoria_label' => match ($row['post_categoria'] ?? null) {
                'duvidas' => 'Dúvida',
                'dicas' => 'Dica',
                'experiencias' => 'Experiência',
                default => 'Outro',
            },
            'data' => $row['post_data'],
            'comentarios' => (int)$row['comentarios'],
            'autor' => [
                'id' => (int)$row['ut_id'],
                'nome' => $row['ut_nome'],
            ],
        ];
    }
}
