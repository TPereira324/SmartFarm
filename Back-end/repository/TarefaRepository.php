<?php

namespace App\Repository;

use App\Config\Conexao;
use PDO;

class TarefaRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Conexao::getConexao();
    }

    public function listarPorUsuario(int $usuario_id): array {
        $stmt = $this->db->prepare(
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
        $stmt->execute([$usuario_id]);
        return array_map(static fn(array $row) => [
            'id' => (int)$row['tar_id'],
            'titulo' => $row['tar_titulo'],
            'descricao' => $row['tar_descricao'],
            'data_inicio' => $row['tar_data_inicio'],
            'data_fim' => $row['tar_data_fim'],
            'estado' => $row['tar_estado'],
            'prioridade' => $row['tar_prioridade'],
            'parcela_nome' => $row['parcela_nome'],
        ], $stmt->fetchAll());
    }
}
