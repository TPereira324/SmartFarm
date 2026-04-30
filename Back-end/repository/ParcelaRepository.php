<?php

namespace App\Repository;

use App\Config\Conexao;
use PDO;
use Throwable;

class ParcelaRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Conexao::getConexao();
    }

    public function listarPorUsuario(int $usuario_id): array {
        $stmt = $this->db->prepare(
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
        $stmt->execute([$usuario_id]);
        $rows = $stmt->fetchAll();

        $parcelas = [];
        foreach ($rows as $row) {
            $parId = (int)$row['par_id'];
            if (!isset($parcelas[$parId])) {
                $parcelas[$parId] = [
                    'id' => $parId,
                    'nome' => $row['par_nome'],
                    'area_m2' => isset($row['par_area']) ? (float)$row['par_area'] : null,
                    'estado' => $row['par_estado'],
                    'cultivos' => [],
                ];
            }

            if (!empty($row['cult_id'])) {
                $parcelas[$parId]['cultivos'][] = [
                    'id' => (int)$row['cult_id'],
                    'nome' => $row['cult_nome'],
                    'metodo' => $row['pc_metodo_cultivo'],
                    'objetivo' => $row['pc_objetivo'],
                ];
            }
        }

        return array_values($parcelas);
    }

    public function adicionar(array $dados): array {
        $utId = (int)($dados['ut_id'] ?? $dados['usuario_id'] ?? 0);
        $nome = trim((string)($dados['par_nome'] ?? $dados['nome'] ?? ''));
        $estado = trim((string)($dados['par_estado'] ?? $dados['estado'] ?? 'ativo'));
        $largura = isset($dados['largura']) ? (float)$dados['largura'] : null;
        $comprimento = isset($dados['comprimento']) ? (float)$dados['comprimento'] : null;
        $area = isset($dados['par_area']) ? (float)$dados['par_area'] : null;
        $cultivoNome = trim((string)($dados['cultivo'] ?? $dados['tipo'] ?? $dados['cult_nome'] ?? ''));
        $metodo = trim((string)($dados['metodo'] ?? $dados['pc_metodo_cultivo'] ?? ''));
        $objetivo = trim((string)($dados['objetivo'] ?? $dados['pc_objetivo'] ?? ''));

        if ($utId <= 0) {
            throw new \InvalidArgumentException('ut_id obrigatório.');
        }
        if ($area === null && $largura !== null && $comprimento !== null) {
            $area = $largura * $comprimento;
        }
        if ($nome === '') {
            $nome = 'Parcela';
        }
        if ($area === null || $area <= 0) {
            throw new \InvalidArgumentException('Área inválida.');
        }

        $this->db->beginTransaction();
        try {
            $stmtPar = $this->db->prepare(
                "INSERT INTO parcela (par_nome, par_area, par_estado, par_ut_id)
                 VALUES (?, ?, ?, ?)"
            );
            $stmtPar->execute([$nome, $area, $estado, $utId]);
            $parId = (int)$this->db->lastInsertId();

            $cultId = null;
            if ($cultivoNome !== '') {
                $stmtCultSel = $this->db->prepare("SELECT cult_id FROM cultivo WHERE cult_nome = ? LIMIT 1");
                $stmtCultSel->execute([$cultivoNome]);
                $rowCult = $stmtCultSel->fetch();

                if ($rowCult && isset($rowCult['cult_id'])) {
                    $cultId = (int)$rowCult['cult_id'];
                } else {
                    $stmtCultIns = $this->db->prepare("INSERT INTO cultivo (cult_nome, cult_descricao) VALUES (?, ?)");
                    $stmtCultIns->execute([$cultivoNome, '']);
                    $cultId = (int)$this->db->lastInsertId();
                }
            }

            if ($cultId !== null) {
                $stmtPc = $this->db->prepare(
                    "INSERT INTO parcela_cultivo (pc_par_id, pc_cult_id, pc_metodo_cultivo, pc_objetivo)
                     VALUES (?, ?, ?, ?)"
                );
                $stmtPc->execute([$parId, $cultId, $metodo, $objetivo]);
            }

            $this->db->commit();
            return [
                'par_id' => $parId,
                'cult_id' => $cultId,
            ];
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
