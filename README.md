# Uptime Monitor

Aplicação de monitoramento de uptime para HTTP, TCP e Ping, desenvolvida com Node.js, Express, Socket.IO, Sequelize e MySQL.

## Funcionalidades

- Monitoramento de serviços HTTP/HTTPS
- Monitoramento de portas TCP
- Monitoramento de hosts via Ping
- Dashboard com estatísticas em tempo real
- Histórico de monitoramento
- Gráficos de tempo de resposta
- Sistema de autenticação de usuários
- Interface web moderna e responsiva

## Requisitos

- Docker e Docker Compose **(recomendado)**
- ou Node.js v16+ e MySQL 8+

## Instalação e Execução

### Com Docker (recomendado)

1. Clone o repositório:
   ```sh
   git clone https://github.com/gabrielgomeslira/uptime-project/
   cd uptime-monitor
   ```

2. Inicie a aplicação com Docker Compose:
   ```sh
   docker-compose up -d
   ```

3. Acesse a aplicação em seu navegador:
   ```
   http://localhost:3000
   ```

### Sem Docker

1. Clone o repositório:
   ```sh
   git clone https://github.com/gabrielgomeslira/uptime-project/
   cd uptime-monitor
   ```

2. Instale as dependências:
   ```sh
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:
   ```
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=uptime
   DB_PASSWORD=uptime_password
   DB_NAME=uptime_monitor
   SESSION_SECRET=sua-chave-secreta
   ```

4. Certifique-se de que o MySQL está rodando e possui um banco de dados e usuário compatíveis com as variáveis acima.

5. Inicie a aplicação:
   ```sh
   npm start
   ```

6. Acesse a aplicação em seu navegador:
   ```
   http://localhost:3000
   ```

## Desenvolvimento

Para desenvolvimento, utilize o modo de hot reload:
```sh
npm run dev
```
---
