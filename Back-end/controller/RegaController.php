<?php

namespace App\Controller;

use App\Dto\RegaDto;
use App\Service\RegaService;
use App\Repository\RegaRepository;
use Exception;

class RegaController extends Controller {
    private RegaRepository $regaRepository;
    private RegaService $regaService;

    public function __construct() {
        $this->regaRepository = new RegaRepository();
        $this->regaService = new RegaService();
    }

    public function registrar(): void {
        try {
            $dados = $_POST;
            $rega = new RegaDto(
                id: null,
                parcela_id: (int)($dados['parcela_id'] ?? 0),
                data: $dados['data'] ?? date('Y-m-d'),
                quantidade_litros: (float)($dados['quantidade_litros'] ?? 0),
                observacoes: $dados['observacoes'] ?? null
            );
            $this->regaRepository->registrar($rega);
            $this->json(['status' => 'sucesso', 'mensagem' => 'Rega registrada!']);
        } catch (Exception $e) {
            $this->erro($e->getMessage());
        }
    }

    public function listar(int $parcela_id): void {
        try {
            $regas = $this->regaRepository->listarPorParcela($parcela_id);
            $this->json(['status' => 'sucesso', 'dados' => $regas]);
        } catch (Exception $e) {
            $this->erro($e->getMessage());
        }
    }

    public function sugerirQuantidade(float $area_m2, string $tipo_cultura, float $climaFator = 1.0): void {
        try {
            $quantidade = $this->regaService->calcularQuantidade($area_m2, $tipo_cultura, $climaFator);
            $this->json(['status' => 'sucesso', 'quantidade_sugerida' => $quantidade]);
        } catch (Exception $e) {
            $this->erro($e->getMessage());
        }
    }
}
