// Check authentication status globally
export async function checkAuth() {
    try {
        const activeUser = JSON.parse(sessionStorage.getItem('activeUser'));
        const data = activeUser ? { loggedIn: true, ...activeUser } : { loggedIn: false };

        const authButtons = document.getElementById('authButtons');
        if (authButtons) {
            if (data.loggedIn) {
                authButtons.innerHTML = `
                    <a href="chat.html" class="btn">Mensagens</a>
                    <button id="logoutBtnNav" class="btn btn-outline">Sair</button>
                `;
                document.getElementById('logoutBtnNav').addEventListener('click', logout);
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

export async function logout() {
    sessionStorage.removeItem('activeUser');
    window.location.href = 'index.html';
}

export function setupAuthForms() {
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
}