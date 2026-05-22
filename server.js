require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const session = require('express-session');
const sharedsession = require('express-socket.io-session');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');
const db = require('./db');

const app = express();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            "img-src": ["'self'", "data:", "https://davidassuncaopereira.github.io"],
        },
    },
}));
app.use(xss());
app.use(cookieParser());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'david-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true, // Prevent XSS from reading session cookie
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
});

app.use(sessionMiddleware);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// --- Socket.io ---

io.use(sharedsession(sessionMiddleware, {
    autoSave: true
}));

io.on('connection', (socket) => {
    const user = socket.handshake.session.user;

    if (!user) {
        console.log('Unauthorized socket connection attempt');
        socket.disconnect();
        return;
    }

    console.log(`User connected: ${user.username} (${user.role})`);

    socket.on('join', async (userId) => {
        // Only allow user to join their own room, OR allow admin to join any user room
        if (user.role !== 'admin' && user.id != userId) {
            console.log(`Unauthorized join attempt by ${user.username} for user_${userId}`);
            return;
        }

        socket.join(`user_${userId}`);
        console.log(`User ${user.username} joined room user_${userId}`);

        // Fetch history
        try {
            const [rows] = await db.query(
                'SELECT * FROM messages WHERE user_id = ? ORDER BY created_at ASC',
                [userId]
            );
            socket.emit('messageHistory', rows);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    });

    socket.on('sendMessage', async (data) => {
        const { userId, message } = data;
        const isAdmin = user.role === 'admin';

        // If not admin, the message must be for themselves
        const targetUserId = isAdmin ? userId : user.id;

        try {
            await db.query(
                'INSERT INTO messages (user_id, message, is_from_admin) VALUES (?, ?, ?)',
                [targetUserId, message, isAdmin]
            );

            const msgData = {
                user_id: targetUserId,
                message: message,
                is_from_admin: isAdmin,
                created_at: new Date()
            };

            // Send to user's room
            io.to(`user_${targetUserId}`).emit('receiveMessage', msgData);

            // If it's a user sending, notify admin room
            if (!isAdmin) {
                io.to('admin_room').emit('newUserMessage', msgData);
            }
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('joinAdmin', () => {
        if (user.role === 'admin') {
            socket.join('admin_room');
            console.log('Admin joined admin room');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// --- API Routes ---

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Check auth status
app.get('/api/auth/status', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// Register
app.post('/api/register', [
    body('username').isAlphanumeric().withMessage('Username must be alphanumeric').isLength({ min: 3, max: 20 }).trim().escape(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters').escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Username already exists' });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Login
app.post('/api/login', [
    body('username').trim().escape(),
    body('password').escape()
], async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        req.session.user = { id: user.id, username: user.username, role: user.role };
        res.json({ message: 'Logged in successfully', user: req.session.user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

// Admin Middleware
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
};

// Admin Routes
app.get('/api/admin/contacts', isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM contacts ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username, created_at FROM users WHERE role != "admin"');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Contact Form
app.post('/api/contact', [
    body('name').trim().isLength({ min: 2 }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('subject').trim().isLength({ min: 2 }).escape(),
    body('message').trim().isLength({ min: 5 }).escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Please provide valid input' });
    }

    const { name, email, subject, message } = req.body;
    try {
        await db.query('INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)',
            [name, email, subject, message]);
        res.json({ message: 'Contact form submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
