<?php

class View {
    public function render($data) {
        header('Content-Type: application/json');
        echo json_encode([
            "title" => "Back-end MVC em PHP",
            "message" => "Sucesso ao carregar o conteúdo",
            "data" => $data
        ]);
    }
}
