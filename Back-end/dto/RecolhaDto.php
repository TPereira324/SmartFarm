<?php

namespace App\Dto;

readonly class RecolhaDto {
    public function __construct(
        public ?int $id,
        public int $parcela_id,
        public string $data,
        public float $quantidade,
        public string $produto,
        public ?string $observacoes = null
    ) {}
}
