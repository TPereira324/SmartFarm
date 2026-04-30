<?php

namespace App\Controller;

use App\Service\ParcelaService;
use Exception;

class ParcelaController extends Controller {
    private ParcelaService $parcelaService;

    public function __construct() {
        $this->parcelaService = new ParcelaService();
    }

    public function adicionar(): void {
        try {
            $resultado = $this->parcelaService->adicionarParcela($this->input());
            $this->success($resultado, 'Parcela criada com sucesso!', 201);
        } catch (Exception $e) {
            $status = str_contains($e->getMessage(), 'ut_id') ? 401 : 400;
            $this->erro($e->getMessage(), $status);
        }
    }

    public function listar(int $usuario_id): void {
        try {
            $this->success($this->parcelaService->listarParcelasDoUsuario($usuario_id));
        } catch (Exception $e) {
            $this->erro($e->getMessage());
        }
    }
}
