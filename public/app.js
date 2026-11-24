/**
 * DAVID PEREIRA - SCRIPT RETRO / PROGRAMADOR (B&W)
 * Gestão de Tema, Interações Brutalistas e Formulário
 */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initContactForm();
    initFooterYear();
    initKeyboardShortcuts();
});

// ==========================================================================
// TEMA RETRO (Preto e Branco: Escuro / Claro)
// ==========================================================================
function initTheme() {
    const savedTheme = localStorage.getItem('david_retro_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeLabel(savedTheme);

    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('david_retro_theme', newTheme);
    updateThemeLabel(newTheme);
    showToast(`[ TEMA ALTERADO // MODO_${newTheme.toUpperCase()} ]`);
}

function updateThemeLabel(theme) {
    const label = document.getElementById('themeLabel');
    if (label) {
        label.textContent = theme === 'dark' ? 'CLARO' : 'ESCURO';
    }
}

// ==========================================================================
// ATALHOS DE TECLADO RETRO (Estilo Hacker / Terminal)
// ==========================================================================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignora se estiver a escrever num campo de texto
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

        if (e.key === 't' || e.key === 'T') {
            toggleTheme();
        }
    });
}

// ==========================================================================
// NAVEGAÇÃO & MENU MOBILE
// ==========================================================================
function initNavigation() {
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');

    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('header[id], section[id]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            const link = document.querySelector(`.nav-link[href="#${id}"]`);

            if (link) {
                if (scrollPos >= top && scrollPos < top + height) {
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
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
}

// ==========================================================================
// FORMULÁRIO DE CONTACTO
// ==========================================================================
function initContactForm() {
    const form = document.getElementById('retroContactForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('clientName').value.trim();
        const email = document.getElementById('clientEmail').value.trim();
        const subject = document.getElementById('clientSubject').value.trim();
        const msg = document.getElementById('clientMsg').value.trim();

        if (!name || !email || !msg) {
            showToast('[ ERRO: CAMPOS OBRIGATÓRIOS EM FALTA ]', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '>> A PROCESSAR TRANSMISSÃO...';

        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = '>> TRANSMISSÃO CONCLUÍDA [OK]';
            showToast(`[ DADOS RECEBIDOS // REGISTO_${Date.now().toString().slice(-4)} // OBRIGADO ${name.toUpperCase()} ]`, 'success');
            form.reset();

            setTimeout(() => {
                submitBtn.textContent = '[ ENVIAR_DADOS_DE_CONTACTO ]';
            }, 3500);
        }, 500);
    });
}

// ==========================================================================
// UTILITÁRIO: COPIAR EMAIL
// ==========================================================================
function copyEmail() {
    const email = '3hs.david.pereira@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
        showToast('[ COPIADO // 3hs.david.pereira@gmail.com ]', 'success');
    }).catch(() => {
        showToast('[ EMAIL: 3hs.david.pereira@gmail.com ]');
    });
}

// ==========================================================================
// NOTIFICAÇÃO RETRO (Toast Monocromático)
// ==========================================================================
function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-terminal"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 200);
    }, 4000);
}

// ==========================================================================
// ANO AUTOMÁTICO NO RODAPÉ
// ==========================================================================
function initFooterYear() {
    const yearEl = document.getElementById('currentYear');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}
