import { checkAuth, setupAuthForms } from './auth.js';
import { initChat } from './chat.js';

// Initialize mock admin and messages if not exists
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([{ id: '1', username: 'admin', password: 'password', role: 'admin' }]));
}
if (!localStorage.getItem('messages')) {
    localStorage.setItem('messages', JSON.stringify([]));
}

document.addEventListener('DOMContentLoaded', () => {
    // Run auth check on normal pages that have an authButtons container
    if (document.getElementById('authButtons')) {
        checkAuth();
    }

    // Initialize auth forms if they are present on the page
    if (document.getElementById('loginForm') || document.getElementById('registerForm')) {
        setupAuthForms();
    }

    // Initialize chat if the chatBox container is present on the page
    if (document.getElementById('chatBox')) {
        initChat();
    }
});