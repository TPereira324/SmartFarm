<?php

namespace App\Service;

use App\Dto\ParcelaDto;
use App\Model\Parcela;
use App\Repository\ParcelaRepository;
use Exception;

class ParcelaService {
    private ParcelaRepository $parcelaRepository;

    public function __construct() {
        $this->parcelaRepository = new ParcelaRepository();
    }

    /**
     * Regista uma nova parcela (canteiro)
     */
    public function adicionarParcela(ParcelaDto $parcelaDto): ParcelaDto {
        $parcela = new Parcela(
            usuario_id: $parcelaDto->usuario_id,
            nome: $parcelaDto->nome,
            tipo_cultura: $parcelaDto->tipo_cultura,
            area_m2: $parcelaDto->area_m2,
            data_plantio: $parcelaDto->data_plantio,
            status: $parcelaDto->status
        );

        if (!$this->parcelaRepository->salvar($parcela)) {
            throw new Exception("Erro ao guardar parcela.");
        }

        return ParcelaDto::fromArray([
            'id' => $parcela->id,
            'usuario_id' => $parcela->usuario_id,
            'nome' => $parcela->nome,
            'tipo_cultura' => $parcela->tipo_cultura,
            'area_m2' => $parcela->area_m2,
            'data_plantio' => $parcela->data_plantio,
            'status' => $parcela->status
        ]);
    }

    /**
     * Lista todas as parcelas de um utilizador
     */
    public function listarParcelasDoUsuario(int $usuario_id): array {
        $parcelas = $this->parcelaRepository->listarPorUsuario($usuario_id);
        
        return array_map(fn($p) => ParcelaDto::fromArray([
            'id' => $p->id,
            'usuario_id' => $p->usuario_id,
            'nome' => $p->nome,
            'tipo_cultura' => $p->tipo_cultura,
            'area_m2' => $p->area_m2,
            'data_plantio' => $p->data_plantio,
            'status' => $p->status
        ]), $parcelas);
    }
}
