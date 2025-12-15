# Estágio 1: Build
FROM node:18-alpine as build

WORKDIR /app

# MÁGICA AQUI: O asterisco (*) faz copiar o package-lock.json APENAS se ele existir.
# Se não existir, ele copia só o package.json e não dá erro.
COPY package*.json ./

# Instala as dependências (cria o lockfile internamente se precisar)
RUN npm install

# Copia o restante do código fonte
COPY . .

# Cria o build de produção
RUN npm run build

# Estágio 2: Servir com Nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]