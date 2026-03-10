
<?php
require_once 'models/Sensor.php';

class SensorController extends Controller {
    public function index() {
        $data = $this->model->getAll();
        $this->view->render($data);
    }

    public function show($id) {
        $data = $this->model->getById($id);
        if ($data) {
            $this->view->render($data);
        } else {
            $this->showError('Sensor not found');
        }
    }

    public function store() {
        $data = json_decode(file_get_contents('php://input'), true);
        if ($this->model->create($data)) {
            $this->view->render(['message' => 'Sensor created successfully']);
        } else {
            $this->showError('Failed to create sensor');
        }
    }

    public function update($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        if ($this->model->update($id, $data)) {
            $this->view->render(['message' => 'Sensor updated successfully']);
        } else {
            $this->showError('Failed to update sensor');
        }
    }

    public function destroy($id) {
        if ($this->model->delete($id)) {
            $this->view->render(['message' => 'Sensor deleted successfully']);
        } else {
            $this->showError('Failed to delete sensor');
        }
    }

    private function showError($message) {
        $this->view->render(['error' => $message]);
    }
}
?>