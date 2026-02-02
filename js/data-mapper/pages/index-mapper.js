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

        // Gallery 슬라이더 재초기화
        if (typeof window.initGallerySlider === 'function') {
            window.initGallerySlider();
        }

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

        // 숙소 영문명 매핑 (customFields 우선)
        const propertyNameEn = this.getPropertyNameEn();
        const heroPropertyNameEn = this.safeSelect('[data-hero-property-name-en]');
        if (heroPropertyNameEn) {
            heroPropertyNameEn.textContent = propertyNameEn;
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

        // 메인 이미지 매핑
        const mainImg = this.safeSelect('[data-signature-main-img]');
        if (mainImg) {
            if (typeof ImageHelpers !== 'undefined') ImageHelpers.applyImageOrPlaceholder(mainImg, signatureData.images);
        }

        // isSelected가 true인 이미지만 필터링하고 sortOrder로 정렬
        const selectedImages = signatureData.images && Array.isArray(signatureData.images)
            ? signatureData.images
                .filter(img => img.isSelected === true)
                .sort((a, b) => a.sortOrder - b.sortOrder)
            : [];

        // 설명 매핑 (signatureData.description 사용)
        const descElement = this.safeSelect('[data-signature-description]');
        if (descElement) {
            descElement.innerHTML = this._formatTextWithLineBreaks(signatureData?.description, '특색 섹션 설명');
        }

        // 썸네일 이미지들 매핑 (이미지 없어도 placeholder 적용 위해 항상 호출)
        this.mapSignatureThumbnails(selectedImages.slice(0, 4));
    }

    /**
     * Signature 썸네일 이미지 매핑
     */
    mapSignatureThumbnails(images) {
        const thumbnails = this.safeSelectAll('.signature-thumb');

        thumbnails.forEach((thumb, index) => {
            const img = thumb.querySelector('img');
            if (!img) return;

            if (images[index]) {
                img.src = images[index].url;
                img.alt = this.sanitizeText(images[index].description, `Signature Thumbnail ${index + 1}`);
                img.classList.remove('empty-image-placeholder');
                thumb.setAttribute('data-index', index);
            } else {
                // 이미지가 없을 경우 placeholder 적용
                if (typeof ImageHelpers !== 'undefined') ImageHelpers.applyPlaceholder(img);
            }
        });
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

        if (selectedImages.length === 0) {
            // 이미지가 없을 경우 placeholder 아이템 추가
            const item = document.createElement('div');
            item.className = 'gallery-item landscape';

            const imageWrapper = document.createElement('div');
            imageWrapper.className = 'gallery-item-image';

            const img = document.createElement('img');
            if (typeof ImageHelpers !== 'undefined') {
                ImageHelpers.applyPlaceholder(img);
            }

            const description = document.createElement('div');
            description.className = 'gallery-item-description';
            const descSpan = document.createElement('span');
            descSpan.textContent = this.sanitizeText(null, '이미지 설명');
            description.appendChild(descSpan);

            imageWrapper.appendChild(img);
            item.appendChild(imageWrapper);
            item.appendChild(description);
            sliderContainer.appendChild(item);
            return;
        }

        // 이미지 생성
        selectedImages.forEach((imgData, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';

            // 홀수(0,2,4...)는 가로, 짝수(1,3,5...)는 세로
            if (index % 2 === 0) {
                item.classList.add('landscape');
            } else {
                item.classList.add('portrait');
            }

            const imageWrapper = document.createElement('div');
            imageWrapper.className = 'gallery-item-image';

            const img = document.createElement('img');
            img.src = imgData.url;
            img.alt = this.sanitizeText(imgData.description, `Gallery Image ${index + 1}`);
            img.loading = 'lazy';

            const description = document.createElement('div');
            description.className = 'gallery-item-description';
            const descSpan = document.createElement('span');
            descSpan.textContent = this.sanitizeText(imgData.description, '이미지 설명');
            description.appendChild(descSpan);

            imageWrapper.appendChild(img);
            item.appendChild(imageWrapper);
            item.appendChild(description);
            sliderContainer.appendChild(item);
        });
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

        // 숙소 영문명 매핑 (customFields 우선)
        const closingPropertyNameEn = this.getPropertyNameEn();
        const closingTitle = this.safeSelect('[data-closing-title]');
        if (closingTitle) {
            closingTitle.textContent = closingPropertyNameEn;
        }

        // 버튼 클릭 이벤트 업데이트 - 첫 번째 객실/시설로 이동
        this.updateClosingButtons();
    }

    /**
     * Closing 섹션 버튼 업데이트 - 첫 번째 객실/시설로 이동
     */
    updateClosingButtons() {
        this._updateButton('room', 'rooms');
        this._updateButton('facility', 'property.facilities');
    }

    /**
     * Closing 섹션의 버튼을 동적으로 업데이트하는 헬퍼 메서드
     * @param {string} type - 버튼 타입 ('room' 또는 'facility')
     * @param {string} dataPath - 데이터 경로
     * @private
     */
    _updateButton(type, dataPath) {
        const button = this.safeSelect(`.closing-btn[onclick*="${type}"]`);
        if (!button) return;

        const items = this.safeGet(this.data, dataPath) || [];
        if (items.length > 0) {
            // displayOrder로 정렬 후 첫 번째 아이템의 ID 가져오기
            const sortedItems = [...items].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            const firstItemId = sortedItems[0]?.id;
            if (firstItemId) {
                button.onclick = () => navigateTo(type, firstItemId);
            }
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
