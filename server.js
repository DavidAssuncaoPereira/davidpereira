require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'davidpereira_secret_key_session_2026';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 dias
    }
}));

// Garante utilizador Admin padrão (admin / admin123)
async function initAdmin() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        db.run(
            `INSERT OR IGNORE INTO users (id, username, password, role) VALUES (1, 'admin', ?, 'admin')`,
            [hashedPassword],
            (err) => {
                if (!err) {
                    console.log('Utilizador administrador verificado com sucesso.');
                }
            }
        );
    } catch (e) {
        console.error('Erro ao inicializar admin:', e);
    }
}
initAdmin();

// API: Health / Status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        uptime: process.uptime(),
        appName: 'David Pereira Portfolio & Live Chat',
        timestamp: new Date().toISOString()
    });
});

// API: Setup Admin manual (se necessário)
app.get('/api/setup', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        db.run('INSERT OR IGNORE INTO users (id, username, password, role) VALUES (1, ?, ?, ?)', ['admin', hashedPassword, 'admin'], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Conta de Administrador pronta (user: admin / pass: admin123)' });
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao configurar admin' });
    }
});

// API: Register
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Nome de utilizador e palavra-passe são obrigatórios.' });
    }

    if (username.trim().length < 3) {
        return res.status(400).json({ error: 'O nome de utilizador deve ter pelo menos 3 caracteres.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'A palavra-passe deve ter pelo menos 6 caracteres.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, "user")', [username.trim(), hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Este nome de utilizador já está em uso.' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Conta criada com sucesso!' });
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro no servidor ao registar utilizador.' });
    }
});

// API: Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Preencha o utilizador e a palavra-passe.' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username.trim()], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: 'Nome de utilizador ou palavra-passe inválidos.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Nome de utilizador ou palavra-passe inválidos.' });

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role || 'user';
        res.json({ message: 'Sessão iniciada com sucesso!', username: user.username, role: user.role });
    });
});

// API: Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Sessão terminada.' });
});

// API: Check Auth
app.get('/api/auth', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, userId: req.session.userId, username: req.session.username, role: req.session.role });
    } else {
        res.json({ loggedIn: false });
    }
});

// API: Send Message
app.post('/api/messages', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Não autorizado. Inicie sessão para enviar mensagens.' });

    const { receiver_id, message } = req.body;
    const sender_id = req.session.userId;

    if (!message || !message.trim()) {
        return res.status(400).json({ error: 'A mensagem não pode estar vazia.' });
    }

    // Se o remetente for utilizador normal, envia para o admin (ID 1)
    let actual_receiver = receiver_id;
    if (req.session.role !== 'admin') {
        actual_receiver = 1;
    } else if (!actual_receiver) {
        return res.status(400).json({ error: 'Como administrador, selecione o destinatário.' });
    }

    db.run(
        'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
        [sender_id, actual_receiver, message.trim()],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });

            io.emit('newMessage', {
                sender_id,
                receiver_id: actual_receiver,
                message: message.trim()
            });
            res.json({ message: 'Mensagem enviada com sucesso!' });
        }
    );
});

// API: Get Messages
app.get('/api/messages', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Não autorizado.' });

    const userId = req.session.userId;
    const targetUserId = req.query.user_id ? parseInt(req.query.user_id, 10) : null;

    if (req.session.role === 'admin') {
        // Se targetUserId for passado, filtra apenas por esse utilizador
        if (targetUserId) {
            db.all(`
                SELECT m.id, m.message, m.timestamp, m.sender_id, m.receiver_id,
                       s.username as sender_name, r.username as receiver_name
                FROM messages m
                LEFT JOIN users s ON m.sender_id = s.id
                LEFT JOIN users r ON m.receiver_id = r.id
                WHERE (m.sender_id = ? AND m.receiver_id = 1) OR (m.sender_id = 1 AND m.receiver_id = ?)
                ORDER BY m.timestamp ASC
            `, [targetUserId, targetUserId], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows || []);
            });
        } else {
            // Retorna todas as conversas do admin
            db.all(`
                SELECT m.id, m.message, m.timestamp, m.sender_id, m.receiver_id,
                       s.username as sender_name, r.username as receiver_name
                FROM messages m
                LEFT JOIN users s ON m.sender_id = s.id
                LEFT JOIN users r ON m.receiver_id = r.id
                ORDER BY m.timestamp ASC
            `, [], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows || []);
            });
        }
    } else {
        // Utilizador comum só vê as mensagens entre si e o admin (ID 1)
        db.all(`
            SELECT m.id, m.message, m.timestamp, m.sender_id, m.receiver_id,
                   s.username as sender_name, r.username as receiver_name
            FROM messages m
            LEFT JOIN users s ON m.sender_id = s.id
            LEFT JOIN users r ON m.receiver_id = r.id
            WHERE (m.sender_id = ? AND m.receiver_id = 1) OR (m.sender_id = 1 AND m.receiver_id = ?)
            ORDER BY m.timestamp ASC
        `, [userId, userId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows || []);
        });
    }
});

// API: Get Users (Admin only)
app.get('/api/users', (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Acesso reservado ao administrador.' });

    db.all(`
        SELECT u.id, u.username, u.created_at,
               (SELECT COUNT(*) FROM messages m WHERE m.sender_id = u.id AND m.receiver_id = 1) as message_count
        FROM users u 
        WHERE u.role != 'admin'
        ORDER BY u.id DESC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        // user disconnected
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor ativo na porta ${PORT} em http://localhost:${PORT}`);
});
