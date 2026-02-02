/**
 * Room Hero Slider - Clean Implementation
 * 3초마다 이미지 전환, 프로그레스바 동기화
 */

// 전역 변수로 interval 관리
window._roomHeroInterval = null;
let isTransitioning = false;

window.initRoomHeroSlider = function initHeroSlider() {
    // 기존 interval 정리
    if (window._roomHeroInterval) {
        clearInterval(window._roomHeroInterval);
        window._roomHeroInterval = null;
    }

    const slider = document.querySelector('[data-hero-slider]');
    if (!slider) return;

    const slides = Array.from(slider.querySelectorAll('.hero-slide'));
    const currentSlideEl = document.querySelector('[data-current-slide]');
    const totalSlidesEl = document.querySelector('[data-total-slides]');
    const progressBar = document.querySelector('[data-hero-progress]');
    const prevBtn = document.querySelector('.hero-nav-prev');
    const nextBtn = document.querySelector('.hero-nav-next');

    const SLIDE_DURATION = 3000; // 3초
    let currentIndex = 0;

    // 슬라이드가 없거나 1개만 있으면 중지
    if (slides.length <= 1) {
        if (slides.length === 1) {
            slides[0].classList.add('active');
            if (currentSlideEl) currentSlideEl.textContent = '01';
            if (totalSlidesEl) totalSlidesEl.textContent = '01';
        }
        return;
    }

    // 초기 설정
    if (totalSlidesEl) {
        totalSlidesEl.textContent = String(slides.length).padStart(2, '0');
    }

    // 슬라이드 전환 함수
    function goToSlide(index) {
        if (isTransitioning) return;
        isTransitioning = true;

        // 이전 슬라이드 비활성화
        const prevSlide = slides[currentIndex];
        prevSlide.classList.remove('active');

        // 새 슬라이드 활성화
        currentIndex = index;
        const newSlide = slides[currentIndex];
        newSlide.classList.add('active');

        // 새 슬라이드 줌인 시작
        const newImg = newSlide.querySelector('img');
        if (newImg) {
            // 처음에 scale(1)로 설정 (트랜지션 없이)
            newImg.style.transition = 'none';
            newImg.style.transform = 'scale(1)';

            // 다음 프레임에서 트랜지션 복원 및 줌인
            requestAnimationFrame(() => {
                newImg.style.transition = 'transform 3s ease-out';
                requestAnimationFrame(() => {
                    newImg.style.transform = 'scale(1.12)';
                });
            });
        }

        // 이전 슬라이드 줌 리셋 (다음 사용을 위해)
        setTimeout(() => {
            const prevImg = prevSlide.querySelector('img');
            if (prevImg && prevSlide !== newSlide) {
                prevImg.style.transition = 'none';
                prevImg.style.transform = 'scale(1)';
                requestAnimationFrame(() => {
                    prevImg.style.transition = 'transform 3s ease-out';
                });
            }
        }, 500);

        // 숫자 업데이트
        if (currentSlideEl) {
            currentSlideEl.textContent = String(currentIndex + 1).padStart(2, '0');
        }

        // 프로그레스바 리셋 및 시작
        resetProgressBar();

        // 트랜지션 종료 후 플래그 리셋
        setTimeout(() => {
            isTransitioning = false;
        }, 600);
    }

    // 프로그레스바 리셋
    function resetProgressBar() {
        if (!progressBar) return;

        // 즉시 리셋
        progressBar.style.transition = 'none';
        progressBar.style.width = '0';

        // 다음 프레임에서 애니메이션 시작
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                progressBar.style.transition = `width ${SLIDE_DURATION}ms linear`;
                progressBar.style.width = '100%';
            });
        });
    }

    // 다음 슬라이드
    function nextSlide() {
        if (slides.length === 0 || isTransitioning) return;
        const nextIndex = (currentIndex + 1) % slides.length;
        goToSlide(nextIndex);
    }

    // 이전 슬라이드
    function prevSlide() {
        if (slides.length === 0 || isTransitioning) return;
        const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
        goToSlide(prevIndex);
    }

    // 자동 재생 시작
    function startAutoPlay() {
        stopAutoPlay(); // 기존 인터벌 정리
        window._roomHeroInterval = setInterval(nextSlide, SLIDE_DURATION);
    }

    // 자동 재생 중지
    function stopAutoPlay() {
        if (window._roomHeroInterval) {
            clearInterval(window._roomHeroInterval);
            window._roomHeroInterval = null;
        }
    }

    // 버튼 이벤트
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (!isTransitioning) {
                stopAutoPlay();
                nextSlide();
                setTimeout(() => {
                    startAutoPlay();
                }, 100);
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (!isTransitioning) {
                stopAutoPlay();
                prevSlide();
                setTimeout(() => {
                    startAutoPlay();
                }, 100);
            }
        });
    }

    // 초기화
    slides.forEach(slide => slide.classList.remove('active'));
    goToSlide(0);
    startAutoPlay();
};

// 디테일 슬라이더 (룸 디테일용)
window.initRoomDetailSlider = function initRoomDetailSlider() {
    // Room Detail 슬라이더 요소들
    const sliderContainer = document.querySelector('[data-room-slider]');
    if (!sliderContainer) return;

    // sliderContainer 내부에서 slides 찾기 (스코프 한정)
    const slides = Array.from(sliderContainer.querySelectorAll('.room-slide'));
    // indicators도 컨테이너 내부에서 찾기
    const indicatorsContainer = document.querySelector('[data-room-slider-indicators]');
    const indicators = indicatorsContainer ? Array.from(indicatorsContainer.querySelectorAll('.indicator')) : [];
    // thumbs는 외부에 있으므로 document에서 찾기
    const thumbs = Array.from(document.querySelectorAll('[data-room-thumbnails] .thumb-img'));

    if (slides.length === 0) return;

    let currentSlide = 0;
    const totalSlides = slides.length;
    const slideInterval = 3000;

    // 슬라이드가 1개 이하면 자동 재생 불필요
    if (totalSlides <= 1) {
        return;
    }

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        thumbs.forEach(thumb => thumb.classList.remove('active'));

        if (slides[index]) slides[index].classList.add('active');
        if (indicators[index]) indicators[index].classList.add('active');
        if (thumbs[index]) thumbs[index].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }

    // 자동 재생 리셋 헬퍼 함수
    function resetAutoPlay() {
        if (window._roomDetailSliderInterval) {
            clearInterval(window._roomDetailSliderInterval);
        }
        window._roomDetailSliderInterval = setInterval(nextSlide, slideInterval);
    }

    // 초기 설정
    showSlide(0);

    // 자동 재생 시작
    resetAutoPlay();

    // 인디케이터 클릭
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
            resetAutoPlay();
        });
    });

    // 썸네일 클릭
    thumbs.forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
            resetAutoPlay();
        });
    });

    // 호버 시 일시정지
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', () => {
            if (window._roomDetailSliderInterval) {
                clearInterval(window._roomDetailSliderInterval);
                window._roomDetailSliderInterval = null;
            }
        });

        sliderContainer.addEventListener('mouseleave', () => {
            resetAutoPlay();
        });
    }
};

// Intersection Observer for animations
function initAnimations() {
    const animatedElements = document.querySelectorAll('.animate-element:not(.animate)');

    if (!animatedElements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // Hero slider는 mapper에서 이미지 로드 후 초기화됨 - 여기서 호출하지 않음
    initRoomDetailSlider();
    initAnimations();
});

// 전역 네임스페이스에 노출
window.initRoomHeroSlider = initRoomHeroSlider;
window.initRoomDetailSlider = initRoomDetailSlider;