<?php

require_once 'models/Model.php';
require_once 'views/View.php';
require_once 'controllers/Controller.php';

$model = new Model();
$view = new View();
$controller = new Controller($model, $view);

$controller->handleRequest();
