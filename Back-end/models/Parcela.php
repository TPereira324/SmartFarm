<?php

class Parcela extends Model {
    public function getAll() {
        $query = "SELECT par_id, par_nome, par_area, par_estado, par_ut_id FROM parcela";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT par_id, par_nome, par_area, par_estado, par_ut_id FROM parcela WHERE par_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $query = "INSERT INTO parcela (par_nome, par_area, par_estado, par_ut_id) VALUES (?, ?, ?, ?)";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$data['par_nome'], $data['par_area'], $data['par_estado'], $data['par_ut_id']]);
    }

    public function update($id, $data) {
        $query = "UPDATE parcela SET par_nome = ?, par_area = ?, par_estado = ?, par_ut_id = ? WHERE par_id = ?";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$data['par_nome'], $data['par_area'], $data['par_estado'], $data['par_ut_id'], $id]);
    }

    public function delete($id) {
        $query = "DELETE FROM parcela WHERE par_id = ?";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$id]);
    }
}
?>