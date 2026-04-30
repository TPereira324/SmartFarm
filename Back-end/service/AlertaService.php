<?php

namespace App\Service;

use App\Repository\AlertaRepository;

class AlertaService
{
    private AlertaRepository $alertaRepository;

    public function __construct()
    {
        $this->alertaRepository = new AlertaRepository();
    }

    public function listarAlertasDoUsuario(int $usuarioId): array
    {
        return $this->alertaRepository->listarPorUsuario($usuarioId);
    }
}
