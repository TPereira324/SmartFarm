<?php

namespace App\Controller;

use App\Dto\ParcelaDto;
use App\Service\ParcelaService;
use Exception;

class ParcelaController extends Controller {
    private ParcelaService $parcelaService;

    public function __construct() {
        $this->parcelaService = new ParcelaService();
    }

    /**
     * Adicionar nova parcela via POST
     */
    public function adicionar(): void {
        try {
            $parcelaDto = ParcelaDto::fromArray($_POST);
            $resultado = $this->parcelaService->adicionarParcela($parcelaDto);

            $this->json([
                'status' => 'sucesso',
                'mensagem' => 'Parcela adicionada!',
                'dados' => $resultado
            ], 201);
        } catch (Exception $e) {
            $this->erro($e->getMessage());
        }
    }

    /**
     * Listar parcelas de um utilizador via GET
     */
    public function listar(int $usuario_id): void {
        try {
            $parcelas = $this->parcelaService->listarParcelasDoUsuario($usuario_id);
            $this->json([
                'status' => 'sucesso',
                'dados' => $parcelas
            ]);
        } catch (Exception $e) {
            $this->erro($e->getMessage());
        }
    }
}
