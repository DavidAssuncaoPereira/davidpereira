/**
 * DAVID PEREIRA - MASTER JAVASCRIPT (Ultra-Modern Edition)
 * Interactions, Theme Management, Card Spotlight, Filters, Real-time Chat & Authentication
 */

// ==========================================================================
// THEME MANAGEMENT (Dark / Light Mode)
// ==========================================================================
function initTheme() {
    const savedTheme = localStorage.getItem('david_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('david_theme', newTheme);
            updateThemeIcon(newTheme);
            showToast(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado`, 'info');
        });
    }
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        if (theme === 'light') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }
}

// ==========================================================================
// TOAST NOTIFICATION SYSTEM
// ==========================================================================
function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-triangle';

    toast.innerHTML = `<i class="fas ${iconClass}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Copy Email Utility
function copyEmail() {
    const email = '3hs.david.pereira@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
        showToast('Email copiado para a área de transferência!', 'success');
    }).catch(() => {
        showToast('Email: 3hs.david.pereira@gmail.com', 'info');
    });
}

// ==========================================================================
// CARD SPOTLIGHT EFFECT (Dynamic Mouse Glow)
// ==========================================================================
function initCardSpotlight() {
    const cards = document.querySelectorAll('.spotlight-card, .project-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

// ==========================================================================
// NAVBAR & MOBILE NAVIGATION
// ==========================================================================
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        if (navbar) {
            if (window.scrollY > 40) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }

        if (backToTop) {
            if (window.scrollY > 350) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }

        // Active link spy
        const sections = document.querySelectorAll('section[id], header[id]');
        const scrollPosition = window.scrollY + 140;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            const correspondingLink = document.querySelector(`.nav-link[href="#${id}"]`);

            if (correspondingLink) {
                if (scrollPosition >= top && scrollPosition < top + height) {
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    correspondingLink.classList.add('active');
                }
            }
        });
    });

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                icon.className = navLinks.classList.contains('open') ? 'fas fa-times' : 'fas fa-bars';
            }
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                const icon = mobileToggle.querySelector('i');
                if (icon) icon.className = 'fas fa-bars';
            });
        });
    }

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// ==========================================================================
// TYPING EFFECT (HERO)
// ==========================================================================
function initTypingEffect() {
    const typedTarget = document.getElementById('typedTarget');
    if (!typedTarget) return;

    const phrases = [
        'Aplicações Web Modernas',
        'Sistemas em Tempo Real',
        'Experiências Digitais Únicas',
        'Código Limpo & Eficiente'
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 80;

    function type() {
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            typedTarget.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 40;
        } else {
            typedTarget.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 80;
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
            isDeleting = true;
            typingSpeed = 1900;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typingSpeed = 350;
        }

        setTimeout(type, typingSpeed);
    }

    type();
}

// ==========================================================================
// PROJECT FILTERING
// ==========================================================================
function initProjectFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card[data-category]');

    if (!filterButtons.length) return;

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filterValue === 'all' || category === filterValue) {
                    card.style.display = 'flex';
                    card.style.animation = 'fadeInBubble 0.35s ease';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// ==========================================================================
// QUICK CONTACT FORM
// ==========================================================================
function initQuickContact() {
    const form = document.getElementById('quickContactForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('quickName').value.trim();
        const email = document.getElementById('quickEmail').value.trim();
        const msg = document.getElementById('quickMessage').value.trim();

        if (!name || !email || !msg) {
            showToast('Por favor, preencha todos os campos.', 'error');
            return;
        }

        // Simula envio e oferece atalho para o chat
        showToast(`Obrigado ${name}! A sua mensagem foi registada. Pode também falar no chat em direto!`, 'success');
        form.reset();
    });
}

// ==========================================================================
// AUTHENTICATION STATE & NAVBAR UI
// ==========================================================================
async function checkAuth() {
    try {
        const res = await fetch('/api/auth');
        if (!res.ok) throw new Error('Auth offline');
        const data = await res.json();

        const authArea = document.getElementById('authButtons');
        if (authArea) {
            if (data.loggedIn) {
                const isAdmin = data.role === 'admin';
                authArea.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <a href="chat.html" class="btn btn-primary btn-sm">
                            <i class="fas fa-comments"></i> Mensagens ${isAdmin ? '<span style="font-size:0.7rem; background:#f59e0b; padding:1px 6px; border-radius:99px; margin-left:3px; color:#000;">ADMIN</span>' : ''}
                        </a>
                        <button onclick="logout()" class="btn btn-secondary btn-sm" title="Terminar Sessão">
                            <i class="fas fa-sign-out-alt"></i> Sair
                        </button>
                    </div>
                `;
            } else {
                authArea.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <a href="login.html" class="btn btn-secondary btn-sm">
                            <i class="fas fa-sign-in-alt"></i> Entrar
                        </a>
                        <a href="register.html" class="btn btn-primary btn-sm">
                            <i class="fas fa-user-plus"></i> Registar
                        </a>
                    </div>
                `;
            }
        }
        return data;
    } catch (err) {
        const authArea = document.getElementById('authButtons');
        if (authArea && !authArea.children.length) {
            authArea.innerHTML = `
                <a href="login.html" class="btn btn-secondary btn-sm">Entrar</a>
                <a href="register.html" class="btn btn-primary btn-sm">Registar</a>
            `;
        }
        return { loggedIn: false };
    }
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        showToast('Sessão terminada.', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    } catch (err) {
        window.location.href = 'index.html';
    }
}

