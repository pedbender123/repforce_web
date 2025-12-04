🚀 Projeto Repforce

Este é o sistema de gestão multi-tenant (multi-empresa) para representantes comerciais. O projeto é totalmente containerizado usando Docker e é composto por um backend (API), um frontend (React) e uma arquitetura de proxy reverso.

🛠️ Tecnologias Utilizadas

Orquestração: Docker & Docker Compose

Proxy Reverso (VPS): Nginx (para gerir o domínio e o tráfego)

Backend: FastAPI (Python), SQLAlchemy, PostgreSQL

Frontend: React (com Tailwind CSS, React Query, Axios)


🏛️ Arquitetura de Produção

O sistema é desenhado para rodar numa VPS e usa uma arquitetura com dois Nginx, que foi a causa dos nossos problemas de 404:

Nginx da VPS (O "Porteiro"):

É o Nginx principal instalado na sua VPS (em /etc/nginx/sites-available/).

Ele cuida do seu domínio (repforce.com.br) e do certificado SSL (HTTPS).

Função: Ele direciona o tráfego:

Requisições para repforce.com.br/api/* são enviadas para http://127.0.0.1:8000 (o container backend).

Todas as outras requisições (/, /login, /sysadmin, etc.) são enviadas para http://127.0.0.1:3000 (o container frontend-web).

Nginx do Container frontend-web (O "Servidor do React")

Este Nginx vive dentro do container frontend-web.

A sua configuração vem do ficheiro frontend-web/nginx.conf [cite: pedbender123/repforce_web/repforce_web-c157320724a7421235d1ff78ab5c17836af4afbe/frontend-web/nginx.conf] no projeto.

Função: Ele serve os ficheiros estáticos do React e usa a regra try_files $uri $uri/ /index.html; para garantir que o React Router funcione, mesmo se você recarregar a página numa rota como /sysadmin/login.

🔑 Acessos e Credenciais

O sistema agora tem duas portas de entrada separadas:

1. Portal do SysAdmin (Administrador do Sistema)

Este é o painel "Deus" onde você cria os Tenants (as empresas clientes).

URL de Login: https://repforce.com.br/sysadmin/login [cite: pedbender123/repforce_web/repforce_web-c157320724a7421235d1ff78ab5c17836af4afbe/frontend-web/src/pages/sysadmin/SysAdminLogin.js]

Usuário (Username): sysadmin

Senha: 12345678

Estas credenciais são criadas automaticamente pelo backend (main.py) [cite: pedbender123/repforce_web/repforce_web-c157320724a7421235d1ff78ab5c17836af4afbe/backend/app/main.py] na inicialização, associadas ao tenant especial "Systems".

2. Portal do Tenant (Admins de Empresa e Representantes)

Esta é a página de login normal para os seus clientes (Admins) e os representantes deles.

URL de Login: https://repforce.com.br/login [cite: pedbender123/repforce_web/repforce_web-c157320724a7421235d1ff78ab5c17836af4afbe/frontend-web/src/pages/Login.js]

Credenciais: Não há utilizadores padrão. O SysAdmin deve primeiro criar um Tenant (ex: "Empresa X") e depois criar um utilizador "Admin" (ex: admin_empresaX) para esse tenant.

⚙️ Deploy Automático (CI/CD)

O deploy é feito automaticamente pelo GitHub Actions.

Gatilho: Qualquer git push para a branch main.

Ficheiro: .github/workflows/deploy.yml [cite: pedbender123/repforce_web/repforce_web-c157320724a7421235d1ff78ab5c17836af4afbe/.github/workflows/deploy.yml]

O que ele faz:

Conecta-se à VPS via SSH.

Entra no diretório do projeto (definido no segredo TARGET_DIR).

Roda git pull origin main para baixar o código novo.

Roda docker compose -f docker-compose.yml up --build -d para reconstruir e reiniciar os containers com o novo código.

Roda docker image prune -f para limpar imagens antigas.

Importante: Para o deploy funcionar, os seguintes segredos devem estar configurados nas Settings > Secrets and variables > Actions do seu repositório no GitHub:

VPS_HOST (IP da VPS)

VPS_USERNAME (Utilizador, ex: root)

VPS_PRIVATE_KEY (A sua chave SSH privada)

TARGET_DIR (O caminho completo na VPS, ex: /root/repforce_web)

🔄 Como Resetar o Banco de Dados (Manualmente)

Se precisar de apagar todos os dados e começar do zero:

Acesse sua VPS via SSH.

Navegue até a pasta do projeto (ex: cd /root/repforce_web).

Pare e remova os containers:

docker compose down


IMPORTANTE: O seu docker-compose.yml [cite: pedbender123/repforce_web/repforce_web-c157320724a7421235d1ff78ab5c17836af4afbe/docker-compose.yml] usa um bind mount. Para apagar os dados, remova a pasta local:

rm -rf ./postgres-data


Suba tudo novamente (o Docker irá recriar a pasta e o script de main.py [cite: pedbender123/repforce_web/repforce_web-c157320724a7421235d1ff78ab5c17836af4afbe/backend/app/main.py] irá recriar o utilizador sysadmin):

docker compose up --build -d
