<?php

namespace App\Model;

class Usuario {
    /**
     * @param int|null $id
     * @param string $nome
     * @param string $email
     * @param string|null $senha
     * @param string|null $foto_perfil
     * @param string $nivel_experiencia (iniciante, intermediario, experiente)
     * @param string|null $data_registo
     */
    public function __construct(
        public ?int $id = null,
        public string $nome,
        public string $email,
        public ?string $senha = null,
        public ?string $foto_perfil = null,
        public string $nivel_experiencia = 'iniciante',
        public ?string $data_registo = null
    ) {}
}
