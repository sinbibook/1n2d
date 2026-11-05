/**
 * Nearby Attractions Data Mapper
 * nearby-attractions.html 전용 매핑 함수들을 포함한 클래스
 */
class NearbyAttractionsMapper extends BaseDataMapper {
    constructor() {
        super();
    }

    getNearbyAttractionsData() {
        return this.safeGet(this.data, 'homepage.customFields.pages.nearbyAttractions.sections.0');
    }

    mapHeroSlider() {
        if (!this.isDataLoaded) return;

        const section = this.getNearbyAttractionsData();
        if (!section || !section.hero) return;

        const sliderContainer = document.querySelector('[data-hero-slider]');
        if (!sliderContainer) return;

        sliderContainer.innerHTML = '';

        const images = section.hero.images || [];
        const selectedImages = images.filter(img => img.isSelected).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        if (selectedImages.length === 0) {
            const slide = document.createElement('div');
            slide.className = 'hero-slide active';
            const img = document.createElement('img');
            if (typeof ImageHelpers !== 'undefined') {
                ImageHelpers.applyPlaceholder(img);
            }
            slide.appendChild(img);
            sliderContainer.appendChild(slide);
            return;
        }

        selectedImages.forEach((imgData, index) => {
            const slide = document.createElement('div');
            slide.className = 'hero-slide';
            if (index === 0) slide.classList.add('active');

            const img = document.createElement('img');
            img.src = imgData.url || '';
            img.alt = this.sanitizeText(imgData.description, `주변관광지 이미지 ${index + 1}`);
            img.loading = index === 0 ? 'eager' : 'lazy';

            slide.appendChild(img);
            sliderContainer.appendChild(slide);
        });

        const totalSlides = document.querySelector('[data-total-slides]');
        if (totalSlides) {
            totalSlides.textContent = String(selectedImages.length).padStart(2, '0');
        }
    }

    mapHeroText() {
        if (!this.isDataLoaded) return;

        const section = this.getNearbyAttractionsData();
        if (!section || !section.hero) return;

        const titleEl = document.querySelector('[data-nearby-attractions-hero-title]');
        if (titleEl) {
            titleEl.textContent = this.sanitizeText(section.hero.title, '주변관광지 타이틀');
        }

        const descEl = document.querySelector('[data-nearby-attractions-hero-description]');
        if (descEl) {
            descEl.textContent = this.sanitizeText(section.hero.description, '주변관광지 설명');
        }
    }

    mapAttractionsContent() {
        if (!this.isDataLoaded) return;

        const section = this.getNearbyAttractionsData();
        if (!section || !section.about) return;

        const introSection = document.querySelector('.intro-section');
        if (!introSection) return;

        introSection.innerHTML = '';

        const attractions = Array.isArray(section.about) ? section.about : [];

        attractions.forEach((attraction, index) => {
            const images = attraction.images || [];
            // isSelected가 true인 이미지만 필터링
            const selectedImages = images.filter(img => img.isSelected).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

            // 선택된 이미지가 없으면 이 attraction 블록 전체 제외
            if (selectedImages.length === 0) return;

            const blockDiv = document.createElement('div');
            blockDiv.className = 'intro-block animate-element';

            // Image container with 2 images (gallery style)
            const imageContainerDiv = document.createElement('div');
            imageContainerDiv.className = 'intro-block-image gallery-slider animate-element';

            // Use first 2 selected images, or create placeholders if less than 2
            for (let i = 0; i < 2; i++) {
                const galleryItem = document.createElement('div');
                galleryItem.className = 'gallery-item';
                if (i === 0) galleryItem.classList.add('gallery-item-active'); // 첫 이미지 활성화

                const img = document.createElement('img');
                if (i < selectedImages.length) {
                    img.src = selectedImages[i].url || '';
                    img.alt = this.sanitizeText(selectedImages[i].description, `명소 이미지 ${i + 1}`);
                } else {
                    if (typeof ImageHelpers !== 'undefined') {
                        ImageHelpers.applyPlaceholder(img);
                    }
                }
                galleryItem.appendChild(img);
                imageContainerDiv.appendChild(galleryItem);
            }

            // Content container (title + description)
            const contentDiv = document.createElement('div');
            contentDiv.className = 'intro-block-content animate-element';

            const titleEl = document.createElement('h3');
            titleEl.className = 'intro-block-title';
            titleEl.textContent = this.sanitizeText(attraction.title, `명소 ${index + 1}`);

            const descEl = document.createElement('p');
            descEl.className = 'intro-block-description';
            descEl.innerHTML = this._formatTextWithLineBreaks(this.sanitizeText(attraction.description, ''));

            contentDiv.appendChild(titleEl);
            contentDiv.appendChild(descEl);

            blockDiv.appendChild(imageContainerDiv);
            blockDiv.appendChild(contentDiv);

            introSection.appendChild(blockDiv);
        });

        if (typeof window.setupNearbyAttractionsAnimations === 'function') {
            window.setupNearbyAttractionsAnimations();
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
        if (!this.isDataLoaded) {
            return;
        }

        const section = this.getNearbyAttractionsData();

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

        this.mapHeroSlider();
        this.mapHeroText();
        this.mapAttractionsContent();
        this.mapClosingSection();
        this.mapPropertyInfo();

        // 메타 태그 및 SEO 업데이트 (인증코드 포함, 전 페이지 공통)
        this.updateMetaTags();

        await this.reinitializeScrollAnimations();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NearbyAttractionsMapper;
} else {
    window.NearbyAttractionsMapper = NearbyAttractionsMapper;
}
