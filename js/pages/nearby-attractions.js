/* Nearby Attractions Page Script */

(function() {
    // Hero Slider - 3초마다 이미지 전환
    window._heroSliderInterval = null;
    let isTransitioning = false;

    window.initHeroSlider = function initHeroSlider() {
        const slider = document.querySelector('[data-hero-slider]');
        if (!slider) return;

        const slides = Array.from(slider.querySelectorAll('.hero-slide'));
        const currentSlideEl = document.querySelector('[data-current-slide]');
        const totalSlidesEl = document.querySelector('[data-total-slides]');
        const progressBar = document.querySelector('[data-hero-progress]');
        const prevBtn = document.querySelector('.hero-nav-prev');
        const nextBtn = document.querySelector('.hero-nav-next');

        const SLIDE_DURATION = 3000;
        let currentIndex = 0;

        if (slides.length <= 1) {
            if (slides.length === 1) {
                slides[0].classList.add('active');
                if (currentSlideEl) currentSlideEl.textContent = '01';
                if (totalSlidesEl) totalSlidesEl.textContent = '01';
            }
            return;
        }

        if (totalSlidesEl) {
            totalSlidesEl.textContent = String(slides.length).padStart(2, '0');
        }

        function goToSlide(index) {
            if (isTransitioning) return;
            isTransitioning = true;

            const prevSlide = slides[currentIndex];
            prevSlide.classList.remove('active');

            currentIndex = index;
            const newSlide = slides[currentIndex];
            newSlide.classList.add('active');

            const newImg = newSlide.querySelector('img');
            if (newImg) {
                newImg.style.transition = 'none';
                newImg.style.transform = 'scale(1)';

                requestAnimationFrame(() => {
                    newImg.style.transition = 'transform 3s ease-out';
                    requestAnimationFrame(() => {
                        newImg.style.transform = 'scale(1.12)';
                    });
                });
            }

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

            if (currentSlideEl) {
                currentSlideEl.textContent = String(currentIndex + 1).padStart(2, '0');
            }

            resetProgressBar();

            setTimeout(() => {
                isTransitioning = false;
            }, 600);
        }

        function resetProgressBar() {
            if (!progressBar) return;

            progressBar.style.transition = 'none';
            progressBar.style.width = '0';

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    progressBar.style.transition = `width ${SLIDE_DURATION}ms linear`;
                    progressBar.style.width = '100%';
                });
            });
        }

        function nextSlide() {
            if (isTransitioning) return;
            const nextIndex = (currentIndex + 1) % slides.length;
            goToSlide(nextIndex);
        }

        function prevSlide() {
            if (isTransitioning) return;
            const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
            goToSlide(prevIndex);
        }

        function startAutoPlay() {
            stopAutoPlay();
            window._heroSliderInterval = setInterval(nextSlide, SLIDE_DURATION);
        }

        function stopAutoPlay() {
            if (window._heroSliderInterval) {
                clearInterval(window._heroSliderInterval);
                window._heroSliderInterval = null;
            }
        }

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

        slides.forEach(slide => slide.classList.remove('active'));
        goToSlide(0);
        startAutoPlay();
    };

    window.scrollToContent = function() {
        const scrollTarget = document.querySelector('.scroll-target');
        if (scrollTarget) {
            scrollTarget.scrollIntoView({ behavior: 'smooth' });
        }
    };

    window.setupNearbyAttractionsAnimations = function() {
        setupGalleryItems();
    };

    function setupGalleryItems() {
        // 각 intro-block의 gallery items에 클릭 이벤트 추가
        document.querySelectorAll('.intro-block-image.gallery-slider').forEach(slider => {
            const items = slider.querySelectorAll('.gallery-item');

            items.forEach(item => {
                // Click event
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    // 같은 slider 내의 다른 active 클래스 제거
                    items.forEach(i => i.classList.remove('gallery-item-active'));
                    // 클릭한 item에 active 클래스 추가
                    this.classList.add('gallery-item-active');
                });
            });
        });
    }
})();
