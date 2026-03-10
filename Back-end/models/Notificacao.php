<?php
require_once 'Model.php';

class Notificacao extends Model {
    protected $table = 'notificacao';

    public function getAll() {
        $stmt = $this->db->prepare("SELECT * FROM " . $this->table);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>