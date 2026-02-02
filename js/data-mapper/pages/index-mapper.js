/**
 * Index Page Data Mapper
 * Extends BaseDataMapper for Index page specific mappings
 */
class IndexMapper extends BaseDataMapper {
    constructor() {
        super();
    }

    /**
     * 메인 매핑 메서드
     */
    async mapPage() {
        if (!this.isDataLoaded) return;

        try {
            // SEO 메타 태그 업데이트
            this.updateMetaTags();

            // 각 섹션 매핑
            this.mapHeroSection();
            this.mapEssenceSection();
            this.mapSignatureSection();
            this.mapGallerySection();
            this.mapClosingSection();

            // E-commerce 등록번호 매핑 (footer)
            this.mapEcommerceRegistration();

            // 애니메이션 재초기화
            this.reinitializeScrollAnimations();

            // 슬라이더 재초기화
            this.reinitializeSliders();

        } catch (error) {
            console.error('Failed to map index page:', error);
        }
    }

    /**
     * 슬라이더 재초기화
     */
    reinitializeSliders() {
        // Hero 슬라이더 재초기화
        if (typeof window.initHeroSlider === 'function') {
            window.initHeroSlider();
        }

        // 갤러리는 마소니 그리드로 변경됨 - 슬라이더 기능 제거
        // Gallery는 이제 CSS Grid 마소니 레이아웃 사용

        // Signature 섹션 재초기화 (썸네일 클릭 이벤트)
        this.initSignatureInteraction();
    }

    /**
     * Signature 섹션 인터랙션 초기화
     */
    initSignatureInteraction() {
        const signatureData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.signature');
        if (!signatureData || !signatureData.images) return;

        const selectedImages = signatureData.images
            .filter(img => img.isSelected === true)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .slice(0, 4);

        if (selectedImages.length === 0) return;

        const mainImg = this.safeSelect('[data-signature-main-img]');
        const description = this.safeSelect('[data-signature-description]');
        const thumbnails = this.safeSelectAll('.signature-thumb');

        if (!mainImg || !description || thumbnails.length === 0) return;

        // 초기 활성 썸네일 설정
        thumbnails[0]?.classList.add('active');

        // 썸네일 클릭 이벤트
        thumbnails.forEach((thumb, index) => {
            if (!selectedImages[index]) return;

            thumb.addEventListener('click', () => {
                // 모든 썸네일에서 active 클래스 제거
                thumbnails.forEach(t => t.classList.remove('active'));

                // 클릭된 썸네일에 active 클래스 추가
                thumb.classList.add('active');

                const imgData = selectedImages[index];

                // 페이드 아웃
                mainImg.style.opacity = '0';

                setTimeout(() => {
                    // 이미지와 설명 변경
                    mainImg.src = imgData.url;
                    mainImg.alt = this.sanitizeText(imgData.description, 'Signature Image');
                    description.innerHTML = this._formatTextWithLineBreaks(imgData.description);

                    // 페이드 인
                    mainImg.style.opacity = '1';
                }, 250);
            });
        });
    }

    // ============================================================================
    // 🎯 HERO SECTION MAPPING
    // ============================================================================

    /**
     * Hero Section 매핑 (메인 소개 섹션)
     */
    mapHeroSection() {
        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.hero');
        if (!heroData) return;

        // 숙소 영문명 매핑
        const propertyNameEn = this.safeGet(this.data, 'property.nameEn');
        const heroPropertyNameEn = this.safeSelect('[data-hero-property-name-en]');
        if (heroPropertyNameEn && propertyNameEn) {
            heroPropertyNameEn.textContent = this.sanitizeText(propertyNameEn);
        }

        // 메인 소개 타이틀 매핑
        const heroTitleElement = this.safeSelect('[data-hero-title]');
        if (heroTitleElement) {
            heroTitleElement.textContent = this.sanitizeText(heroData?.title, '메인 히어로 타이틀');
        }

        // 메인 소개 설명 매핑
        const heroDescElement = this.safeSelect('[data-hero-description]');
        if (heroDescElement) {
            heroDescElement.innerHTML = this._formatTextWithLineBreaks(heroData?.description, '메인 히어로 설명');
        }

        // 히어로 슬라이더 이미지 매핑
        if (heroData.images && Array.isArray(heroData.images)) {
            this.mapHeroSlider(heroData.images);
        }
    }

