<?php

namespace App\Service;

use App\Dto\PrevisaoTempoDto;
use Exception;

class PrevisaoTempoService {
    /**
     * @var string A chave da API fornecida pelo utilizador
     */
    private string $apiKey = "5450371b79d80c85c2f3cd8735550a7f";
    
    /**
     * @var string URL base para a API do OpenWeather
     */
    private string $baseUrl = "https://api.openweathermap.org/data/2.5/weather";

    /**
    
     * @param string $cidade Nome da cidade (ex: "Lisboa", "Luanda")
     * @return PrevisaoTempoDto
     * @throws Exception
     */
    public function consultarClima(string $cidade): PrevisaoTempoDto {
        if (empty($cidade)) {
            throw new Exception("O nome da cidade é obrigatório.");
        }

       
        $url = "{$this->baseUrl}?q=" . urlencode($cidade) . "&appid={$this->apiKey}&units=metric&lang=pt_br";

        
        $resposta = @file_get_contents($url);

        if ($resposta === false) {
            $error = error_get_last();
            throw new Exception("Erro ao conectar com o serviço de meteorologia. Verifique a cidade ou tente mais tarde.");
        }

        
        $dados = json_decode($resposta, true);

        if (!$dados || (isset($dados['cod']) && $dados['cod'] != 200)) {
            $mensagem = $dados['message'] ?? "Erro desconhecido ao consultar o clima.";
            throw new Exception("Erro da API: " . $mensagem);
        }

       
        return PrevisaoTempoDto::fromApiResponse($dados);
    }
}
