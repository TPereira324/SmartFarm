<?php

namespace App\Repository;

use App\Config\Conexao;
use App\Model\Parcela;
use PDO;

class ParcelaRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Conexao::getConexao();
    }

    public function buscarPorId(int $id): ?Parcela {
        $stmt = $this->db->prepare("SELECT * FROM parcelas WHERE id = ?");
        $stmt->execute([$id]);
        $dados = $stmt->fetch();

        if (!$dados) return null;

        return new Parcela(
            id: (int)$dados['id'],
            usuario_id: (int)$dados['usuario_id'],
            nome: $dados['nome'],
            tipo_cultura: $dados['tipo_cultura'],
            area_m2: (float)$dados['area_m2'],
            data_plantio: $dados['data_plantio'],
            status: $dados['status']
        );
    }

    public function listarPorUsuario(int $usuario_id): array {
        $stmt = $this->db->prepare("SELECT * FROM parcelas WHERE usuario_id = ?");
        $stmt->execute([$usuario_id]);
        $resultados = $stmt->fetchAll();

        $parcelas = [];
        foreach ($resultados as $dados) {
            $parcelas[] = new Parcela(
                id: (int)$dados['id'],
                usuario_id: (int)$dados['usuario_id'],
                nome: $dados['nome'],
                tipo_cultura: $dados['tipo_cultura'],
                area_m2: (float)$dados['area_m2'],
                data_plantio: $dados['data_plantio'],
                status: $dados['status']
            );
        }
        return $parcelas;
    }

    public function salvar(Parcela $parcela): bool {
        if ($parcela->id) {
            $stmt = $this->db->prepare("UPDATE parcelas SET nome = ?, tipo_cultura = ?, area_m2 = ?, data_plantio = ?, status = ? WHERE id = ?");
            return $stmt->execute([
                $parcela->nome,
                $parcela->tipo_cultura,
                $parcela->area_m2,
                $parcela->data_plantio,
                $parcela->status,
                $parcela->id
            ]);
        } else {
            $stmt = $this->db->prepare("INSERT INTO parcelas (usuario_id, nome, tipo_cultura, area_m2, data_plantio, status) VALUES (?, ?, ?, ?, ?, ?)");
            $sucesso = $stmt->execute([
                $parcela->usuario_id,
                $parcela->nome,
                $parcela->tipo_cultura,
                $parcela->area_m2,
                $parcela->data_plantio,
                $parcela->status
            ]);
            if ($sucesso) {
                $parcela->id = (int)$this->db->lastInsertId();
            }
            return $sucesso;
        }
    }

    public function eliminar(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM parcelas WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
