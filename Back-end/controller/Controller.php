<?php

namespace App\Controller;

abstract class Controller {
    /**
     * Devolve uma resposta JSON formatada
     */
    protected function json(mixed $dados, int $status = 200): void {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($status);
        echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * Devolve uma resposta de erro JSON
     */
    protected function erro(string $mensagem, int $status = 400): void {
        $this->json([
            'status' => 'erro',
            'mensagem' => $mensagem
        ], $status);
    }

    /**
     * Renderiza uma view PHP
     */
    protected function view(string $nome, array $dados = []): void {
        extract($dados);
        $ficheiro = __DIR__ . '/../views/' . $nome . '.php';
        if (file_exists($ficheiro)) {
            require $ficheiro;
        } else {
            die("Erro: View [$nome] não encontrada.");
        }
    }
}
