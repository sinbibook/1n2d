/**
 * Facility Page Functionality
 * 시설 페이지 기능 (헤더/푸터 로딩 포함)
 */

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load data mapper for content mapping
    setTimeout(() => {
        loadDataMapper();
    }, 100);
});

/**
 * Data mapper loader and initializer
 */
async function loadDataMapper() {
    // iframe 환경(어드민 미리보기)에서는 PreviewHandler가 초기화 담당
    if (window.APP_CONFIG && window.APP_CONFIG.isInIframe()) {
        return;
    }

    try {
        const dataPath = window.APP_CONFIG
            ? window.APP_CONFIG.getResourcePath('standard-template-data.json')
            : './standard-template-data.json';
        const response = await fetch(dataPath);
        const data = await response.json();

        window.dogFriendlyDataMapper = {
            data: data,
            isDataLoaded: true
        };

        if (window.FacilityMapper) {
            const mapper = new FacilityMapper(data);
            mapper.mapPage();
        } else {
            setTimeout(() => {
                if (window.FacilityMapper) {
                    const mapper = new FacilityMapper(data);
                    mapper.mapPage();
                }
            }, 1000);
        }

        setTimeout(() => {
            if (window.HeaderFooterMapper) {
                const headerFooterMapper = new HeaderFooterMapper();
                headerFooterMapper.data = data;
                headerFooterMapper.isDataLoaded = true;
                headerFooterMapper.mapHeaderFooter();
            }
        }, 1500);
    } catch (error) {
    }
}

// Navigation function
function navigateToHome() {
    window.location.href = 'index.html';
}

// Facility Slider Functions
window.facilityCurrentSlide = 0;
window.facilityTotalSlides = 1;

function updateFacilitySlider() {
    const slides = document.querySelectorAll('.facility-slide');
    const indicators = document.querySelectorAll('.facility-indicator');

    slides.forEach((slide, index) => {
        slide.style.opacity = index === window.facilityCurrentSlide ? '1' : '0';
    });

    indicators.forEach((indicator, index) => {
        indicator.style.background = index === window.facilityCurrentSlide ? 'white' : 'rgba(255,255,255,0.5)';
    });
}

function nextFacilitySlide() {
    if (window.facilityTotalSlides <= 1) return;

    window.facilityCurrentSlide = (window.facilityCurrentSlide + 1) % window.facilityTotalSlides;
    updateFacilitySlider();
}

function prevFacilitySlide() {
    if (window.facilityTotalSlides <= 1) return;

    window.facilityCurrentSlide = window.facilityCurrentSlide === 0
        ? window.facilityTotalSlides - 1
        : window.facilityCurrentSlide - 1;
    updateFacilitySlider();
}

function goToFacilitySlide(index) {
    if (index >= 0 && index < window.facilityTotalSlides) {
        window.facilityCurrentSlide = index;
        updateFacilitySlider();
    }
}

// Auto-play functionality (optional)
let facilityAutoSlideTimer;
function startFacilityAutoSlide() {
    if (window.facilityTotalSlides <= 1) return;

    facilityAutoSlideTimer = setInterval(() => {
        nextFacilitySlide();
    }, 4000); // 4초마다 자동 슬라이드
}

function stopFacilityAutoSlide() {
    if (facilityAutoSlideTimer) {
        clearInterval(facilityAutoSlideTimer);
    }
}

// Touch 슬라이드 변수
let facilityTouchStartX = 0;
let facilityTouchEndX = 0;
let facilityIsTouchMove = false;

// Touch 이벤트 핸들러
function handleFacilityTouchStart(e) {
    facilityTouchStartX = e.changedTouches[0].screenX;
    facilityIsTouchMove = false;
}

function handleFacilityTouchMove(e) {
    facilityIsTouchMove = true;
}

function handleFacilityTouchEnd(e) {
    facilityTouchEndX = e.changedTouches[0].screenX;

    if (!facilityIsTouchMove) return;

    const threshold = 50; // 최소 스와이프 거리
    const swipeDistance = facilityTouchStartX - facilityTouchEndX;

    if (Math.abs(swipeDistance) > threshold) {
        if (swipeDistance > 0) {
            // 왼쪽으로 스와이프 = 다음 슬라이드
            nextFacilitySlide();
        } else {
            // 오른쪽으로 스와이프 = 이전 슬라이드
            prevFacilitySlide();
        }
    }
}

