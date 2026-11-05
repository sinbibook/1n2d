/* Layout Map Page Script */

(function() {
    window.scrollToContent = function() {
        const scrollTarget = document.querySelector('.scroll-target');
        if (scrollTarget) {
            scrollTarget.scrollIntoView({ behavior: 'smooth' });
        }
    };

    window.setupLayoutMapAnimations = function() {
        // Layout map animations are handled by scroll-animations.js
    };
})();
