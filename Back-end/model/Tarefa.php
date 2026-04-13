<?php

namespace App\Model;

class Tarefa {
    /**
     * @param int|null $id
     * @param int $usuario_id
     * @param int|null $parcela_id
     * @param string $titulo
     * @param string $descricao
     * @param string $data_limite
     * @param bool $concluida
     * @param string $prioridade (baixa, media, alta)
     */
    public function __construct(
        public ?int $id = null,
        public int $usuario_id,
        public ?int $parcela_id = null,
        public string $titulo,
        public string $descricao,
        public string $data_limite,
        public bool $concluida = false,
        public string $prioridade = 'media'
    ) {}
}
