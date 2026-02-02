/**
 * Scroll-triggered Animations
 * IntersectionObserver를 사용한 스크롤 애니메이션
 */

document.addEventListener('DOMContentLoaded', function() {
    // 애니메이션을 적용할 요소들 선택
    const animateElements = [
        '.main-about-title',
        '.main-about-description',
        '.intro-block-image',
        '.intro-block-content',
        '.full-banner-title',
        '.full-banner-circle',
        '.about-title',  // directions 페이지 타이틀
        '.location-details',
        '.location-note',
        '.map-wrapper',
        '.facility-label',  // facility 페이지 요소들
        '.facility-main-title',
        '.facility-main-description',
        '.facility-thumbnail',
        '.facility-full-image',
        '.facility-details-section',
        '.facility-additional-section',
        '.facility-info-card',
        '.facility-gallery-label',  // facility 갤러리 라벨
        '.gallery-item'
    ];

    // IntersectionObserver 설정
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 // 요소가 10% 보일 때 애니메이션 시작
    };

    // Observer 콜백 함수
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 요소가 뷰포트에 들어오면 animate 클래스 추가
                entry.target.classList.add('animate');

                // 한 번 애니메이션이 실행되면 더 이상 관찰하지 않음
                observer.unobserve(entry.target);
            }
        });
    };

    // Observer 인스턴스 생성
    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // 각 요소를 관찰
    animateElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            // 요소가 이미 뷰포트에 있는지 확인
            const rect = element.getBoundingClientRect();
            const isInViewport = rect.top < window.innerHeight && rect.bottom >= 0;

            if (isInViewport) {
                // 이미 뷰포트에 있으면 바로 애니메이션 시작
                setTimeout(() => {
                    element.classList.add('animate');
                }, 100);
            } else {
                // 그렇지 않으면 관찰 시작
                observer.observe(element);
            }
        });
    });

    // 특별히 intro 블록들은 순차적으로 애니메이션
    const introBlocks = document.querySelectorAll('.intro-block');
    introBlocks.forEach((block, index) => {
        const image = block.querySelector('.intro-block-image');
        const content = block.querySelector('.intro-block-content');

        if (image) {
            image.style.transitionDelay = `${index * 0.1}s`;
        }
        if (content) {
            content.style.transitionDelay = `${index * 0.1 + 0.2}s`;
        }
    });
});