// Adaptive Facility Gallery - Grid or Slider based on image count
const facilityGallery = {
    currentIndex: 0,
    autoplayInterval: null,
    autoplayDelay: 3000,
    isSliding: false,

    // Sample data - This can be replaced with dynamic JSON data
    images: [
        {
            url: '',
            title: '메인 라운지',
            description: '편안한 휴식 공간'
        },
        {
            url: '',
            title: '야외 테라스',
            description: '자연과 함께하는 공간'
        },
        {
            url: '',
            title: '반려견 놀이터',
            description: '안전한 놀이 공간'
        },
        {
            url: '',
            title: '객실',
            description: '편안한 숙소'
        },
        {
            url: '',
            title: '욕실',
            description: '깨끗한 욕실'
        }
    ],

    init() {
        const container = document.getElementById('facility-gallery-container');
        if (!container) {
            return;
        }

        const imageCount = this.images.length;

        if (imageCount === 0) {
            // 이미지가 없을 때 3개 placeholder 그리드 생성
            this.createPlaceholderGrid(container);
            return;
        }

        if (imageCount <= 3) {
            this.createGrid(container, imageCount);
        } else {
            this.createSlider(container);
        }
    },

    createGrid(container, count) {
        const gridClass = `gallery-grid gallery-grid-${count}`;
        container.innerHTML = `<div class="${gridClass}"></div>`;
        const grid = container.querySelector('.gallery-grid');

        // Create grid items
        for (let i = 0; i < count; i++) {
            const item = this.images[i];
            const gridItem = document.createElement('div');
            gridItem.className = 'gallery-item';

            const isMobile = window.innerWidth <= 768;

            if (!isMobile) {
                // 데스크탑에서만 이미지 개수에 따라 높이 다르게 설정
                if (count === 1) {
                    gridItem.style.height = '600px';
                } else if (count === 2) {
                    gridItem.style.height = '500px';
                } else if (count === 3) {
                    // Center image larger for 3-image layout
                    if (i === 1) {
                        gridItem.style.height = '500px';
                        gridItem.style.marginTop = '-50px'; // 중앙 이미지 50px 위로 조정
                    } else {
                        gridItem.style.height = '400px';
                    }
                }
            }

            // 이미지 컨테이너 div 생성
            const imageContainer = document.createElement('div');
            imageContainer.className = 'relative overflow-hidden rounded-lg aspect-[4/3] bg-gray-100';
            imageContainer.style.cssText = 'width: 100%; height: 100%;';

            if (item.url && item.url.trim() !== '') {
                // 이미지가 있는 경우
                const img = document.createElement('img');
                img.src = item.url;
                img.alt = 'Gallery Image';
                img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; display: block;';
                imageContainer.appendChild(img);
            } else {
                // 이미지가 없는 경우 - 기존 empty-image-placeholder 방식으로 일관성 유지
                const img = document.createElement('img');
                img.src = '';
                img.alt = 'No Image Available';
                img.className = 'w-full h-full object-cover empty-image-placeholder';
                img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; display: block; min-height: 300px;';
                imageContainer.appendChild(img);
            }

            gridItem.appendChild(imageContainer);

            grid.appendChild(gridItem);
        }
    },

    createSlider(container) {
        container.innerHTML = `
            <div class="gallery-slider">
                <div class="slider-track-container">
                    <div class="slider-track"></div>
                </div>
                <button class="slider-nav prev" onclick="facilityGallery.prev()">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>
                <button class="slider-nav next" onclick="facilityGallery.next()">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path>
                    </svg>
                </button>
            </div>
        `;

        const track = container.querySelector('.slider-track');

        // Create slider items
        this.images.forEach((item, index) => {
            const sliderItem = document.createElement('div');
            sliderItem.className = 'slider-item';
            sliderItem.innerHTML = `
                <img src="${item.url}" alt="Gallery Image" onload="this.classList.remove('empty-image-placeholder')" onerror="this.classList.add('empty-image-placeholder')">
            `;
            track.appendChild(sliderItem);
        });

        // Clone first and last items for infinite loop
        const firstClone = track.children[0].cloneNode(true);
        const lastClone = track.children[track.children.length - 1].cloneNode(true);
        track.appendChild(firstClone);
        track.insertBefore(lastClone, track.children[0]);

        // Set initial position to show first real image in center
        this.currentIndex = 1; // First real image is at index 1 (after clone)

        // Initialize position and classes immediately
        this.updateSliderPosition(false);

        // Start autoplay
        this.startAutoplay();

        // Pause on hover
        container.querySelector('.gallery-slider').addEventListener('mouseenter', () => {
            this.stopAutoplay();
        });

        container.querySelector('.gallery-slider').addEventListener('mouseleave', () => {
            this.startAutoplay();
        });
    },

    updateSliderPosition(animate = true) {
        const track = document.querySelector('.slider-track');
        if (!track) return;

        const sliderContainer = document.querySelector('.slider-track-container');
        if (!sliderContainer) return;

        // Fixed sizes for items
        const items = track.querySelectorAll('.slider-item');
        const containerWidth = sliderContainer.offsetWidth;

        // Check if mobile
        const isMobile = window.innerWidth <= 768;

        let offset;

        if (isMobile) {
            // Mobile: center the active item perfectly (no gap)
            const itemWidth = containerWidth; // 100% width on mobile

            // Simply move by full container width for each slide
            offset = -((this.currentIndex - 1) * itemWidth);
        } else {
            // Desktop: show 3 items as before
            const centerItemWidth = 520;
            const sideItemWidth = 320;
            const gap = 20;

            // Calculate to always show 3 items centered in container
            const threeItemsWidth = sideItemWidth + gap + centerItemWidth + gap + sideItemWidth;
            const containerCenter = containerWidth / 2;
            const threeItemsCenter = threeItemsWidth / 2;

            // Base offset to center the 3-item group in container
            const baseOffset = containerCenter - threeItemsCenter;

            // Adjust position based on current index
            const itemStep = sideItemWidth + gap;
            offset = baseOffset - ((this.currentIndex - 1) * itemStep);
        }

        if (animate) {
            track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
            track.style.transition = 'none';
        }

        track.style.transform = `translateX(${offset}px)`;

        // Update active states - only for desktop
        if (!isMobile) {
            items.forEach((item, index) => {
                item.classList.remove('active', 'side');

                if (index === this.currentIndex) {
                    // Current index item is the center (large)
                    item.classList.add('active');
                } else if (index === this.currentIndex - 1 || index === this.currentIndex + 1) {
                    // Adjacent items are sides (smaller)
                    item.classList.add('side');
                }
            });
        } else {
            // Mobile: remove all active/side classes for simple slider
            items.forEach((item) => {
                item.classList.remove('active', 'side');
            });
        }
    },

    next() {
        if (this.isSliding) return;
        this.isSliding = true;

        this.currentIndex++;
        this.updateSliderPosition();

        // Handle infinite loop
        setTimeout(() => {
            if (this.currentIndex >= this.images.length + 1) {
                this.currentIndex = 1;
                this.updateSliderPosition(false);
            }
            this.isSliding = false;
        }, 500);
    },

    prev() {
        if (this.isSliding) return;
        this.isSliding = true;

        this.currentIndex--;
        this.updateSliderPosition();

        // Handle infinite loop
        setTimeout(() => {
            if (this.currentIndex <= 0) {
                this.currentIndex = this.images.length;
                this.updateSliderPosition(false);
            }
            this.isSliding = false;
        }, 500);
    },

    startAutoplay() {
        this.stopAutoplay();
        this.autoplayInterval = setInterval(() => {
            this.next();
        }, this.autoplayDelay);
    },

    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    },

    createPlaceholderGrid(container) {
        // 3개 placeholder 이미지 그리드 생성
        const gridClass = 'gallery-grid gallery-grid-3';
        container.innerHTML = `<div class="${gridClass}"></div>`;
        const grid = container.querySelector('.gallery-grid');

        // 3개 placeholder 아이템 생성
        for (let i = 0; i < 3; i++) {
            const gridItem = document.createElement('div');
            gridItem.className = 'gallery-item';

            const isMobile = window.innerWidth <= 768;

            if (!isMobile) {
                if (i === 1) {
                    gridItem.style.height = '500px';
                    gridItem.style.marginTop = '-50px';
                } else {
                    gridItem.style.height = '400px';
                }
            }

            const img = document.createElement('img');
            img.src = '';
            img.alt = 'No Image Available';
            img.className = 'w-full h-full object-cover empty-image-placeholder';
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; display: block; min-height: 300px;';

            gridItem.appendChild(img);
            grid.appendChild(gridItem);
        }
    }
};

