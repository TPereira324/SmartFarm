<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Carregamento dos ficheiros base do sistema
require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/models/Model.php';
require_once __DIR__ . '/views/View.php';
require_once __DIR__ . '/controllers/Controller.php';

// Roteamento para o endpoint unificado
/**
 * Ponto de Entrada da API (Roteador Principal)
 *
 * Este script analisa a URL, carrega o Controller correspondente e executa a ação.
 * Exemplo de URL: /Back-end/CocoRoot/utilizador/1
 * - "utilizador" é a entidade (o Controller)
 * - "1" é o ID (opcional)
 */

// 1. Análise da URL
$base_path = str_replace('index.php', '', $_SERVER['SCRIPT_NAME']);
$request = str_replace($base_path, '', $_SERVER['REQUEST_URI']);
$request = trim(parse_url($request, PHP_URL_PATH), "/");
$parts = explode("/", $request);

// Se o primeiro segmento for "CocoRoot", removemos para encontrar o recurso real
if (isset($parts[0]) && strtolower($parts[0]) === 'cocoroot') {
    array_shift($parts);
}

// O primeiro segmento da URL é o nome do recurso (ex: "utilizador")
$resource = strtolower($parts[0] ?? 'all'); // MUDANÇA: 'all' é agora o padrão
$id = $parts[1] ?? null;

// Caso especial: Pedir tudo de uma vez
if ($resource === 'all') {
    require_once 'views/View.php';
    $view = new View();
    $data = [];
    
    // Lista de entidades reais no banco
    $entities = ['utilizador', 'parcela', 'cultivo', 'monitorizacao', 'tarefa', 'alerta'];
    
    foreach ($entities as $ent) {
        $modelName = ucfirst($ent);
        $modelFile = __DIR__ . '/models/' . $modelName . '.php';
        if (file_exists($modelFile)) {
            require_once $modelFile;
            $modelInstance = new $modelName();
            $data[$ent] = $modelInstance->getAll();
        }
    }
    
    $view->render($data);
    exit;
}

// 2. Carregamento Dinâmico do Controller (Para casos individuais como /utilizador)
$controllerName = ucfirst($resource) . 'Controller';
$controllerFile = __DIR__ . '/controllers/' . $controllerName . '.php';

if (!file_exists($controllerFile)) {
    http_response_code(404);
    echo json_encode(['error' => "Recurso '$resource' não encontrado."]);
    exit;
}

require_once $controllerFile;

// 3. Instanciação e Execução da Ação
$modelName = ucfirst($resource);
$modelFile = __DIR__ . '/models/' . $modelName . '.php';
if (file_exists($modelFile)) {
    require_once $modelFile;
}

$view = new View();
$model = class_exists($modelName) ? new $modelName() : null;
$controller = new $controllerName($model, $view);

$method = $_SERVER['REQUEST_METHOD'];
$action = '';

// Mapeia o método HTTP para a ação no controller (padrão RESTful)
switch ($method) {
    case 'GET':
        $action = $id ? 'show' : 'index';
        break;
    case 'POST':
        $action = 'store';
        break;
    case 'PUT':
    case 'PATCH':
        $action = 'update';
        break;
    case 'DELETE':
        $action = 'destroy';
        break;
    default:
        http_response_code(405); // Método não permitido
        echo json_encode(['error' => "Método '$method' não suportado."]);
        exit;
}

// Verifica se a ação existe no controller antes de chamar
if (!method_exists($controller, $action)) {
    http_response_code(501); // Não implementado
    echo json_encode(['error' => "Ação '$action' não implementada no controller '$controllerName'."]);
    exit;
}

// Executa a ação, passando o ID se necessário
$controller->$action($id);

?>