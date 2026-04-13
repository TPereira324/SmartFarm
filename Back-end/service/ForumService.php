<?php

namespace App\Service;

use App\Dto\ForumDto;
use App\Model\Forum;
use App\Repository\ForumRepository;
use Exception;

class ForumService {
    private ForumRepository $forumRepository;

    public function __construct() {
        $this->forumRepository = new ForumRepository();
    }

    
     
    public function publicarTopico(ForumDto $forumDto): ForumDto {
        $forum = new Forum(
            usuario_id: $forumDto->usuario_id,
            titulo: $forumDto->titulo,
            conteudo: $forumDto->conteudo,
            categoria: $forumDto->categoria
        );

        if (!$this->forumRepository->salvar($forum)) {
            throw new Exception("Erro ao publicar tópico.");
        }

        return ForumDto::fromArray([
            'id' => $forum->id,
            'usuario_id' => $forum->usuario_id,
            'titulo' => $forum->titulo,
            'conteudo' => $forum->conteudo,
            'categoria' => $forum->categoria,
            'data_criacao' => $forum->data_criacao
        ]);
    }

    
    public function listarTopicos(): array {
        $topicos = $this->forumRepository->listarTodos();
        
        return array_map(fn($f) => ForumDto::fromArray([
            'id' => $f->id,
            'usuario_id' => $f->usuario_id,
            'titulo' => $f->titulo,
            'conteudo' => $f->conteudo,
            'categoria' => $f->categoria,
            'data_criacao' => $f->data_criacao
        ]), $topicos);
    }
}
