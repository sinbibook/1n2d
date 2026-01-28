/**
 * Index Page Data Mapper
 * template-dog-friendly-lodge index.html 전용 매핑 클래스
 */
class IndexMapper extends BaseDataMapper {
    constructor(data = null) {
        super();
        if (data) {
            this.data = data;
            this.isDataLoaded = true;
        }
    }

    // ============================================================================
    // 🏠 INDEX PAGE SPECIFIC MAPPINGS
    // ============================================================================

    /**
     * Hero 섹션 매핑
     */
    mapHeroSection() {
        if (!this.isDataLoaded) return;

        // customFields 헬퍼를 통해 숙소명 가져오기
        const builderPropertyName = this.getPropertyName();

        // 1. Property name 매핑 (Hero 섹션의 h1 내부)
        const propertyNameEl = this.safeSelect('#section1 [data-property-name]');
        if (propertyNameEl && builderPropertyName) {
            propertyNameEl.textContent = builderPropertyName;
        }

        // 2. Hero description 매핑
        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.hero');
        const heroDescriptionEl = this.safeSelect('[data-homepage-customFields-pages-index-sections-0-hero-description]');
        if (heroDescriptionEl && heroData) {
            const description = heroData.description || '메인 히어로 설명';
            heroDescriptionEl.innerHTML = description.replace(/\n/g, '<br>');
        }

        // 3. Hero 슬라이더 이미지 매핑
        this.mapHeroImage();
    }

    /**
     * Hero 슬라이더 이미지 매핑 (여러 이미지)
     */
    mapHeroImage() {
        const swiperWrapper = this.safeSelect('[data-homepage-customFields-pages-index-sections-0-hero-images]');

        if (!swiperWrapper) {
            const altWrapper = this.safeSelect('.swiper-wrapper');
            if (altWrapper) {
                return this.mapHeroImageToWrapper(altWrapper);
            }
            return;
        }

        return this.mapHeroImageToWrapper(swiperWrapper);
    }

    /**
     * 특정 wrapper에 Hero 이미지 매핑
     */
    mapHeroImageToWrapper(swiperWrapper) {
        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.hero');
        const heroImages = (heroData && Array.isArray(heroData.images)) ? heroData.images : [];

        swiperWrapper.innerHTML = '';

        if (heroImages.length > 0) {
            const selectedImages = window.ImageHelpers.getSelectedImages(heroImages);

            if (selectedImages.length > 0) {
                // 각 유효한 이미지에 대해 슬라이드 생성
                selectedImages.forEach((image, index) => {
                    const slide = document.createElement('div');
                    slide.className = 'swiper-slide';

                    const img = document.createElement('img');
                    img.src = image.url;
                    img.alt = image.description || `Hero Image ${index + 1}`;
                    img.className = 'w-full h-full object-cover';
                    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';

                    img.onerror = function() {
                        this.src = '';
                        this.classList.add('empty-image-placeholder');
                    };

                    slide.appendChild(img);
                    swiperWrapper.appendChild(slide);
                });

                // Swiper 초기화
                this.initializeHeroSwiper();
            } else {
                this.createPlaceholderSlide(swiperWrapper);
                this.initializeHeroSwiper(true);
            }
        } else {
            this.createPlaceholderSlide(swiperWrapper);
            this.initializeHeroSwiper(true);
        }
    }

    /**
     * Placeholder 슬라이드 생성 (main.html hero 방식과 동일)
     */
    createPlaceholderSlide(wrapper) {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';

        const img = document.createElement('img');
        img.src = '';
        img.alt = '히어로 이미지';
        img.className = 'absolute inset-0 w-full h-full object-cover empty-image-placeholder';
        img.style.cssText = 'width: 100%; height: 100vh; min-height: 100vh; object-fit: cover; display: block; position: absolute; inset: 0px; z-index: 1;';

        slide.appendChild(img);
        wrapper.appendChild(slide);
    }

