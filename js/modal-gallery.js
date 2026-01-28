/**
 * Modal Gallery Handler
 * 이미지 모달의 갤러리 기능과 썸네일 네비게이션을 관리
 */
class ModalGallery {
    constructor() {
        this.images = [];
        this.currentIndex = 0;
        this.modal = null;
        this.modalImage = null;
        this.thumbnailContainer = null;
        this.prevButton = null;
        this.nextButton = null;

        // 터치 이벤트 좌표
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;

        this.init();
    }

    init() {
        this.modal = document.getElementById('image-modal');
        this.modalImage = document.getElementById('modal-image');
        this.thumbnailContainer = document.getElementById('modal-thumbnails');
        this.prevButton = document.getElementById('modal-prev');
        this.nextButton = document.getElementById('modal-next');

        if (!this.modal || !this.modalImage || !this.thumbnailContainer) {
            return;
        }

        this.bindEvents();
    }

    bindEvents() {
        // 모달 닫기 (배경 클릭)
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.close();
            }
            if (e.key === 'ArrowLeft' && !this.modal.classList.contains('hidden')) {
                this.showPrevious();
            }
            if (e.key === 'ArrowRight' && !this.modal.classList.contains('hidden')) {
                this.showNext();
            }
        });

        // 터치 스와이프 이벤트
        this.setupTouchEvents();

        // 네비게이션 버튼
        if (this.prevButton) {
            this.prevButton.addEventListener('click', () => this.showPrevious());
        }
        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => this.showNext());
        }

        // 갤러리 이미지 클릭 이벤트 등록
        this.registerGalleryClicks();
    }

    registerGalleryClicks() {
        // 메인 슬라이더 이미지 클릭
        const mainSliderImage = document.querySelector('[data-room-slider-main]');
        if (mainSliderImage) {
            mainSliderImage.addEventListener('click', () => {
                this.openWithSliderImages();
            });
        }

        // Section 4 갤러리는 모달과 관련 없음 - 제거
    }

    setupTouchEvents() {
        this.modalImage.addEventListener('touchstart', (e) => {
            if (!this.modal.classList.contains('hidden')) {
                this.startX = e.touches[0].clientX;
                this.startY = e.touches[0].clientY;
            }
        }, { passive: true });

        this.modalImage.addEventListener('touchend', (e) => {
            if (!this.modal.classList.contains('hidden')) {
                this.endX = e.changedTouches[0].clientX;
                this.endY = e.changedTouches[0].clientY;
                this.handleSwipe();
            }
        }, { passive: true });
    }

    handleSwipe() {
        const deltaX = this.endX - this.startX;
        const deltaY = this.endY - this.startY;
        const minSwipeDistance = 50;

        // 가로 스와이프가 세로 스와이프보다 클 때만 처리
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                // 오른쪽으로 스와이프 = 이전 이미지
                this.showPrevious();
            } else {
                // 왼쪽으로 스와이프 = 다음 이미지
                this.showNext();
            }
        }
    }

    openWithSliderImages() {
        // 슬라이더 이미지들로 모달 열기
        if (window.roomSlider && window.roomSlider.images) {
            this.images = window.roomSlider.images;
            this.currentIndex = window.roomSlider.currentIndex || 0;
            this.open();
        }
    }


    open() {
        if (this.images.length === 0) return;

        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        document.body.style.overflow = 'hidden';

        this.updateImage();
        this.updateThumbnails();
        this.updateNavigationButtons();
    }

    close() {
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');
        document.body.style.overflow = '';
    }

    showPrevious() {
        if (this.images.length <= 1) return;
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.updateImage();
        this.updateThumbnails();
    }

    showNext() {
        if (this.images.length <= 1) return;
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.updateImage();
        this.updateThumbnails();
    }

    updateImage() {
        const currentImage = this.images[this.currentIndex];
        if (currentImage && this.modalImage) {
            this.modalImage.src = currentImage.url;
            this.modalImage.alt = currentImage.description || 'Gallery Image';
        }
    }

    updateThumbnails() {
        if (!this.thumbnailContainer) return;

        this.thumbnailContainer.innerHTML = '';

        this.images.forEach((image, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = image.url;
            thumbnail.alt = image.description || `Thumbnail ${index + 1}`;
            thumbnail.className = `w-16 h-16 object-cover rounded cursor-pointer border-2 transition-all duration-200 ${
                index === this.currentIndex ? 'border-white opacity-100' : 'border-gray-500 opacity-60 hover:opacity-80'
            }`;

            thumbnail.addEventListener('click', () => {
                this.currentIndex = index;
                this.updateImage();
                this.updateThumbnails();
            });

            this.thumbnailContainer.appendChild(thumbnail);
        });
    }

    updateNavigationButtons() {
        if (this.images.length <= 1) {
            if (this.prevButton) this.prevButton.style.display = 'none';
            if (this.nextButton) this.nextButton.style.display = 'none';
        } else {
            if (this.prevButton) this.prevButton.style.display = 'block';
            if (this.nextButton) this.nextButton.style.display = 'block';
        }
    }
}

// DOM이 로드되면 모달 갤러리 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.modalGallery = new ModalGallery();
});

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalGallery;
} else {
    window.ModalGallery = ModalGallery;
}