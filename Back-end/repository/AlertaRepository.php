<?php

namespace App\Repository;

use App\Config\Conexao;
use PDO;

class AlertaRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Conexao::getConexao();
    }

    public function listarPorUsuario(int $usuarioId): array {
        $stmt = $this->db->prepare(
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
        $stmt->execute([$usuarioId]);

        return array_map(static fn(array $row) => [
            'id' => (int)$row['alt_id'],
            'tipo' => $row['alt_tipo'],
            'mensagem' => $row['alt_mensagem'],
            'data' => $row['alt_data'],
            'parcela_nome' => $row['parcela_nome'],
        ], $stmt->fetchAll());
    }
}
