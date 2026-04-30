<?php

namespace App\Service;

use App\Repository\ForumRepository;
use Exception;

class ForumService {
    private ForumRepository $forumRepository;

    public function __construct() {
        $this->forumRepository = new ForumRepository();
    }

    public function publicarTopico(int $usuarioId, string $titulo, string $conteudo, string $categoria): array {
        if ($usuarioId <= 0) {
            throw new Exception("Utilizador inválido.");
        }
        if (trim($titulo) === '') {
            throw new Exception("Título obrigatório.");
        }
        if (trim($conteudo) === '') {
            throw new Exception("Conteúdo obrigatório.");
        }

        return ['id' => $this->forumRepository->publicar($usuarioId, trim($titulo), trim($conteudo), trim($categoria) ?: 'outros')];
    }

    public function listarTopicos(): array {
        return $this->forumRepository->listarTodos();
    }

    public function obterDetalhe(int $postId): array {
        if ($postId <= 0) {
            throw new Exception("Publicação inválida.");
        }
        $post = $this->forumRepository->buscarPorId($postId);
        if (!$post) {
            throw new Exception("Publicação não encontrada.");
        }
        return $post;
    }

    public function listarComentarios(int $postId): array {
        if ($postId <= 0) {
            throw new Exception("Publicação inválida.");
        }
        return $this->forumRepository->listarComentarios($postId);
    }

    public function comentar(int $postId, int $usuarioId, string $conteudo): array {
        if ($postId <= 0) {
            throw new Exception("Publicação inválida.");
        }
        if ($usuarioId <= 0) {
            throw new Exception("Utilizador inválido.");
        }
        if (trim($conteudo) === '') {
            throw new Exception("Comentário vazio.");
        }

        return ['id' => $this->forumRepository->comentar($postId, $usuarioId, trim($conteudo))];
    }
}
