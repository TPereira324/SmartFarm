<?php

namespace App\Dto;

readonly class TarefaDto {
    /**
     * @param int|null $id
     * @param int $usuario_id
     * @param int|null $parcela_id
     * @param string $titulo
     * @param string $descricao
     * @param string $data_limite
     * @param bool $concluida
     * @param string $prioridade
     */
    public function __construct(
        public ?int $id,
        public int $usuario_id,
        public ?int $parcela_id,
        public string $titulo,
        public string $descricao,
        public string $data_limite,
        public bool $concluida,
        public string $prioridade
    ) {}

    public static function fromArray(array $dados): self {
        return new self(
            id: $dados['id'] ?? null,
            usuario_id: (int)($dados['usuario_id'] ?? 0),
            parcela_id: isset($dados['parcela_id']) ? (int)$dados['parcela_id'] : null,
            titulo: $dados['titulo'] ?? '',
            descricao: $dados['descricao'] ?? '',
            data_limite: $dados['data_limite'] ?? '',
            concluida: (bool)($dados['concluida'] ?? false),
            prioridade: $dados['prioridade'] ?? 'media'
        );
    }
}
