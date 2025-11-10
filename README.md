🚀 Projeto Repforce v0_Web

Este é o protótipo da arquitetura full-stack para o sistema de gestão de representantes Repforce. O projeto é totalmente containerizado usando Docker e é composto por um backend (API), um frontend (React) e um proxy reverso (Nginx).

🛠️ Tecnologias Utilizadas

Orquestração: Docker & Docker Compose

Proxy Reverso: Nginx

Backend: FastAPI (Python)

Frontend: React (com Tailwind CSS, React Query, Axios)

Banco de Dados: PostgreSQL

▶️ Como Executar o Projeto

Para rodar o ambiente de desenvolvimento completo:

Pré-requisito (Apenas na 1ª vez):
O Docker precisa do arquivo package-lock.json para construir o frontend. Entre na pasta frontend-web e instale as dependências:

cd frontend-web
npm install
cd ..


Subir os Serviços:
Na pasta raiz do projeto (v0_Web), suba todos os serviços com o Docker Compose. O --build garante que todas as mudanças sejam aplicadas.

docker compose up --build


Acessar o Projeto:
Após os containers iniciarem (especialmente o repforce_backend mostrar Application startup complete.), acesse o sistema no seu navegador:

URL: http://localhost

🔑 Credenciais de Acesso (Administrador)

Para facilitar o desenvolvimento, um usuário Administrador padrão é criado automaticamente (via seeding no main.py) toda vez que o backend é iniciado.

URL de Login: http://localhost/login

Usuário (Admin): admin@sistemas.com

Senha: 12345678

Tenant Padrão: Systems

Use este usuário para acessar o painel /admin e cadastrar novos Representantes (Contas Filhas) para outros tenants.

🏗️ Estrutura dos Serviços

nginx (Porta 80): É o "porteiro" do projeto.

Requisições para http://localhost/ são enviadas para o container frontend-web.

Requisições para http://localhost/api/ são enviadas para o container backend.

backend (FastAPI): A API Python.

Contém toda a lógica de negócios, autenticação JWT e isolamento de dados por tenant_id.

Cria o admin padrão na inicialização (via main.py).

frontend-web (React): O portal web.

Faz chamadas para http://localhost/api/... para se comunicar com o backend (via apiClient.js).

Tem rotas protegidas para /app (Representante) e /admin (Admin).

db (PostgreSQL): O banco de dados.

Os dados são persistidos na pasta local postgres-data/ (criada pelo Docker).

💡 Dica de Desenvolvimento: Resetar o Banco de Dados

Se em algum momento você "corromper" o banco de dados (como aconteceu conosco) e quiser começar do zero, siga estes passos:

Pare os containers:
(No terminal onde o docker está rodando, aperte Ctrl + C ou rode docker compose down)

docker compose down


IMPORTANTE: Destrua o volume do banco (apaga todos os dados):

docker volume rm v0_web_postgres-data


Suba tudo de novo:

docker compose up --build


Isso vai forçar o Docker a criar um banco de dados limpo, e o script de seeding (em main.py) rodará novamente, recriando o usuário admin@sistemas.com.