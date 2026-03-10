<?php
require_once 'Model.php';

class HistoricoParcela extends Model {
    protected $table = 'historico_parcela';

    public function getAll() {
        $stmt = $this->db->prepare("SELECT * FROM " . $this->table);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>