window.facilityGallery = facilityGallery;

// Image Modal functionality
const imageModal = {
    modal: null,
    modalImage: null,
    modalClose: null,
    modalPrev: null,
    modalNext: null,
    currentImages: [],
    currentIndex: 0,

    init() {
        this.modal = document.getElementById('image-modal');
        this.modalImage = document.getElementById('modal-image');
        this.modalClose = document.getElementById('modal-close');
        this.modalPrev = document.getElementById('modal-prev');
        this.modalNext = document.getElementById('modal-next');

        if (!this.modal) {
            return;
        }

        // Event listeners
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.modalPrev.addEventListener('click', () => this.modalPrevImage());
        this.modalNext.addEventListener('click', () => this.modalNextImage());

        // Close modal on background click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.modal.classList.contains('hidden')) {
                return;
            }
            switch (e.key) {
                case 'Escape':
                    this.closeModal();
                    break;
                case 'ArrowLeft':
                    this.modalPrevImage();
                    break;
                case 'ArrowRight':
                    this.modalNextImage();
                    break;
            }
        });

        this.setupImageClickHandlers();
    },

    setupImageClickHandlers() {
        // Add click handlers to gallery images
        document.addEventListener('click', (e) => {
            const galleryImage = e.target.closest('.gallery-item img, .slider-item img');
            if (galleryImage && !galleryImage.classList.contains('empty-image-placeholder')) {
                e.preventDefault();
                this.openModal(galleryImage);
            }
        });
    },

    openModal(clickedImage) {
        const galleryImages = document.querySelectorAll('.gallery-item img, .slider-item img');
        this.currentImages = Array.from(galleryImages)
            .filter(img => !img.classList.contains('empty-image-placeholder') && img.src)
            .map(img => ({
                url: img.src,
                alt: img.alt || 'Gallery Image'
            }));

        if (this.currentImages.length === 0) return;

        this.currentIndex = this.currentImages.findIndex(img => img.url === clickedImage.src);
        if (this.currentIndex === -1) this.currentIndex = 0;

        this.updateModalImage();

        // Save current scroll position
        const scrollY = window.scrollY;
        document.body.style.top = `-${scrollY}px`;

        // Show modal and prevent body scroll
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        document.body.classList.add('modal-open');
    },

    closeModal() {
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');

        // Restore scroll position
        const scrollY = document.body.style.top;
        document.body.classList.remove('modal-open');
        document.body.style.top = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
    },

    updateModalImage() {
        if (!this.currentImages || this.currentImages.length === 0) return;
        const image = this.currentImages[this.currentIndex];
        this.modalImage.src = image.url;
        this.modalImage.alt = image.alt;
    },

    modalPrevImage() {
        if (this.currentImages.length <= 1) return;

        this.currentIndex = (this.currentIndex - 1 + this.currentImages.length) % this.currentImages.length;
        this.updateModalImage();
    },

    modalNextImage() {
        if (this.currentImages.length <= 1) return;

        this.currentIndex = (this.currentIndex + 1) % this.currentImages.length;
        this.updateModalImage();
    }
};

// Initialize modal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const initModalWhenReady = (retries = 0) => {
        const galleryContent = document.querySelector('#facility-gallery-container .gallery-grid, #facility-gallery-container .gallery-slider');
        if (galleryContent) {
            imageModal.init();
        } else if (retries < 50) { // Wait up to 5 seconds
            setTimeout(() => initModalWhenReady(retries + 1), 100);
        } else {
        }
    };
    initModalWhenReady();
});

window.imageModal = imageModal;

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    facilityGallery.stopAutoplay();
});

