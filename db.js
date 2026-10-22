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

// Inicialização síncrona das tabelas (executada na ordem correta)
db.serialize(() => {
  // Tabela de utilizadores (autenticação: login e registo)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela users:', err.message);
    }
  });

  // Tabela de mensagens para o chat em tempo real
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela messages:', err.message);
    }
  });
});

module.exports = db;