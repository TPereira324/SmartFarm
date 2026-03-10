<?php

class View {
    public function render($data) {
        header('Content-Type: application/json');
        echo json_encode($data);
    }
}
