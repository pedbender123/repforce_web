# Estágio 1: Build
FROM node:18-alpine as build

WORKDIR /app

# Copia dependências
COPY package*.json ./
RUN npm install

# Copia código fonte
COPY . .

# Argumento de build para a API
ARG REACT_APP_API_URL=https://repforce.com.br/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Gera o build estático em /app/build
RUN npm run build

# Estágio 2: Servir com Nginx
FROM nginx:alpine

# 1. Copia os arquivos do build React para a pasta do Nginx
COPY --from=build /app/build /usr/share/nginx/html

# 2. (IMPORTANTE) Remove a config padrão do Nginx e copia a nossa
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]