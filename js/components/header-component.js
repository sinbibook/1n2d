/**
 * Header Component
 * 헤더 컴포넌트의 모든 기능을 담당하는 클래스
 * 기존 header.js 기능과 새로운 풀스크린 메뉴 기능 통합
 */

class HeaderComponent {
    constructor() {
        this.internalIsMenuOpen = false;
        this.externalIsMenuOpen = undefined;
        this.fullScreenMenuComponent = null;
        this.isScrolled = false;

        // 기존 header.js 호환성을 위한 변수들
        this.PAGE_MAP = {
            home: 'index.html',
            main: 'main.html',
            directions: 'directions.html',
            'reservation-info': 'reservation.html',
            room: 'room.html',
        };
        this.isMobileMenuOpen = false;

        // DOM elements
        this.body = null;
        this.headers = null;
        this.mobileMenu = null;
        this.mobileToggleButtons = null;
        this.desktopMenuItems = null;
        this.mobileHeaderItems = null;
        this.allMenuGroups = null;

        this.init();
    }

    init() {
        // DOM이 완전히 로드될 때까지 기다린 후 이벤트 설정
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeAfterDOM();
            });
        } else {
            this.initializeAfterDOM();
        }
    }

    initializeAfterDOM() {
        this.initializeDOMElements();
        this.setupEventListeners();
        this.setupScrollListener();
        this.setupLegacyMenuHandlers();

        this.loadFullScreenMenu().then(() => {
        });
    }

    // 기존 header.js의 DOM 초기화 기능
    initializeDOMElements() {
        this.body = document.body;
        this.headers = Array.from(document.querySelectorAll('.header, .mHd, #main-header'));
        this.mobileMenu = document.getElementById('mobile-menu');
        this.mobileToggleButtons = Array.from(document.querySelectorAll('.mobile-toggle'));
        this.desktopMenuItems = Array.from(document.querySelectorAll('.header .mainMenu > li'));
        this.mobileHeaderItems = Array.from(document.querySelectorAll('.mHd .mainMenu > li'));
        this.allMenuGroups = [this.desktopMenuItems, this.mobileHeaderItems];
    }

    setupScrollListener() {
        window.addEventListener('scroll', () => {
            const scrollPosition = window.scrollY;
            const header = document.getElementById('main-header');
            const logo = document.querySelector('.logo-text');
            const hamburgerLines = document.querySelectorAll('#hamburger-menu div div');

            if (scrollPosition > 50) {
                // Scrolled state - apply CSS background
                if (!this.isScrolled) {
                    this.isScrolled = true;
                    header.classList.add('scrolled');
                    // Remove inline styles to let CSS take control
                    header.style.backgroundColor = '';
                    header.style.backdropFilter = '';
                    header.style.boxShadow = '';

                    // Keep text white for visibility
                    if (logo) {
                        logo.classList.add('text-white');
                        logo.classList.remove('text-gray-800');
                        // Add text shadow for better readability
                        logo.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.3)';
                    }
                    // Keep hamburger lines white with shadow for visibility
                    hamburgerLines.forEach(line => {
                        line.classList.add('bg-white');
                        line.classList.remove('bg-gray-800');
                        line.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';
                    });
                }
            } else {
                // Top of page - transparent background
                if (this.isScrolled) {
                    this.isScrolled = false;
                    header.classList.remove('scrolled');
                    // Remove inline styles to let CSS take control
                    header.style.backgroundColor = '';
                    header.style.backdropFilter = '';
                    header.style.boxShadow = '';

                    // Return to original white text without shadows
                    if (logo) {
                        logo.classList.add('text-white');
                        logo.classList.remove('text-gray-800');
                        logo.style.textShadow = 'none';
                    }
                    // Return hamburger lines to white without shadows
                    hamburgerLines.forEach(line => {
                        line.classList.add('bg-white');
                        line.classList.remove('bg-gray-800');
                        line.style.boxShadow = 'none';
                    });
                }
            }
        });
    }

    async loadFullScreenMenu() {
        // 이미 로드된 경우 중복 방지
        if (document.getElementById('fullscreen-menu')) {
            this.fullScreenMenuComponent = window.fullScreenMenu || window.fullScreenMenuComponent;
            return;
        }

        try {
            // 현재 위치에 따라 경로 결정
            const isInPagesFolder = window.location.pathname.includes('/pages/');
            const headerBasePath = isInPagesFolder ? '../../common/' : './common/';
            const fullMenuPath = headerBasePath + 'fullscreen-menu.html';

            const response = await fetch(fullMenuPath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const html = await response.text();

            // DOM 파서로 fullscreen-menu 내용 추출
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const fullscreenMenuElement = doc.getElementById('fullscreen-menu');

            if (fullscreenMenuElement) {
                document.getElementById('fullscreen-menu-container').appendChild(fullscreenMenuElement);

                // HTML에서 로드된 스크립트 실행
                const scripts = doc.querySelectorAll('script');
                scripts.forEach((script) => {
                    if (script.src) {
                        // 외부 스크립트 로드
                        const newScript = document.createElement('script');
                        newScript.src = script.src;
                        newScript.onload = () => {
                            this.fullScreenMenuComponent = window.fullScreenMenu || window.fullScreenMenuComponent;
                        };
                        document.head.appendChild(newScript);
                    } else if (script.textContent.trim()) {
                        // 인라인 스크립트 실행
                        const newScript = document.createElement('script');
                        newScript.textContent = script.textContent;
                        document.head.appendChild(newScript);
                    }
                });

                // CSS 로드
                const links = doc.querySelectorAll('link[rel="stylesheet"]');
                links.forEach((link) => {
                    if (!document.querySelector(`link[href="${link.href}"]`)) {
                        const newLink = document.createElement('link');
                        newLink.rel = 'stylesheet';
                        newLink.href = link.href;
                        document.head.appendChild(newLink);
                    }
                });

                // 컴포넌트 참조 설정
                setTimeout(() => {
                    this.fullScreenMenuComponent = window.fullScreenMenu || window.fullScreenMenuComponent;
                }, 100);
            }
        } catch (error) {
        }
    }

    setupEventListeners() {
        // 로고 클릭 이벤트
        const logoElement = document.getElementById('pension-logo');
        if (logoElement) {
            logoElement.addEventListener('click', () => {
                this.navigateHome();
            });
        }

        // 햄버거 메뉴 클릭 이벤트
        const hamburgerElement = document.getElementById('hamburger-menu');
        if (hamburgerElement) {
            hamburgerElement.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleMenu();
            });
        } else {
        }

        // 전역 메뉴 닫기 콜백 설정
        window.onCloseMenu = () => {
            this.closeMenu();
        };
    }

    // React와 동일한 상태 관리 로직
    get isMenuOpen() {
        return this.externalIsMenuOpen !== undefined ? this.externalIsMenuOpen : this.internalIsMenuOpen;
    }

    navigateHome() {
        // 모든 HTML이 루트에 있으므로 index.html로 바로 이동
        window.location.href = 'index.html';
    }

    navigateToReservation() {
        // React: onNavigate("reservation") 콜백과 동일
        if (typeof window.onNavigate === 'function') {
            window.onNavigate('reservation');
        } else {
            // 모든 HTML이 루트에 있으므로 reservation.html로 바로 이동
            window.location.href = 'reservation.html';
        }
    }

    toggleMenu() {
        try {
            this.internalIsMenuOpen = !this.internalIsMenuOpen;
            this.updateMenuIcon();
            this.tryToggleFullscreenMenu(0);
        } catch (error) {
            this.internalIsMenuOpen = false;
            this.updateMenuIcon();
        }
    }

    tryToggleFullscreenMenu(attempt) {
        const maxAttempts = 5;
        const menuComponent = window.fullScreenMenu || window.fullScreenMenuComponent;

        if (menuComponent) {
            if (this.internalIsMenuOpen) {
                menuComponent.openMenu();
            } else {
                menuComponent.closeMenu();
            }
        } else if (attempt < maxAttempts) {
            setTimeout(() => {
                this.tryToggleFullscreenMenu(attempt + 1);
            }, 200);
        } else {
            this.internalIsMenuOpen = false;
            this.updateMenuIcon();
        }
    }

    closeMenu() {
        // 메뉴 상태 직접 닫기
        this.internalIsMenuOpen = false;
        this.updateMenuIcon();

        const menuComponent = window.fullScreenMenu || window.fullScreenMenuComponent;
        if (menuComponent) {
            menuComponent.closeMenu();
        }
    }

    updateMenuIcon() {
        // 햄버거 아이콘 변경하지 않고 그대로 유지
        // 필요시 다른 시각적 피드백 추가 가능
    }

    // 외부에서 메뉴 상태 제어 (React props와 동일)
    setExternalMenuOpen(isOpen) {
        this.externalIsMenuOpen = isOpen;
        this.updateMenuIcon();
    }

    setMenuOpen(isOpen) {
        this.internalIsMenuOpen = isOpen;
        this.updateMenuIcon();
    }

    // ============================================================================
    // 기존 header.js 호환성 기능들
    // ============================================================================

    // 기존 모바일 메뉴 기능
    closeMobileMenu() {
        if (!this.isMobileMenuOpen) return;
        this.isMobileMenuOpen = false;

        const currentMobileMenu = document.getElementById('mobile-menu');
        const currentMobileToggleButtons = document.querySelectorAll('.mobile-toggle');

        currentMobileMenu?.classList.remove('is-open');
        currentMobileMenu?.setAttribute('aria-hidden', 'true');
        currentMobileToggleButtons.forEach((btn) => {
            btn.classList.remove('is-active');
            btn.setAttribute('aria-expanded', 'false');
        });

        if (this.body) {
            this.body.style.overflow = '';
            this.body.classList.remove('mobile-menu-open');
        }

        if (this.allMenuGroups && this.allMenuGroups.length > 0) {
            this.allMenuGroups.forEach(this.closeAllMenuItems.bind(this));
        }
    }

    openMobileMenu() {
        if (this.isMobileMenuOpen) return;
        this.isMobileMenuOpen = true;

        const currentMobileMenu = document.getElementById('mobile-menu');
        const currentMobileToggleButtons = document.querySelectorAll('.mobile-toggle');

        currentMobileMenu?.classList.add('is-open');
        currentMobileMenu?.setAttribute('aria-hidden', 'false');
        currentMobileToggleButtons.forEach((btn) => {
            btn.classList.add('is-active');
            btn.setAttribute('aria-expanded', 'true');
        });

        if (this.body) {
            this.body.style.overflow = 'hidden';
            this.body.classList.add('mobile-menu-open');
        }
    }

    navigateTo(page) {
        if (!page) return;

        const isInRoot = !window.location.pathname.includes('/pages/');
        const pathPrefix = isInRoot ? 'pages/' : '';

        const targetPath = this.PAGE_MAP[page];
        if (targetPath) {
            window.location.href = `${pathPrefix}${targetPath}`;
            this.closeMobileMenu();
            return;
        }

        if (page === 'home') {
            window.location.href = isInRoot ? 'index.html' : '../index.html';
            this.closeMobileMenu();
        }
    }

    syncAriaExpanded(collection) {
        collection.forEach((item) => {
            const trigger = item.querySelector('a');
            if (trigger) {
                trigger.setAttribute('aria-expanded', item.classList.contains('is-open') ? 'true' : 'false');
            }
        });
    }

    closeAllMenuItems(collection) {
        collection.forEach((item) => item.classList.remove('is-open'));
        this.syncAriaExpanded(collection);
    }

    toggleMenuItem(item, collection) {
        const alreadyOpen = item.classList.contains('is-open');
        this.closeAllMenuItems(collection);
        if (!alreadyOpen) {
            item.classList.add('is-open');
        }
        this.syncAriaExpanded(collection);
    }

    attachMenuToggleHandlers(menuItems, options = {}) {
        menuItems.forEach((item) => {
            const trigger = item.querySelector('a');
            if (!trigger) return;

            trigger.addEventListener('click', (event) => {
                const shouldHandle = options.shouldHandle ? options.shouldHandle() : true;
                if (!shouldHandle) return;

                if (trigger.getAttribute('href') === 'javascript:void(0)') {
                    event.preventDefault();
                }

                this.toggleMenuItem(item, menuItems);
            });

            trigger.addEventListener('keydown', (event) => {
                if ((event.key === 'Enter' || event.key === ' ') && (!options.shouldHandle || options.shouldHandle())) {
                    event.preventDefault();
                    this.toggleMenuItem(item, menuItems);
                }
            });
        });
    }

    setupLegacyMenuHandlers() {
        // 기존 메뉴 시스템 설정
        if (this.desktopMenuItems.length > 0) {
            this.attachMenuToggleHandlers(this.desktopMenuItems, {
                shouldHandle: () => window.innerWidth >= 1024
            });
        }

        if (this.mobileHeaderItems.length > 0) {
            this.attachMenuToggleHandlers(this.mobileHeaderItems, {
                shouldHandle: () => window.innerWidth < 1024
            });
        }

        this.allMenuGroups.forEach(this.syncAriaExpanded.bind(this));

        // 기존 모바일 토글 버튼들 설정
        this.mobileToggleButtons.forEach((btn) => {
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.toggleMobileMenu();
            });
        });

        // 전역 클릭 핸들러
        document.addEventListener('click', (event) => {
            const target = event.target;

            if (this.isMobileMenuOpen) {
                const clickInsideMenu = this.mobileMenu?.contains(target);
                const clickOnToggle = this.mobileToggleButtons.some((btn) => btn.contains(target));
                if (!clickInsideMenu && !clickOnToggle) {
                    this.closeMobileMenu();
                }
            }

            if (window.innerWidth >= 1024) {
                const insideMenu = target.closest('.header .mainMenu');
                if (!insideMenu) {
                    this.closeAllMenuItems(this.desktopMenuItems);
                }
            }
        });

        // 리사이즈 핸들러
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024) {
                this.closeMobileMenu();
            }
            this.allMenuGroups.forEach(this.closeAllMenuItems.bind(this));
            this.allMenuGroups.forEach(this.syncAriaExpanded.bind(this));
        });
    }

    toggleMobileMenu() {
        // 풀스크린 메뉴가 우선
        if (window.fullScreenMenuComponent) {
            this.toggleMenu();
            return;
        }

        // 기존 모바일 메뉴 폴백
        if (this.isMobileMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }
}

