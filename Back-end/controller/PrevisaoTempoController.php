<?php

namespace App\Controller;

use App\Service\PrevisaoTempoService;
use Exception;

class PrevisaoTempoController extends Controller {
    private PrevisaoTempoService $previsaoTempoService;

    public function __construct() {
        $this->previsaoTempoService = new PrevisaoTempoService();
    }

    /**
     * Endpoint para consultar a meteorologia de uma cidade
     * Exemplo: /api/clima?cidade=Lisboa
     */
    public function consultar(): void {
        try {
            
            $cidade = $_GET['cidade'] ?? 'Lisboa';

            
            $climaDto = $this->previsaoTempoService->consultarClima($cidade);

           
            $this->json([
                'status' => 'sucesso',
                'mensagem' => "Meteorologia para {$cidade} obtida com sucesso!",
                'dados' => $climaDto
            ]);

        } catch (Exception $e) {
            
            $this->erro($e->getMessage(), 400);
        }
    }
}
