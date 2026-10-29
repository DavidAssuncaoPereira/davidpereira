// Initialize mock admin and messages if not exists
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([{ id: '1', username: 'admin', password: 'password', role: 'admin' }]));
}
if (!localStorage.getItem('messages')) {
    localStorage.setItem('messages', JSON.stringify([]));
}

// Check authentication status globally
async function checkAuth() {
    try {
        const activeUser = JSON.parse(sessionStorage.getItem('activeUser'));
        const data = activeUser ? { loggedIn: true, ...activeUser } : { loggedIn: false };

        const authButtons = document.getElementById('authButtons');
        if (authButtons) {
            if (data.loggedIn) {
                authButtons.innerHTML = `
                    <a href="chat.html" class="btn">Mensagens</a>
                    <button onclick="logout()" class="btn btn-outline">Sair</button>
                `;
            } else {
                authButtons.innerHTML = `
                    <a href="login.html" class="btn">Login</a>
                    <a href="register.html" class="btn btn-outline">Registar</a>
                `;
            }
        }
        return data;
    } catch (err) {
        console.error('Auth check failed', err);
        return { loggedIn: false };
    }
}

async function logout() {
    sessionStorage.removeItem('activeUser');
    window.location.href = 'index.html';
}

// Handle Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMsg');

        try {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                sessionStorage.setItem('activeUser', JSON.stringify(user));
                window.location.href = 'chat.html';
            } else {
                errorMsg.innerText = 'Credenciais inválidas';
            }
        } catch (err) {
            errorMsg.innerText = 'Erro ao fazer login.';
        }
    });
}

// Handle Register
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const errorMsg = document.getElementById('reg-errorMsg');

        try {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            if (users.some(u => u.username === username)) {
                errorMsg.innerText = 'Nome de utilizador já existe';
                return;
            }

            const newUser = {
                id: Date.now().toString(), // simple unique id
                username,
                password,
                role: 'user'
            };
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            alert('Conta criada com sucesso! Faça login.');
            window.location.href = 'login.html';
        } catch (err) {
            errorMsg.innerText = 'Erro ao registar.';
        }
    });
}

// Chat Functionality
let currentUser = null;

async function initChat() {
    const authData = await checkAuth();
    if (!authData.loggedIn) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = authData;

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    if (currentUser.role === 'admin') {
        document.getElementById('adminControls').style.display = 'block';
        loadUsers();
    }

    loadMessages();

    // Poll for new messages every 3 seconds
    setInterval(() => {
        loadMessages();
    }, 3000);

    const chatForm = document.getElementById('chatForm');
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        if (!message) return;

        let receiver_id = null;
        if (currentUser.role === 'admin') {
            const userSelect = document.getElementById('userSelect');
            receiver_id = userSelect.value;
            if (!receiver_id) {
                alert('Selecione um utilizador para enviar mensagem.');
                return;
            }
        }

        try {
            const messages = JSON.parse(localStorage.getItem('messages')) || [];
            messages.push({
                id: Date.now().toString(),
                sender_id: currentUser.id,
                sender_name: currentUser.username,
                receiver_id: receiver_id,
                message: message,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('messages', JSON.stringify(messages));

            messageInput.value = '';
            loadMessages();
        } catch (err) {
            console.error('Error sending message', err);
        }
    });
}

async function loadUsers() {
    try {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const select = document.getElementById('userSelect');
        // Clear options except first
        while (select.options.length > 1) {
            select.remove(1);
        }
        users.forEach(u => {
            if (u.role !== 'admin') {
                const option = document.createElement('option');
                option.value = u.id;
                option.textContent = u.username;
                select.appendChild(option);
            }
        });
    } catch (err) {
        console.error('Error loading users', err);
    }
}

async function loadMessages() {
    try {
        let allMessages = JSON.parse(localStorage.getItem('messages')) || [];
        let messages = [];

        if (currentUser.role === 'admin') {
            // Admin sees all messages
            messages = allMessages;
        } else {
            // Normal user sees messages sent to or by them
            messages = allMessages.filter(m => m.sender_id === currentUser.id || m.receiver_id === currentUser.id || m.receiver_id === null || m.receiver_id === '');
        }

        const chatBox = document.getElementById('chatBox');

        // Prevent XSS by constructing DOM nodes
        const fragment = document.createDocumentFragment();

        messages.forEach(m => {
            const isSent = m.sender_name === currentUser.username;
            const msgClass = isSent ? 'msg-sent' : 'msg-received';
            const senderInfo = isSent ? 'Você' : m.sender_name;

            const div = document.createElement('div');
            div.className = `message ${msgClass}`;

            const small = document.createElement('small');
            const strong = document.createElement('strong');
            strong.textContent = senderInfo;

            small.appendChild(strong);
            small.appendChild(document.createTextNode(` - ${new Date(m.timestamp).toLocaleTimeString()}`));

            div.appendChild(small);
            div.appendChild(document.createElement('br'));

            const msgSpan = document.createElement('span');
            msgSpan.textContent = m.message;
            div.appendChild(msgSpan);

            fragment.appendChild(div);
        });

        // Clear and append only if we have changes (very simple check for now, can improve later)
        // Here we just re-render everything to be safe since we removed raw html length check
        chatBox.textContent = '';
        chatBox.appendChild(fragment);
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (err) {
        console.error('Error loading messages', err);
    }
}

// Run auth check on normal pages
if (document.getElementById('authButtons')) {
    checkAuth();
}
