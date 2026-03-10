<?php

class Cultivo extends Model {
    public function getAll() {
        $query = "SELECT cult_id, cult_nome, cult_descricao FROM cultivo";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT cult_id, cult_nome, cult_descricao FROM cultivo WHERE cult_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $query = "INSERT INTO cultivo (cult_nome, cult_descricao) VALUES (?, ?)";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$data['cult_nome'], $data['cult_descricao']]);
    }

    public function update($id, $data) {
        $query = "UPDATE cultivo SET cult_nome = ?, cult_descricao = ? WHERE cult_id = ?";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$data['cult_nome'], $data['cult_descricao'], $id]);
    }

    public function delete($id) {
        $query = "DELETE FROM cultivo WHERE cult_id = ?";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$id]);
    }
}
?>