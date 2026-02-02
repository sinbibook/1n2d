/**
 * Header and Footer Loader
 * Dynamically loads header and footer templates into pages
 */

(function() {
    'use strict';

    // Track if header and footer are both loaded
    let headerLoaded = false;
    let footerLoaded = false;

    // Initialize mapper after both header and footer are loaded
    async function tryInitializeMapper() {
        if (headerLoaded && footerLoaded && window.HeaderFooterMapper) {
            // 프리뷰 환경인지 확인 (iframe 내부)
            const isPreview = window.parent !== window;

            if (!isPreview) {
                // 일반 페이지: 기본 데이터로 매핑
                const mapper = new window.HeaderFooterMapper();
                await mapper.initialize();

                // 매핑 완료 후 헤더/사이드바 표시
                if (window.showHeaders) window.showHeaders();
            }
            // 프리뷰 환경: PreviewHandler가 처리하므로 여기서는 매핑하지 않음
        }
    }

    // Load CSS
    function loadCSS(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }

    // Load Header
    async function loadHeader() {
        try {
            // Load header CSS first
            loadCSS('styles/header.css');

            const response = await fetch('common/header.html', { cache: 'no-cache' });
            const html = await response.text();

            // Create a temporary container
            const temp = document.createElement('div');
            temp.innerHTML = html;

            // Find transparent header and menu overlay from temp
            const transparentHeader = temp.querySelector('.transparent-header');
            const menuOverlay = temp.querySelector('.menu-overlay');
            const menuOverlayBg = temp.querySelector('.menu-overlay-bg');

            // Insert overlay background first
            if (menuOverlayBg) {
                document.body.insertBefore(menuOverlayBg, document.body.firstChild);
            }

            // Insert menu overlay
            if (menuOverlay) {
                document.body.insertBefore(menuOverlay, document.body.firstChild);
            }

            // Insert transparent header
            if (transparentHeader) {
                document.body.insertBefore(transparentHeader, document.body.firstChild);
            }

            // Load header JavaScript
            const script = document.createElement('script');
            script.src = 'js/common/header.js';
            script.onload = function() {
                // Mark header as loaded after script is fully loaded
                headerLoaded = true;
                tryInitializeMapper();

                // Trigger scroll event to ensure scrolled class is applied
                window.dispatchEvent(new Event('scroll'));
            };
            document.body.appendChild(script);

            // Immediately check scroll position after header is loaded
            if (window.scrollY > 50 || window.pageYOffset > 50) {
                const header = document.querySelector('.transparent-header');
                if (header) {
                    header.classList.add('scrolled');
                    document.body.classList.add('scrolled');
                }
            }
        } catch (error) {
            console.error('Error loading header:', error);
        }
    }


    // Load Footer
    async function loadFooter() {
        try {
            const response = await fetch('common/footer.html', { cache: 'no-cache' });
            if (response.ok) {
                // Load footer CSS
                loadCSS('styles/footer.css');

                const html = await response.text();

                // Create a temporary container
                const temp = document.createElement('div');
                temp.innerHTML = html;

                // Append footer at the end of body
                const footer = temp.querySelector('.footer');
                if (footer) {
                    document.body.appendChild(footer);

                    // Update copyright year dynamically
                    const copyrightElement = footer.querySelector('.footer-copyright p');
                    if (copyrightElement) {
                        const currentYear = new Date().getFullYear();
                        copyrightElement.textContent = `© ${currentYear} All rights reserved.`;
                    }
                }

                // Also append floating buttons if they exist
                const floatingButtons = temp.querySelector('.floating-buttons');
                if (floatingButtons) {
                    document.body.appendChild(floatingButtons);
                }

                // Load footer JavaScript if exists
                const script = document.createElement('script');
                script.src = 'js/common/footer.js';
                document.body.appendChild(script);

                // Mark footer as loaded and try to initialize mapper
                footerLoaded = true;
                tryInitializeMapper();
            }
        } catch (error) {
            console.error('Error loading footer:', error);
        }
    }

    // Load Scroll to Top Button
    async function loadScrollToTop() {
        try {
            const response = await fetch('common/scroll-to-top.html', { cache: 'no-cache' });
            if (response.ok) {
                const html = await response.text();
                const temp = document.createElement('div');
                temp.innerHTML = html;

                const scrollBtn = temp.querySelector('.scroll-to-top');
                if (scrollBtn) {
                    document.body.appendChild(scrollBtn);
                    initScrollToTop();
                }
            }
        } catch (error) {
            console.error('Error loading scroll to top button:', error);
        }
    }

    // Initialize scroll to top functionality
    function initScrollToTop() {
        const scrollBtn = document.getElementById('scrollToTop');
        if (!scrollBtn) return;

        // Show/hide button based on scroll position
        function toggleScrollButton() {
            if (window.scrollY > 100) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        }

        // Initial check
        toggleScrollButton();

        // Listen for scroll events
        window.addEventListener('scroll', toggleScrollButton);

        // Scroll to top on click
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        loadHeader();
        loadFooter();
        loadScrollToTop();
    });

})();
