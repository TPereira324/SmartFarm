<?php

class Monitorizacao extends Model {
    public function getAll() {
        $query = "SELECT mon_id, mon_par_id, mon_humidade, mon_temperatura, mon_ph, mon_data FROM monitorizacao";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT mon_id, mon_par_id, mon_humidade, mon_temperatura, mon_ph, mon_data FROM monitorizacao WHERE mon_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $query = "INSERT INTO monitorizacao (mon_par_id, mon_humidade, mon_temperatura, mon_ph) VALUES (?, ?, ?, ?)";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$data['mon_par_id'], $data['mon_humidade'], $data['mon_temperatura'], $data['mon_ph']]);
    }

    public function update($id, $data) {
        $query = "UPDATE monitorizacao SET mon_par_id = ?, mon_humidade = ?, mon_temperatura = ?, mon_ph = ? WHERE mon_id = ?";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$data['mon_par_id'], $data['mon_humidade'], $data['mon_temperatura'], $data['mon_ph'], $id]);
    }

    public function delete($id) {
        $query = "DELETE FROM monitorizacao WHERE mon_id = ?";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$id]);
    }
}
?>