<?php

class Alerta extends Model {
    public function getAll() {
        $query = "SELECT alt_id, alt_tipo, alt_mensagem, alt_data, alt_par_id FROM alerta";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT alt_id, alt_tipo, alt_mensagem, alt_data, alt_par_id FROM alerta WHERE alt_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $query = "INSERT INTO alerta (alt_tipo, alt_mensagem, alt_par_id) VALUES (?, ?, ?)";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$data['alt_tipo'], $data['alt_mensagem'], $data['alt_par_id']]);
    }

    public function update($id, $data) {
        $query = "UPDATE alerta SET alt_tipo = ?, alt_mensagem = ?, alt_par_id = ? WHERE alt_id = ?";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$data['alt_tipo'], $data['alt_mensagem'], $data['alt_par_id'], $id]);
    }

    public function delete($id) {
        $query = "DELETE FROM alerta WHERE alt_id = ?";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$id]);
    }
}
?>