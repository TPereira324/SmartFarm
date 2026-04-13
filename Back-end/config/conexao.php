<?php

namespace App\Config;

use PDO;
use PDOException;

class Conexao {
    private static ?PDO $instancia = null;

    public static function getConexao(): PDO {
        if (self::$instancia === null) {
            $host = "localhost";
            $db   = "coco_db";
            $user = "root";
            $pass = "root";
            $charset = 'utf8mb4';

            $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                self::$instancia = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                throw new PDOException($e->getMessage(), (int)$e->getCode());
            }
        }

        return self::$instancia;
    }
}
