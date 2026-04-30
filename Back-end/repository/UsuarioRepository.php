<?php

namespace App\Repository;

use App\Config\Conexao;
use PDO;

class UsuarioRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Conexao::getConexao();
    }

    public function buscarPorId(int $id): ?array {
        $stmt = $this->db->prepare(
            "SELECT ut_id, ut_nome, ut_email, ut_nome_fazenda, ut_agricultor_iniciante, ut_datareg
             FROM utilizador
             WHERE ut_id = ?"
        );
        $stmt->execute([$id]);
        $dados = $stmt->fetch() ?: null;
        return $dados ? $this->mapUser($dados, false) : null;
    }

    public function buscarPorEmail(string $email, bool $withPassword = true): ?array {
        $stmt = $this->db->prepare(
            "SELECT ut_id, ut_nome, ut_email, ut_password, ut_nome_fazenda, ut_agricultor_iniciante, ut_datareg
             FROM utilizador
             WHERE ut_email = ?"
        );
        $stmt->execute([$email]);
        $dados = $stmt->fetch() ?: null;
        return $dados ? $this->mapUser($dados, $withPassword) : null;
    }

    public function pesquisarPorTermo(string $termo): array {
        $stmt = $this->db->prepare(
            "SELECT ut_id, ut_nome, ut_email, ut_nome_fazenda, ut_agricultor_iniciante, ut_datareg
             FROM utilizador
             WHERE ut_nome LIKE ? OR ut_email LIKE ?"
        );
        $like = "%$termo%";
        $stmt->execute([$like, $like]);
        $resultados = $stmt->fetchAll();

        return array_map(fn(array $dados) => $this->mapUser($dados, false), $resultados);
    }

    public function criar(string $nome, string $email, string $senhaHash, string $nomeFazenda = ''): array {
        $stmt = $this->db->prepare(
            "INSERT INTO utilizador (ut_nome, ut_email, ut_password, ut_nome_fazenda)
             VALUES (?, ?, ?, ?)"
        );
        $stmt->execute([$nome, $email, $senhaHash, $nomeFazenda]);

        return [
            'id' => (int)$this->db->lastInsertId(),
            'nome' => $nome,
            'email' => $email,
            'nome_fazenda' => $nomeFazenda,
            'agricultor_iniciante' => false,
            'data_registo' => null,
        ];
    }

    private function mapUser(array $dados, bool $withPassword): array {
        $user = [
            'id' => (int)$dados['ut_id'],
            'nome' => $dados['ut_nome'],
            'email' => $dados['ut_email'],
            'nome_fazenda' => $dados['ut_nome_fazenda'] ?? '',
            'agricultor_iniciante' => isset($dados['ut_agricultor_iniciante']) ? (bool)$dados['ut_agricultor_iniciante'] : false,
            'data_registo' => $dados['ut_datareg'] ?? null,
        ];
        if ($withPassword) {
            $user['senha'] = $dados['ut_password'] ?? null;
        }
        return $user;
    }
}
