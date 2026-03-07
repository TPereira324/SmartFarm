<?php

class Controller {
    private $model;
    private $view;

    public function __construct($model, $view) {
        $this->model = $model;
        $this->view = $view;
    }

    public function handleRequest() {
        $data = $this->model->getData();
        $this->view->render($data);
    }
}
