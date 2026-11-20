const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Define o caminho absoluto para o ficheiro da base de dados
const dbPath = path.resolve(__dirname, 'database.sqlite');

// Abre ou cria o ficheiro database.sqlite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao ligar à base de dados SQLite:', err.message);
  } else {
    console.log('Ligado com sucesso à base de dados SQLite.');
  }
});

// Inicialização síncrona das tabelas e migrações
db.serialize(() => {
  // Tabela de utilizadores (autenticação: login e registo)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela users:', err.message);
    }
  });

  // Migração segura: garante que a coluna 'role' existe caso a tabela tenha sido criada em versão anterior
  db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, () => {
    // Silencia o erro se a coluna já existir
  });

  // Tabela de mensagens para o chat em tempo real
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users (id),
      FOREIGN KEY (receiver_id) REFERENCES users (id)
    )
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela messages:', err.message);
    }
  });

  // Migração para messages caso colunas antigas existam
  db.run(`ALTER TABLE messages ADD COLUMN sender_id INTEGER`, () => {});
  db.run(`ALTER TABLE messages ADD COLUMN receiver_id INTEGER`, () => {});
});

module.exports = db;
