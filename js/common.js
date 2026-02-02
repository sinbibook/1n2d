// Common JavaScript functions
(function() {
    'use strict';

    // Page load animation for main content sections
    function initPageLoadAnimation() {
        // Add fade-in animation to main content elements
        setTimeout(() => {
            const fadeElements = document.querySelectorAll('.main-content-fade-in');
            fadeElements.forEach((element, index) => {
                setTimeout(() => {
                    element.classList.add('animate');
                }, 300 + (index * 150)); // Start after page fade-in
            });
        }, 100);
    }

    // Also trigger animations on scroll for better UX
    function handleScrollAnimations() {
        const fadeElements = document.querySelectorAll('.main-content-fade-in:not(.animate)');

        fadeElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 100;

            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('animate');
            }
        });
    }

    // Scroll to next section function
    window.scrollToNextSection = function() {
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            const nextSection = heroSection.nextElementSibling;
            if (nextSection) {
                nextSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    };

    // Initialize page load animation when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initPageLoadAnimation();
            window.addEventListener('scroll', handleScrollAnimations);
        });
    } else {
        initPageLoadAnimation();
        window.addEventListener('scroll', handleScrollAnimations);
    }

})();