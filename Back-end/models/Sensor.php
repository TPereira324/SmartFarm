<?php
require_once 'Model.php';

class Sensor extends Model {
    protected $table = 'sensores';

    public function getAll() {
        $stmt = $this->db->prepare("SELECT * FROM " . $this->table);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM " . $this->table . " WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $stmt = $this->db->prepare("INSERT INTO " . $this->table . " (tipo, valor, data_hora, id_parcela) VALUES (:tipo, :valor, :data_hora, :id_parcela)");
        $stmt->bindParam(':tipo', $data['tipo']);
        $stmt->bindParam(':valor', $data['valor']);
        $stmt->bindParam(':data_hora', $data['data_hora']);
        $stmt->bindParam(':id_parcela', $data['id_parcela'], PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function update($id, $data) {
        $stmt = $this->db->prepare("UPDATE " . $this->table . " SET tipo = :tipo, valor = :valor, data_hora = :data_hora, id_parcela = :id_parcela WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->bindParam(':tipo', $data['tipo']);
        $stmt->bindParam(':valor', $data['valor']);
        $stmt->bindParam(':data_hora', $data['data_hora']);
        $stmt->bindParam(':id_parcela', $data['id_parcela'], PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM " . $this->table . " WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
?>