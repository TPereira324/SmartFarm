<?php

namespace App\Service;

use App\Dto\TarefaDto;
use App\Model\Tarefa;
use App\Repository\TarefaRepository;
use Exception;

class TarefaService {
    private TarefaRepository $tarefaRepository;

    public function __construct() {
        $this->tarefaRepository = new TarefaRepository();
    }

    /**
     * Adiciona uma nova tarefa
     */
    public function adicionarTarefa(TarefaDto $tarefaDto): TarefaDto {
        $tarefa = new Tarefa(
            usuario_id: $tarefaDto->usuario_id,
            parcela_id: $tarefaDto->parcela_id,
            titulo: $tarefaDto->titulo,
            descricao: $tarefaDto->descricao,
            data_limite: $tarefaDto->data_limite,
            concluida: $tarefaDto->concluida,
            prioridade: $tarefaDto->prioridade
        );

        if (!$this->tarefaRepository->salvar($tarefa)) {
            throw new Exception("Erro ao guardar tarefa.");
        }

        return TarefaDto::fromArray([
            'id' => $tarefa->id,
            'usuario_id' => $tarefa->usuario_id,
            'parcela_id' => $tarefa->parcela_id,
            'titulo' => $tarefa->titulo,
            'descricao' => $tarefa->descricao,
            'data_limite' => $tarefa->data_limite,
            'concluida' => $tarefa->concluida,
            'prioridade' => $tarefa->prioridade
        ]);
    }

    /**
     * Marca uma tarefa como concluída ou pendente
     */
    public function alternarEstado(int $id, bool $concluida): bool {
        $tarefa = $this->tarefaRepository->buscarPorId($id);
        
        if (!$tarefa) {
            throw new Exception("Tarefa não encontrada.");
        }

        $tarefa->concluida = $concluida;
        return $this->tarefaRepository->salvar($tarefa);
    }

    /**
     * Lista todas as tarefas de um utilizador
     */
    public function listarTarefasDoUsuario(int $usuario_id): array {
        $tarefas = $this->tarefaRepository->listarPorUsuario($usuario_id);
        
        return array_map(fn($t) => TarefaDto::fromArray([
            'id' => $t->id,
            'usuario_id' => $t->usuario_id,
            'parcela_id' => $t->parcela_id,
            'titulo' => $t->titulo,
            'descricao' => $t->descricao,
            'data_limite' => $t->data_limite,
            'concluida' => $t->concluida,
            'prioridade' => $t->prioridade
        ]), $tarefas);
    }
}