    /**
     * Hero Swiper 초기화 (원래 디자인)
     */
    initializeHeroSwiper(isPlaceholderMode = false) {
        // 모바일에서 추가 대기 시간
        const isMobile = window.innerWidth <= 768;
        const delay = isMobile ? 500 : 100;

        // Swiper가 로드된 후 초기화
        setTimeout(() => {
            if (typeof Swiper !== 'undefined') {
                const swiperConfig = {
                    effect: 'fade',
                    fadeEffect: {
                        crossFade: true
                    },
                    speed: 800,
                    allowTouchMove: true,
                    touchRatio: 1,
                    touchAngle: 45,
                    navigation: {
                        nextEl: '.hero-controls .swiper-button-next',
                        prevEl: '.hero-controls .swiper-button-prev',
                    },
                    pagination: {
                        el: '.swiper-pagination',
                        clickable: true,
                        bulletClass: 'swiper-pagination-bullet',
                        bulletActiveClass: 'swiper-pagination-bullet-active'
                    },
                    scrollbar: {
                        el: '.swiper-scrollbar',
                        draggable: true,
                    },
                };

                // Only enable autoplay and loop if not in placeholder mode
                if (!isPlaceholderMode) {
                    // 슬라이드 개수 확인
                    const slideCount = document.querySelectorAll('#hero-swiper .swiper-slide').length;

                    swiperConfig.autoplay = {
                        delay: 4000,
                        disableOnInteraction: false,
                    };

                    // loop는 슬라이드가 2개 이상일 때만 활성화
                    if (slideCount >= 2) {
                        swiperConfig.loop = true;
                    }
                }

                // Add the 'on' callbacks to the config
                swiperConfig.on = {
                    init: function() {
                        // Swiper 초기화 완료 후 hero 애니메이션 트리거
                        if (window.initHeroAfterData) {
                            window.initHeroAfterData();
                        }
                    },
                    slideChange: function() {
                        // 슬라이드 변경시 프로그레스 바 리셋
                        const progressBar = document.querySelector('.hero-progress');
                        if (progressBar) {
                            progressBar.style.width = '0%';
                        }
                    },
                    autoplayTimeLeft: function(_, __, progress) {
                        if (!isPlaceholderMode) {
                            const currentProgress = (1 - progress) * 100;
                            const progressBar = document.querySelector('.hero-progress');
                            if (progressBar) {
                                progressBar.style.width = currentProgress + '%';
                            }
                        }
                    }
                };

                const heroSwiper = new Swiper('#hero-swiper', swiperConfig);

                // 전역에서 접근 가능하도록
                window.heroSwiper = heroSwiper;

                // 수동으로 네비게이션 버튼 이벤트 추가
                const nextButton = document.querySelector('.hero-controls .swiper-button-next');
                const prevButton = document.querySelector('.hero-controls .swiper-button-prev');

                if (nextButton) {
                    nextButton.addEventListener('click', () => {
                        heroSwiper.slideNext();
                    });
                }

                if (prevButton) {
                    prevButton.addEventListener('click', () => {
                        heroSwiper.slidePrev();
                    });
                }
            } else {
                setTimeout(() => this.initializeHeroSwiper(), 500);
            }
        }, delay);
    }

    /**
     * Essence 섹션 매핑 (중간 설명 텍스트)
     */
    mapEssenceSection() {
        if (!this.isDataLoaded) return;

        const essenceData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.essence');

        // Essence title 매핑
        const essenceTitleEl = this.safeSelect('[data-homepage-customFields-pages-index-sections-0-essence-title]');
        if (essenceTitleEl && essenceData) {
            const title = essenceData.title || '특징 섹션 타이틀';
            essenceTitleEl.textContent = title;
        }

        // Essence description 매핑
        const essenceDescEl = this.safeSelect('[data-homepage-customFields-pages-index-sections-0-essence-description]');
        if (essenceDescEl && essenceData) {
            const description = essenceData.description || '특징 섹션 설명';
            essenceDescEl.innerHTML = description.replace(/\n/g, '<br>');
        }
    }

