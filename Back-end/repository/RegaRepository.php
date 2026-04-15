<?php

namespace App\Repository;

use App\Config\Conexao;
use App\Dto\RegaDto;
use PDO;

class RegaRepository {
    private PDO $db;
    public function __construct() {
        $this->db = Conexao::getConexao();
    }

    public function registrar(RegaDto $rega): bool {
        $stmt = $this->db->prepare(
            "INSERT INTO regas (parcela_id, data, quantidade_litros, observacoes) VALUES (?, ?, ?, ?)"
        );
        return $stmt->execute([
            $rega->parcela_id,
            $rega->data,
            $rega->quantidade_litros,
            $rega->observacoes
        ]);
    }

    public function listarPorParcela(int $parcela_id): array {
        $stmt = $this->db->prepare("SELECT * FROM regas WHERE parcela_id = ?");
        $stmt->execute([$parcela_id]);
        $resultados = $stmt->fetchAll();
        $regas = [];
        foreach ($resultados as $dados) {
            $regas[] = new RegaDto(
                id: (int)$dados['id'],
                parcela_id: (int)$dados['parcela_id'],
                data: $dados['data'],
                quantidade_litros: (float)$dados['quantidade_litros'],
                observacoes: $dados['observacoes']
            );
        }
        return $regas;
    }
}
