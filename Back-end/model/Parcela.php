<?php

namespace App\Model;

class Parcela {
    /**
     * @param int|null $id
     * @param int $usuario_id
     * @param string $nome
     * @param string $tipo_cultura
     * @param float $area_m2
     * @param string $data_plantio
     * @param string $status (ativo, colheita, repouso)
     */
    public function __construct(
        public ?int $id = null,
        public int $usuario_id,
        public string $nome,
        public string $tipo_cultura,
        public float $area_m2,
        public string $data_plantio,
        public string $status = 'ativo'
    ) {}
}
