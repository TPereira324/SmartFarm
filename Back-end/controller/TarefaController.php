<?php

namespace App\Controller;

use App\Service\TarefaService;
use Exception;

class TarefaController extends Controller {
    private TarefaService $tarefaService;

    public function __construct() {
        $this->tarefaService = new TarefaService();
    }

    public function listar(int $usuario_id): void {
        try {
            $this->success($this->tarefaService->listarTarefasDoUsuario($usuario_id));
        } catch (Exception $e) {
            $this->erro($e->getMessage());
        }
    }
}
