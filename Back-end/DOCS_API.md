# Documentação da API REST - CocoRoot

> **Base URL:** `/api/`
> Todas as respostas são em JSON.

---

## Estrutura de Resposta Padrão

**Sucesso:**
```json
{
  "status": "sucesso",
  "mensagem": "Descrição opcional",
  "dados": { }
}
```
**Erro:**
```json
{
  "status": "erro",
  "mensagem": "Motivo do erro"
}
```

---


| Recurso      | Método | Endpoint                                 | Descrição                              |
|--------------|--------|------------------------------------------|----------------------------------------|
| Utilizadores | POST   | /api/usuarios/registar                   | Registar novo utilizador               |
| Utilizadores | POST   | /api/usuarios/login                      | Login de utilizador                    |
| Utilizadores | GET    | /api/usuarios/perfil/{id}                | Obter perfil do utilizador             |
| Parcelas     | POST   | /api/parcelas/adicionar                  | Adicionar nova parcela                 |
| Parcelas     | GET    | /api/parcelas/listar/{usuario_id}        | Listar parcelas do utilizador          |
| Tarefas      | POST   | /api/tarefas/adicionar                   | Adicionar nova tarefa                  |
| Tarefas      | POST   | /api/tarefas/alternar/{id}               | Alternar estado da tarefa              |
| Tarefas      | GET    | /api/tarefas/listar/{usuario_id}         | Listar tarefas do utilizador           |
| Fórum        | POST   | /api/forum/publicar                      | Publicar novo tópico                   |
| Fórum        | GET    | /api/forum/listar                        | Listar todos os tópicos                |
| Clima        | GET    | /api/clima?cidade={nome}                 | Consultar clima atual                  |
| Rega         | POST   | /api/rega/registrar                      | Registrar evento de rega na parcela    |
| Rega         | GET    | /api/rega/listar/{parcela_id}            | Listar eventos de rega da parcela      |
| Rega         | GET    | /api/rega/sugerir                        | Sugerir quantidade de rega             |
| Recolha      | POST   | /api/recolha/registrar                   | Registrar evento de recolha na parcela |
| Recolha      | GET    | /api/recolha/listar/{parcela_id}         | Listar eventos de recolha da parcela   |
# 6. Rega

### Registrar evento de rega
**POST** `/api/rega/registrar`

**Body JSON:**
```json
{
  "parcela_id": 10,
  "data": "2026-04-15",
  "quantidade_litros": 120.5,
  "observacoes": "Rega manual"
}
```
**Resposta:**
```json
{
  "status": "sucesso",
  "mensagem": "Rega registrada!"
}
```

### Listar eventos de rega da parcela
**GET** `/api/rega/listar/{parcela_id}`

**Exemplo:** `/api/rega/listar/10`

**Resposta:**
```json
{
  "status": "sucesso",
  "dados": [
    {
      "id": 1,
      "parcela_id": 10,
      "data": "2026-04-15",
      "quantidade_litros": 120.5,
      "observacoes": "Rega manual"
    }
  ]
}
```

### Sugerir quantidade de rega
**GET** `/api/rega/sugerir?area_m2=1000&tipo_cultura=milho&climaFator=1.2`

**Resposta:**
```json
{
  "status": "sucesso",
  "quantidade_sugerida": 7200
}
```

# 7. Recolha

### Registrar evento de recolha
**POST** `/api/recolha/registrar`

**Body JSON:**
```json
{
  "parcela_id": 10,
  "data": "2026-04-15",
  "quantidade": 50.0,
  "produto": "Milho",
  "observacoes": "Colheita parcial"
}
```
**Resposta:**
```json
{
  "status": "sucesso",
  "mensagem": "Recolha registrada!"
}
```

### Listar eventos de recolha da parcela
**GET** `/api/recolha/listar/{parcela_id}`

**Exemplo:** `/api/recolha/listar/10`

**Resposta:**
```json
{
  "status": "sucesso",
  "dados": [
    {
      "id": 1,
      "parcela_id": 10,
      "data": "2026-04-15",
      "quantidade": 50.0,
      "produto": "Milho",
      "observacoes": "Colheita parcial"
    }
  ]
}
```

---

## 1. Utilizadores

### Registar Conta
**POST** `/api/usuarios/registar`

**Body JSON:**
```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "123456"
}
```
**Resposta:**
```json
{
  "status": "sucesso",
  "mensagem": "Conta criada com sucesso!",
  "dados": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@email.com"
  }
}
```

