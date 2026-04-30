<?php

namespace App\Controller;

use App\Service\UsuarioService;
use Exception;

class UsuarioController extends Controller
{
    private UsuarioService $usuarioService;

    public function __construct()
    {
        $this->usuarioService = new UsuarioService();
    }

    public function registar(): void
    {
        try {
            $dados = $this->input();
            $user = $this->usuarioService->registar(
                $dados['fullname'] ?? $dados['nome'] ?? '',
                $dados['email'] ?? '',
                $dados['password'] ?? $dados['senha'] ?? '',
                $dados['farm_name'] ?? ''
            );

            $this->json([
                'success' => true,
                'message' => 'Conta criada com sucesso!',
                'user' => $user,
            ], 201);
        } catch (Exception $e) {
            $status = str_contains($e->getMessage(), 'já está registado') ? 409 : 400;
            $this->erro($e->getMessage(), $status);
        }
    }

    public function login(): void
    {
        try {
            $dados = $this->input();
            $user = $this->usuarioService->login(
                $dados['email'] ?? '',
                $dados['password'] ?? $dados['senha'] ?? ''
            );

            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_nome'] = $user['nome'];
            $_SESSION['user_email'] = $user['email'];

            $this->json([
                'success' => true,
                'user' => $user,
            ]);
        } catch (Exception $e) {
            $status = str_contains($e->getMessage(), 'não encontrado') ? 404 : 401;
            $this->erro($e->getMessage(), $status);
        }
    }

    public function perfil(int $id): void
    {
        try {
            $this->success($this->usuarioService->obterPerfil($id));
        } catch (Exception $e) {
            $this->erro($e->getMessage(), 404);
        }
    }
}
