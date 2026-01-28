/**
 * Room Image Slider
 * Handles the image slider functionality for room.html
 */
class RoomSlider {
    constructor() {
        this.currentIndex = 0;
        this.images = [];
        this.initialized = false;
        this.init();
    }

    /**
     * Initialize slider functionality
     */
    init() {
        // Wait for DOM and data to be ready
        document.addEventListener('DOMContentLoaded', () => {
            this.setupSlider();
        });

        // Also try to setup immediately in case DOM is already loaded
        if (document.readyState === 'loading') {
            // DOM hasn't finished loading yet
        } else {
            // DOM is already loaded
            this.setupSlider();
        }
    }

    /**
     * Setup slider elements and event listeners
     */
    setupSlider() {
        this.mainImage = document.getElementById('main-slider-image');
        this.prevBtn = document.getElementById('room-slider-prev');
        this.nextBtn = document.getElementById('room-slider-next');

        if (!this.mainImage) {
            return;
        }

        // Setup navigation buttons
        this.setupNavigationButtons();

        // Setup modal elements
        this.setupModal();

        this.initialized = true;
    }

    /**
     * Setup navigation button functionality
     */
    setupNavigationButtons() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => {
                this.stopAutoPlay(); // 버튼 클릭 시 자동 재생 중지
                this.previousSlide();
                this.startAutoPlay(3000); // 3초 후 다시 자동 재생 시작
            });
        }

        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => {
                this.stopAutoPlay(); // 버튼 클릭 시 자동 재생 중지
                this.nextSlide();
                this.startAutoPlay(3000); // 3초 후 다시 자동 재생 시작
            });
        }
    }

    /**
     * Setup modal functionality
     */
    setupModal() {
        this.modal = document.getElementById('image-modal');
        this.modalImage = document.getElementById('modal-image');
        this.modalClose = document.getElementById('modal-close');
        this.modalPrev = document.getElementById('modal-prev');
        this.modalNext = document.getElementById('modal-next');

        if (!this.modal) {
            return;
        }

        // Add click event to main image
        this.mainImage.addEventListener('click', () => this.openModal());
        this.mainImage.style.cursor = 'pointer';

        // Modal controls
        if (this.modalClose) {
            this.modalClose.addEventListener('click', () => this.closeModal());
        }
        if (this.modalPrev) {
            this.modalPrev.addEventListener('click', () => this.modalPrevImage());
        }
        if (this.modalNext) {
            this.modalNext.addEventListener('click', () => this.modalNextImage());
        }

        // Close modal on background click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.modal.classList.contains('hidden')) {
                if (e.key === 'Escape') this.closeModal();
                if (e.key === 'ArrowLeft') this.modalPrevImage();
                if (e.key === 'ArrowRight') this.modalNextImage();
            }
        });
    }


    /**
     * Show empty placeholder when no images available
     */
    showPlaceholder() {
        if (this.mainImage) {
            this.mainImage.src = '';
            this.mainImage.alt = '이미지 없음';
            this.mainImage.classList.add('empty-image-placeholder');
        }
    }

    /**
     * Load images from room data
     */
    loadImages(roomImages) {
        if (!roomImages || roomImages.length === 0) {
            return;
        }

        this.images = roomImages;
        this.currentIndex = 0;
        this.updateSlider();

        // Restart auto-play with new images
        this.startAutoPlay(3000);

    }

    /**
     * Go to specific slide
     */
    goToSlide(index) {
        if (index < 0 || index >= this.images.length) return;

        this.currentIndex = index;
        this.updateSlider();
    }

    /**
     * Go to next slide
     */
    nextSlide() {
        const nextIndex = (this.currentIndex + 1) % this.images.length;
        this.goToSlide(nextIndex);
    }

    /**
     * Go to previous slide
     */
    previousSlide() {
        const prevIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.goToSlide(prevIndex);
    }

    /**
     * Update slider display
     */
    updateSlider() {
        if (this.images.length === 0 || !this.mainImage) return;

        const currentImage = this.images[this.currentIndex];


        // Update main image
        if (currentImage && currentImage.url) {
            this.mainImage.src = currentImage.url;
            this.mainImage.alt = currentImage.description || `객실 이미지 ${this.currentIndex + 1}`;
            this.mainImage.style.opacity = '1';
            this.mainImage.style.display = 'block';

            // Remove empty placeholder class that could be hiding the image
            this.mainImage.classList.remove('empty-image-placeholder');

        }
    }

    /**
     * Update navigation button states
     */
    updateNavigationButtons() {
        if (!this.prevBtn || !this.nextBtn) return;

        // Always enable buttons for circular navigation
        this.prevBtn.style.opacity = '1';
        this.nextBtn.style.opacity = '1';
        this.prevBtn.disabled = false;
        this.nextBtn.disabled = false;
    }

    /**
     * Auto-play functionality
     */
    startAutoPlay(interval = 5000) {
        this.stopAutoPlay(); // Clear any existing interval

        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, interval);

    }

    /**
     * Stop auto-play
     */
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    /**
     * Get current image
     */
    getCurrentImage() {
        return this.images[this.currentIndex];
    }

    /**
     * Get total image count
     */
    getImageCount() {
        return this.images.length;
    }

    /**
     * Open modal with current image
     */
    openModal() {
        if (this.images.length === 0) return;

        const currentImage = this.images[this.currentIndex];
        this.modalImage.src = currentImage.url;
        this.modalImage.alt = currentImage.description;

        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        // Prevent scrolling on both html and body
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

    }

    /**
     * Close modal
     */
    closeModal() {
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');
        // Restore scrolling by removing styles from both html and body
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';

    }

    /**
     * Show previous image in modal
     */
    modalPrevImage() {
        const prevIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.currentIndex = prevIndex;

        const currentImage = this.images[this.currentIndex];
        this.modalImage.src = currentImage.url;
        this.modalImage.alt = currentImage.description;
    }

    /**
     * Show next image in modal
     */
    modalNextImage() {
        const nextIndex = (this.currentIndex + 1) % this.images.length;
        this.currentIndex = nextIndex;

        const currentImage = this.images[this.currentIndex];
        this.modalImage.src = currentImage.url;
        this.modalImage.alt = currentImage.description;
    }
}

// Initialize when DOM is ready
let roomSlider;
document.addEventListener('DOMContentLoaded', () => {
    roomSlider = new RoomSlider();
    window.roomSlider = roomSlider; // Make it globally accessible
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoomSlider;
}