    /**
     * About 섹션 매핑 (Signature Section)
     */
    mapAboutSection() {
        if (!this.isDataLoaded) return;

        // customFields 헬퍼를 통해 숙소명 가져오기
        const builderPropertyName = this.getPropertyName();

        // Property name 매핑 (설명 텍스트 내 모든 요소)
        const propertyNameElements = this.safeSelectAll('.about-section [data-property-name]');
        propertyNameElements.forEach(element => {
            if (builderPropertyName) {
                element.textContent = builderPropertyName;
            }
        });

        // Signature 섹션 이미지들 매핑
        this.mapSignatureImages();
    }

    /**
     * Signature 섹션 동적 생성 및 매핑
     */
    mapSignatureImages() {
        // Signature 컨테이너 찾기
        const signatureContainer = this.safeSelect('[data-homepage-customFields-pages-index-sections-signature-items]');
        if (!signatureContainer) return;

        // 컨테이너 초기화
        signatureContainer.innerHTML = '';

        // Signature 데이터 가져오기
        const signatureData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.signature');
        let itemsToRender = [];

        // 선택된 이미지들을 사용
        if (signatureData && signatureData.images && signatureData.images.length > 0) {
            const selectedImages = window.ImageHelpers.getSelectedImages(signatureData.images);

            if (selectedImages.length > 0) {
                itemsToRender = selectedImages.map(image => ({
                    description: image.description !== undefined && image.description !== null
                        ? image.description
                        : '이미지 설명을 입력해주세요.',
                    image: {
                        url: image.url,
                        description: image.description
                    }
                }));
            }
        }

        // Fallback: 기본 아이템 1개 생성
        if (itemsToRender.length === 0) {
            itemsToRender = [
                {
                    description: '이미지 설명을 입력해주세요.'
                }
            ];
        }

        // 각 아이템 동적 생성
        itemsToRender.forEach((item, index) => {
            this.createSignatureItem(signatureContainer, item, index);
        });
    }

    /**
     * 개별 Signature 아이템 HTML 생성
     */
    createSignatureItem(container, itemData) {
        const isImageFirst = true;

        // 아이템 컨테이너 생성
        const itemDiv = document.createElement('div');
        itemDiv.className = 'about-content pb-12 md:py-12';

        // 이미지 요소 생성
        const imageDiv = document.createElement('div');
        imageDiv.className = 'about-image fade-in-scale';

        const img = document.createElement('img');
        img.alt = 'signature-image';
        img.className = 'empty-image-placeholder';

        // 이미지 데이터 처리
        let imageUrl = '';
        let imageAlt = 'signature-image';

        if (itemData.image && itemData.image.url) {
            imageUrl = itemData.image.url;
            imageAlt = itemData.image.description !== undefined && itemData.image.description !== null
                ? itemData.image.description
                : 'signature-image';
        } else if (itemData.imageUrl) {
            imageUrl = itemData.imageUrl;
        }

        if (imageUrl) {
            img.src = imageUrl;
            img.alt = imageAlt;
            img.classList.remove('empty-image-placeholder');
            img.onerror = function() {
                this.src = '';
                this.classList.add('empty-image-placeholder');
            };
        } else {
            img.src = '';
        }

        imageDiv.appendChild(img);

        // 텍스트 요소 생성
        const textDiv = document.createElement('div');
        textDiv.className = 'about-text px-16 fade-in-up';

        const p = document.createElement('p');
        p.className = 'about-description ko-body';
        const descText = itemData.description !== undefined && itemData.description !== null
            ? itemData.description
            : '이미지 설명을 입력해주세요.';
        p.innerHTML = descText.replace(/\n/g, '<br>');

        textDiv.appendChild(p);

        // 홀수/짝수에 따라 순서 결정
        if (isImageFirst) {
            itemDiv.appendChild(imageDiv);
            itemDiv.appendChild(textDiv);
        } else {
            itemDiv.appendChild(textDiv);
            itemDiv.appendChild(imageDiv);
        }

        // 컨테이너에 추가
        container.appendChild(itemDiv);
    }

    /**
     * Signature 섹션 매핑 (preview-handler용)
     */
    mapSignatureSection() {
        // updateSignatureDescriptions를 호출하여 미리보기 업데이트
        this.updateSignatureDescriptions();
    }