// ==========================================================================
// LOGIN FORM HANDLER
// ==========================================================================
function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    const togglePassBtn = document.getElementById('togglePassword');
    const passInput = document.getElementById('password');
    if (togglePassBtn && passInput) {
        togglePassBtn.addEventListener('click', () => {
            const isPassword = passInput.getAttribute('type') === 'password';
            passInput.setAttribute('type', isPassword ? 'text' : 'password');
            togglePassBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMsg');
        const submitBtn = form.querySelector('button[type="submit"]');

        if (errorMsg) errorMsg.innerText = '';
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A entrar...';

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok) {
                showToast('Login efetuado com sucesso!', 'success');
                setTimeout(() => {
                    window.location.href = 'chat.html';
                }, 600);
            } else {
                const message = data.error || 'Erro ao entrar. Verifique os seus dados.';
                if (errorMsg) errorMsg.innerText = message;
                showToast(message, 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
            }
        } catch (err) {
            const netError = 'Não foi possível ligar ao servidor.';
            if (errorMsg) errorMsg.innerText = netError;
            showToast(netError, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
        }
    });
}

// ==========================================================================
// REGISTER FORM HANDLER
// ==========================================================================
function initRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    const togglePassBtn = document.getElementById('reg-togglePassword');
    const passInput = document.getElementById('reg-password');
    if (togglePassBtn && passInput) {
        togglePassBtn.addEventListener('click', () => {
            const isPassword = passInput.getAttribute('type') === 'password';
            passInput.setAttribute('type', isPassword ? 'text' : 'password');
            togglePassBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const errorMsg = document.getElementById('reg-errorMsg');
        const submitBtn = form.querySelector('button[type="submit"]');

        if (errorMsg) errorMsg.innerText = '';

        if (username.length < 3) {
            const msg = 'O nome de utilizador deve ter no mínimo 3 caracteres.';
            if (errorMsg) errorMsg.innerText = msg;
            showToast(msg, 'error');
            return;
        }

        if (password.length < 6) {
            const msg = 'A palavra-passe deve ter no mínimo 6 caracteres.';
            if (errorMsg) errorMsg.innerText = msg;
            showToast(msg, 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A criar conta...';

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok) {
                showToast('Conta criada com sucesso! A redirecionar para login...', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            } else {
                const message = data.error || 'Erro ao criar conta.';
                if (errorMsg) errorMsg.innerText = message;
                showToast(message, 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Registar Conta';
            }
        } catch (err) {
            const netError = 'Não foi possível ligar ao servidor.';
            if (errorMsg) errorMsg.innerText = netError;
            showToast(netError, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Registar Conta';
        }
    });
}

// ==========================================================================
// REAL-TIME CHAT ENGINE
// ==========================================================================
let currentChatUser = null;
let selectedUserIdForAdmin = null;

async function initChat() {
    const authData = await checkAuth();
    if (!authData.loggedIn) {
        window.location.href = 'login.html';
        return;
    }

    currentChatUser = authData;

    const sidebarAvatar = document.getElementById('currentUserAvatar');
    const sidebarUsername = document.getElementById('currentUsername');
    const sidebarRole = document.getElementById('currentUserRole');

    if (sidebarAvatar) sidebarAvatar.textContent = authData.username.charAt(0).toUpperCase();
    if (sidebarUsername) sidebarUsername.textContent = authData.username;
    if (sidebarRole) {
        sidebarRole.textContent = authData.role === 'admin' ? 'Administrador' : 'Utilizador';
        if (authData.role === 'admin') sidebarRole.classList.add('admin');
    }

    const interlocutorTitle = document.getElementById('interlocutorTitle');
    const adminUserListContainer = document.getElementById('adminUserList');

    if (authData.role === 'admin') {
        if (interlocutorTitle) interlocutorTitle.textContent = 'Painel de Suporte (Admin)';
        if (adminUserListContainer) adminUserListContainer.style.display = 'block';
        await loadAdminUsers();
    } else {
        if (interlocutorTitle) interlocutorTitle.textContent = 'David Pereira (Suporte / Criador)';
    }

    loadMessages();

    // WebSocket Setup
    try {
        if (typeof io !== 'undefined') {
            const socket = io();
            socket.on('newMessage', () => {
                loadMessages();
            });
        }
    } catch (e) {
        console.warn('Socket.IO connection pending or not available in this context');
    }

    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');

    if (chatForm && messageInput) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = messageInput.value.trim();
            if (!message) return;

            let receiver_id = null;
            if (currentChatUser.role === 'admin') {
                receiver_id = selectedUserIdForAdmin;
                if (!receiver_id) {
                    showToast('Selecione um utilizador na lista à esquerda para responder.', 'error');
                    return;
                }
            }

            try {
                const res = await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ receiver_id, message })
                });

                if (res.ok) {
                    messageInput.value = '';
                    loadMessages();
                } else {
                    const data = await res.json();
                    showToast(data.error || 'Erro ao enviar mensagem.', 'error');
                }
            } catch (err) {
                showToast('Erro de ligação ao enviar mensagem.', 'error');
            }
        });
    }
}

