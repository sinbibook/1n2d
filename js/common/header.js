// Header JavaScript
(function() {
    'use strict';

    // Scroll Effect for Transparent Header
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.transparent-header');
        const body = document.body;

        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
                body.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
                body.classList.remove('scrolled');
            }
        }
    });

    // Toggle Menu Overlay
    window.toggleMenuOverlay = function() {
        const menuOverlay = document.getElementById('menu-overlay');
        const menuToggle = document.getElementById('menu-toggle');
        const menuText = menuToggle ? menuToggle.querySelector('.menu-text') : null;
        const overlayBg = document.getElementById('menu-overlay-bg');
        const body = document.body;

        if (!menuOverlay || !menuToggle) return;

        const isActive = menuOverlay.classList.contains('active');

        if (isActive) {
            // Close menu
            menuOverlay.classList.remove('active');
            menuToggle.classList.remove('active');
            body.classList.remove('menu-open');
            if (overlayBg) overlayBg.classList.remove('active');

            // Change text back to MENU
            if (menuText) {
                menuText.textContent = 'MENU';
            }
        } else {
            // Open menu
            // Change text to CLOSE
            if (menuText) {
                menuText.textContent = 'CLOSE';
            }


            menuOverlay.classList.add('active');
            menuToggle.classList.add('active');
            body.classList.add('menu-open');
            if (overlayBg) overlayBg.classList.add('active');
        }
    };

    // Keep the old function name for compatibility
    window.toggleSideHeader = window.toggleMenuOverlay;

    // Navigation function
    window.navigateTo = function(page, id = null) {
        // Close menu overlay if open
        const menuOverlay = document.getElementById('menu-overlay');
        if (menuOverlay && menuOverlay.classList.contains('active')) {
            toggleMenuOverlay();
        }

        // Navigate to page
        let url = '';
        switch(page) {
            case 'home':
                url = 'index.html';
                break;
            case 'main':
                url = 'main.html';
                break;
            case 'directions':
                url = 'directions.html';
                break;
            case 'reservation-info':
                url = 'reservation.html';
                break;
            case 'room':
                url = 'room.html';
                break;
            case 'facility':
                url = 'facility.html';
                break;
            case 'reservation':
                url = 'reservation.html';
                break;
            default:
                url = page + '.html';
        }

        // Navigate to URL (preserve preview query string and add id if provided)
        if (url) {
            const currentParams = new URLSearchParams(window.location.search);
            const isPreview = currentParams.get('preview');
            const params = new URLSearchParams();

            if (id) {
                params.set('id', id);
            }
            if (isPreview) {
                params.set('preview', isPreview);
            }

            const queryString = params.toString();
            if (queryString) {
                url += '?' + queryString;
            }

            window.location.href = url;
        }
    };

    // Initialize Accordion Menu
    function initializeAccordionMenu() {
        const menuItems = document.querySelectorAll('.menu-item');

        // 기본적으로 모든 메뉴 열기
        menuItems.forEach(item => {
            item.classList.add('accordion-active');

            // 타이틀 클릭 이벤트 추가
            const title = item.querySelector('.menu-item-title');
            if (title) {
                title.addEventListener('click', function(e) {
                    e.stopPropagation();

                    // 다른 메뉴들 닫기 (선택적 - 한 번에 하나만 열리게 하려면)
                    // menuItems.forEach(otherItem => {
                    //     if (otherItem !== item) {
                    //         otherItem.classList.remove('accordion-active');
                    //     }
                    // });

                    // 현재 메뉴 토글
                    item.classList.toggle('accordion-active');
                });
            }
        });
    }

    // Check and set header state based on scroll position
    function checkInitialScroll() {
        const header = document.querySelector('.transparent-header');

        if (header) {
            if (window.scrollY > 50 || window.pageYOffset > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    }



    // Initialize header immediately (since this script is loaded dynamically)
    function initializeHeader() {
        // Initialize header functions

        // Check initial scroll position
        checkInitialScroll();

        // Initialize menu toggle button
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', function(e) {
                e.preventDefault();
                toggleMenuOverlay();
            });
        }

        // Initialize accordion menu
        initializeAccordionMenu();


        // Initialize overlay click event
        const overlayBg = document.getElementById('menu-overlay-bg');
        if (overlayBg) {
            overlayBg.addEventListener('click', function() {
                toggleMenuOverlay();
            });
        }

        // Initialize YBS booking button
        const ybsBookingBtn = document.querySelector('[data-ybs-booking]');
        if (ybsBookingBtn) {
            ybsBookingBtn.addEventListener('click', function(e) {
                e.preventDefault();
                // Add YBS booking functionality here
                console.log('YBS Booking clicked');
            });
        }

        // Initialize mobile booking buttons
        const mobileBookingBtns = document.querySelectorAll('.mobile-booking-btn');
        mobileBookingBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                // Add mobile booking functionality here
                console.log('Mobile booking clicked:', this.textContent);
            });
        });
    }

    // Call initialization immediately
    initializeHeader();

    // Also check when window loads (for refresh scenarios)
    window.addEventListener('load', function() {
        checkInitialScroll();
    });

})();