    /**
     * Signature 미리보기 업데이트 (DOM 재활용)
     */
    updateSignatureDescriptions() {
        const signatureContainer = this.safeSelect('[data-homepage-customFields-pages-index-sections-signature-items]');
        if (!signatureContainer) return;

        // Signature 데이터 가져오기
        const signatureData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.signature');
        if (!signatureData || !signatureData.images) return;

        // 선택된 이미지들
        const selectedImages = window.ImageHelpers.getSelectedImages(signatureData.images);


        // 이미지가 0개인 경우 기본 아이템 1개 사용
        let itemsToRender = [];
        if (selectedImages.length === 0) {
            itemsToRender = [
                { description: '이미지 설명을 입력해주세요.' }
            ];
        } else {
            itemsToRender = selectedImages.map(image => ({
                description: image.description !== undefined && image.description !== null
                    ? image.description
                    : '이미지 설명을 입력해주세요.',
                image: {
                    url: image.url,
                    description: image.description
                }
            }));
        }

        // 기존 아이템
        const existingItems = Array.from(signatureContainer.querySelectorAll('.about-content'));

        // 개수가 줄어든 경우: 초과 아이템 제거
        if (existingItems.length > itemsToRender.length) {
            for (let i = itemsToRender.length; i < existingItems.length; i++) {
                existingItems[i].remove();
            }
        }

        // 각 아이템 업데이트 또는 생성
        itemsToRender.forEach((itemData, index) => {
            const existingItem = existingItems[index];

            if (existingItem) {
                // 기존 아이템 업데이트
                const imageData = itemData.image || { url: '', description: itemData.description };
                this.updateSignatureItem(existingItem, imageData);
            } else {
                // 새 아이템 생성
                this.createSignatureItem(signatureContainer, itemData, index);
            }
        });
    }

    /**
     * 기존 Signature 아이템 업데이트 (DOM 재활용)
     */
    updateSignatureItem(itemElement, imageData) {
        // 이미지 업데이트
        const imgElement = itemElement.querySelector('.about-image img');
        if (imgElement) {
            const newUrl = imageData.url !== undefined && imageData.url !== null ? imageData.url : '';
            // URL 비교를 단순화 - 항상 업데이트
            imgElement.src = newUrl;
            imgElement.alt = imageData.description !== undefined && imageData.description !== null
                ? imageData.description
                : 'signature-image';

            if (newUrl) {
                imgElement.classList.remove('empty-image-placeholder');
                // 이미지 로드 에러 처리
                imgElement.onerror = function() {
                    this.src = '';
                    this.classList.add('empty-image-placeholder');
                };
            } else {
                imgElement.classList.add('empty-image-placeholder');
            }
        }

        // Description 업데이트
        const descElement = itemElement.querySelector('.about-description');
        if (descElement) {
            // 빈 문자열도 허용 (undefined/null일 때만 기본값 사용)
            const descText = imageData.description !== undefined && imageData.description !== null
                ? imageData.description
                : '이미지 설명을 입력해주세요.';
            descElement.innerHTML = descText.replace(/\n/g, '<br>');
        }
    }

    /**
     * Closing 섹션 매핑 (preview-handler용)
     */
    mapClosingSection() {
        this.mapWaveSection();
    }

    /**
     * Wave 섹션 매핑
     */
    mapWaveSection() {
        if (!this.isDataLoaded) return;

        const closingData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.closing');

        // Wave 섹션 제목 매핑
        const waveTitleEl = this.safeSelect('[data-homepage-customFields-pages-index-sections-0-closing-title]');
        if (waveTitleEl && closingData) {
            const title = closingData.title || '마무리 섹션 타이틀';
            waveTitleEl.textContent = title;
        }

        // Wave 섹션 설명 매핑
        const waveDescEl = this.safeSelect('[data-homepage-customFields-pages-index-sections-0-closing-description]');
        if (waveDescEl && closingData) {
            const description = closingData.description || '마무리 섹션 설명';
            waveDescEl.innerHTML = description.replace(/\n/g, '<br>');
        }

        // Wave 배경 이미지 매핑
        this.mapWaveBackgroundImage();
    }

