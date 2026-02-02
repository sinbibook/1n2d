/**
 * Hero Slider with Zoom Animation
 */
class HeroSlider {
    constructor() {
        this.currentSlide = 0;
        this.totalSlides = 0;
        this.slideDuration = 4000; // 4초
        this.slides = [];
        this.progressFill = null;
        this.sliderContainer = null;
        this.autoSlideInterval = null;
    }

    init() {
        this.sliderContainer = document.querySelector('[data-hero-slider]');
        this.progressFill = document.querySelector('[data-hero-progress]');

        if (!this.sliderContainer) return;

        this.loadSlides();

        // 슬라이드가 1개 이하면 자동슬라이드 비활성화
        if (this.totalSlides <= 1) {
            this.updateIndicators();
            if (this.slides[0]) {
                this.startZoomAnimation(this.slides[0]);
            }
            return;
        }

        this.updateIndicators();
        this.startAutoSlide();
    }

    loadSlides() {
        // mapper가 생성한 슬라이드 사용
        this.slides = Array.from(this.sliderContainer.querySelectorAll('.hero-slide'));
        this.totalSlides = this.slides.length;

        // 첫 번째 슬라이드 줌인 시작
        if (this.slides[0]) {
            this.startZoomAnimation(this.slides[0]);
        }
    }

    startZoomAnimation(slide) {
        const img = slide.querySelector('img');
        if (img) {
            // 줌 아웃 상태로 초기화
            img.style.transform = 'scale(1)';
            img.style.transition = 'none';

            // 약간의 지연 후 줌인 시작
            setTimeout(() => {
                img.style.transition = `transform ${this.slideDuration}ms ease-out`;
                img.style.transform = 'scale(1.15)';
            }, 100);
        }
    }

    nextSlide() {
        // 현재 슬라이드를 비활성화
        this.slides[this.currentSlide].classList.remove('active');

        // 다음 슬라이드로 이동
        this.currentSlide = (this.currentSlide + 1) % this.totalSlides;

        // 새 슬라이드 활성화
        this.slides[this.currentSlide].classList.add('active');

        // 줌인 애니메이션 시작
        this.startZoomAnimation(this.slides[this.currentSlide]);

        // 인디케이터 업데이트
        this.updateIndicators();
    }

    updateIndicators() {
        const currentEl = document.querySelector('[data-current-slide]');
        const totalEl = document.querySelector('[data-total-slides]');

        if (currentEl) {
            currentEl.textContent = String(this.currentSlide + 1).padStart(2, '0');
        }
        if (totalEl) {
            totalEl.textContent = String(this.totalSlides).padStart(2, '0');
        }
    }

    animateProgress() {
        if (!this.progressFill) return;

        // 프로그레스바 초기화
        this.progressFill.style.transition = 'none';
        this.progressFill.style.width = '0%';

        // 강제 리플로우
        this.progressFill.offsetHeight;

        // 애니메이션 시작
        setTimeout(() => {
            this.progressFill.style.transition = `width ${this.slideDuration}ms linear`;
            this.progressFill.style.width = '100%';
        }, 50);
    }

    startAutoSlide() {
        // 첫 번째 프로그레스바 애니메이션 시작
        this.animateProgress();

        this.autoSlideInterval = setInterval(() => {
            this.nextSlide();
            this.animateProgress();
        }, this.slideDuration);
    }

    stop() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
            this.autoSlideInterval = null;
        }
    }
}

/**
 * Gallery Slider - Flex 기반 깔끔한 캐러셀
 */
class GallerySlider {
    constructor() {
        this.slider = null;
        this.index = 0;
        this.intervalId = null;
        this.isPaused = false;
        this.slideDuration = 3000; // 3초마다 슬라이드
        this.slideCount = 0;

        // 상수 정의
        this.SLIDE_GAP = 30;           // 슬라이드 간 간격 (px)
        this.INITIAL_DELAY = 2000;     // 초기 자동 슬라이드 지연 시간 (ms)
    }

    init() {
        this.slider = document.querySelector('[data-gallery-slider]');
        if (!this.slider) {
            return;
        }

        this.setupGallery();
    }

