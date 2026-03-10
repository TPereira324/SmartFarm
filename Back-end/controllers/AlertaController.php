<?php

require_once 'models/Alerta.php';

class AlertaController extends Controller {
    public function index() {
        $data = $this->model->getAll();
        $this->view->render($data);
    }

    public function show($id) {
        $data = $this->model->getById($id);
        $this->view->render($data);
    }

    public function store() {
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $this->model->create($data);
        $this->view->render(["success" => $result]);
    }

    public function update($id) {
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $this->model->update($id, $data);
        $this->view->render(["success" => $result]);
    }

    public function destroy($id) {
        $result = $this->model->delete($id);
        $this->view->render(["success" => $result]);
    }
}
?>