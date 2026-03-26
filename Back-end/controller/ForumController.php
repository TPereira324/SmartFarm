<?php

namespace App\Controller;

use App\Dto\ForumDto;
use App\Service\ForumService;
use Exception;

class ForumController extends Controller {
    private ForumService $forumService;

    public function __construct() {
        $this->forumService = new ForumService();
    }

    /**
     * Publicar novo tópico via POST
     */
    public function publicar(): void {
        try {
            $forumDto = ForumDto::fromArray($_POST);
            $resultado = $this->forumService->publicarTopico($forumDto);

            $this->json([
                'status' => 'sucesso',
                'mensagem' => 'Tópico publicado!',
                'dados' => $resultado
            ], 201);
        } catch (Exception $e) {
            $this->erro($e->getMessage());
        }
    }

    /**
     * Listar todos os tópicos via GET
     */
    public function listar(): void {
        try {
            $topicos = $this->forumService->listarTopicos();
            $this->json([
                'status' => 'sucesso',
                'dados' => $topicos
            ]);
        } catch (Exception $e) {
            $this->erro($e->getMessage());
        }
    }
}
