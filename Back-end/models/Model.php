<?php

class Model {
    private $data;

    public function __construct() {
        $this->data = "Dados vindos do Back-end PHP";
    }

    public function getData() {
        return $this->data;
    }
}
