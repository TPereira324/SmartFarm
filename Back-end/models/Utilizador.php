<?php

class Utilizador extends Model {
    public function getAll() {
        $query = "SELECT ut_id, ut_nome, ut_email, ut_datareg FROM utilizador";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT ut_id, ut_nome, ut_email, ut_datareg FROM utilizador WHERE ut_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $query = "INSERT INTO utilizador (ut_nome, ut_email, ut_password) VALUES (?, ?, ?)";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$data['ut_nome'], $data['ut_email'], $data['ut_password']]);
    }

    public function update($id, $data) {
        $query = "UPDATE utilizador SET ut_nome = ?, ut_email = ?, ut_password = ? WHERE ut_id = ?";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$data['ut_nome'], $data['ut_email'], $data['ut_password'], $id]);
    }

    public function delete($id) {
        $query = "DELETE FROM utilizador WHERE ut_id = ?";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$id]);
    }
}
?>