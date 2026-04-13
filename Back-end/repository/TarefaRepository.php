<?php

namespace App\Repository;

use App\Config\Conexao;
use App\Model\Tarefa;
use PDO;

class TarefaRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Conexao::getConexao();
    }

    public function buscarPorId(int $id): ?Tarefa {
        $stmt = $this->db->prepare("SELECT * FROM tarefas WHERE id = ?");
        $stmt->execute([$id]);
        $dados = $stmt->fetch();

        if (!$dados) return null;

        return new Tarefa(
            id: (int)$dados['id'],
            usuario_id: (int)$dados['usuario_id'],
            parcela_id: isset($dados['parcela_id']) ? (int)$dados['parcela_id'] : null,
            titulo: $dados['titulo'],
            descricao: $dados['descricao'],
            data_limite: $dados['data_limite'],
            concluida: (bool)$dados['concluida'],
            prioridade: $dados['prioridade']
        );
    }

    public function listarPorUsuario(int $usuario_id): array {
        $stmt = $this->db->prepare("SELECT * FROM tarefas WHERE usuario_id = ? ORDER BY data_limite ASC");
        $stmt->execute([$usuario_id]);
        $resultados = $stmt->fetchAll();

        $tarefas = [];
        foreach ($resultados as $dados) {
            $tarefas[] = new Tarefa(
                id: (int)$dados['id'],
                usuario_id: (int)$dados['usuario_id'],
                parcela_id: isset($dados['parcela_id']) ? (int)$dados['parcela_id'] : null,
                titulo: $dados['titulo'],
                descricao: $dados['descricao'],
                data_limite: $dados['data_limite'],
                concluida: (bool)$dados['concluida'],
                prioridade: $dados['prioridade']
            );
        }
        return $tarefas;
    }

    public function salvar(Tarefa $tarefa): bool {
        if ($tarefa->id) {
            $stmt = $this->db->prepare("UPDATE tarefas SET titulo = ?, descricao = ?, data_limite = ?, concluida = ?, prioridade = ?, parcela_id = ? WHERE id = ?");
            return $stmt->execute([
                $tarefa->titulo,
                $tarefa->descricao,
                $tarefa->data_limite,
                (int)$tarefa->concluida,
                $tarefa->prioridade,
                $tarefa->parcela_id,
                $tarefa->id
            ]);
        } else {
            $stmt = $this->db->prepare("INSERT INTO tarefas (usuario_id, parcela_id, titulo, descricao, data_limite, concluida, prioridade) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $sucesso = $stmt->execute([
                $tarefa->usuario_id,
                $tarefa->parcela_id,
                $tarefa->titulo,
                $tarefa->descricao,
                $tarefa->data_limite,
                (int)$tarefa->concluida,
                $tarefa->prioridade
            ]);
            if ($sucesso) {
                $tarefa->id = (int)$this->db->lastInsertId();
            }
            return $sucesso;
        }
    }

    public function eliminar(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM tarefas WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
