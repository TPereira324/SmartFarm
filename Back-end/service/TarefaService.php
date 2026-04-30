<?php

namespace App\Service;

use App\Repository\TarefaRepository;
use Exception;

class TarefaService {
    private TarefaRepository $tarefaRepository;

    public function __construct() {
        $this->tarefaRepository = new TarefaRepository();
    }

    public function listarTarefasDoUsuario(int $usuario_id): array {
        return $this->tarefaRepository->listarPorUsuario($usuario_id);
    }
}
