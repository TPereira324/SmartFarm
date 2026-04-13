<?php

namespace App\Dto;

readonly class ParcelaDto {
    /**
     * @param int|null $id
     * @param int $usuario_id
     * @param string $nome
     * @param string $tipo_cultura
     * @param float $area_m2
     * @param string $data_plantio
     * @param string $status
     */
    public function __construct(
        public ?int $id,
        public int $usuario_id,
        public string $nome,
        public string $tipo_cultura,
        public float $area_m2,
        public string $data_plantio,
        public string $status
    ) {}

    public static function fromArray(array $dados): self {
        return new self(
            id: $dados['id'] ?? null,
            usuario_id: (int)($dados['usuario_id'] ?? 0),
            nome: $dados['nome'] ?? '',
            tipo_cultura: $dados['tipo_cultura'] ?? '',
            area_m2: (float)($dados['area_m2'] ?? 0.0),
            data_plantio: $dados['data_plantio'] ?? '',
            status: $dados['status'] ?? 'ativo'
        );
    }
}
