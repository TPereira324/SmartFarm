<?php

spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    $parts = explode('\\', $relative_class);
    $fileName = array_pop($parts) . '.php';
    $path = strtolower(implode('/', $parts));

    $file = $base_dir . ($path ? $path . '/' : '') . $fileName;

    if (file_exists($file)) {
        require $file;
    }
});

use App\Core\Router;

$router = new Router();

$router->add('POST', '/usuarios/registar', 'UsuarioController@registar');
$router->add('POST', '/usuarios/login', 'UsuarioController@login');
$router->add('GET', '/usuarios/perfil/{id}', 'UsuarioController@perfil');

$router->add('POST', '/parcelas/adicionar', 'ParcelaController@adicionar');
$router->add('GET', '/parcelas/listar/{usuario_id}', 'ParcelaController@listar');

$router->add('POST', '/tarefas/adicionar', 'TarefaController@adicionar');
$router->add('POST', '/tarefas/alternar/{id}', 'TarefaController@alternarEstado');
$router->add('GET', '/tarefas/listar/{usuario_id}', 'TarefaController@listar');

$router->add('POST', '/forum/publicar', 'ForumController@publicar');
$router->add('GET', '/forum/listar', 'ForumController@listar');

$router->add('GET', '/clima', 'PrevisaoTempoController@consultar');

$router->add('POST', '/recolha/registrar', 'RecolhaController@registrar');
$router->add('GET', '/recolha/listar/{parcela_id}', 'RecolhaController@listar');

$router->add('POST', '/rega/registrar', 'RegaController@registrar');
$router->add('GET', '/rega/listar/{parcela_id}', 'RegaController@listar');
$router->add('GET', '/rega/sugerir', 'RegaController@sugerirQuantidade');

$router->dispatch();
