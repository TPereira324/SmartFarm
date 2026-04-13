<?php

namespace App\Controller;

use App\Dto\TarefaDto;
use App\Service\TarefaService;
use Exception;

class TarefaController extends Controller {
    private TarefaService $tarefaService;

    public function __construct() {
        $this->tarefaService = new TarefaService();
    }

    /**
     * Adicionar nova tarefa via POST
     */
    public function adicionar(): void {
        try {
            $tarefaDto = TarefaDto::fromArray($_POST);
            $resultado = $this->tarefaService->adicionarTarefa($tarefaDto);

            $this->json([
                'status' => 'sucesso',
                'mensagem' => 'Tarefa agendada!',
                'dados' => $resultado
            ], 201);
        } catch (Exception $e) {
            $this->erro($e->getMessage());
        }
    }

    /**
     * Alternar estado (concluída/pendente) via POST/PATCH
     */
    public function alternarEstado(int $id): void {
        try {
            $concluida = (bool)($_POST['concluida'] ?? false);
            $sucesso = $this->tarefaService->alternarEstado($id, $concluida);

            if ($sucesso) {
                $this->json([
                    'status' => 'sucesso',
                    'mensagem' => 'Estado da tarefa atualizado!'
                ]);
            } else {
                throw new Exception("Não foi possível atualizar a tarefa.");
            }
        } catch (Exception $e) {
            $this->erro($e->getMessage());
        }
    }

    /**
     * Listar tarefas do utilizador via GET
     */
    public function listar(int $usuario_id): void {
        try {
            $tarefas = $this->tarefaService->listarTarefasDoUsuario($usuario_id);
            $this->json([
                'status' => 'sucesso',
                'dados' => $tarefas
            ]);
        } catch (Exception $e) {
            $this->erro($e->getMessage());
        }
    }
}
