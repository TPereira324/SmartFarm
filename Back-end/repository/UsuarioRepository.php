<?php

namespace App\Repository;

use App\Config\Conexao;
use App\Model\Usuario;
use PDO;

class UsuarioRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Conexao::getConexao();
    }

    public function buscarPorId(int $id): ?Usuario {
        $stmt = $this->db->prepare("SELECT * FROM usuarios WHERE id = ?");
        $stmt->execute([$id]);
        $dados = $stmt->fetch();

        if (!$dados) return null;

        return new Usuario(
            id: (int)$dados['id'],
            nome: $dados['nome'],
            email: $dados['email'],
            senha: $dados['senha'],
            foto_perfil: $dados['foto_perfil'],
            nivel_experiencia: $dados['nivel_experiencia'],
            data_registo: $dados['data_registo']
        );
    }

    public function buscarPorEmail(string $email): ?Usuario {
        $stmt = $this->db->prepare("SELECT * FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $dados = $stmt->fetch();

        if (!$dados) return null;

        return new Usuario(
            id: (int)$dados['id'],
            nome: $dados['nome'],
            email: $dados['email'],
            senha: $dados['senha'],
            foto_perfil: $dados['foto_perfil'],
            nivel_experiencia: $dados['nivel_experiencia'],
            data_registo: $dados['data_registo']
        );
    }

    public function pesquisarPorTermo(string $termo): array {
        $stmt = $this->db->prepare("SELECT * FROM usuarios WHERE nome LIKE ? OR email LIKE ?");
        $like = "%$termo%";
        $stmt->execute([$like, $like]);
        $resultados = $stmt->fetchAll();

        $usuarios = [];
        foreach ($resultados as $dados) {
            $usuarios[] = new Usuario(
                id: (int)$dados['id'],
                nome: $dados['nome'],
                email: $dados['email'],
                senha: $dados['senha'],
                foto_perfil: $dados['foto_perfil'],
                nivel_experiencia: $dados['nivel_experiencia'],
                data_registo: $dados['data_registo']
            );
        }
        return $usuarios;
    }

    public function salvar(Usuario $usuario): bool {
        if ($usuario->id) {
            $stmt = $this->db->prepare("UPDATE usuarios SET nome = ?, email = ?, senha = ?, foto_perfil = ?, nivel_experiencia = ? WHERE id = ?");
            return $stmt->execute([
                $usuario->nome,
                $usuario->email,
                $usuario->senha,
                $usuario->foto_perfil,
                $usuario->nivel_experiencia,
                $usuario->id
            ]);
        } else {
            $stmt = $this->db->prepare("INSERT INTO usuarios (nome, email, senha, foto_perfil, nivel_experiencia) VALUES (?, ?, ?, ?, ?)");
            $sucesso = $stmt->execute([
                $usuario->nome,
                $usuario->email,
                $usuario->senha,
                $usuario->foto_perfil,
                $usuario->nivel_experiencia
            ]);
            if ($sucesso) {
                $usuario->id = (int)$this->db->lastInsertId();
            }
            return $sucesso;
        }
    }
}
