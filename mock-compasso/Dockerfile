# --- FRONTEND BUILD ---
FROM node:20-alpine

WORKDIR /app

# Copiar dependências primeiro (cache layer)
COPY package*.json ./
RUN npm install

# Copiar o resto do código
COPY . .

# Expor porta 3000
EXPOSE 3000

# Rodar em modo dev com hot reload
CMD ["npm", "run", "dev"]
