<?php

namespace App\Dto;

readonly class RegaDto {
    public function __construct(
        public ?int $id,
        public int $parcela_id,
        public string $data,
        public float $quantidade_litros,
        public ?string $observacoes = null
    ) {}
}
