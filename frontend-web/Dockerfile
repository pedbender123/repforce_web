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



EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]