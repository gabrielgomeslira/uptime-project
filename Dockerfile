FROM node:18-alpine

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências para compilação
RUN apk add --no-cache --virtual .gyp python3 make g++

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Recompile bcrypt após copiar o código fonte
RUN npm rebuild bcrypt --build-from-source

# Criar diretórios necessários para volumes, se não existirem
RUN mkdir -p src public

# Limpar cache e dependências de compilação
RUN apk del .gyp

# Porta de exposição
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"] 