const initScrollAnimation = () => {
    // Create intersection observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 이미 animate 클래스가 있으면 skip
                if (!entry.target.classList.contains('animate')) {
                    entry.target.classList.add('animate');
                }
            }
        });
    }, observerOptions);

    // Observe all elements with animation classes
    const animatedElements = document.querySelectorAll('.fade-in-up, .fade-in-scale, .slide-in-left, .slide-in-right, .fade-in-line');
    animatedElements.forEach(el => observer.observe(el));
  };

  document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimation();

    // 동적으로 생성되는 요소를 위해 MutationObserver 추가
    const observeDOM = new MutationObserver(() => {
      initScrollAnimation();
    });

    observeDOM.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
  