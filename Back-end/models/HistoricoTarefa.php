<?php
require_once 'Model.php';

class HistoricoTarefa extends Model {
    protected $table = 'historico_tarefa';

    public function getAll() {
        $stmt = $this->db->prepare("SELECT * FROM " . $this->table);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>