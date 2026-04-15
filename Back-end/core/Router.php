<?php

namespace App\Core;

class Router {
    private array $routes = [];

    public function add(string $method, string $path, string $handler): void {
        $path = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $path);
        $this->routes[] = [
            'method' => $method,
            'path' => "#^" . $path . "$#",
            'handler' => $handler
        ];
    }

    public function dispatch(): void {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        $uri = preg_replace('/^.*\/api/', '', $uri);
        if (empty($uri)) {
            $uri = '/';
        }

        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['path'], $uri, $matches)) {
                $handler = explode('@', $route['handler']);
                $controllerName = "App\\Controller\\" . $handler[0];
                $action = $handler[1];

                if (class_exists($controllerName)) {
                    $controller = new $controllerName();
                    $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                    call_user_func_array([$controller, $action], $params);
                    return;
                }
            }
        }

        header("Content-Type: application/json");
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Route not found: $method $uri"]);
    }
}
