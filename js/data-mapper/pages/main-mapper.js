/**
 * Main Page Data Mapper
 * main.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 main 페이지 특화 기능 제공
 */
class MainMapper extends BaseDataMapper {
    constructor() {
        super();
    }

    // ============================================================================
    // 🏠 MAIN PAGE SPECIFIC MAPPINGS
    // ============================================================================

    /**
     * Hero 슬라이더 이미지 매핑
     * homepage.customFields.pages.main.sections[0].hero.images → [data-hero-slider]
     */
    mapHeroSlider() {
        if (!this.isDataLoaded) return;

        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.main.sections.0.hero');
        const sliderContainer = this.safeSelect('[data-hero-slider]');

        if (!sliderContainer) return;

        // 기존 슬라이드 제거
        sliderContainer.innerHTML = '';

        // ImageHelpers를 사용하여 선택된 이미지 필터링 및 정렬
        const selectedImages = ImageHelpers.getSelectedImages(heroData?.images);

        if (selectedImages.length === 0) {
            // 이미지 없으면 placeholder 슬라이드 생성
            const slide = document.createElement('div');
            slide.className = 'hero-slide active';
            const img = document.createElement('img');
            ImageHelpers.applyPlaceholder(img);
            slide.appendChild(img);
            sliderContainer.appendChild(slide);
            return;
        }

        // 이미지 슬라이드 생성
        selectedImages.forEach((imgData, index) => {
            const slide = document.createElement('div');
            slide.className = 'hero-slide';
            if (index === 0) slide.classList.add('active');

            const img = document.createElement('img');
            img.src = imgData.url;
            img.alt = this.sanitizeText(imgData.description, `메인 이미지 ${index + 1}`);
            img.loading = index === 0 ? 'eager' : 'lazy';

            slide.appendChild(img);
            sliderContainer.appendChild(slide);
        });

        // 네비게이션 총 개수 업데이트
        const totalSlides = document.querySelector('[data-total-slides]');
        if (totalSlides) {
            totalSlides.textContent = String(selectedImages.length).padStart(2, '0');
        }
    }

    /**
     * About 섹션 매핑 (제목 + 설명)
     * customFields.pages.main.sections[0].hero.title → [data-main-about-title]
     * customFields.pages.main.sections[0].hero.description → [data-main-about-description]
     */
    mapAboutSection() {
        if (!this.isDataLoaded) return;

        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.main.sections.0.hero');

        // About 제목 - customFields hero.title 사용
        const aboutTitle = this.safeSelect('[data-main-about-title]');
        if (aboutTitle) {
            aboutTitle.textContent = this.sanitizeText(heroData?.title, '소개 페이지 히어로 타이틀');
        }

        // About 설명 - customFields hero.description 사용
        const aboutDescription = this.safeSelect('[data-main-about-description]');
        if (aboutDescription) {
            aboutDescription.innerHTML = this._formatTextWithLineBreaks(heroData?.description, '소개 페이지 히어로 설명');
        }
    }


    /**
     * Full Banner 섹션 매핑
     * property.nameEn (영문명) → [data-main-banner-title]
     * main hero images → [data-main-banner] 배경 이미지
     */
    mapFullBanner() {
        if (!this.isDataLoaded) return;

        // 배너 타이틀 매핑 (property.nameEn)
        const bannerTitle = this.safeSelect('[data-main-banner-title]');
        if (bannerTitle) {
            const nameEn = this.safeGet(this.data, 'property.nameEn');
            bannerTitle.textContent = this.sanitizeText(nameEn, 'PROPERTY NAME').toUpperCase();
        }

        // 배너 배경 이미지 매핑 - 섹션 자체에 배경 설정
        const bannerSection = this.safeSelect('[data-main-banner]');
        if (!bannerSection) return;

        // main hero 이미지 사용
        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.main.sections.0.hero');
        const selectedImages = ImageHelpers.getSelectedImages(heroData?.images);

        if (selectedImages.length > 0) {
            const firstImage = selectedImages[0];
            bannerSection.style.backgroundImage = `url('${firstImage.url}')`;
            bannerSection.style.backgroundSize = 'cover';
            bannerSection.style.backgroundPosition = 'center';
            bannerSection.style.backgroundRepeat = 'no-repeat';
        } else {
            // placeholder 배경 이미지
            ImageHelpers.applyPlaceholder(bannerSection);
        }
    }

