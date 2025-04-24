
# Dockerfile para Bitcoin DCA Pro
# Primeira etapa: Build do aplicativo
FROM node:18-alpine as builder

# Diretório de trabalho
WORKDIR /app

# Copia arquivos de pacotes
COPY package*.json ./

# Instala dependências
RUN npm ci

# Copia todos os arquivos do projeto
COPY . .

# Constrói o aplicativo
RUN npm run build

# Segunda etapa: Criar imagem de produção
FROM node:18-alpine as production

# Define diretório de trabalho
WORKDIR /app

# Copia apenas os arquivos necessários da etapa de build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Expõe porta que o aplicativo usa internamente
EXPOSE 3000

# Variáveis de ambiente (serão substituídas pelos valores reais no docker-compose)
ENV NODE_ENV=production

# Comando para iniciar o aplicativo
CMD ["node", "dist/server.js"]
