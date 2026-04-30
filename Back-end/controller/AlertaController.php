<?php

namespace App\Controller;

use App\Service\AlertaService;
use Exception;

class AlertaController extends Controller {
    private AlertaService $alertaService;

    public function __construct() {
        $this->alertaService = new AlertaService();
    }

    public function listar(int $usuarioId): void {
        try {
            $this->success($this->alertaService->listarAlertasDoUsuario($usuarioId));
        } catch (Exception $e) {
            $this->erro($e->getMessage());
        }
    }
}
