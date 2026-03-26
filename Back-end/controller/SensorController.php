<?php

namespace App\Controller;

use App\Dto\SensorDto;
use App\Service\SensorService;
use Exception;

class SensorController extends Controller {
    private SensorService $sensorService;

    public function __construct() {
        $this->sensorService = new SensorService();
    }

    /**
     * Receber leitura de sensor via POST
     */
    public function registarLeitura(): void {
        try {
            $sensorDto = SensorDto::fromArray($_POST);
            $resultado = $this->sensorService->registarLeitura($sensorDto);

            $this->json([
                'status' => 'sucesso',
                'mensagem' => 'Leitura registada!',
                'dados' => $resultado
            ]);
        } catch (Exception $e) {
            $this->erro($e->getMessage());
        }
    }

    /**
     * Listar sensores de uma parcela via GET
     */
    public function listarPorParcela(int $parcela_id): void {
        try {
            $sensores = $this->sensorService->obterSensoresDaParcela($parcela_id);
            $this->json([
                'status' => 'sucesso',
                'dados' => $sensores
            ]);
        } catch (Exception $e) {
            $this->erro($e->getMessage());
        }
    }
}
