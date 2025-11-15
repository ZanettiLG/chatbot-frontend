# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache python3 make g++

# Argumentos de build para variáveis VITE_*
# Essas variáveis são incorporadas no build e não podem ser alteradas depois
ARG VITE_API_URL=http://localhost:3030
ARG VITE_WS_URL=ws://localhost:3030

# Definir como variáveis de ambiente para o build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Copiar arquivos de dependências e configuração
COPY package*.json ./
COPY tsconfig*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Stage 2: Production (Nginx)
FROM nginx:alpine

# Copiar arquivos buildados do stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Remover configuração padrão e copiar configuração customizada do Nginx para SPA routing
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

# Nginx já inicia automaticamente, mas podemos garantir
CMD ["nginx", "-g", "daemon off;"]