    /**
     * Hero Slider 이미지 매핑
     */
    mapHeroSlider(images) {
        const sliderContainer = this.safeSelect('[data-hero-slider]');
        if (!sliderContainer) return;

        // ImageHelpers를 사용하여 선택된 이미지 필터링 및 정렬
        const selectedImages = ImageHelpers.getSelectedImages(images);

        // 슬라이더 초기화
        sliderContainer.innerHTML = '';

        if (selectedImages.length === 0) {
            // 이미지가 없을 경우 placeholder 슬라이드 추가
            const slideDiv = document.createElement('div');
            slideDiv.className = 'hero-slide active';

            const imgElement = document.createElement('img');
            // 이미지 없을 때 placeholder 적용
            if (typeof ImageHelpers !== 'undefined') {
                ImageHelpers.applyPlaceholder(imgElement);
            }

            slideDiv.appendChild(imgElement);
            sliderContainer.appendChild(slideDiv);
            return;
        }

        // 이미지 생성
        selectedImages.forEach((img, index) => {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'hero-slide';
            if (index === 0) {
                slideDiv.classList.add('active');
            }

            const imgElement = document.createElement('img');
            imgElement.src = img.url;
            imgElement.alt = this.sanitizeText(img.description, '히어로 이미지');
            imgElement.loading = index === 0 ? 'eager' : 'lazy';

            slideDiv.appendChild(imgElement);
            sliderContainer.appendChild(slideDiv);
        });
    }

    // ============================================================================
    // 💎 ESSENCE SECTION MAPPING
    // ============================================================================

    /**
     * Essence Section 매핑 (핵심 메시지 섹션)
     */
    mapEssenceSection() {
        const essenceData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.essence');
        if (!essenceData) return;

        // 타이틀 매핑
        const titleElement = this.safeSelect('[data-essence-title]');
        if (titleElement) {
            titleElement.textContent = this.sanitizeText(essenceData?.title, '특징 섹션 타이틀');
        }

        // 설명 매핑 (description이 images 다음에 오는 새로운 구조 지원)
        const descElement = this.safeSelect('[data-essence-description]');
        if (descElement) {
            descElement.innerHTML = this._formatTextWithLineBreaks(essenceData?.description, '특징 섹션 설명');
        }

        // Essence 이미지 매핑
        const essenceImg = this.safeSelect('[data-essence-img]');
        if (essenceImg) {
            if (typeof ImageHelpers !== 'undefined') {
                ImageHelpers.applyImageOrPlaceholder(essenceImg, essenceData.images);
            }
        }
    }

    // ============================================================================
    // ⭐ SIGNATURE SECTION MAPPING
    // ============================================================================

    /**
     * Signature Section 매핑 (특색 섹션)
     */
    mapSignatureSection() {
        const signatureData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.signature');
        if (!signatureData) return;

        // 타이틀 매핑
        const titleElement = this.safeSelect('[data-signature-title]');
        if (titleElement) {
            titleElement.textContent = this.sanitizeText(signatureData?.title, '시그니처 섹션 타이틀');
        }

        // isSelected가 true인 이미지만 필터링하고 sortOrder로 정렬
        const selectedImages = signatureData.images && Array.isArray(signatureData.images)
            ? signatureData.images
                .filter(img => img.isSelected === true)
                .sort((a, b) => a.sortOrder - b.sortOrder)
            : [];

        // 메인 이미지 매핑 - 첫 번째 썸네일 이미지로 초기화
        const mainImg = this.safeSelect('[data-signature-main-img]');
        if (mainImg) {
            if (selectedImages.length > 0) {
                mainImg.src = selectedImages[0].url;
                mainImg.alt = this.sanitizeText(selectedImages[0].description, 'Signature Main Image');
                mainImg.classList.remove('empty-image-placeholder');
            } else {
                // 이미지가 없을 경우 placeholder 적용
                ImageHelpers.applyPlaceholder(mainImg);
            }
        }

        // 설명 매핑 (signatureData.description 사용)
        const descElement = this.safeSelect('[data-signature-description]');
        if (descElement) {
            descElement.innerHTML = this._formatTextWithLineBreaks(signatureData?.description, '특색 섹션 설명');
        }

        // 썸네일 이미지들 매핑 (최대 3개, 이미지 없어도 placeholder 적용)
        this.mapSignatureThumbnails(selectedImages.slice(0, 3));

        // 썸네일 클릭 이벤트 초기화 (최대 3개)
        this.initSignatureThumbnailEvents(selectedImages.slice(0, 3));
    }

    /**
     * Signature 썸네일 이미지 매핑
     * 총 3개 썸네일, 메인 이미지는 활성 썸네일의 확대 버전
     */
    mapSignatureThumbnails(images) {
        const thumbnails = this.safeSelectAll('.signature-thumb');

        thumbnails.forEach((thumb, thumbIndex) => {
            const img = thumb.querySelector('img');
            if (!img) return;

            if (images[thumbIndex]) {
                img.src = images[thumbIndex].url;
                img.alt = this.sanitizeText(images[thumbIndex].description, `Signature Thumbnail ${thumbIndex + 1}`);
                img.classList.remove('empty-image-placeholder');
                thumb.setAttribute('data-image-index', thumbIndex);
            } else {
                // 이미지가 없을 경우 placeholder 적용
                if (typeof ImageHelpers !== 'undefined') ImageHelpers.applyPlaceholder(img);
            }
        });
    }

