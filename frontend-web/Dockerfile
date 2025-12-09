# Estágio 1: Construção (Build)
FROM node:18-alpine as build

WORKDIR /app

# Copia package.json e package-lock.json (se existir)
# O uso do asterisco (*) permite que o comando funcione mesmo sem o package-lock.json
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o restante do código fonte
COPY . .

# Constrói a aplicação para produção
RUN npm run build

# Estágio 2: Servir com Nginx
FROM nginx:alpine

# Copia os arquivos estáticos do build anterior para o diretório do Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copia a configuração personalizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]