    /**
     * Introduction 섹션 매핑 (동적 블록 생성)
     * homepage.customFields.pages.main.sections[0].about[] → .intro-section
     * 첫 번째 블록은 hero.title/description 사용, 나머지는 about[] 사용
     */
    mapIntroductionSection() {
        const introContainer = document.querySelector('.intro-section');
        if (!introContainer) return;

        // 기존 블록 제거
        introContainer.innerHTML = '';

        // JSON 데이터에서 about 섹션 가져오기 (배열)
        const aboutData = this.safeGet(this.data, 'homepage.customFields.pages.main.sections.0.about');

        // about 배열이 있으면 사용, 없으면 빈 배열
        const blocks = (aboutData && Array.isArray(aboutData)) ? aboutData : [];

        if (blocks.length === 0) {
            // 데이터 없으면 placeholder 블록 생성
            const block = this.createIntroBlock({
                title: '소개 블록 제목',
                description: '소개 블록 설명',
                images: null
            });
            introContainer.appendChild(block);
            return;
        }

        // 블록 생성 (sortOrder로 정렬)
        blocks
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .forEach((block) => {
                const blockElement = this.createIntroBlock(block);
                introContainer.appendChild(blockElement);
            });

        // 동적으로 생성된 요소들에 애니메이션 초기화
        this.initializeIntroAnimations();
    }

    /**
     * 동적으로 생성된 intro 요소들에 애니메이션 적용
     */
    initializeIntroAnimations() {
        // IntersectionObserver 설정
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        // Observer 콜백
        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    observer.unobserve(entry.target);
                }
            });
        };

        // Observer 생성
        const observer = new IntersectionObserver(observerCallback, observerOptions);

        // intro-block 내부 요소들 선택하여 관찰
        const elements = document.querySelectorAll('.intro-block-image, .intro-block-content');
        elements.forEach(element => {
            // 이미 뷰포트에 있는지 확인
            const rect = element.getBoundingClientRect();
            const isInViewport = rect.top < window.innerHeight && rect.bottom >= 0;

            if (isInViewport) {
                // 이미 뷰포트에 있으면 바로 애니메이션
                setTimeout(() => {
                    element.classList.add('animate');
                }, 100);
            } else {
                // 그렇지 않으면 관찰 시작
                observer.observe(element);
            }
        });

        // 순차적 애니메이션을 위한 딜레이 설정
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
    }

    /**
     * Introduction 블록 생성 헬퍼 함수
     */
    createIntroBlock(block) {
        const introBlock = document.createElement('div');
        introBlock.className = 'intro-block';

        // 이미지 생성 (animate-element 클래스 추가하여 스크롤 애니메이션 적용)
        const imageDiv = document.createElement('div');
        imageDiv.className = 'intro-block-image animate-element';

        const img = document.createElement('img');
        img.loading = 'lazy';

        // ImageHelpers를 사용하여 선택된 이미지 적용 또는 placeholder
        ImageHelpers.applyImageOrPlaceholder(img, block.images);

        imageDiv.appendChild(img);

        // 텍스트 컨텐츠 래퍼 생성 (animate-element 클래스 추가하여 스크롤 애니메이션 적용)
        const contentDiv = document.createElement('div');
        contentDiv.className = 'intro-block-content animate-element';

        // 제목 생성
        const title = document.createElement('h2');
        title.className = 'intro-block-title';
        title.textContent = this.sanitizeText(block.title, '소개 블록 제목');

        // 설명 생성
        const description = document.createElement('p');
        description.className = 'intro-block-description';
        description.innerHTML = this._formatTextWithLineBreaks(block.description, '소개 블록 설명');

        // 컨텐츠에 추가
        contentDiv.appendChild(title);
        contentDiv.appendChild(description);

        // 블록에 추가
        introBlock.appendChild(imageDiv);
        introBlock.appendChild(contentDiv);

        return introBlock;
    }

    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Main 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            console.error('Cannot map main page: data not loaded');
            return;
        }

        // Main 페이지 섹션들 순차 매핑
        this.mapHeroSlider();
        this.mapAboutSection();
        this.mapFullBanner();
        this.mapIntroductionSection();

        // 메타 태그 업데이트
        this.updateMetaTags();

        // 슬라이더 재초기화
        this.reinitializeSlider();

        // 스크롤 애니메이션 재초기화
        this.reinitializeScrollAnimations();
    }

    /**
     * 스크롤 애니메이션 재초기화
     * 동적으로 생성된 요소들에 대해 새 옵저버 설정
     */
    reinitializeScrollAnimations() {
        // main.js의 initScrollAnimations() 함수 호출하여 새 요소들 옵저버 등록
        if (typeof window.initScrollAnimations === 'function') {
            window.initScrollAnimations();
        }
    }

    /**
     * 슬라이더 재초기화
     * main.js의 initHeroSlider 함수 호출
     */
    reinitializeSlider() {
        // main.js의 initHeroSlider 함수 호출
        if (typeof window.initHeroSlider === 'function') {
            window.initHeroSlider();
        }
    }
}

// ============================================================================
// 🚀 INITIALIZATION
// ============================================================================

// 페이지 로드 시 자동 초기화
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', async () => {
        const mapper = new MainMapper();
        await mapper.initialize();
    });
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainMapper;
} else {
    window.MainMapper = MainMapper;
}
