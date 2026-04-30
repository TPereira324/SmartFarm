<?php

namespace App\Service;

use App\Repository\UsuarioRepository;
use Exception;

class UsuarioService {
    private UsuarioRepository $usuarioRepository;

    public function __construct() {
        $this->usuarioRepository = new UsuarioRepository();
    }

    public function registar(string $nome, string $email, string $senha, string $nomeFazenda = ''): array {
        if ($this->usuarioRepository->buscarPorEmail($email)) {
            throw new Exception("Este email já está registado.");
        }

        if (trim($nome) === '' || trim($email) === '' || trim($senha) === '') {
            throw new Exception("Preenche todos os campos obrigatórios.");
        }

        return $this->usuarioRepository->criar(
            trim($nome),
            trim($email),
            password_hash($senha, PASSWORD_DEFAULT),
            trim($nomeFazenda)
        );
    }

    public function login(string $email, string $senha): array {
        $usuario = $this->usuarioRepository->buscarPorEmail(trim($email), true);

        if (!$usuario || !password_verify($senha, (string)($usuario['senha'] ?? ''))) {
            if (!$usuario) {
                throw new Exception("Utilizador não encontrado.");
            }
            throw new Exception("Palavra-passe incorreta.");
        }

        unset($usuario['senha']);
        return $usuario;
    }

    public function pesquisar(string $termo): array {
        return $this->usuarioRepository->pesquisarPorTermo($termo);
    }

    public function obterPerfil(int $id): array {
        $usuario = $this->usuarioRepository->buscarPorId($id);
        
        if (!$usuario) {
            throw new Exception("Utilizador não encontrado.");
        }

        return $usuario;
    }
}
