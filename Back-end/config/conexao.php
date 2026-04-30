<?php

namespace App\Config;

use PDO;
use PDOException;

class Conexao
{
    private static ?PDO $instancia = null;

    public static function getConexao(): PDO
    {
        if (self::$instancia === null) {
            $config = require dirname(__DIR__) . '/config/app.php';
            $dbConfig = $config['db'] ?? [];
            $host = (string)($dbConfig['host'] ?? '127.0.0.1');
            $db = (string)($dbConfig['name'] ?? 'coco_db');
            $user = (string)($dbConfig['user'] ?? 'root');
            $passwords = $dbConfig['password_candidates'] ?? [$dbConfig['password'] ?? ''];
            $ports = $dbConfig['ports'] ?? [3306];
            $charset = (string)($dbConfig['charset'] ?? 'utf8mb4');

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                $lastException = null;
                foreach ($passwords as $pass) {
                    foreach ($ports as $port) {
                        try {
                            $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
                            self::$instancia = new PDO($dsn, $user, $pass, $options);
                            $lastException = null;
                            break 2;
                        } catch (PDOException $e) {
                            $lastException = $e;
                        }
                    }
                }
                if ($lastException) {
                    throw $lastException;
                }
            } catch (PDOException $e) {
                throw new PDOException($e->getMessage(), (int)$e->getCode());
            }
        }

        return self::$instancia;
    }
}
