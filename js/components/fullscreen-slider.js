// Reusable Fullscreen Slider Component
class FullscreenSlider {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.warn(`Fullscreen slider container not found: ${containerSelector}`);
            return;
        }

        this.slides = this.container.querySelectorAll('.fullscreen-slide');
        this.navCurrent = this.container.querySelector('.nav-current');
        this.navTotal = this.container.querySelector('.nav-total');
        this.prevBtn = this.container.querySelector('.nav-prev');
        this.nextBtn = this.container.querySelector('.nav-next');
        this.sliderInner = this.container.querySelector('.fullscreen-slider-inner');

        this.currentSlide = 0;
        this.slideInterval = null;
        this.isTransitioning = false;

        // Options with defaults
        this.options = {
            slideDuration: options.slideDuration || 3000,
            autoplay: options.autoplay !== false, // default true
            enableSwipe: options.enableSwipe !== false, // default true
            enableKeyboard: options.enableKeyboard !== false, // default true
            ...options
        };

        this.init();
    }

    init() {
        if (this.slides.length === 0) return;

        this.setupNavigation();
        this.setupEventListeners();

        if (this.options.enableSwipe) {
            this.setupSwipe();
        }

        if (this.options.enableKeyboard) {
            this.setupKeyboard();
        }

        if (this.options.autoplay) {
            this.startAutoSlide();
        }

        // Setup pause on hover
        this.setupHoverPause();
    }

    setupNavigation() {
        // Set total slides
        if (this.navTotal) {
            this.navTotal.textContent = this.slides.length.toString().padStart(2, '0');
        }

        // Update current slide number
        this.updateSlideNumber();
    }

    setupEventListeners() {
        // Arrow button clicks
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prevSlide());
        }

        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextSlide());
        }

        // Navigation area click for next slide
        const navElement = this.container.querySelector('.fullscreen-slider-nav');
        if (navElement) {
            navElement.addEventListener('click', (e) => {
                // Only if not clicking on arrow buttons
                if (!e.target.classList.contains('nav-arrow')) {
                    this.nextSlide();
                }
            });
        }
    }

    setupSwipe() {
        if (!this.sliderInner) return;

        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let currentY = 0;
        let isDragging = false;
        const threshold = 50; // Minimum distance for swipe

        // Mouse events
        this.sliderInner.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startX = e.clientX;
            startY = e.clientY;
            isDragging = true;
            this.stopAutoSlide();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            currentX = e.clientX;
            currentY = e.clientY;
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            this.handleSwipeEnd(startX, startY, currentX, currentY, threshold);
            isDragging = false;
            if (this.options.autoplay) {
                this.startAutoSlide();
            }
        });

        // Touch events
        this.sliderInner.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            this.stopAutoSlide();
        }, { passive: true });

        this.sliderInner.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            currentX = touch.clientX;
            currentY = touch.clientY;
        }, { passive: true });

        this.sliderInner.addEventListener('touchend', () => {
            this.handleSwipeEnd(startX, startY, currentX, currentY, threshold);
            if (this.options.autoplay) {
                this.startAutoSlide();
            }
        });
    }

    handleSwipeEnd(startX, startY, endX, endY, threshold) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;

        // Check if horizontal swipe is stronger than vertical
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
            if (deltaX > 0) {
                this.prevSlide(); // Swipe right - previous slide
            } else {
                this.nextSlide(); // Swipe left - next slide
            }
        }
    }

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.prevSlide();
            } else if (e.key === 'ArrowRight') {
                this.nextSlide();
            }
        });
    }

    setupHoverPause() {
        if (this.container) {
            this.container.addEventListener('mouseenter', () => {
                this.stopAutoSlide();
            });

            this.container.addEventListener('mouseleave', () => {
                if (this.options.autoplay) {
                    this.startAutoSlide();
                }
            });
        }
    }

    nextSlide() {
        if (this.isTransitioning || this.slides.length === 0) return;

        this.isTransitioning = true;

        // Remove active from current slide
        this.slides[this.currentSlide].classList.remove('active');

        // Move to next slide (with loop)
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;

        // Add active to new slide
        this.slides[this.currentSlide].classList.add('active');

        // Update navigation
        this.updateSlideNumber();

        // Reset transition flag after animation
        setTimeout(() => {
            this.isTransitioning = false;
        }, 1000); // Match CSS transition duration
    }

    prevSlide() {
        if (this.isTransitioning || this.slides.length === 0) return;

        this.isTransitioning = true;

        // Remove active from current slide
        this.slides[this.currentSlide].classList.remove('active');

        // Move to previous slide (with loop)
        this.currentSlide = this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;

        // Add active to new slide
        this.slides[this.currentSlide].classList.add('active');

        // Update navigation
        this.updateSlideNumber();

        // Reset transition flag after animation
        setTimeout(() => {
            this.isTransitioning = false;
        }, 1000); // Match CSS transition duration
    }

    updateSlideNumber() {
        if (this.navCurrent) {
            this.navCurrent.textContent = (this.currentSlide + 1).toString().padStart(2, '0');
        }
    }

    startAutoSlide() {
        if (!this.options.autoplay) return;
        this.slideInterval = setInterval(() => {
            this.nextSlide();
        }, this.options.slideDuration);
    }

    stopAutoSlide() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
    }

    // Public methods
    goToSlide(index) {
        if (index < 0 || index >= this.slides.length || index === this.currentSlide) return;

        this.slides[this.currentSlide].classList.remove('active');
        this.currentSlide = index;
        this.slides[this.currentSlide].classList.add('active');
        this.updateSlideNumber();
    }

    destroy() {
        this.stopAutoSlide();
        // Remove event listeners if needed
    }
}

// Export for use in other files
window.FullscreenSlider = FullscreenSlider;