    /**
     * Signature 썸네일 클릭 이벤트 초기화
     */
    initSignatureThumbnailEvents(images) {
        const thumbnails = this.safeSelectAll('.signature-thumb');
        const mainImg = this.safeSelect('[data-signature-main-img]');

        if (!mainImg || thumbnails.length === 0) return;

        // 첫 번째 썸네일을 활성 상태로 설정
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        if (thumbnails[0]) {
            thumbnails[0].classList.add('active');
        }

        // 썸네일 클릭 이벤트
        thumbnails.forEach((thumb, index) => {
            thumb.addEventListener('click', (e) => {
                e.preventDefault();
                this.setActiveThumbnail(thumbnails, images, mainImg, index);
            });
        });

        // 자동 회전 시작
        this.startThumbnailAutoRotation(thumbnails, images, mainImg);
    }

    /**
     * 활성 썸네일 설정 및 메인 이미지 변경
     * thumbIndex: 썸네일 위치 (0,1,2), 메인 이미지는 해당 썸네일의 확대 버전
     */
    setActiveThumbnail(thumbnails, images, mainImg, thumbIndex) {
        if (!images[thumbIndex]) return;

        // 강제로 모든 active 클래스 제거
        thumbnails.forEach((thumb) => {
            thumb.classList.remove('active');
            // 확실한 제거를 위해 한 번 더
            if (thumb.classList.contains('active')) {
                thumb.className = thumb.className.replace(/\bactive\b/g, '').trim();
            }
        });

        // 동시 실행을 위해 한 번에 처리
        requestAnimationFrame(() => {
            // 메인 이미지 변경
            mainImg.src = images[thumbIndex].url;
            mainImg.alt = this.sanitizeText(images[thumbIndex].description, 'Signature Main Image');

            // 선택된 썸네일에 active 클래스 추가
            if (thumbnails[thumbIndex]) {
                thumbnails[thumbIndex].classList.add('active');
            }
        });
    }

    /**
     * 썸네일 자동 회전 시작
     */
    startThumbnailAutoRotation(thumbnails, images, mainImg) {
        if (thumbnails.length === 0) return;

        // 현재 활성화된 썸네일 인덱스 찾기
        let currentIndex = 0;
        for (let i = 0; i < thumbnails.length; i++) {
            if (thumbnails[i].classList.contains('active')) {
                currentIndex = i;
                break;
            }
        }

        // 기존 타이머 제거
        if (this.signatureThumbnailTimer) {
            clearInterval(this.signatureThumbnailTimer);
        }

        // 3초마다 자동 회전 (현재 활성화된 인덱스부터 다음으로)
        this.signatureThumbnailTimer = setInterval(() => {
            currentIndex = (currentIndex + 1) % thumbnails.length;
            this.setActiveThumbnail(thumbnails, images, mainImg, currentIndex);
        }, 3000);
    }

    // ============================================================================
    // 🖼️ GALLERY SECTION MAPPING
    // ============================================================================

    /**
     * Gallery Section 매핑 (갤러리 섹션)
     */
    mapGallerySection() {
        const galleryData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.gallery');
        if (!galleryData) return;

        // 타이틀 매핑
        const titleElement = this.safeSelect('[data-gallery-title]');
        if (titleElement) {
            titleElement.textContent = this.sanitizeText(galleryData?.title, '갤러리 타이틀');
        }

        // 설명 매핑
        const descElement = this.safeSelect('[data-gallery-description]');
        if (descElement) {
            descElement.innerHTML = this._formatTextWithLineBreaks(galleryData?.description, '갤러리 설명');
        }

        // 갤러리 이미지 매핑
        const sliderContainer = this.safeSelect('[data-gallery-slider]');
        if (!sliderContainer) return;

        // ImageHelpers를 사용하여 선택된 이미지 필터링 및 정렬
        const selectedImages = ImageHelpers.getSelectedImages(galleryData.images);

        // 슬라이더 초기화
        sliderContainer.innerHTML = '';

        // 갤러리 아이템 개수 결정
        // - 템플릿 상태(이미지 없음): 4개 placeholder
        // - 이미지 있음: 4-6개 동적 (최소 4개, 최대 6개)
        const minItems = 4;
        const maxItems = 6;
        let itemCount;

        if (selectedImages.length === 0) {
            // 템플릿 상태: 4개 placeholder만
            itemCount = 4;
        } else {
            // 이미지 있음: 4-6개 동적
            itemCount = Math.max(minItems, Math.min(maxItems, selectedImages.length));
        }

        for (let i = 0; i < itemCount; i++) {
            const imgData = selectedImages[i] || null; // 이미지가 없으면 null
            const item = this._createGalleryItem(imgData, 'Gallery Image');
            sliderContainer.appendChild(item);
        }

        // 갤러리 아코디언 초기화
        setTimeout(() => {
            this.initIndexGallery();
        }, 100);
    }

