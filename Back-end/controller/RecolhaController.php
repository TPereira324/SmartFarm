<?php

namespace App\Controller;

use App\Dto\RecolhaDto;
use App\Service\RecolhaService;
use App\Repository\RecolhaRepository;
use Exception;

class RecolhaController extends Controller {
    private RecolhaRepository $recolhaRepository;
    private RecolhaService $recolhaService;

    public function __construct() {
        $this->recolhaRepository = new RecolhaRepository();
        $this->recolhaService = new RecolhaService();
    }

    public function registrar(): void {
        try {
            $dados = $_POST;
            $recolha = new RecolhaDto(
                id: null,
                parcela_id: (int)($dados['parcela_id'] ?? 0),
                data: $dados['data'] ?? date('Y-m-d'),
                quantidade: (float)($dados['quantidade'] ?? 0),
                produto: $dados['produto'] ?? '',
                observacoes: $dados['observacoes'] ?? null
            );
            $this->recolhaRepository->registrar($recolha);
            $this->json(['status' => 'sucesso', 'mensagem' => 'Recolha registrada!']);
        } catch (Exception $e) {
            $this->erro($e->getMessage());
        }
    }

    public function listar(int $parcela_id): void {
        try {
            $recolhas = $this->recolhaRepository->listarPorParcela($parcela_id);
            $this->json(['status' => 'sucesso', 'dados' => $recolhas]);
        } catch (Exception $e) {
            $this->erro($e->getMessage());
        }
    }
}
