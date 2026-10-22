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
const io = new Server(server);
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ativo na porta ${PORT}`);
});

if (!process.env.SESSION_SECRET) {
    console.error('FATAL ERROR: SESSION_SECRET is not defined in environment variables.');
    process.exit(1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// API: Setup Admin (Run once or manually)
app.get('/api/setup', async (req, res) => {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    db.run('INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hashedPassword, 'admin'], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({ message: 'Admin user created (if not exists)' });
    });
});

// API: Register
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Registered successfully' });
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// API: Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: 'Invalid username or password' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid username or password' });

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        res.json({ message: 'Logged in successfully', role: user.role });
    });
});

// API: Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out' });
});

// API: Check Auth
app.get('/api/auth', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, username: req.session.username, role: req.session.role });
    } else {
        res.json({ loggedIn: false });
    }
});

// API: Send Message (User to Admin, Admin to User)
app.post('/api/messages', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { receiver_id, message } = req.body;
    const sender_id = req.session.userId;

    // If user is sending, receiver should be admin (let's assume admin has id 1)
    let actual_receiver = receiver_id;
    if (req.session.role !== 'admin') {
         actual_receiver = 1; // Send to admin
    } else if (!actual_receiver) {
         return res.status(400).json({ error: 'Admin must specify receiver_id' });
    }

    db.run('INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)', [sender_id, actual_receiver, message], function(err) {
        if (err) return res.status(500).json({ error: err.message });

        io.emit('newMessage');
        res.json({ message: 'Message sent' });
    });
});

// API: Get Messages
app.get('/api/messages', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

    const userId = req.session.userId;

    if (req.session.role === 'admin') {
        // Admin sees all distinct conversations. For simplicity, just get all messages with usernames
        db.all(`
            SELECT m.id, m.message, m.timestamp, m.sender_id, m.receiver_id,
                   s.username as sender_name, r.username as receiver_name
            FROM messages m
            JOIN users s ON m.sender_id = s.id
            JOIN users r ON m.receiver_id = r.id
            ORDER BY m.timestamp ASC
        `, [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    } else {
        // Normal user sees messages between themselves and admin (id 1)
        db.all(`
            SELECT m.id, m.message, m.timestamp, m.sender_id, m.receiver_id,
                   s.username as sender_name, r.username as receiver_name
            FROM messages m
            JOIN users s ON m.sender_id = s.id
            JOIN users r ON m.receiver_id = r.id
            WHERE (m.sender_id = ? AND m.receiver_id = 1) OR (m.sender_id = 1 AND m.receiver_id = ?)
            ORDER BY m.timestamp ASC
        `, [userId, userId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    }
});

// API: Get Users (Admin only)
app.get('/api/users', (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    db.all('SELECT id, username FROM users WHERE role != "admin"', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

io.on('connection', (socket) => {
    console.log('A user connected via WebSocket');
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} at 0.0.0.0`);
});