    setupGallery() {
        // mapper가 생성한 슬라이드 읽기
        const originalSlides = Array.from(this.slider.querySelectorAll('.gallery-item'));
        this.slideCount = originalSlides.length;

        // 슬라이드가 없으면 종료
        if (this.slideCount === 0) {
            return;
        }

        // 무한 루프를 위해 원본 이미지들을 여러 번 복제 (3번 더 복제해서 총 4세트)
        for (let i = 0; i < 3; i++) {
            originalSlides.forEach(slide => {
                this.slider.appendChild(slide.cloneNode(true));
            });
        }

        // 시작 위치 설정
        this.index = 0;

        // 슬라이드 시작
        this.startSlider();
    }

    addFadeOverlays() {
        const galleryContainer = document.querySelector('.gallery-container');

        if (galleryContainer) {
            // 왼쪽 페이드 오버레이
            const leftOverlay = document.createElement('div');
            leftOverlay.className = 'gallery-fade-left';
            leftOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 200px;
                height: 100%;
                background: linear-gradient(to right, rgba(255, 236, 210, 1) 0%, rgba(255, 236, 210, 0.8) 20%, rgba(255, 236, 210, 0) 100%);
                pointer-events: none;
                z-index: 100;
            `;

            // 오른쪽 페이드 오버레이
            const rightOverlay = document.createElement('div');
            rightOverlay.className = 'gallery-fade-right';
            rightOverlay.style.cssText = `
                position: absolute;
                top: 0;
                right: 0;
                width: 200px;
                height: 100%;
                background: linear-gradient(to left, rgba(255, 236, 210, 1) 0%, rgba(255, 236, 210, 0.8) 20%, rgba(255, 236, 210, 0) 100%);
                pointer-events: none;
                z-index: 100;
            `;

            galleryContainer.appendChild(leftOverlay);
            galleryContainer.appendChild(rightOverlay);
        }
    }

    startSlider() {
        // 슬라이더 초기 위치 설정 (버퍼 고려)
        const firstItem = this.slider.querySelector('.gallery-item');
        if (firstItem) {
            const itemWidth = firstItem.offsetWidth + this.SLIDE_GAP;
            this.slider.style.transform = `translateX(-${this.index * itemWidth}px)`;
        }

        // 호버 이벤트
        this.slider.addEventListener('mouseenter', () => {
            this.isPaused = true;
        });

        this.slider.addEventListener('mouseleave', () => {
            this.isPaused = false;
        });

        // 자동 슬라이드 활성화
        setTimeout(() => {
            this.intervalId = setInterval(() => {
                if (!this.isPaused) {
                    this.move();
                }
            }, this.slideDuration);
        }, this.INITIAL_DELAY);
    }

    move() {
        // 이미지 너비 계산 (첫 번째 아이템 기준)
        const firstItem = this.slider.querySelector('.gallery-item');
        if (!firstItem) return;

        const itemWidth = firstItem.offsetWidth + this.SLIDE_GAP; // gap 포함

        // 2세트를 지나면 리셋 (자연스러운 무한 루프)
        if (this.index >= this.slideCount * 2) {
            // 즉시 리셋 (애니메이션 없이)
            this.slider.style.transition = 'none';
            this.index = 0;
            this.slider.style.transform = `translateX(0px)`;

            // 리플로우 후 애니메이션 재적용
            void this.slider.offsetWidth;
            this.slider.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        }

        this.index += 1;
        const moveDistance = this.index * itemWidth;
        this.slider.style.transform = `translateX(-${moveDistance}px)`;
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
}

/**
 * Fullpage Scroll
 */
class FullpageScroll {
    constructor() {
        this.sections = [];
        this.currentSection = 0;
        this.isScrolling = false;
        this.wheelTimeout = null;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.isInFooter = false;

        this.init();
    }

    init() {
        // 모바일에서는 fullpage scroll 비활성화
        if (window.innerWidth <= 768) {
            // 모바일에서 일반 스크롤 활성화
            document.body.style.overflow = 'auto';
            document.body.style.height = 'auto';

            // fullpage 컨테이너 스타일 변경
            const fullpage = document.getElementById('fullpage');
            if (fullpage) {
                fullpage.style.height = 'auto';
            }

            // 모든 섹션 높이 자동으로 변경
            const sections = document.querySelectorAll('.section');
            sections.forEach(section => {
                section.style.height = 'auto';
                section.style.minHeight = '100vh';
            });

            // fp-section 클래스 제거
            document.querySelectorAll('.fp-section').forEach(el => {
                el.classList.remove('fp-section');
            });

            // Navigation dots 숨기기
            const fpNav = document.querySelector('.fp-nav');
            if (fpNav) {
                fpNav.style.display = 'none';
            }

            return;
        }

        this.sections = document.querySelectorAll('.fp-section');
        this.initNavigation();
        this.initScrollListener();
        this.initWheelListener();
        this.initTouchListener();
        this.updateActiveSection();
    }

    initNavigation() {
        const navLinks = document.querySelectorAll('.fp-nav a');
        navLinks.forEach((link, index) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToSection(index);
            });
        });
    }

    initScrollListener() {
        let scrollTimeout;

        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.updateActiveSection();
            }, 100);
        });
    }

    initWheelListener() {
        window.addEventListener('wheel', (e) => {
            if (this.isScrolling) {
                e.preventDefault();
                return;
            }

            // 마지막 섹션에서 아래로 스크롤하거나 푸터 영역에 있으면 일반 스크롤 허용
            const lastSection = this.sections[this.sections.length - 1];
            const lastSectionBottom = lastSection.offsetTop + lastSection.offsetHeight;
            const currentScrollPosition = window.scrollY + window.innerHeight;

            if (currentScrollPosition >= lastSectionBottom || this.isInFooter) {
                return; // 일반 스크롤 허용
            }

            e.preventDefault();

            clearTimeout(this.wheelTimeout);
            this.wheelTimeout = setTimeout(() => {
                if (e.deltaY > 0) {
                    // 아래로 스크롤
                    this.nextSection();
                } else {
                    // 위로 스크롤
                    this.prevSection();
                }
            }, 50);
        }, { passive: false });
    }

    initTouchListener() {
        window.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
            this.touchStartTime = Date.now();
        }, { passive: true });

        window.addEventListener('touchend', (e) => {
            if (this.isScrolling) return;

            const touchEndY = e.changedTouches[0].clientY;
            const touchDuration = Date.now() - this.touchStartTime;
            const touchDistance = Math.abs(touchEndY - this.touchStartY);

            // 최소 거리와 최대 시간 체크 (스와이프 감지)
            if (touchDistance > 50 && touchDuration < 500) {
                // 마지막 섹션에서 아래로 스와이프하거나 푸터 영역에 있으면 일반 스크롤 허용
                const lastSection = this.sections[this.sections.length - 1];
                const lastSectionBottom = lastSection.offsetTop + lastSection.offsetHeight;
                const currentScrollPosition = window.scrollY + window.innerHeight;

                if (currentScrollPosition >= lastSectionBottom || this.isInFooter) {
                    return; // 일반 스크롤 허용
                }

                if (touchEndY < this.touchStartY) {
                    // 아래로 스와이프
                    this.nextSection();
                } else {
                    // 위로 스와이프
                    this.prevSection();
                }
            }
        }, { passive: true });
    }

    updateActiveSection() {
        const scrollPosition = window.scrollY + window.innerHeight / 2;
        const footer = document.querySelector('.footer');

        // 푸터 영역 체크
        if (footer) {
            const footerTop = footer.offsetTop;
            this.isInFooter = window.scrollY + window.innerHeight > footerTop;
        }

        this.sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition <= sectionBottom) {
                this.currentSection = index;
                this.updateNavigation();

                // 갤러리 또는 클로징 섹션 체크
                if (section.classList.contains('gallery-section') || section.classList.contains('closing-section')) {
                    document.body.classList.add('dark-section-active');
                } else {
                    document.body.classList.remove('dark-section-active');
                }

                // Footer 가시성 체크 (스크롤 끝)
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

                // 스크롤이 거의 끝에 도달했을 때 (footer가 보일 때)
                if (scrollTop + windowHeight >= documentHeight - 100) {
                    document.body.classList.add('footer-visible');
                } else {
                    document.body.classList.remove('footer-visible');
                }
            }
        });
    }

    updateNavigation() {
        const navLinks = document.querySelectorAll('.fp-nav a');
        navLinks.forEach((link, index) => {
            if (index === this.currentSection) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    nextSection() {
        if (this.currentSection < this.sections.length - 1) {
            this.goToSection(this.currentSection + 1);
        } else {
            // 마지막 섹션에서 푸터로 스크롤
            const footer = document.querySelector('.footer');
            if (footer) {
                footer.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    prevSection() {
        if (this.currentSection > 0) {
            this.goToSection(this.currentSection - 1);
        }
    }

    goToSection(index) {
        if (this.isScrolling || index < 0 || index >= this.sections.length) return;

        this.isScrolling = true;
        this.currentSection = index;

        const targetSection = this.sections[index];
        targetSection.scrollIntoView({ behavior: 'smooth' });

        this.updateNavigation();

        // 애니메이션 트리거
        this.triggerSectionAnimation(targetSection);

        // 스크롤 완료 후 잠금 해제
        setTimeout(() => {
            this.isScrolling = false;
        }, 1000);
    }

    triggerSectionAnimation(section) {
        // 모든 섹션의 애니메이션 리셋
        this.sections.forEach(s => {
            const elements = s.querySelectorAll('.animate-element');
            elements.forEach(el => {
                el.classList.remove('animate');
                // 강제 리플로우
                el.offsetHeight;
            });
        });

        // 히어로 섹션(첫 번째 섹션)은 스킵
        if (section.classList.contains('hero-section')) {
            return;
        }

        // 현재 섹션의 애니메이션 트리거 (약간의 지연 후)
        setTimeout(() => {
            const elements = section.querySelectorAll('.animate-element');
            elements.forEach(el => {
                // 인라인 스타일 제거 (CSS가 처리하도록)
                el.style.removeProperty('opacity');
                el.style.removeProperty('transform');
                el.classList.add('animate');
            });
        }, 200);
    }

    // 페이지 로드 시 현재 섹션의 텍스트 즉시 표시 (새로고침 시)
    checkAndTriggerCurrentSectionAnimation() {
        // 현재 스크롤 위치에 따라 활성 섹션 결정
        const scrollPosition = window.scrollY + window.innerHeight / 2;

        for (const [index, section] of this.sections.entries()) {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition <= sectionBottom) {
                this.currentSection = index;

                // 히어로 섹션이 아닌 경우에만 텍스트 즉시 표시
                if (!section.classList.contains('hero-section')) {
                    const elements = section.querySelectorAll('.animate-element');

                    // 새로고침 시 텍스트를 즉시 표시 (애니메이션 없이)
                    elements.forEach(el => {
                        // 애니메이션 클래스 추가하고 즉시 표시
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                        el.classList.add('animate');
                    });
                }

                this.updateNavigation();
                return;
            }
        }
    }
}

/**
 * 스크롤 감지 및 UI 업데이트
 */
function initScrollDetection() {
    function updateScrollState() {
        const scrolled = window.scrollY > 50;

        if (scrolled) {
            document.body.classList.add('scrolled');
        } else {
            document.body.classList.remove('scrolled');
        }
    }

    // 초기 상태 설정
    updateScrollState();

    // 스크롤 이벤트 리스너
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateScrollState();
                ticking = false;
            });
            ticking = true;
        }
    });
}

// 모바일 스크롤 애니메이션 초기화 함수
function initMobileAnimations() {
    const animateElements = document.querySelectorAll('.animate-element');

    if (!animateElements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 약간의 지연을 두고 애니메이션 실행
                setTimeout(() => {
                    entry.target.classList.add('animate');
                }, entry.target.dataset.delay || 0);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    });

    animateElements.forEach((element, index) => {
        // 순차적 애니메이션을 위한 지연 시간 설정
        element.dataset.delay = index * 100;
        observer.observe(element);
    });
}

// 모바일 일반 스크롤 활성화 함수
function enableMobileScroll() {
    // body와 html 스크롤 활성화
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';

    // fullpage 컨테이너 스타일 초기화
    const fullpage = document.getElementById('fullpage');
    if (fullpage) {
        fullpage.style.height = 'auto';
        fullpage.style.overflow = 'visible';
    }

    // 모든 섹션 높이 자동으로
    const sections = document.querySelectorAll('.section, .fp-section');
    sections.forEach(section => {
        section.style.height = 'auto';
        section.style.minHeight = '100vh';
        section.classList.remove('fp-section');
    });

    // Navigation dots 숨기기
    const fpNav = document.querySelector('.fp-nav');
    if (fpNav) {
        fpNav.style.display = 'none';
    }
}

// 전역 초기화 함수 (mapper에서 호출 가능)
let heroSliderInstance = null;
let gallerySliderInstance = null;

window.initHeroSlider = function() {
    if (heroSliderInstance) {
        heroSliderInstance.stop();
    }
    heroSliderInstance = new HeroSlider();
    heroSliderInstance.init();
};

window.initGallerySlider = function() {
    if (gallerySliderInstance) {
        gallerySliderInstance.stop();
    }
    gallerySliderInstance = new GallerySlider();
    gallerySliderInstance.init();
};

// DOM 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    // Hero Slider 초기화 (mapper 전에 실행될 수 있으므로 슬라이드 없으면 스킵)
    // mapper의 reinitializeSliders()에서 다시 호출됨
    window.initHeroSlider();

    // Gallery Slider 초기화 (모든 디바이스에서)
    window.initGallerySlider();

    // 모바일이 아닐 때만 Fullpage Scroll 초기화
    let fullpageScroll = null;
    if (window.innerWidth > 768) {
        fullpageScroll = new FullpageScroll();

        // 페이지 로드 완료 후 현재 섹션 애니메이션 체크 (더 빠르게)
        setTimeout(() => {
            fullpageScroll.checkAndTriggerCurrentSectionAnimation();
        }, 300);
    }

    // 스크롤 감지 초기화
    initScrollDetection();

    // 모바일에서 일반 스크롤 활성화
    if (window.innerWidth <= 768) {
        enableMobileScroll();
        initMobileAnimations();
    } else {
        // 데스크톱에서 완전한 로드 후 애니메이션 활성화 (필요시에만)
        window.addEventListener('load', () => {
            if (fullpageScroll) {
                // 현재 스크롤 위치가 히어로 섹션이 아닌 경우에만 실행
                if (window.scrollY > window.innerHeight * 0.5) {
                    setTimeout(() => {
                        fullpageScroll.checkAndTriggerCurrentSectionAnimation();
                    }, 100);
                }
            }
        });
    }

    // 페이지 로드 시 텍스트 즉시 표시 설정
    setTimeout(() => {
        const scrollPosition = window.scrollY + window.innerHeight / 2;
        const sections = document.querySelectorAll('.fp-section');

        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;

            // 현재 보이는 섹션인지 확인
            const isCurrentSection = scrollPosition >= sectionTop && scrollPosition <= sectionBottom;

            // 히어로 섹션이 아닌 경우 처리
            if (!section.classList.contains('hero-section')) {
                const elements = section.querySelectorAll('.animate-element');

                if (isCurrentSection) {
                    // 현재 보이는 섹션은 텍스트를 즉시 표시
                    elements.forEach(el => {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                        el.classList.add('animate');
                    });
                } else {
                    // 다른 섹션들은 애니메이션 대기 상태로
                    elements.forEach(el => {
                        el.classList.remove('animate');
                        el.style.removeProperty('opacity');
                        el.style.removeProperty('transform');
                    });
                }
            }
        });
    }, 100);

    // Signature 썸네일 자동 및 클릭 이벤트
    const signatureThumbs = document.querySelectorAll('.signature-thumb');
    const signatureMainImage = document.getElementById('signature-main-image');
    let signatureCurrentIndex = 0;
    let signatureInterval = null;

    function changeSignatureImage(index) {
        // 모든 썸네일에서 active 클래스 제거
        signatureThumbs.forEach(t => t.classList.remove('active'));
        // 선택된 썸네일에 active 클래스 추가
        signatureThumbs[index].classList.add('active');

        // 메인 이미지 변경
        const newImageSrc = signatureThumbs[index].getAttribute('data-image');
        if (signatureMainImage && newImageSrc) {
            signatureMainImage.style.opacity = '0';
            setTimeout(() => {
                signatureMainImage.src = newImageSrc;
                signatureMainImage.style.opacity = '1';
            }, 250);
        }
    }

    // 자동 슬라이드 시작
    function startSignatureAutoSlide() {
        signatureInterval = setInterval(() => {
            signatureCurrentIndex = (signatureCurrentIndex + 1) % signatureThumbs.length;
            changeSignatureImage(signatureCurrentIndex);
        }, 4000); // 4초마다 변경
    }

    // 자동 슬라이드 중지
    function stopSignatureAutoSlide() {
        if (signatureInterval) {
            clearInterval(signatureInterval);
            signatureInterval = null;
        }
    }

    // 썸네일 클릭 이벤트
    signatureThumbs.forEach((thumb, index) => {
        thumb.addEventListener('click', function() {
            stopSignatureAutoSlide(); // 자동 슬라이드 중지
            signatureCurrentIndex = index;
            changeSignatureImage(index);
            // 3초 후 자동 슬라이드 재시작
            setTimeout(startSignatureAutoSlide, 3000);
        });
    });

    // 자동 슬라이드 시작
    if (signatureThumbs.length > 0) {
        startSignatureAutoSlide();
    }
});