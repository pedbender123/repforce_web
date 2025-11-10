# Estágio 1: Build do React
FROM node:18-alpine as build
WORKDIR /app

# Copia package.json e package-lock.json
COPY package.json ./
COPY package-lock.json ./

# Instala dependências
RUN npm install

# Copia o restante do código-fonte
COPY . .

# Constrói a aplicação para produção
RUN npm run build

# Estágio 2: Servir com Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove o HTML padrão do Nginx
RUN rm -rf ./*

# Copia os arquivos estáticos do estágio de build
COPY --from=build /app/build .

# (Opcional) Copia uma configuração Nginx específica para o React Router
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# O nginx.conf padrão do Estágio 2 deve ter:
# location / {
#   try_files $uri $uri/ /index.html;
# }
# Por simplicidade, vamos usar o proxy reverso principal (do docker-compose)
# para lidar com isso.

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]