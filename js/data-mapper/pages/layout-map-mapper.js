/**
 * Layout Map Data Mapper
 * layout-map.html 전용 매핑 함수들을 포함한 클래스
 */
class LayoutMapMapper extends BaseDataMapper {
    constructor() {
        super();
    }

    getLayoutMapData() {
        return this.safeGet(this.data, 'homepage.customFields.pages.layoutMap.sections.0');
    }

    /**
     * Hero 섹션 매핑 (단일 이미지)
     * homepage.customFields.pages.layoutMap.sections[0].hero.images → [data-hero-image]
     */
    mapHeroSection() {
        if (!this.isDataLoaded) return;

        const section = this.getLayoutMapData();
        this.mapHeroImage(section?.hero?.images, '배치도 이미지');
    }

    mapLayoutMapContent() {
        if (!this.isDataLoaded) return;

        const section = this.getLayoutMapData();
        if (!section || !section.about) return;

        // 타이틀/설명 내용 없으면 미노출
        const titleEl = document.querySelector('[data-layout-map-about-title]');
        if (titleEl) {
            const title = this.sanitizeText(section.about.title);
            titleEl.textContent = title;
            titleEl.style.display = title ? '' : 'none';
        }

        const descEl = document.querySelector('[data-layout-map-about-description]');
        if (descEl) {
            const description = this.sanitizeText(section.about.description);
            descEl.textContent = description;
            descEl.style.display = description ? '' : 'none';
        }

        const introSection = document.querySelector('.intro-section');
        if (!introSection) return;

        introSection.innerHTML = '';

        const images = section.about.images || [];
        // isSelected가 true인 이미지만 필터링
        const selectedImages = images.filter(img => img.isSelected).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        if (selectedImages.length === 0) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'layout-map-item animate-element';
            const imageWrapperDiv = document.createElement('div');
            imageWrapperDiv.className = 'layout-map-image-wrapper';
            const img = document.createElement('img');
            if (typeof ImageHelpers !== 'undefined') {
                ImageHelpers.applyPlaceholder(img);
            }
            imageWrapperDiv.appendChild(img);
            itemDiv.appendChild(imageWrapperDiv);
            introSection.appendChild(itemDiv);
            return;
        }

        selectedImages.forEach((image, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'layout-map-item animate-element';

            // Image wrapper
            const imageWrapperDiv = document.createElement('div');
            imageWrapperDiv.className = 'layout-map-image-wrapper';

            const img = document.createElement('img');
            if (image.url) {
                img.src = image.url;
            } else {
                if (typeof ImageHelpers !== 'undefined') {
                    ImageHelpers.applyPlaceholder(img);
                }
            }
            img.alt = this.sanitizeText(image.description, `배치도 이미지 ${index + 1}`);

            imageWrapperDiv.appendChild(img);

            itemDiv.appendChild(imageWrapperDiv);

            // Description wrapper - 설명 없으면 배경 박스까지 미노출
            const imageDescription = this.sanitizeText(image.description);
            if (imageDescription) {
                const descWrapperDiv = document.createElement('div');
                descWrapperDiv.className = 'layout-map-description-wrapper';

                const descDiv = document.createElement('div');
                descDiv.className = 'layout-map-description';
                descDiv.innerHTML = this._formatTextWithLineBreaks(imageDescription);
                descWrapperDiv.appendChild(descDiv);

                itemDiv.appendChild(descWrapperDiv);
            }

            introSection.appendChild(itemDiv);
        });

        if (typeof window.setupLayoutMapAnimations === 'function') {
            window.setupLayoutMapAnimations();
        }
    }

    mapClosingSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        const exteriorImages = this.getPropertyImages('property_exterior');
        const bannerEl = document.querySelector('[data-main-banner]');
        if (bannerEl) {
            if (exteriorImages.length > 0) {
                bannerEl.style.backgroundImage = `url('${exteriorImages[0].url}')`;
            } else {
                if (typeof ImageHelpers !== 'undefined') {
                    ImageHelpers.applyPlaceholder(bannerEl);
                }
            }
        }

        const propertyNameEn = this.getPropertyNameEn();
        const nameEl = document.querySelector('[data-closing-property-name]');
        if (nameEl) {
            nameEl.textContent = propertyNameEn;
        }
    }

    mapPropertyInfo() {
        const propertyName = this.getPropertyName();
        const nameElements = document.querySelectorAll('[data-property-name]');
        nameElements.forEach(el => {
            el.textContent = propertyName;
        });

        const propertyNameEn = this.getPropertyNameEn();
        const nameEnElements = document.querySelectorAll('[data-property-name-en]');
        nameEnElements.forEach(el => {
            el.textContent = propertyNameEn;
        });
    }

    async mapPage() {
        if (!this.isDataLoaded) return;

        const section = this.getLayoutMapData();
        if (section && section.enabled === false) {
            // Preview 모드에서는 preview 파라미터 유지
            const urlParams = new URLSearchParams(window.location.search);
            const isPreview = urlParams.get('preview');
            let redirectUrl = '404.html';
            if (isPreview) {
                redirectUrl += `?preview=${isPreview}`;
            }
            window.location.href = redirectUrl;
            return;
        }

        this.mapHeroSection();
        this.mapLayoutMapContent();
        this.mapClosingSection();
        this.mapPropertyInfo();

        // 메타 태그 및 SEO 업데이트 (인증코드 포함, 전 페이지 공통)
        this.updateMetaTags();

        await this.reinitializeScrollAnimations();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayoutMapMapper;
} else {
    window.LayoutMapMapper = LayoutMapMapper;
}
