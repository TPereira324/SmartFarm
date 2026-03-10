<?php

class Database {
    private $db_name = "coco_db";
    private $conn;
    private $lastErrors = [];

    public function getConnection() {
        $this->conn = null;
        $this->lastErrors = [];

        // As credenciais mais comuns para MAMP e MAMP PRO.
        $credentials = [
            ['host' => 'localhost', 'port' => '3306', 'user' => 'root', 'pass' => 'root'],
            ['host' => '127.0.0.1', 'port' => '3306', 'user' => 'root', 'pass' => 'root'],
            ['host' => 'localhost', 'port' => '3306', 'user' => 'root', 'pass' => ''],
        ];

        foreach ($credentials as $cred) {
            try {
                $dsn = "mysql:host={$cred['host']};port={$cred['port']};dbname={$this->db_name};charset=utf8";
                $this->conn = new PDO($dsn, $cred['user'], $cred['pass'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_TIMEOUT => 2
                ]);
                return $this->conn; // Conexão bem-sucedida!
            } catch (PDOException $e) {
                $this->lastErrors[] = "Tentativa com {$cred['host']}:{$cred['port']} falhou: " . $e->getMessage();
                continue; // Tenta a próxima credencial.
            }
        }

        // Se todas as tentativas falharem.
        return null;
    }

    public function getLastErrors() {
        return $this->lastErrors ?? [];
    }


}
?>