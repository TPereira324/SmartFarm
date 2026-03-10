<?php
require_once 'config/Database.php';

class Model {
    protected $db;

    public function __construct() {
        $db = new Database();
        $this->db = $db->getConnection();
        if (!$this->db) {
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode([
                'error' => 'Could not connect to database.',
                'details' => $db->getLastErrors(),
                'advice' => 'Certifique-se que o MySQL no MAMP PRO está ligado e o banco "cocoroot" existe.'
            ]);
            exit;
        }
    }
}
