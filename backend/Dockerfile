# Estágio 1: Imagem base Python
FROM python:3.11-slim

# Define o diretório de trabalho
WORKDIR /app

# Instala o Poetry (gerenciador de dependências)
# Se preferir requirements.txt, pode trocar esta parte
# RUN pip install poetry

# Copia os arquivos de dependência
COPY requirements.txt .

# Instala as dependências
RUN pip install -r requirements.txt

# Copia o restante do código da aplicação
COPY ./app /app/app

# O comando para rodar a aplicação será dado no docker-compose.yml
# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]