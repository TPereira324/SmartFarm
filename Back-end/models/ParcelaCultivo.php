<?php
require_once 'Model.php';

class ParcelaCultivo extends Model {
    protected $table = 'parcela_cultivo';

    public function getAll() {
        $stmt = $this->db->prepare("SELECT * FROM " . $this->table);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>