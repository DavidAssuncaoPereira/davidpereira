// Check authentication status globally
async function checkAuth() {
    try {
        const res = await fetch('/api/auth');
        const data = await res.json();

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
    await fetch('/api/logout', { method: 'POST' });
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
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok) {
                window.location.href = 'chat.html';
            } else {
                errorMsg.innerText = data.error || 'Erro ao fazer login';
            }
        } catch (err) {
            errorMsg.innerText = 'Erro de ligação.';
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
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok) {
                alert('Conta criada com sucesso! Faça login.');
                window.location.href = 'login.html';
            } else {
                errorMsg.innerText = data.error || 'Erro ao registar';
            }
        } catch (err) {
            errorMsg.innerText = 'Erro de ligação.';
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
    setInterval(loadMessages, 5000); // Polling simple every 5s

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
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiver_id, message })
            });
            messageInput.value = '';
            loadMessages();
        } catch (err) {
            console.error('Error sending message', err);
        }
    });
}

async function loadUsers() {
    try {
        const res = await fetch('/api/users');
        const users = await res.json();
        const select = document.getElementById('userSelect');
        users.forEach(u => {
            const option = document.createElement('option');
            option.value = u.id;
            option.textContent = u.username;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading users', err);
    }
}

async function loadMessages() {
    try {
        const res = await fetch('/api/messages');
        const messages = await res.json();
        const chatBox = document.getElementById('chatBox');

        let html = '';
        messages.forEach(m => {
            const isSent = m.sender_name === currentUser.username;
            const msgClass = isSent ? 'msg-sent' : 'msg-received';
            const senderInfo = isSent ? 'Você' : m.sender_name;

            html += `
                <div class="message ${msgClass}">
                    <small><strong>${senderInfo}</strong> - ${new Date(m.timestamp).toLocaleTimeString()}</small><br>
                    ${m.message}
                </div>
            `;
        });

        // Only update if changed (simplified check by length or just overwrite)
        if (chatBox.innerHTML.length !== html.length) {
            chatBox.innerHTML = html;
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    } catch (err) {
        console.error('Error loading messages', err);
    }
}

// Run auth check on normal pages
if (document.getElementById('authButtons')) {
    checkAuth();
}
