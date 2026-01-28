/**
 * Index Page Functionality
 * 인덱스 페이지 기능 (헤더/푸터 로딩 포함)
 */

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize scroll animations
    initScrollAnimations();

    // Load data mapper for content mapping
    setTimeout(() => {
        loadDataMapper();
    }, 100);

    // Initialize Hero after data is loaded
    // Will be called after Swiper initialization completes
    window.initHeroAfterData = () => {
        setTimeout(() => {
            const heroTitle = document.querySelector('.hero-title-1');
            if (heroTitle) {
                heroTitle.classList.add('animate');
            }
        }, 500);

        setTimeout(() => {
            const heroDesc = document.querySelector('.hero-description-animation');
            if (heroDesc) {
                heroDesc.classList.add('animate');
            }
        }, 1000);

        setTimeout(() => {
            const heroBtn = document.querySelector('.hero-cta-animation');
            if (heroBtn) {
                heroBtn.classList.add('animate');
            }
        }, 1500);

        setTimeout(() => {
            const heroControls = document.querySelector('.hero-controls-animation');
            if (heroControls) {
                heroControls.classList.add('animate');
            }
        }, 2000);
    };
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
        // GitHub Pages 지원: config.js의 경로 헬퍼 사용
        const dataPath = window.APP_CONFIG
            ? window.APP_CONFIG.getResourcePath('standard-template-data.json')
            : './standard-template-data.json';
        const response = await fetch(dataPath);
        const data = await response.json();

        window.dogFriendlyDataMapper = {
            data: data,
            isDataLoaded: true
        };

        const initMapper = () => {
            if (window.IndexMapper) {
                const mapper = new IndexMapper(data);
                mapper.mapPage();

                // Initialize HeaderFooterMapper for social links
                if (window.HeaderFooterMapper) {
                    const headerFooterMapper = new HeaderFooterMapper();
                    headerFooterMapper.setData(data);
                    headerFooterMapper.mapHeaderFooter();
                }

                if (window.initHeroAfterData) {
                    window.initHeroAfterData();
                }
            }
        };

        if (window.IndexMapper) {
            initMapper();
        } else {
            setTimeout(initMapper, 1000);
        }
    } catch (error) {
    }
}

// Smooth scroll to next section
function scrollToNextSection() {
    const nextSection = document.querySelector('.essence-section');
    if (nextSection) {
        nextSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Enhanced Intersection Observer with React-style Staggered Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Special handling for about-image animations
                if (entry.target.classList.contains('fade-in-scale')) {
                    entry.target.classList.add('animate');
                }

                // Special handling for fade-in-up animations
                if (entry.target.classList.contains('fade-in-up')) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }

                // Special handling for gallery items with staggered animation
                if (entry.target.classList.contains('gallery-item')) {
                    const galleryItems = Array.from(entry.target.parentElement.children);
                    const index = galleryItems.indexOf(entry.target);

                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 100); // 100ms stagger
                } else {
                    entry.target.classList.add('visible');
                }
            }
        });
    }, observerOptions);

    // Observe all animation elements including about section
    const animatedElements = document.querySelectorAll(
        '.fade-in-up, .fade-in-scale, .slide-in-left, .slide-in-right, .gallery-item, .room-card, .facility-item'
    );


    animatedElements.forEach(el => {
        observer.observe(el);
    });
}


