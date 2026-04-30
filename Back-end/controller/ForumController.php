<?php

namespace App\Controller;

use App\Service\ForumService;
use Exception;

class ForumController extends Controller {
    private ForumService $forumService;

    public function __construct() {
        $this->forumService = new ForumService();
    }

    public function publicar(): void {
        try {
            $dados = $this->input();
            $resultado = $this->forumService->publicarTopico(
                (int)($dados['ut_id'] ?? $dados['usuario_id'] ?? 0),
                (string)($dados['titulo'] ?? ''),
                (string)($dados['conteudo'] ?? ''),
                (string)($dados['categoria'] ?? 'outros')
            );
            $this->success($resultado, 'Tópico publicado com sucesso!', 201);
        } catch (Exception $e) {
            $status = str_contains($e->getMessage(), 'Utilizador inválido') ? 401 : 400;
            $this->erro($e->getMessage(), $status);
        }
    }

    public function listar(): void {
        try {
            $this->success($this->forumService->listarTopicos());
        } catch (Exception $e) {
            $this->erro($e->getMessage());
        }
    }

    public function detalhe(int $id): void {
        try {
            $this->success($this->forumService->obterDetalhe($id));
        } catch (Exception $e) {
            $status = str_contains($e->getMessage(), 'não encontrada') ? 404 : 400;
            $this->erro($e->getMessage(), $status);
        }
    }

    public function comentarios(int $id): void {
        try {
            $this->success($this->forumService->listarComentarios($id));
        } catch (Exception $e) {
            $this->erro($e->getMessage(), 400);
        }
    }

    public function comentar(int $id): void {
        try {
            $dados = $this->input();
            $resultado = $this->forumService->comentar(
                $id,
                (int)($dados['ut_id'] ?? $dados['usuario_id'] ?? 0),
                (string)($dados['conteudo'] ?? '')
            );
            $this->success($resultado, 'Comentário enviado com sucesso!', 201);
        } catch (Exception $e) {
            $status = str_contains($e->getMessage(), 'Utilizador inválido') ? 401 : 400;
            $this->erro($e->getMessage(), $status);
        }
    }
}
