<?php

namespace App\Repository;

use App\Config\Conexao;
use App\Model\Forum;
use PDO;

class ForumRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Conexao::getConexao();
    }

    public function buscarPorId(int $id): ?Forum {
        $stmt = $this->db->prepare("SELECT * FROM forum WHERE id = ?");
        $stmt->execute([$id]);
        $dados = $stmt->fetch();

        if (!$dados) return null;

        return new Forum(
            id: (int)$dados['id'],
            usuario_id: (int)$dados['usuario_id'],
            titulo: $dados['titulo'],
            conteudo: $dados['conteudo'],
            categoria: $dados['categoria'],
            data_criacao: $dados['data_criacao']
        );
    }

    public function listarTodos(): array {
        $stmt = $this->db->query("SELECT * FROM forum ORDER BY data_criacao DESC");
        $resultados = $stmt->fetchAll();

        $topicos = [];
        foreach ($resultados as $dados) {
            $topicos[] = new Forum(
                id: (int)$dados['id'],
                usuario_id: (int)$dados['usuario_id'],
                titulo: $dados['titulo'],
                conteudo: $dados['conteudo'],
                categoria: $dados['categoria'],
                data_criacao: $dados['data_criacao']
            );
        }
        return $topicos;
    }

    public function salvar(Forum $forum): bool {
        if ($forum->id) {
            $stmt = $this->db->prepare("UPDATE forum SET titulo = ?, conteudo = ?, categoria = ? WHERE id = ?");
            return $stmt->execute([
                $forum->titulo,
                $forum->conteudo,
                $forum->categoria,
                $forum->id
            ]);
        } else {
            $stmt = $this->db->prepare("INSERT INTO forum (usuario_id, titulo, conteudo, categoria) VALUES (?, ?, ?, ?)");
            $sucesso = $stmt->execute([
                $forum->usuario_id,
                $forum->titulo,
                $forum->conteudo,
                $forum->categoria
            ]);
            if ($sucesso) {
                $forum->id = (int)$this->db->lastInsertId();
            }
            return $sucesso;
        }
    }

    public function eliminar(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM forum WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
