<?php

$defaults = [
    'db' => [
        'host' => '127.0.0.1',
        'name' => 'coco_db',
        'user' => 'root',
        'password' => 'root',
        'password_candidates' => ['root', ''],
        'ports' => [3306, 8889],
        'charset' => 'utf8mb4',
    ],
];

$mergeConfig = static function (array $base, array $override) use (&$mergeConfig): array {
    foreach ($override as $key => $value) {
        if (is_array($value) && isset($base[$key]) && is_array($base[$key])) {
            $base[$key] = $mergeConfig($base[$key], $value);
            continue;
        }
        $base[$key] = $value;
    }
    return $base;
};

$config = $defaults;
$localConfigPath = dirname(__DIR__) . '/config.local.php';
if (file_exists($localConfigPath)) {
    $localConfig = require $localConfigPath;
    if (is_array($localConfig)) {
        $config = $mergeConfig($config, $localConfig);
    }
}

$envMap = [
    'MYSQL_HOST' => ['db', 'host'],
    'MYSQL_DB' => ['db', 'name'],
    'MYSQL_USER' => ['db', 'user'],
    'MYSQL_CHARSET' => ['db', 'charset'],
];

foreach ($envMap as $envName => [$section, $key]) {
    $value = getenv($envName);
    if ($value !== false && $value !== '') {
        $config[$section][$key] = $value;
    }
}

$envPass = getenv('MYSQL_PASS');
if ($envPass !== false) {
    $config['db']['password'] = $envPass;
    $config['db']['password_candidates'] = [$envPass];
}

$envPort = getenv('MYSQL_PORT');
if ($envPort !== false && $envPort !== '') {
    $config['db']['ports'] = [(int)$envPort];
}

$passwords = $config['db']['password_candidates'] ?? [];
if (!is_array($passwords)) {
    $passwords = [$passwords];
}
$primaryPassword = $config['db']['password'] ?? '';
array_unshift($passwords, $primaryPassword);
$config['db']['password_candidates'] = array_values(array_unique(array_map(
    static fn($value) => (string)$value,
    array_filter($passwords, static fn($value) => $value !== null)
)));

$ports = $config['db']['ports'] ?? [];
if (!is_array($ports)) {
    $ports = [$ports];
}
$config['db']['ports'] = array_values(array_unique(array_filter(array_map(
    static fn($value) => (int)$value,
    $ports
), static fn($value) => $value > 0)));

return $config;
