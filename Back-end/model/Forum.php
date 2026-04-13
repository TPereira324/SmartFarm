<?php

namespace App\Model;

class Forum {
    /**
     * @param int|null $id
     * @param int $usuario_id
     * @param string $titulo
     * @param string $conteudo
     * @param string $categoria (ajuda, dicas, mercado, geral)
     * @param string|null $data_criacao
     */
    public function __construct(
        public ?int $id = null,
        public int $usuario_id,
        public string $titulo,
        public string $conteudo,
        public string $categoria = 'geral',
        public ?string $data_criacao = null
    ) {}
}
