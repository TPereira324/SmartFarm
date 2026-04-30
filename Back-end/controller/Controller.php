<?php

namespace App\Controller;

abstract class Controller {
    protected function json(mixed $dados, int $status = 200): void {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($status);
        echo json_encode($dados, JSON_UNESCAPED_UNICODE);
        exit;
    }

    protected function success(mixed $data = null, ?string $message = null, int $status = 200, array $extra = []): void {
        $payload = ['success' => true];
        if ($message !== null) {
            $payload['message'] = $message;
        }
        if ($data !== null) {
            $payload['data'] = $data;
        }
        $this->json(array_merge($payload, $extra), $status);
    }

    protected function erro(string $mensagem, int $status = 400, array $extra = []): void {
        $this->json([
            'success' => false,
            'message' => $mensagem,
            ...$extra,
        ], $status);
    }

    protected function input(): array {
        $rawBody = file_get_contents('php://input');
        $jsonBody = json_decode($rawBody ?: '', true);
        $body = is_array($jsonBody) ? $jsonBody : [];
        if (!empty($_POST)) {
            $body = array_merge($body, $_POST);
        }
        return $body;
    }
}