async function loadAdminUsers() {
    try {
        const res = await fetch('/api/users');
        if (!res.ok) return;
        const users = await res.json();

        const userList = document.getElementById('userItemsList');
        if (!userList) return;

        userList.innerHTML = '';
        if (users.length === 0) {
            userList.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; padding:0.5rem;">Nenhum utilizador registado ainda.</p>';
            return;
        }

        users.forEach((user, idx) => {
            const btn = document.createElement('button');
            btn.className = `user-item-btn ${idx === 0 && !selectedUserIdForAdmin ? 'active' : ''}`;
            btn.innerHTML = `
                <div class="user-avatar-badge" style="width:36px; height:36px; font-size:0.9rem;">
                    ${user.username.charAt(0).toUpperCase()}
                </div>
                <div style="flex:1; overflow:hidden;">
                    <div style="font-weight:700; font-size:0.92rem; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; color:var(--text-bright);">
                        ${user.username}
                    </div>
                    <small style="color:var(--text-muted); font-size:0.75rem;">
                        ${user.message_count ? `${user.message_count} mensagens` : 'Novo utilizador'}
                    </small>
                </div>
            `;

            btn.addEventListener('click', () => {
                document.querySelectorAll('.user-item-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedUserIdForAdmin = user.id;

                const interlocutorTitle = document.getElementById('interlocutorTitle');
                if (interlocutorTitle) interlocutorTitle.textContent = `Conversa com @${user.username}`;
                loadMessages();
            });

            userList.appendChild(btn);

            if (idx === 0 && !selectedUserIdForAdmin) {
                selectedUserIdForAdmin = user.id;
                const interlocutorTitle = document.getElementById('interlocutorTitle');
                if (interlocutorTitle) interlocutorTitle.textContent = `Conversa com @${user.username}`;
            }
        });
    } catch (err) {
        console.error('Erro ao carregar utilizadores admin', err);
    }
}

async function loadMessages() {
    try {
        let url = '/api/messages';
        if (currentChatUser && currentChatUser.role === 'admin' && selectedUserIdForAdmin) {
            url += `?user_id=${selectedUserIdForAdmin}`;
        }

        const res = await fetch(url);
        if (!res.ok) return;
        const messages = await res.json();
        const chatBox = document.getElementById('chatMessages');
        if (!chatBox) return;

        if (!messages || messages.length === 0) {
            chatBox.innerHTML = `
                <div class="chat-empty-state">
                    <i class="far fa-comments"></i>
                    <h4>Nenhuma mensagem ainda</h4>
                    <p>Escreva uma mensagem abaixo para iniciar a conversa!</p>
                </div>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();

        messages.forEach(m => {
            const isSent = m.sender_name === currentChatUser.username;
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble ${isSent ? 'sent' : 'received'}`;

            const meta = document.createElement('div');
            meta.className = 'bubble-meta';

            const senderLabel = document.createElement('strong');
            senderLabel.textContent = isSent ? 'Você' : (m.sender_name || 'Utilizador');

            const timeStr = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const timeSpan = document.createElement('span');
            timeSpan.textContent = timeStr;

            meta.appendChild(senderLabel);
            meta.appendChild(document.createTextNode(' • '));
            meta.appendChild(timeSpan);

            const content = document.createElement('div');
            content.className = 'bubble-content';
            content.textContent = m.message; // XSS Safe

            bubble.appendChild(meta);
            bubble.appendChild(content);
            fragment.appendChild(bubble);
        });

        chatBox.textContent = '';
        chatBox.appendChild(fragment);
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (err) {
        console.error('Erro ao carregar mensagens', err);
    }
}

// ==========================================================================
// DOM READY INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initTypingEffect();
    initCardSpotlight();
    initProjectFilters();
    initQuickContact();

    if (document.getElementById('authButtons')) {
        checkAuth();
    }

    initLoginForm();
    initRegisterForm();

    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});
