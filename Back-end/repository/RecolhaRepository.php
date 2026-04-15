<?php

namespace App\Repository;

use App\Config\Conexao;
use App\Dto\RecolhaDto;
use PDO;

class RecolhaRepository {
    private PDO $db;
    public function __construct() {
        $this->db = Conexao::getConexao();
    }

    public function registrar(RecolhaDto $recolha): bool {
        $stmt = $this->db->prepare(
            "INSERT INTO recolhas (parcela_id, data, quantidade, produto, observacoes) VALUES (?, ?, ?, ?, ?)"
        );
        return $stmt->execute([
            $recolha->parcela_id,
            $recolha->data,
            $recolha->quantidade,
            $recolha->produto,
            $recolha->observacoes
        ]);
    }

    public function listarPorParcela(int $parcela_id): array {
        $stmt = $this->db->prepare("SELECT * FROM recolhas WHERE parcela_id = ?");
        $stmt->execute([$parcela_id]);
        $resultados = $stmt->fetchAll();
        $recolhas = [];
        foreach ($resultados as $dados) {
            $recolhas[] = new RecolhaDto(
                id: (int)$dados['id'],
                parcela_id: (int)$dados['parcela_id'],
                data: $dados['data'],
                quantidade: (float)$dados['quantidade'],
                produto: $dados['produto'],
                observacoes: $dados['observacoes']
            );
        }
        return $recolhas;
    }
}
