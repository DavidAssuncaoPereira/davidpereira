// ===== DOM CONTENT LOADED =====
document.addEventListener('DOMContentLoaded', function() {
    // Loading Screen
    setTimeout(() => {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
        }
    }, 1500);

    // Initialize components
    initThemeToggle();
    initMobileMenu();
    initSmoothScroll();
    initTypedText();
    initCounterAnimation();
    initScrollToTop();
    initSkillBars();
    initContactForm(); // Inicia o formulário de contacto
    updateAuthUI(); // Atualiza a UI baseada na autenticação

    // Atualiza o ano no footer
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.innerText = new Date().getFullYear();
    }
});

// ===== THEME TOGGLE =====
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const icon = themeToggle.querySelector('i');

    const savedTheme = localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');

        if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
        }
    });
}

// ===== MOBILE MENU =====
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    if (!menuToggle || !mobileMenu) return;

    menuToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        menuToggle.innerHTML = mobileMenu.classList.contains('active') ?
            '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        });
    });
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== TYPED TEXT ANIMATION =====
function initTypedText() {
    const typedTextSpan = document.getElementById('typed');
    const cursorSpan = document.querySelector('.cursor');

    if (!typedTextSpan || !cursorSpan) return;

    const textArray = [
        "Aprendiz",
        "Espírito de equipa",
        "Motivado",
        "Apaixonado por Programação"
    ];
    const typingDelay = 100;
    const erasingDelay = 50;
    const newTextDelay = 2000;
    let textArrayIndex = 0;
    let charIndex = 0;

    function type() {
        if (charIndex < textArray[textArrayIndex].length) {
            if(!cursorSpan.classList.contains("typing"))
                cursorSpan.classList.add("typing");
            typedTextSpan.textContent += textArray[textArrayIndex].charAt(charIndex);
            charIndex++;
            setTimeout(type, typingDelay);
        } else {
            cursorSpan.classList.remove("typing");
            setTimeout(erase, newTextDelay);
        }
    }

    function erase() {
        if (charIndex > 0) {
            if(!cursorSpan.classList.contains("typing"))
                cursorSpan.classList.add("typing");
            typedTextSpan.textContent = textArray[textArrayIndex].substring(0, charIndex-1);
            charIndex--;
            setTimeout(erase, erasingDelay);
        } else {
            cursorSpan.classList.remove("typing");
            textArrayIndex++;
            if(textArrayIndex >= textArray.length) textArrayIndex = 0;
            setTimeout(type, typingDelay + 1100);
        }
    }

    if(textArray.length) setTimeout(type, newTextDelay + 250);
}

// ===== COUNTER ANIMATION =====
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-count'));
                const duration = 2000;
                const step = target / (duration / 16);
                let current = 0;

                const updateCounter = () => {
                    current += step;
                    if (current < target) {
                        counter.textContent = Math.ceil(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };

                updateCounter();
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(counter => observer.observe(counter));
}

// ===== SCROLL TO TOP =====
function initScrollToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== SKILL BARS ANIMATION =====
function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-level');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const skillBar = entry.target;
                const width = skillBar.style.width;
                skillBar.style.width = '0';
                setTimeout(() => { skillBar.style.width = width; }, 300);
                observer.unobserve(skillBar);
            }
        });
    }, { threshold: 0.5 });
    skillBars.forEach(bar => observer.observe(bar));
}

// ===== CONTACT FORM =====
function initContactForm() {
    const form = document.getElementById("contactForm");

    if (form) {
        form.addEventListener("submit", async function(e) {
            e.preventDefault();

            // Botão a carregar...
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A enviar...';
            btn.disabled = true;

            const formData = new FormData(this);
            const data = Object.fromEntries(formData);

            try {
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    alert("Mensagem enviada com sucesso!");
                    form.reset();
                } else {
                    alert("Erro ao enviar mensagem.");
                }
            } catch (error) {
                console.error("Erro:", error);
                alert("Erro de conexão.");
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
}

// ===== AUTH UI =====
async function updateAuthUI() {
    try {
        const res = await fetch('/api/auth/status');
        const data = await res.json();

        const navLinks = document.querySelectorAll('.nav-links');
        const mobileNavLinks = document.querySelector('#mobileMenu ul');

        navLinks.forEach(nav => {
            const contactLink = nav.querySelector('a[href="contact.html"]')?.parentElement;

            // Avoid duplication if the script runs multiple times
            if (nav.dataset.authUpdated === 'true' && !data.loggedIn) return;

            // Remove existing auth links
            nav.querySelectorAll('.auth-link').forEach(l => l.remove());

            if (data.loggedIn) {
                // Add Chat and Logout
                const chatLi = document.createElement('li');
                chatLi.className = 'auth-link';
                chatLi.innerHTML = '<a href="chat.html" class="nav-link">Chat</a>';
                nav.insertBefore(chatLi, contactLink ? contactLink.nextSibling : null);

                if (data.user.role === 'admin') {
                    const adminLi = document.createElement('li');
                    adminLi.className = 'auth-link';
                    adminLi.innerHTML = '<a href="admin.html" class="nav-link">Admin</a>';
                    nav.insertBefore(adminLi, chatLi.nextSibling);
                }

                const logoutLi = document.createElement('li');
                logoutLi.className = 'auth-link';
                logoutLi.innerHTML = '<a href="#" id="logoutBtn" class="nav-link">Sair</a>';
                nav.appendChild(logoutLi);

                document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await fetch('/api/logout', { method: 'POST' });
                    window.location.href = 'index.html';
                });
            } else {
                // Add Login and Register
                const loginLi = document.createElement('li');
                loginLi.className = 'auth-link';
                loginLi.innerHTML = '<a href="login.html" class="nav-link">Login</a>';
                nav.appendChild(loginLi);

                const registerLi = document.createElement('li');
                registerLi.className = 'auth-link';
                registerLi.innerHTML = '<a href="register.html" class="nav-link">Registar</a>';
                nav.appendChild(registerLi);
            }
            nav.dataset.authUpdated = 'true';
        });

    } catch (error) {
        console.error("Erro ao verificar auth status:", error);
    }
}