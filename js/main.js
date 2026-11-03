document.addEventListener('DOMContentLoaded', () => {
    // Scroll animations using IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-up');
    animatedElements.forEach(element => {
        observer.observe(element);
    });
});