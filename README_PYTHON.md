# FilaExpress - Sistema de Gestão de Filas e Painel de Senhas
### Implementado em Python 3, Flask e SQLite

Este projeto conta com um backend completo em **Python 3**, framework **Flask** e banco de dados relacional **SQLite (`fila.db`)**, integrado com a interface web em tempo real (Painel TV com síntese de voz, Totem de Autoatendimento, Console de Guichê e Métricas).

---

## 📁 Estrutura dos Arquivos Python e SQLite

- **`app.py`**: Aplicação principal Flask com todos os endpoints REST (emissão de senhas, algoritmo de prioridades Lei nº 10.048, chamadas, rechamadas, encerramento de atendimentos, métricas e exportação CSV).
- **`database.py`**: Módulo de conexão SQLite, transações, criação automática do banco e dados iniciais (seed).
- **`schema.sql`**: Esquema DDL do SQLite com tabelas relacionais (`categories`, `counters`, `tickets`, `calls`, `settings`) e índices de busca rápida.
- **`fila.db`**: Arquivo do banco de dados relacional SQLite local.
- **`requirements.txt`**: Dependências Python (`flask`, `flask-cors`).
- **`server.ts`**: Inicializador full-stack integrado que gerencia o processo Python e serve a interface na porta 3000.

---

## 🚀 Como Executar Apenas o Backend Python (Modo Standalone)

Caso deseje rodar exclusivamente o servidor Flask no seu terminal ou ambiente local:

```bash
# 1. Instalar as dependências Python
pip install -r requirements.txt

# 2. Iniciar a API Flask
python3 app.py
```

O servidor iniciará em `http://0.0.0.0:5001` (ou na porta definida pela variável de ambiente `PORT`).

---

## 📡 Principais Endpoints da API Flask

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/status` | Status da API e contagens do banco SQLite |
| `GET` | `/api/categories` | Lista categorias de serviço e tempos de SLA |
| `GET` | `/api/counters` | Lista os guichês, operadores e status atual |
| `GET` | `/api/tickets` | Consulta a fila de senhas com filtros por status/categoria |
| `POST` | `/api/tickets` | Emite uma nova senha (calcula sequencial e grava no SQLite) |
| `POST` | `/api/call-next` | Algoritmo inteligente que seleciona a próxima senha respeitando a Lei de Prioridade (proporção 2:1 ou estrita) |
| `POST` | `/api/call-specific` | Chama uma senha específica da fila |
| `POST` | `/api/recall` | Re-chama a senha no painel (incrementa contagem) |
| `POST` | `/api/service/start` | Inicia o cronômetro do atendimento no guichê |
| `POST` | `/api/service/finish` | Conclui atendimento com anotações de resolução |
| `POST` | `/api/service/no-show` | Registra ausência / não comparecimento do cidadão |
| `POST` | `/api/transfer` | Transfere senha para outra fila ou guichê |
| `GET` | `/api/calls/active` | Retorna a chamada atual para exibição na TV |
| `GET` | `/api/calls/history` | Histórico das últimas chamadas |
| `GET` | `/api/metrics` | Indicadores em tempo real (tempo médio de espera, guichê e SLA) |
| `GET` | `/api/export/csv` | Gera e faz download de relatório operacional em CSV direto do SQLite |
| `POST` | `/api/reset` | Reinicia as senhas do dia no SQLite |
