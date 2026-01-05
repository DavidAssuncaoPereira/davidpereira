// Main JavaScript File
import { initNavigation } from './modules/navigation.js';
import { initAnimations } from './modules/animations.js';
import { initContactForm } from './modules/contact.js';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 David Pereira Portfolio initialized');

    // Initialize modules
    initNavigation();
    initAnimations();
    initContactForm();

    // Initialize custom cursor
    initCustomCursor();

    // Initialize back to top button
    initBackToTop();

    // Initialize theme
    initTheme();

    // Initialize loading screen
    initLoadingScreen();

    // Initialize intersection observer for animations
    initIntersectionObserver();
});

// Custom Cursor
function initCustomCursor() {
    const cursorDot = document.querySelector('[data-cursor-dot]');
    const cursorOutline = document.querySelector('[data-cursor-outline]');

    if (!cursorDot || !cursorOutline) return;

    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        cursorOutline.animate(
            [
                { left: `${cursorOutline.style.left}`, top: `${cursorOutline.style.top}` },
                { left: `${posX}px`, top: `${posY}px` }
            ],
            {
                duration: 500,
                fill: 'forwards'
            }
        );
    });

    // Add active state on clickable elements
    const clickables = document.querySelectorAll('a, button, [role="button"]');
    clickables.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursorDot.classList.add('active');
            cursorOutline.classList.add('active');
        });

        element.addEventListener('mouseleave', () => {
            cursorDot.classList.remove('active');
            cursorOutline.classList.remove('active');
        });
    });
}

// Back to Top Button
function initBackToTop() {
    const backToTopButton = document.getElementById('back-to-top');
    if (!backToTopButton) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.style.opacity = '1';
            backToTopButton.style.visibility = 'visible';
        } else {
            backToTopButton.style.opacity = '0';
            backToTopButton.style.visibility = 'hidden';
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Theme Management
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeToggleMobile = document.getElementById('theme-toggle-mobile');
    const themeIconSun = document.getElementById('theme-icon-sun');
    const themeIconMoon = document.getElementById('theme-icon-moon');

    // Check for saved theme or prefer-color-scheme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
        themeIconSun?.classList.remove('hidden');
        themeIconMoon?.classList.add('hidden');
    }

    // Toggle theme function
    const toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle('dark');

        if (themeIconSun && themeIconMoon) {
            if (isDark) {
                themeIconSun.classList.remove('hidden');
                themeIconMoon.classList.add('hidden');
            } else {
                themeIconSun.classList.add('hidden');
                themeIconMoon.classList.remove('hidden');
            }
        }

        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    };

    // Add event listeners
    themeToggle?.addEventListener('click', toggleTheme);
    themeToggleMobile?.addEventListener('click', toggleTheme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                document.documentElement.classList.add('dark');
            } else