    /**
     * 갤러리 아이템 생성 헬퍼 메서드 (facility와 동일한 구조)
     */
    _createGalleryItem(image, altPrefix) {
        const item = document.createElement('div');
        item.className = 'gallery-item animate-element';

        // 이미지 요소
        const img = document.createElement('img');
        if (image && image.url) {
            img.src = image.url;
            img.alt = this.sanitizeText(image.description, altPrefix);
            img.classList.remove('empty-image-placeholder');
        } else {
            if (typeof ImageHelpers !== 'undefined') {
                ImageHelpers.applyPlaceholder(img);
            }
        }

        // 축소시 나타나는 어두운 오버레이
        const overlay = document.createElement('div');
        overlay.className = 'gallery-item-overlay';

        // 확장시 이미지 설명 (하단 우측)
        const description = document.createElement('p');
        description.className = 'gallery-item-description';
        description.textContent = image ? this.sanitizeText(image.description, '') : '';

        // 클릭 이벤트 추가 (facility와 동일한 방식)
        item.addEventListener('click', () => {
            if (window.innerWidth > 768) { // 데스크톱에서만
                this.setActiveGalleryItem(item);
            }
        });

        // 구조 조립
        item.appendChild(img);
        item.appendChild(overlay);
        item.appendChild(description);

        return item;
    }

    /**
     * Index 갤러리 초기화 (facility와 동일한 로직)
     */
    initIndexGallery() {
        const galleryContainer = this.safeSelect('[data-gallery-slider]');
        if (!galleryContainer) return;

        const galleryItems = Array.from(galleryContainer.querySelectorAll('.gallery-item'));
        if (galleryItems.length === 0) return;

        console.log('Index Gallery Items:', galleryItems.length); // 디버깅

        // 첫 번째 아이템 항상 활성화 (facility와 동일)
        if (galleryItems[0]) {
            galleryItems[0].classList.add('gallery-item-active');
        }

        // 클릭 이벤트는 _createGalleryItem에서 이미 추가됨
    }

    /**
     * 활성 갤러리 아이템 설정
     */
    setActiveGalleryItem(activeItem) {
        const container = this.safeSelect('[data-gallery-slider]');
        if (!container) return;

        // 모든 아이템에서 active 클래스 제거
        const allItems = container.querySelectorAll('.gallery-item');
        allItems.forEach(item => {
            item.classList.remove('gallery-item-active');
        });

        // 클릭된 아이템에 active 클래스 추가
        activeItem.classList.add('gallery-item-active');
    }

    // ============================================================================
    // 🎬 CLOSING SECTION MAPPING
    // ============================================================================

    /**
     * Closing Section 매핑 (마무리 섹션)
     */
    mapClosingSection() {
        const closingData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.closing');
        if (!closingData) return;

        // 배경 이미지 매핑
        const bgImg = this.safeSelect('[data-closing-bg-img]');
        if (bgImg) {
            if (typeof ImageHelpers !== 'undefined') ImageHelpers.applyImageOrPlaceholder(bgImg, closingData.images);
        }

        // 설명 매핑
        const descElement = this.safeSelect('[data-closing-description]');
        if (descElement) {
            descElement.innerHTML = this._formatTextWithLineBreaks(closingData?.description, '마무리 섹션 설명');
        }

        // 숙소명 매핑 (새로운 closing-property-name 요소)
        const propertyNameEn = this.safeGet(this.data, 'property.nameEn');
        const closingPropertyName = this.safeSelect('[data-closing-property-name]');
        if (closingPropertyName && propertyNameEn) {
            closingPropertyName.textContent = this.sanitizeText(propertyNameEn);
        }

        // 마무리 섹션 타이틀 매핑
        const closingTitle = this.safeSelect('[data-closing-title]');
        if (closingTitle) {
            closingTitle.textContent = this.sanitizeText(closingData?.title, '마무리 섹션 타이틀');
        }
    }

}

// ============================================================================
// 🚀 INITIALIZATION
// ============================================================================

// 페이지 로드 시 자동 초기화
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', async () => {
        const mapper = new IndexMapper();
        await mapper.initialize();
    });
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IndexMapper;
} else {
    window.IndexMapper = IndexMapper;
}
