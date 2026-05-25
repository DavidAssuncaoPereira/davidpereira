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
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const db = require('./db');

const app = express();

// Ensure upload directories exist
if (!fs.existsSync("public/uploads/profiles")) fs.mkdirSync("public/uploads/profiles", { recursive: true });
if (!fs.existsSync("public/uploads/sensitive")) fs.mkdirSync("public/uploads/sensitive", { recursive: true });

// Multer Setup
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/profiles'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const uploadProfile = multer({
    storage: profileStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images allowed'));
    }
});

const sensitiveStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/sensitive'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'secret-' + uniqueSuffix);
    }
});
const uploadSensitive = multer({ storage: sensitiveStorage });

// Encryption Helper
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '32_char_secret_key_for_aes_256_!'; // Must be exactly 32 chars
const IV_LENGTH = 16;

function encrypt(text) {
    if (!text) return null;
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    if (!text) return null;
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

async function logActivity(action, details) {
    try {
        await db.query('INSERT INTO activity_logs (action, details) VALUES (?, ?)', [action, details]);
    } catch (error) {
        console.error('Logging failed:', error);
    }
}

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
app.post('/api/register', uploadProfile.single('profilePic'), [
    body('username').isAlphanumeric().withMessage('Username must be alphanumeric').isLength({ min: 3, max: 20 }).trim().escape(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters').escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username, password } = req.body;
    const profilePic = req.file ? `/uploads/profiles/${req.file.filename}` : null;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (username, password, profile_pic) VALUES (?, ?, ?)',
            [username, hashedPassword, profilePic]);
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
        await logActivity('Login', `User ${user.username} logged in`);
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

// User Settings
app.post('/api/user/settings', uploadProfile.single('profilePic'), async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

    const { password } = req.body;
    const userId = req.session.user.id;
    let query = 'UPDATE users SET ';
    let params = [];

    if (req.file) {
        const profilePic = `/uploads/profiles/${req.file.filename}`;
        query += 'profile_pic = ?, ';
        params.push(profilePic);
        req.session.user.profile_pic = profilePic;
    }

    if (password && password.length >= 6) {
        const hashedPassword = await bcrypt.hash(password, 10);
        query += 'password = ?, ';
        params.push(hashedPassword);
    }

    // Remove trailing comma and space
    if (params.length === 0) return res.json({ message: 'No changes' });

    query = query.slice(0, -2) + ' WHERE id = ?';
    params.push(userId);

    try {
        await db.query(query, params);
        res.json({ message: 'Settings updated', user: req.session.user });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
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
app.get('/api/admin/logs', isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 50');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

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
        const [rows] = await db.query('SELECT id, username, profile_pic, created_at FROM users WHERE role != "admin"');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- Admin Personal Features ---

// Notes
app.get('/api/admin/notes', isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM notes ORDER BY created_at DESC');
        const decryptedNotes = rows.map(note => ({
            ...note,
            content: decrypt(note.content)
        }));
        res.json(decryptedNotes);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/notes', isAdmin, async (req, res) => {
    const { title, content } = req.body;
    try {
        const encryptedContent = encrypt(content);
        await db.query('INSERT INTO notes (title, content) VALUES (?, ?)', [title, encryptedContent]);
        res.json({ message: 'Note saved' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Finances
app.get('/api/admin/finances', isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM financial_records ORDER BY date DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/finances', isAdmin, async (req, res) => {
    const { description, amount, type, source, date } = req.body;
    try {
        await db.query('INSERT INTO financial_records (description, amount, type, source, date) VALUES (?, ?, ?, ?, ?)',
            [description, amount, type, source, date]);
        res.json({ message: 'Financial record saved' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Sensitive Files
app.get('/api/admin/files', isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, original_name, mimetype, size, created_at FROM sensitive_files ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/files', isAdmin, uploadSensitive.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const filePath = req.file.path;
        const fileContent = fs.readFileSync(filePath);
        const encryptedContent = encrypt(fileContent.toString('hex')); // Store as hex for simplicity in this helper

        fs.writeFileSync(filePath, encryptedContent);

        await db.query(
            'INSERT INTO sensitive_files (filename, original_name, mimetype, size) VALUES (?, ?, ?, ?)',
            [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size]
        );

        await logActivity('File Upload', `Admin uploaded encrypted file: ${req.file.originalname}`);
        res.json({ message: 'File uploaded and encrypted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Encryption failed' });
    }
});

app.get('/api/admin/files/download/:id', isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM sensitive_files WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'File not found' });

        const file = rows[0];
        const filePath = path.join(__dirname, 'public/uploads/sensitive', file.filename);

        const encryptedContent = fs.readFileSync(filePath, 'utf8');
        const decryptedHex = decrypt(encryptedContent);
        const decryptedContent = Buffer.from(decryptedHex, 'hex');

        res.setHeader('Content-Type', file.mimetype);
        res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
        res.send(decryptedContent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Decryption failed' });
    }
});

// Projects CRUD
app.get('/api/projects', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/projects', isAdmin, async (req, res) => {
    const { title, description, image_url, github_url, demo_url, technologies } = req.body;
    try {
        await db.query(
            'INSERT INTO projects (title, description, image_url, github_url, demo_url, technologies) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, image_url, github_url, demo_url, technologies]
        );
        res.json({ message: 'Project added' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/admin/projects/:id', isAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
        res.json({ message: 'Project deleted' });
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