### Login
**POST** `/api/usuarios/login`

**Body JSON:**
```json
{
  "email": "joao@email.com",
  "senha": "123456"
}
```
**Resposta:**
```json
{
  "status": "sucesso",
  "mensagem": "Login realizado!",
  "dados": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@email.com"
  }
}
```

### Obter Perfil
**GET** `/api/usuarios/perfil/{id}`

**Exemplo:** `/api/usuarios/perfil/1`

**Resposta:**
```json
{
  "status": "sucesso",
  "dados": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@email.com"
  }
}
```

---

## 2. Parcelas

### Adicionar Parcela
**POST** `/api/parcelas/adicionar`

**Body JSON:**
```json
{
  "nome": "Parcela 1",
  "localizacao": "Fazenda Central",
  "tamanho": 2.5,
  "cultura": "Milho",
  "usuario_id": 1
}
```
**Resposta:**
```json
{
  "status": "sucesso",
  "mensagem": "Parcela adicionada!",
  "dados": {
    "id": 10,
    "nome": "Parcela 1"
  }
}
```

### Listar Parcelas do Utilizador
**GET** `/api/parcelas/listar/{usuario_id}`

**Exemplo:** `/api/parcelas/listar/1`

**Resposta:**
```json
{
  "status": "sucesso",
  "dados": [
    {
      "id": 10,
      "nome": "Parcela 1",
      "localizacao": "Fazenda Central",
      "tamanho": 2.5,
      "cultura": "Milho"
    }
  ]
}
```

---

## 3. Tarefas

### Adicionar Tarefa
**POST** `/api/tarefas/adicionar`

**Body JSON:**
```json
{
  "titulo": "Adubar solo",
  "descricao": "Aplicar adubo na parcela 1",
  "data": "2026-04-13",
  "concluida": false,
  "usuario_id": 1
}
```
**Resposta:**
```json
{
  "status": "sucesso",
  "mensagem": "Tarefa agendada!",
  "dados": {
    "id": 5,
    "titulo": "Adubar solo"
  }
}
```

### Alternar Estado da Tarefa
**POST** `/api/tarefas/alternar/{id}`

**Exemplo:** `/api/tarefas/alternar/5`

**Body JSON:**
```json
{
  "concluida": true
}
```
**Resposta:**
```json
{
  "status": "sucesso",
  "mensagem": "Estado da tarefa atualizado!"
}
```

### Listar Tarefas do Utilizador
**GET** `/api/tarefas/listar/{usuario_id}`

**Exemplo:** `/api/tarefas/listar/1`

**Resposta:**
```json
{
  "status": "sucesso",
  "dados": [
    {
      "id": 5,
      "titulo": "Adubar solo",
      "descricao": "Aplicar adubo na parcela 1",
      "data": "2026-04-13",
      "concluida": false
    }
  ]
}
```

---

## 4. Fórum

### Publicar Tópico
**POST** `/api/forum/publicar`

**Body JSON:**
```json
{
  "titulo": "Dúvida sobre irrigação",
  "conteudo": "Qual o melhor horário para irrigar?",
  "usuario_id": 1
}
```
**Resposta:**
```json
{
  "status": "sucesso",
  "mensagem": "Tópico publicado!",
  "dados": {
    "id": 3,
    "titulo": "Dúvida sobre irrigação"
  }
}
```

### Listar Todos os Tópicos
**GET** `/api/forum/listar`

**Resposta:**
```json
{
  "status": "sucesso",
  "dados": [
    {
      "id": 3,
      "titulo": "Dúvida sobre irrigação",
      "conteudo": "Qual o melhor horário para irrigar?",
      "usuario_id": 1
    }
  ]
}
```

---

## 5. Meteorologia

### Consultar Clima Atual
**GET** `/api/clima?cidade={nome}`

**Exemplo:** `/api/clima?cidade=Lisboa`

**Resposta:**
```json
{
  "status": "sucesso",
  "mensagem": "Meteorologia para Lisboa obtida com sucesso!",
  "dados": {
    "cidade": "Lisboa",
    "temperatura": 18.5,
    "humidade": 72,
    "descricao": "céu limpo",
    "sensacao_termica": 18.2,
    "temp_min": 17.0,
    "temp_max": 20.0,
    "icon": "01d"
  }
}
```
