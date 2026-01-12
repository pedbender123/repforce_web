# Documentação Técnica: Repforce 2.0 Web

**Instruções de Planejamento:** Esta documentação foi elaborada para desenvolvedores e arquitetos, cobrindo desde a configuração do ambiente até os detalhes da arquitetura modular do sistema.

## 1. Visão Geral e Contexto

### 1.1. Objetivo do Projeto
O **Repforce 2.0 Web** é uma plataforma de **Business Process Management (BPM)** e **CRM** focada em flexibilidade e autonomia (No-Code/Low-Code). O sistema resolve o problema da rigidez dos CRMs tradicionais, permitindo que administradores criem entidades, dashboards e fluxos de automação personalizados sem depender de deploys constantes. Sua arquitetura multitenancy suporta múltiplas empresas isoladamente.

### 1.2. Stakeholders e Contatos

| Papel | Nome | Contato |
| :--- | :--- | :--- |
| **Product Owner** | Pedro Bender | `pedro.p.bender.randon@gmail.com` |
| **Arquiteto Responsável** | Pedro Bender | `pedro.p.bender.randon@gmail.com` |
| **Tech Lead** | Antigravity AI | N/A |

> **Impacto Crítico:** Se este sistema parar, as operações de vendas e gestão de processos dos clientes (tenants) são interrompidas imediatamente, impedindo o acesso a tarefas, contatos e automações de fluxo.

---

## 2. Arquitetura do Sistema

### 2.1. Stack Tecnológica

*   **Linguagem Principal (Backend):** Python 3.11+
*   **Framework (Backend):** FastAPI (Uvicorn)
*   **Linguagem Principal (Frontend):** JavaScript (React 18)
*   **Framework (Frontend):** React Scripts (CRA), TailwindCSS, React Query.
*   **Banco de Dados:** PostgreSQL 15 (Relacional).
*   **Infraestrutura:** Docker & Docker Compose.
*   **Proxy/Gateway:** Nginx (Alpine).
*   **Automação:** n8n (Integrado via container).

### 2.2. Diagrama de Arquitetura

```mermaid
graph TD
    Client[Navegador do Usuário] -->|HTTP/HTTPS| Nginx[Nginx Proxy]
    Nginx -->|/api/*| Backend[Backend API (FastAPI)]
    Nginx -->|/*| Frontend[Frontend Web (React)]
    Backend -->|SQL| DB[(PostgreSQL 15)]
    Backend -->|Webhooks| N8N[n8n Automation]
    N8N -->|Trigger| Backend
```

### 2.3. Padrões de Projeto (Design Patterns)

*   **Modular Monolith (Backend):** O código é organizado em módulos (`system`, `engine`, `shared`) para separar o "core" do sistema da "engine" dinâmica, facilitando manutenção e futura extração para microsserviços.
*   **Dependency Injection (FastAPI):** Uso extensivo de `Depends()` para gestão de sessões de banco e autenticação/autorização (`get_current_user`).
*   **Repository Pattern (Implícito):** Separação de lógica de acesso a dados (SQLAlchemy Models) da lógica de negócios (Routers/Services).
*   **Component-Based (Frontend):** Interface construída com componentes reutilizáveis e Context API (`BuilderContext`) para gestão de estado global da construção de páginas.
*   **Schema Validation:** Uso de **Pydantic V2** para garantir a integridade dos dados de entrada e saída.

---

## 3. Guia de Desenvolvimento

### 3.1. Pré-requisitos
*   **Docker Engine** (v20.10+) e **Docker Compose** (v2+).
*   **Git**.

### 3.2. Setup Local

```bash
# 1. Clone o repositório
git clone https://github.com/pedbender123/repforce_web.git
cd repforce_web

# 2. Configure as variáveis de ambiente (Crie o arquivo .env se não existir)
# (Veja a seção 3.3 para detalhes)

# 3. Suba o ambiente completo (Backend, Frontend, DB, N8N)
docker compose up --build -d

# 4. Acesso ao Sistema
# Frontend: http://localhost:3100
# Backend API Docs: http://localhost:8100/docs
# N8N: http://localhost:5700
```

> **Nota:** Na primeira execução, o sistema cria automaticamente o usuário padrão `pbrandon` / `1asdfgh.`.

### 3.3. Variáveis de Ambiente (.env)

| Variável | Descrição |
| :--- | :--- |
| `POSTGRES_USER` | Usuário do banco de dados (Ex: postgres) |
| `POSTGRES_PASSWORD` | Senha do banco de dados |
| `POSTGRES_DB` | Nome do banco de dados (Ex: repforce) |
| `SECRET_KEY` | Chave secreta para assinatura de JWT |
| `PUBLIC_API_URL` | URL pública da API (Ex: `http://localhost:8100` local ou `https://seu-vps/api` em prod) |
| `OPENAI_API_KEY` | (Opcional) Chave para funcionalidades de IA |

---

## 4. Integrações e API

### 4.1. Documentação de API
*   **Swagger/OpenAPI:** Disponível em `/docs` (Ex: `http://localhost:8100/docs`).
*   **Autenticação:** Bearer Token JWT (`OAuth2PasswordBearer`). Endpoint: `/v1/auth/login`.

### 4.2. Dependências Externas

| Serviço | Finalidade | SLA Esperado |
| :--- | :--- | :--- |
| **n8n** | Motor de automação de fluxos e webhooks | Self-hosted (Depende da VPS) |
| **OpenAI** | (Opcional) Geração de conteúdo inteligente | 99.9% |

---

## 5. Qualidade e Testes

*   **Testes Unitários (Backend):** Baseados em `pytest`.
    ```bash
    docker exec -it repforce_backend pytest
    ```
*   **Testes (Frontend):** Baseados em `react-scripts test`.
*   **Cobertura:** Foco principal em testes de integração das rotas da API (`sysadmin`, `engine`).

---

## 6. Operações e Monitoramento

### 6.1. Observabilidade
*   **Logs:** Acessíveis via Docker.
    ```bash
    docker logs -f repforce_backend
    docker logs -f repforce_frontend
    ```
*   **Dashboards:** O próprio sistema possui um módulo de Analytics (`/api/engine/analytics`) consumido pelo Frontend.

### 6.2. CI/CD Pipeline
*   **Deploy Manual:** Atualmente o deploy é feito via `git pull` e `docker compose up --build -d` na VPS.
*   **Build de Produção:** O Frontend é compilado estaticamente (`npm run build`) e servido via Nginx para máxima performance.

---

## 7. Troubleshooting (Solução de Problemas)

| Sintoma | Causa Provável | Solução |
| :--- | :--- | :--- |
| **Login Falhando** | Usuário inexistente ou importação errada no backend | Verificar logs do backend; Recriar usuário via script Python no container. |
| **Erro de Rede (Frontend)** | `REACT_APP_API_URL` apontando para localhost em produção | Ajustar `docker-compose.yml` para usar `/api` e rebuildar. |
| **Conflito de Container** | Nomes de containers já em uso | Rodar `docker rm -f <container>` ou `docker compose down`. |
| **Build Falhando** | Sintaxe incorreta ou dependência instável | Verificar logs de build; checar versões no `package.json`. |

---

## 8. Histórico de Versões

| Versão | Data | Autor | Descrição |
| :--- | :--- | :--- | :--- |
| **2.1.0** | 07/01/2026 | Antigravity AI | Correção de infraestrutura, estabilização de build e deploy em VPS. |
| **2.0.0** | 01/2026 | Pedro Bender | Lançamento da arquitetura Engine Dinâmica e ActionManager. |
