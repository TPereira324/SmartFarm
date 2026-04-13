<?php

namespace App\Service;

use App\Dto\UsuarioDto;
use App\Model\Usuario;
use App\Repository\UsuarioRepository;
use Exception;

class UsuarioService {
    private UsuarioRepository $usuarioRepository;

    public function __construct() {
        $this->usuarioRepository = new UsuarioRepository();
    }

    /**
     * Regista um novo utilizador no sistema
     */
    public function registar(string $nome, string $email, string $senha): UsuarioDto {
        // Verificar se o email já existe
        if ($this->usuarioRepository->buscarPorEmail($email)) {
            throw new Exception("Este email já está registado.");
        }

        // Criar o modelo com a senha em hash
        $usuario = new Usuario(
            nome: $nome,
            email: $email,
            senha: password_hash($senha, PASSWORD_DEFAULT),
            nivel_experiencia: 'iniciante'
        );

        if (!$this->usuarioRepository->salvar($usuario)) {
            throw new Exception("Erro ao criar conta.");
        }

        return UsuarioDto::fromArray([
            'id' => $usuario->id,
            'nome' => $usuario->nome,
            'email' => $usuario->email,
            'nivel_experiencia' => $usuario->nivel_experiencia
        ]);
    }

    /**
     * Realiza o login do utilizador
     */
    public function login(string $email, string $senha): UsuarioDto {
        $usuario = $this->usuarioRepository->buscarPorEmail($email);

        if (!$usuario || !password_verify($senha, $usuario->senha)) {
            throw new Exception("Credenciais inválidas.");
        }

        return UsuarioDto::fromArray([
            'id' => $usuario->id,
            'nome' => $usuario->nome,
            'email' => $usuario->email,
            'foto_perfil' => $usuario->foto_perfil,
            'nivel_experiencia' => $usuario->nivel_experiencia,
            'data_registo' => $usuario->data_registo
        ]);
    }

    /**
     * Pesquisa utilizadores por nome ou email
     */
    public function pesquisar(string $termo): array {
        return $this->usuarioRepository->pesquisarPorTermo($termo);
    }

    /**
     * Obtém os dados de perfil do utilizador
     */
    public function obterPerfil(int $id): UsuarioDto {
        $usuario = $this->usuarioRepository->buscarPorId($id);
        
        if (!$usuario) {
            throw new Exception("Utilizador não encontrado.");
        }

        return UsuarioDto::fromArray([
            'id' => $usuario->id,
            'nome' => $usuario->nome,
            'email' => $usuario->email,
            'foto_perfil' => $usuario->foto_perfil,
            'nivel_experiencia' => $usuario->nivel_experiencia,
            'data_registo' => $usuario->data_registo
        ]);
    }
}
