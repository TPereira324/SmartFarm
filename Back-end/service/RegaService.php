<?php

namespace App\Service;

class RegaService {
    public function calcularQuantidade(float $area_m2, string $tipo_cultura, float $climaFator = 1.0): float {
        $base = 5.0;
        if ($tipo_cultura === 'arroz') $base = 7.0;
        if ($tipo_cultura === 'milho') $base = 6.0;
        return $area_m2 * $base * $climaFator;
    }
}