// 헤더 컴포넌트 초기화
window.headerComponent = new HeaderComponent();

// 전역 함수들 (React props와 동일한 인터페이스)
window.setHeaderMenuOpen = function(isOpen) {
    if (window.headerComponent) {
        window.headerComponent.setExternalMenuOpen(isOpen);
    }
};

// 헤더 초기화 함수 (room pages에서 사용)
window.initializeHeader = function(navigationCallback) {
    // 네비게이션 콜백 설정
    window.onNavigate = navigationCallback;
    window.onHome = () => navigationCallback('home');
};

// 기존 header.js 호환성을 위한 전역 함수들
window.toggleMobileMenu = function() {
    if (window.headerComponent) {
        window.headerComponent.toggleMobileMenu();
    }
};

window.navigateTo = function(page) {
    if (window.headerComponent) {
        window.headerComponent.navigateTo(page);
    }
};

window.showSubMenus = function() {
    if (window.headerComponent && window.innerWidth >= 1024) {
        window.headerComponent.desktopMenuItems.forEach((item) => item.classList.add('is-open'));
    }
};

window.hideSubMenus = function() {
    if (window.headerComponent) {
        window.headerComponent.allMenuGroups.forEach(window.headerComponent.closeAllMenuItems.bind(window.headerComponent));
    }
};