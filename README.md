# Website Pessoal David Pereira (Full-Stack)

Este projeto é um website pessoal completo com backend em Node.js, base de dados MySQL e chat em tempo real.

## 🚀 Funcionalidades

- **Autenticação de Utilizadores**: Sistema de registo e login seguro.
- **Chat em Tempo Real**: Chat privado entre utilizadores e o administrador via Socket.io.
- **Painel de Administração**: Visualização de mensagens de contacto e gestão de chats.
- **Formulário de Contacto**: Mensagens guardadas diretamente na base de dados.
- **Segurança Avançada**: Proteção contra XSS, Rate Limiting, CSP e hashing de passwords (bcrypt).
- **Design Moderno**: Interface responsiva com suporte para tema claro/escuro.

---

## 🛠️ Pré-requisitos

Antes de começar, certifique-se de que tem instalado:
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
OU
- [Node.js](https://nodejs.org/) (v18+) e [MySQL](https://www.mysql.com/)

---

## 📦 Configuração e Instalação

### Opção 1: Usando Docker (Recomendado)

Esta é a forma mais fácil e rápida de colocar o site a funcionar.

1. **Clonar o repositório:**
   ```bash
   git clone <url-do-repositorio>
   cd personal-website
   ```

2. **Configurar variáveis de ambiente:**
   Crie um ficheiro `.env` na raiz do projeto (pode copiar o `.env.example` se existir ou criar um novo):
   ```env
   DB_HOST=db
   DB_USER=david_user
   DB_PASSWORD=david_password
   DB_NAME=david_db
   PORT=3000
   SESSION_SECRET=uma_chave_secreta_muito_segura
   ```

3. **Iniciar os contentores:**
   ```bash
   docker-compose up -d
   ```

4. **Aceder ao site:**
   Abra o seu navegador em `http://localhost:3000`.

---

### Opção 2: Instalação Local (Sem Docker)

1. **Configurar a Base de Dados:**
   - Crie uma base de dados no MySQL.
   - Execute o script contido em `init.sql` para criar as tabelas necessárias.

2. **Instalar Dependências:**
   ```bash
   npm install
   ```

3. **Configurar o ficheiro `.env`:**
   Ajuste o `DB_HOST` para `localhost` e insira as suas credenciais do MySQL.

4. **Iniciar o Servidor:**
   ```bash
   npm start
   ```

---

## 🔑 Acesso de Administrador

Por defeito, o sistema cria uma conta de administrador:
- **Utilizador:** `admin`
- **Palavra-passe:** `admin123` (Deve ser alterada após o primeiro login!)

Aceda ao painel em `http://localhost:3000/admin.html` após fazer login como admin.

---

## 🛡️ Segurança e Privacidade

- **Proteção de Dados**: As palavras-passe são encriptadas com bcryptjs.
- **Validação**: Todas as entradas de formulários são validadas e filtradas no servidor.
- **Privacidade**: Avisos de privacidade incluídos nos formulários de contacto e registo.
- **Headers de Segurança**: Utilização de `helmet` para configurar CSP e outros headers críticos.

---

## 📞 Suporte e Contacto

David Pereira - [GitHub](https://github.com/davidassuncaopereira)
