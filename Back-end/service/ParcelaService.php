<?php

namespace App\Service;

use App\Repository\ParcelaRepository;

class ParcelaService {
    private ParcelaRepository $parcelaRepository;

    public function __construct() {
        $this->parcelaRepository = new ParcelaRepository();
    }

    public function adicionarParcela(array $dados): array {
        return $this->parcelaRepository->adicionar($dados);
    }

    public function listarParcelasDoUsuario(int $usuario_id): array {
        return $this->parcelaRepository->listarPorUsuario($usuario_id);
    }
}
