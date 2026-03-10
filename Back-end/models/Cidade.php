<?php
require_once 'Model.php';

class Cidade extends Model {
    protected $table = 'cidade';

    public function getAll() {
        $stmt = $this->db->prepare("SELECT * FROM " . $this->table);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>