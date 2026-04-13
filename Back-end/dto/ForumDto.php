<?php

namespace App\Dto;

readonly class ForumDto {
    /**
     * @param int|null $id
     * @param int $usuario_id
     * @param string $titulo
     * @param string $conteudo
     * @param string $categoria
     * @param string|null $data_criacao
     */
    public function __construct(
        public ?int $id,
        public int $usuario_id,
        public string $titulo,
        public string $conteudo,
        public string $categoria,
        public ?string $data_criacao
    ) {}

    public static function fromArray(array $dados): self {
        return new self(
            id: $dados['id'] ?? null,
            usuario_id: (int)($dados['usuario_id'] ?? 0),
            titulo: $dados['titulo'] ?? '',
            conteudo: $dados['conteudo'] ?? '',
            categoria: $dados['categoria'] ?? 'geral',
            data_criacao: $dados['data_criacao'] ?? null
        );
    }
}