    /**
     * Wave 배경 이미지 매핑
     */
    mapWaveBackgroundImage() {
        const waveImageElement = this.safeSelect('.wave-bg-section .bg-cover.bg-center');
        if (!waveImageElement) return;

        const closingData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.closing');
        let imageUrl = null;

        if (closingData && closingData.images && Array.isArray(closingData.images)) {
            // isSelected가 true인 이미지들만 필터링하고 sortOrder로 정렬
            const firstImage = window.ImageHelpers.getFirstSelectedImage(closingData.images);

            // 첫 번째 선택된 이미지 사용
            if (firstImage) {
                imageUrl = firstImage.url;
            }
        }

        if (imageUrl) {
            waveImageElement.style.backgroundImage = `url("${imageUrl}")`;
            waveImageElement.classList.remove('empty-image-placeholder');
        } else {
            waveImageElement.style.backgroundImage = '';
            waveImageElement.classList.add('empty-image-placeholder');
        }
    }

    /**
     * 스크롤 애니메이션 재초기화
     */
    reinitializeScrollAnimations() {
        if (typeof window.initScrollAnimations === 'function') {
            window.initScrollAnimations();
        }
    }

    /**
     * SEO 메타 태그 및 Favicon 업데이트
     */
    updateSEOInfo(property, seoData) {
        // customFields 헬퍼를 통해 숙소명 가져오기
        const builderPropertyName = this.getPropertyName();

        // Property 기반 기본 타이틀 설정
        if (builderPropertyName) {
            const title = document.querySelector('title');
            if (title && property?.subtitle) {
                title.textContent = `${builderPropertyName} - ${property.subtitle}`;
            } else if (title) {
                title.textContent = builderPropertyName;
            }
        }

        // SEO 데이터가 있으면 우선 적용
        if (seoData) {
            if (seoData.title) {
                const titleElement = document.querySelector('[data-homepage-seo-title]');
                if (titleElement) {
                    titleElement.textContent = seoData.title;
                }
            }

            if (seoData.description) {
                const descElement = document.querySelector('[data-homepage-seo-description]');
                if (descElement) {
                    descElement.content = seoData.description;
                }
            }

            if (seoData.keywords) {
                const keywordsElement = document.querySelector('[data-homepage-seo-keywords]');
                if (keywordsElement) {
                    keywordsElement.content = seoData.keywords;
                }
            }
        }

        // Favicon 업데이트 (homepage.images[0].logo에서 isSelected: true인 항목)
        if (this.data && this.data.homepage && this.data.homepage.images && this.data.homepage.images[0] && this.data.homepage.images[0].logo) {
            const selectedLogo = this.data.homepage.images[0].logo.find(logo => logo.isSelected === true);
            if (selectedLogo && selectedLogo.url) {
                const faviconElement = document.querySelector('[data-homepage-favicon]');
                if (faviconElement) {
                    faviconElement.href = selectedLogo.url;
                }
            }
        }
    }

    // ============================================================================
    // 🔄 MAIN MAPPING METHOD
    // ============================================================================

    /**
     * Index 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            return;
        }

        // 실제 HTML 구조에 맞는 섹션들만 매핑
        this.mapHeroSection();      // Hero 섹션 (Property name, subtitle, 슬라이더)
        this.mapEssenceSection();   // Essence 섹션 (중간 설명 텍스트)
        this.mapAboutSection();     // About 섹션 (Signature 이미지들)
        this.mapWaveSection();      // Wave 섹션 (제목, 설명, 배경이미지)

        // 메타 태그 및 SEO 업데이트
        const indexSEO = this.safeGet(this.data, 'homepage.customFields.pages.index.seo');
        this.updateSEOInfo(this.data.property, indexSEO);

        // 애니메이션 재초기화
        this.reinitializeScrollAnimations();
    }
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IndexMapper;
} else {
    window.IndexMapper = IndexMapper;
}
