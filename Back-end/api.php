<?php
session_start();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relative = substr($class, strlen($prefix));
    $path = __DIR__ . '/' . str_replace('\\', '/', $relative) . '.php';
    if (file_exists($path)) {
        require_once $path;
    }
});

$jsonResponse = static function (array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit();
};

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$path = trim((string)($_GET['route'] ?? ($_SERVER['PATH_INFO'] ?? '')), '/');

if ($path === '') {
    $requestUriPath = trim((string)parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
    $apiMarker = 'api.php/';
    $apiPos = strpos($requestUriPath, $apiMarker);
    if ($apiPos !== false) {
        $path = trim(substr($requestUriPath, $apiPos + strlen($apiMarker)), '/');
    }
}

if ($path === '') {
    $jsonResponse([
        'success' => true,
        'message' => 'API online',
    ]);
}

$segments = array_values(array_filter(explode('/', $path), static fn($segment) => $segment !== ''));
$resource = $segments[0] ?? '';
$action = $segments[1] ?? '';
$id = isset($segments[2]) ? (int)$segments[2] : null;

$routes = [
    'usuarios' => [
        'controller' => \App\Controller\UsuarioController::class,
        'actions' => [
            'login' => ['method' => 'POST', 'handler' => 'login'],
            'registar' => ['method' => 'POST', 'handler' => 'registar'],
            'registrar' => ['method' => 'POST', 'handler' => 'registar'],
            'perfil' => ['method' => 'GET', 'handler' => 'perfil', 'needs_id' => true],
        ],
    ],
    'parcelas' => [
        'controller' => \App\Controller\ParcelaController::class,
        'actions' => [
            'listar' => ['method' => 'GET', 'handler' => 'listar', 'needs_id' => true],
            'adicionar' => ['method' => 'POST', 'handler' => 'adicionar'],
        ],
    ],
    'tarefas' => [
        'controller' => \App\Controller\TarefaController::class,
        'actions' => [
            'listar' => ['method' => 'GET', 'handler' => 'listar', 'needs_id' => true],
        ],
    ],
    'alertas' => [
        'controller' => \App\Controller\AlertaController::class,
        'actions' => [
            'listar' => ['method' => 'GET', 'handler' => 'listar', 'needs_id' => true],
        ],
    ],
    'forum' => [
        'controller' => \App\Controller\ForumController::class,
        'actions' => [
            'listar' => ['method' => 'GET', 'handler' => 'listar'],
            'publicar' => ['method' => 'POST', 'handler' => 'publicar'],
            'detalhe' => ['method' => 'GET', 'handler' => 'detalhe', 'needs_id' => true],
            'comentarios' => ['method' => 'GET', 'handler' => 'comentarios', 'needs_id' => true],
            'comentar' => ['method' => 'POST', 'handler' => 'comentar', 'needs_id' => true],
        ],
    ],
    'clima' => [
        'controller' => \App\Controller\PrevisaoTempoController::class,
        'actions' => [
            '__default__' => ['method' => 'GET', 'handler' => 'consultar'],
        ],
    ],
];

$resourceConfig = $routes[$resource] ?? null;
if (!$resourceConfig) {
    $jsonResponse(['success' => false, 'message' => 'Endpoint não encontrado.'], 404);
}

$actionKey = $action !== '' ? $action : '__default__';
$route = $resourceConfig['actions'][$actionKey] ?? null;
if (!$route) {
    $jsonResponse(['success' => false, 'message' => 'Endpoint não encontrado.'], 404);
}

if (($route['method'] ?? '') !== $method) {
    $jsonResponse(['success' => false, 'message' => 'Método inválido.'], 405);
}

$controllerClass = $resourceConfig['controller'];
$controller = new $controllerClass();
$handler = $route['handler'];
$needsId = (bool)($route['needs_id'] ?? false);

if ($needsId) {
    if ($id === null || $id <= 0) {
        $jsonResponse(['success' => false, 'message' => 'Identificador inválido.'], 400);
    }
    $controller->$handler($id);
    exit();
}

$controller->$handler();
