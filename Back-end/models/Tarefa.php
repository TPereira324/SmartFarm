<?php

class Tarefa extends Model {
    public function getAll() {
        $query = "SELECT tar_id, tar_titulo, tar_descricao, tar_data_inicio, tar_data_fim, tar_estado, tar_prioridade, tar_par_id, tar_ut_id FROM tarefa";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT tar_id, tar_titulo, tar_descricao, tar_data_inicio, tar_data_fim, tar_estado, tar_prioridade, tar_par_id, tar_ut_id FROM tarefa WHERE tar_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $query = "INSERT INTO tarefa (tar_titulo, tar_descricao, tar_data_inicio, tar_data_fim, tar_estado, tar_prioridade, tar_par_id, tar_ut_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$data['tar_titulo'], $data['tar_descricao'], $data['tar_data_inicio'], $data['tar_data_fim'], $data['tar_estado'], $data['tar_prioridade'], $data['tar_par_id'], $data['tar_ut_id']]);
    }

    public function update($id, $data) {
        $query = "UPDATE tarefa SET tar_titulo = ?, tar_descricao = ?, tar_data_inicio = ?, tar_data_fim = ?, tar_estado = ?, tar_prioridade = ?, tar_par_id = ?, tar_ut_id = ? WHERE tar_id = ?";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$data['tar_titulo'], $data['tar_descricao'], $data['tar_data_inicio'], $data['tar_data_fim'], $data['tar_estado'], $data['tar_prioridade'], $data['tar_par_id'], $data['tar_ut_id'], $id]);
    }

    public function delete($id) {
        $query = "DELETE FROM tarefa WHERE tar_id = ?";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$id]);
    }
}
?>