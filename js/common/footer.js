/**
 * Footer Component Functionality
 * 푸터 컴포넌트 기능
 */

// FooterComponent 클래스 (footer.html에서 이동)
class FooterComponent {
    constructor() {
        this.ybsId = null;
        this.realtimeBookingId = null;
        this.init();
    }

    init() {
        // 예약하기 버튼 이벤트
        document.getElementById('reservation-btn-mobile')?.addEventListener('click', () => this.handleReservation());
        document.getElementById('reservation-btn-desktop')?.addEventListener('click', () => this.handleReservation());

        // 플로팅 예약 버튼 이벤트
        this.initFloatingBookingButton();

        // 스크롤 투 탑 버튼 이벤트
        document.getElementById('scroll-top-btn-mobile')?.addEventListener('click', () => this.scrollToTop());
        document.getElementById('scroll-top-btn-desktop')?.addEventListener('click', () => this.scrollToTop());
    }

    initFloatingBookingButton() {
        const realtimeBtn = document.querySelector('[data-property-gpension-id]');
        const ybsBtn = document.querySelector('[data-property-ybs-id]');

        if (realtimeBtn) {
            realtimeBtn.addEventListener('click', () => this.handleGpensionReservation());
        }

        if (ybsBtn) {
            ybsBtn.addEventListener('click', () => this.handleYbsReservation());
            this.initYbsButton(ybsBtn);
        }
    }

    /**
     * Property 데이터 조회 (mapper 또는 JSON에서)
     * NOTE: 유사한 로직이 js/pages/reservation.js에도 존재
     * 수정 시 양쪽 모두 확인 필요
     */
    async getPropertyData(fieldName) {
        try {
            // 1. 페이지별 mapper에서 데이터 가져오기
            const mappers = [
                window.indexMapper,
                window.mainMapper,
                window.roomMapper
            ];

            for (const mapper of mappers) {
                if (mapper?.data?.property?.[fieldName]) {
                    return mapper.data.property[fieldName];
                }
            }

            // 2. JSON 파일 직접 로드
            const dataPath = window.APP_CONFIG
                ? window.APP_CONFIG.getResourcePath('standard-template-data.json')
                : './standard-template-data.json';
            const response = await fetch(dataPath);
            const data = await response.json();
            return data.property?.[fieldName];
        } catch (error) {
            console.error(`Error fetching ${fieldName}:`, error);
            return null;
        }
    }

    async initYbsButton(ybsBtn) {
        this.ybsId = await this.getPropertyData('ybsId');
        if (this.ybsId) {
            ybsBtn.style.setProperty('display', 'block', 'important');
        }
    }

    async handleYbsReservation() {
        // 캐시된 값이 없으면 다시 조회
        if (!this.ybsId) {
            this.ybsId = await this.getPropertyData('ybsId');
        }

        if (this.ybsId) {
            const reservationUrl = `https://rev.yapen.co.kr/external?ypIdx=${this.ybsId}`;
            window.open(reservationUrl, '_blank');
        }
    }

    async handleGpensionReservation() {
        // 캐시된 값이 없으면 다시 조회
        if (!this.realtimeBookingId) {
            this.realtimeBookingId = await this.getPropertyData('realtimeBookingId');
        }

        if (this.realtimeBookingId) {
            window.open(this.realtimeBookingId, '_blank');
        } else {
            this.handleReservation();
        }
    }

    scrollToTop() {
        if (typeof onScrollToTop === 'function') {
            onScrollToTop();
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    handleReservation() {
        if (typeof window.onReservation === 'function') {
            window.onReservation();
        } else if (typeof window.onNavigate === 'function') {
            window.onNavigate('reservation');
        } else {
            // 동적 경로 설정
            const currentPath = window.location.pathname;
            let targetPath;
            if (currentPath.includes('/pages/')) {
                // pages 폴더 안에서는 상대 경로 사용
                targetPath = 'reservation.html';
            } else {
                // 루트에서는 pages 폴더로 이동
                targetPath = 'pages/reservation.html';
            }
            window.location.href = targetPath;
        }
    }

    navigateHome() {
        if (typeof window.onHome === 'function') {
            window.onHome();
        } else {
            // 동적 경로 설정
            const currentPath = window.location.pathname;
            let targetPath;
            if (currentPath.includes('/pages/')) {
                // pages 폴더 안에서는 상대 경로 사용
                targetPath = '../index.html';
            } else {
                // 루트에서는 index.html로 이동
                targetPath = 'index.html';
            }
            window.location.href = targetPath;
        }
    }

    handleNavigation(page) {
        if (typeof window.onNavigate === 'function') {
            window.onNavigate(page);
        } else {
            // 동적 경로 설정
            const currentPath = window.location.pathname;
            let targetPath;
            if (currentPath.includes('/pages/')) {
                // pages 폴더 안에서는 상대 경로 사용
                targetPath = `${page}.html`;
            } else {
                // 루트에서는 pages 폴더로 이동
                targetPath = `pages/${page}.html`;
            }
            window.location.href = targetPath;
        }
    }
}

// Footer 매핑 함수 - data-mapper가 로드된 후 실행
async function initFooterMapping() {
    try {
        // HeaderFooterMapper가 로드될 때까지 대기
        if (typeof HeaderFooterMapper === 'undefined') {
            setTimeout(initFooterMapping, 100);
            return;
        }

        // HeaderFooterMapper 인스턴스 생성 및 초기화
        const headerFooterMapper = new HeaderFooterMapper();
        await headerFooterMapper.initialize();

        // Footer 매핑 실행
        await headerFooterMapper.mapFooter();
    } catch (error) {
    }
}

// Function to initialize scroll to top button
function initScrollToTop() {
    // Scroll to top button functionality
    const scrollToTopButton = document.getElementById('scrollToTop');

    if (scrollToTopButton) {
        // Show/hide button based on scroll position
        function toggleScrollButton() {
            const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

            if (scrollPosition > 300) {
                scrollToTopButton.classList.add('visible');
            } else {
                scrollToTopButton.classList.remove('visible');
            }
        }

        // Throttle scroll event for better performance
        let isScrolling = false;
        window.addEventListener('scroll', function() {
            if (!isScrolling) {
                window.requestAnimationFrame(function() {
                    toggleScrollButton();
                    isScrolling = false;
                });
                isScrolling = true;
            }
        });

        // Scroll to top when button is clicked
        scrollToTopButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // Initial check
        toggleScrollButton();
    }
}

// 푸터 컴포넌트 초기화
function initFooterComponent() {
    window.footerComponent = new FooterComponent();

    // Footer 매핑도 함께 실행
    initFooterMapping();
}

// Initialize immediately if DOM is already loaded, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            initScrollToTop();
            initFooterComponent();
        }, 500);
    });
} else {
    // DOM is already loaded, initialize after a short delay
    setTimeout(() => {
        initScrollToTop();
        initFooterComponent();
    }, 500);
}
