/**
 * Facility Page Data Mapper
 * facility.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 시설 페이지 전용 기능 제공
 * URL 파라미터로 ?id=facility-uuid를 받아서 동적으로 시설 정보 표시
 */
class FacilityMapper extends BaseDataMapper {
    constructor() {
        super();
        this.currentFacility = null;
        this.currentFacilityIndex = null;
    }

    // ============================================================================
    // 🏢 FACILITY PAGE SPECIFIC MAPPINGS
    // ============================================================================

    /**
     * 현재 시설 정보 가져오기 (URL 파라미터 기반)
     */
    getCurrentFacility() {
        if (!this.isDataLoaded || !this.data.property?.facilities) {
            console.error('Data not loaded or no facilities data available');
            return null;
        }

        // URL에서 facility id 추출
        const urlParams = new URLSearchParams(window.location.search);
        const facilityId = urlParams.get('id');

        if (!facilityId) {
            console.error('Facility id not specified in URL');
            return null;
        }

        // facilities 배열에서 해당 id의 시설 찾기
        const facilityIndex = this.data.property.facilities.findIndex(facility => facility.id === facilityId);

        if (facilityIndex === -1) {
            console.error(`Facility with id ${facilityId} not found`);
            return null;
        }

        const facility = this.data.property.facilities[facilityIndex];
        this.currentFacility = facility;
        this.currentFacilityIndex = facilityIndex;
        return facility;
    }

    /**
     * 현재 시설의 customFields 페이지 데이터 가져오기
     */
    getCurrentFacilityPageData() {
        const facility = this.getCurrentFacility();
        if (!facility) return null;

        const facilityPages = this.data.homepage?.customFields?.pages?.facility;
        if (!Array.isArray(facilityPages)) return null;

        return facilityPages.find(page => page.id === facility.id);
    }

    /**
     * Hero Slider 매핑 (facility.images 전체 순서대로)
     */
    mapHeroSlider() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        const sliderInner = this.safeSelect('[data-hero-slider]');
        if (!sliderInner) return;

        // ImageHelpers로 선택된 이미지 가져오기
        const selectedImages = ImageHelpers.getSelectedImages(facility.images);

        sliderInner.innerHTML = '';

        if (selectedImages.length === 0) {
            // 이미지 없을 때 placeholder
            const slide = document.createElement('div');
            slide.className = 'hero-slide active';
            const img = document.createElement('img');
            ImageHelpers.applyPlaceholder(img);
            slide.appendChild(img);
            sliderInner.appendChild(slide);
            return;
        }

        // 슬라이드 생성
        selectedImages.forEach((image, index) => {
            const slide = document.createElement('div');
            slide.className = `hero-slide${index === 0 ? ' active' : ''}`;
            const img = document.createElement('img');
            img.src = image.url;
            img.alt = image.description || facility.name;
            img.loading = index === 0 ? 'eager' : 'lazy';

            // 첫 번째 이미지가 로드되면 슬라이더 초기화
            if (index === 0) {
                img.onload = () => {
                    // DOM 렌더링 완료를 위한 최소 지연 (슬라이더 레이아웃 계산에 필요)
                    setTimeout(() => {
                        if (typeof window.initFacilityHeroSlider === 'function') {
                            window.initFacilityHeroSlider();
                        }
                    }, 100);
                };
            }

            slide.appendChild(img);
            sliderInner.appendChild(slide);
        });

        // 슬라이더 인디케이터 매핑
        const totalSlidesEl = this.safeSelect('[data-total-slides]');
        if (totalSlidesEl) {
            totalSlidesEl.textContent = selectedImages.length.toString().padStart(2, '0');
        }
    }

    /**
     * 썸네일 이미지 매핑
     */
    mapThumbnail() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        const thumbnailContainer = this.safeSelect('[data-facility-thumbnail]');
        if (!thumbnailContainer) return;

        const img = thumbnailContainer.querySelector('img');
        if (!img) return;

        const selectedImages = ImageHelpers.getSelectedImages(facility.images);
        // 첫 번째 이미지를 썸네일로 사용
        const thumbnailImage = selectedImages[0];

        if (thumbnailImage && thumbnailImage.url) {
            img.src = thumbnailImage.url;
            img.alt = thumbnailImage.description || facility.name;
            img.classList.remove('empty-image-placeholder');
        } else {
            ImageHelpers.applyPlaceholder(img);
        }
    }

    /**
     * 메인 이미지 매핑
     */
    mapMainImage() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        const mainImageContainer = this.safeSelect('[data-facility-main-image]');
        if (!mainImageContainer) return;

        const img = mainImageContainer.querySelector('img');
        if (!img) return;

        const selectedImages = ImageHelpers.getSelectedImages(facility.images);
        // 두 번째 이미지를 메인 이미지로 사용 (없으면 첫 번째)
        const mainImage = selectedImages[1] || selectedImages[0];

        if (mainImage && mainImage.url) {
            img.src = mainImage.url;
            img.alt = mainImage.description || facility.name;
            img.classList.remove('empty-image-placeholder');
        } else {
            ImageHelpers.applyPlaceholder(img);
        }
    }

    /**
     * 기본 정보 매핑 (시설명, 시설 설명, 시설 번호)
     */
    mapBasicInfo() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        // 시설명 매핑 (시스템 데이터)
        const facilityTitle = this.safeSelect('[data-facility-title]');
        if (facilityTitle) {
            facilityTitle.textContent = facility.name || '시설명';
        }

        // 시설 소개 문구 매핑 (template-A와 동일한 폴백 체인)
        // CUSTOM FIELD hero.title (1순위) → facilities[current].usageGuide (이용안내)
        // description 은 하단 '시설 상세 안내' 섹션에서 노출하므로 여기서는 제외 (중복 방지)
        // 둘 다 비면 미노출
        const facilityDescription = this.safeSelect('[data-facility-description]');
        if (facilityDescription) {
            const facilityPageData = this.getCurrentFacilityPageData();
            const heroTitle = this.sanitizeText(facilityPageData?.sections?.[0]?.hero?.title);
            const usageGuide = this.sanitizeText(facility.usageGuide);
            const text = heroTitle || usageGuide;

            facilityDescription.innerHTML = text ? this._formatTextWithLineBreaks(text) : '';
            facilityDescription.style.display = text ? '' : 'none';
        }

        // 시설 번호 매핑 제거됨 - 동적 생성 비활성화
    }

    /**
     * 시설 상세 설명 매핑
     */
    mapDetailDescription() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        const descriptionContainer = this.safeSelect('[data-facility-detail-description]');
        if (!descriptionContainer) return;

        // CUSTOM FIELD 우선, 없으면 시스템 데이터
        const facilityPageData = this.getCurrentFacilityPageData();
        const heroDescription = facilityPageData?.sections?.[0]?.hero?.description;
        const description = heroDescription || facility.description;

        // 시설설명 없으면 상세 안내 섹션 미노출
        const detailsWrapper = descriptionContainer.closest('.facility-details-wrapper');
        const hasDescription = !this._isEmptyValue(description) && description.trim() !== '';

        if (detailsWrapper) {
            detailsWrapper.style.display = hasDescription ? '' : 'none';
        }

        descriptionContainer.innerHTML = hasDescription ? this._formatTextWithLineBreaks(description) : '';
    }

    /**
     * 주요특징 매핑 (CUSTOM FIELD)
     */
    mapFeatures(features) {
        const featuresContainer = this.safeSelect('[data-facility-features]');
        if (!featuresContainer) return;

        const cardElement = featuresContainer.closest('.facility-info-card');

        if (!features || !Array.isArray(features) || features.length === 0) {
            if (cardElement) cardElement.style.display = 'none';
            return;
        }

        // 모든 아이템이 디폴트 값인지 체크
        const isAllDefault = features.every(feature =>
            feature.title === '특징 타이틀' && feature.description === '특징 설명'
        );

        if (isAllDefault) {
            if (cardElement) cardElement.style.display = 'none';
            return;
        }

        if (cardElement) cardElement.style.display = '';

        // ul 리스트로 생성
        const ul = document.createElement('ul');
        features.forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature.title || feature.description || '';
            ul.appendChild(li);
        });

        featuresContainer.innerHTML = '';
        featuresContainer.appendChild(ul);
    }

    /**
     * 추가정보 매핑 (CUSTOM FIELD)
     */
    mapAdditionalInfo(additionalInfo) {
        const additionalInfoContainer = this.safeSelect('[data-facility-additional-info]');
        if (!additionalInfoContainer) return;

        const cardElement = additionalInfoContainer.closest('.facility-info-card');

        if (!additionalInfo || !Array.isArray(additionalInfo) || additionalInfo.length === 0) {
            if (cardElement) cardElement.style.display = 'none';
            return;
        }

        // 모든 아이템이 디폴트 값인지 체크
        const isAllDefault = additionalInfo.every(info =>
            info.title === '추가정보 타이틀' && info.description === '추가정보 설명'
        );

        if (isAllDefault) {
            if (cardElement) cardElement.style.display = 'none';
            return;
        }

        if (cardElement) cardElement.style.display = '';

        // ul 리스트로 생성
        const ul = document.createElement('ul');
        additionalInfo.forEach(info => {
            const li = document.createElement('li');
            li.textContent = info.title || info.description || '';
            ul.appendChild(li);
        });

        additionalInfoContainer.innerHTML = '';
        additionalInfoContainer.appendChild(ul);
    }

    /**
     * 이용혜택 매핑 (CUSTOM FIELD)
     */
    mapBenefits(benefits) {
        const benefitsContainer = this.safeSelect('[data-facility-benefits]');
        if (!benefitsContainer) return;

        const cardElement = benefitsContainer.closest('.facility-info-card');

        if (!benefits || !Array.isArray(benefits) || benefits.length === 0) {
            if (cardElement) cardElement.style.display = 'none';
            return;
        }

        // 모든 아이템이 디폴트 값인지 체크
        const isAllDefault = benefits.every(benefit =>
            benefit.title === '혜택 타이틀' && benefit.description === '혜택 설명'
        );

        if (isAllDefault) {
            if (cardElement) cardElement.style.display = 'none';
            return;
        }

        if (cardElement) cardElement.style.display = '';

        // ul 리스트로 생성
        const ul = document.createElement('ul');
        benefits.forEach(benefit => {
            const li = document.createElement('li');
            li.textContent = benefit.title || benefit.description || '';
            ul.appendChild(li);
        });

        benefitsContainer.innerHTML = '';
        benefitsContainer.appendChild(ul);
    }

    /**
     * Marquee 매핑 (property.nameEn)
     */

    /**
     * 갤러리 매핑 (facility.images 개수에 따라 동적 생성)
     * - 0장: 섹션 숨김
     * - 1장: 이미지 1장 풀(full)
     * - 2~4장: 아코디언 방식
     */
    mapGallery() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        const galleryContainer = this.safeSelect('[data-facility-gallery]');
        if (!galleryContainer) return;

        // 갤러리 상수 정의
        const HERO_IMAGES_COUNT = 2; // Hero/Thumbnail에서 사용하는 이미지 수
        const GALLERY_MAX_COUNT = 4; // 갤러리에 표시할 최대 이미지 수

        // ImageHelpers로 선택된 이미지 가져오기 (실제 이미지만 반환)
        const selectedImages = ImageHelpers.getSelectedImages(facility.images);

        // 갤러리용 이미지 (Hero/Thumbnail 이후 이미지들, 최대 4장)
        const galleryImages = selectedImages.slice(HERO_IMAGES_COUNT, HERO_IMAGES_COUNT + GALLERY_MAX_COUNT);

        // 갤러리 컨테이너 초기화
        galleryContainer.innerHTML = '';

        // 이미지가 없으면 섹션 자체를 숨김
        const gallerySection = galleryContainer.closest('.facility-gallery-section');
        if (galleryImages.length === 0) {
            if (gallerySection) gallerySection.style.display = 'none';
            return;
        }
        if (gallerySection) gallerySection.style.display = '';

        // 1장이면 풀 이미지, 2장 이상이면 아코디언
        galleryContainer.classList.toggle('gallery-single', galleryImages.length === 1);

        // 실제 이미지 개수만큼 갤러리 아이템 생성 (1~4개)
        galleryImages.forEach(imgData => {
            const item = this._createGalleryItem(imgData, facility.name);
            galleryContainer.appendChild(item);
        });

        // DOM에 추가된 후 첫 번째 아이템을 활성화
        setTimeout(() => {
            const firstItem = galleryContainer.querySelector('.gallery-item');
            if (firstItem) {
                firstItem.classList.add('gallery-item-active');
            } else {
                console.error('첫 번째 갤러리 아이템을 찾을 수 없음');
            }
        }, 100);
    }

    /**
     * 갤러리 아이템 생성 헬퍼
     */
    _createGalleryItem(image, facilityName) {
        const item = document.createElement('div');
        item.className = 'gallery-item animate-element';

        // 이미지 요소
        const img = document.createElement('img');
        if (image && image.url) {
            img.src = image.url;
            img.alt = image.description || facilityName;
            img.classList.remove('empty-image-placeholder');
        } else {
            ImageHelpers.applyPlaceholder(img);
        }

        // 축소시 나타나는 어두운 오버레이 (텍스트 없음)
        const overlay = document.createElement('div');
        overlay.className = 'gallery-item-overlay';

        // 확장시 이미지 설명 (하단 우측)
        const description = document.createElement('p');
        description.className = 'gallery-item-description';
        // JSON description 매핑
        description.textContent = image ? image.description || '' : '';

        // 클릭 이벤트 추가
        item.addEventListener('click', () => {
            this.setActiveGalleryItem(item);
        });

        // 구조 조립
        item.appendChild(img);
        item.appendChild(overlay); // 빈 오버레이 (어두운 필터용)
        item.appendChild(description);

        return item;
    }

    /**
     * 활성 갤러리 아이템 설정
     */
    setActiveGalleryItem(activeItem) {
        const container = this.safeSelect('[data-facility-gallery]');
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
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Facility 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            console.error('Cannot map facility page: data not loaded');
            return;
        }

        const facility = this.getCurrentFacility();
        if (!facility) {
            console.error('Cannot map facility page: facility not found');
            return;
        }

        // 순차적으로 각 섹션 매핑
        this.mapHeroSlider();           // Hero slider
        this.mapThumbnail();            // 썸네일 이미지
        this.mapBasicInfo();            // 시설명, 시설 설명
        this.mapMainImage();            // 메인 이미지
        this.mapDetailDescription();    // 시설 상세 설명
        this.mapInfoCards();            // 주요특징, 추가정보, 이용혜택
        this.mapGallery();              // Gallery

        // 메타 태그 업데이트 (페이지별 SEO 적용)
        const property = this.data.property;
        const pageSEO = {
            title: (facility?.name && property?.name) ? `${facility.name} - ${property.name}` : 'SEO 타이틀',
            description: facility?.description || property?.description || 'SEO 설명'
        };
        this.updateMetaTags(pageSEO);

        // E-commerce registration 매핑
        this.mapEcommerceRegistration();

        // 애니메이션 재초기화
        if (typeof window.initFacilityAnimations === 'function') {
            window.initFacilityAnimations();
        }
    }

    /**
     * 정보 카드 매핑 (주요특징, 추가정보, 이용혜택)
     */
    mapInfoCards() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        const facilityPageData = this.getCurrentFacilityPageData();
        const experience = facilityPageData?.sections?.[0]?.experience;

        // 주요특징 매핑
        this.mapFeatures(experience?.features);

        // 추가정보 매핑
        this.mapAdditionalInfo(experience?.additionalInfos);

        // 이용혜택 매핑
        this.mapBenefits(experience?.benefits);

        // 모든 카드가 숨겨졌는지 확인하고 전체 섹션 숨김 처리
        this.checkAndHideAdditionalWrapper();
    }

    /**
     * 모든 추가 정보 카드가 비어있으면 전체 섹션 숨김
     */
    checkAndHideAdditionalWrapper() {
        const additionalWrapper = this.safeSelect('.facility-additional-wrapper');
        if (!additionalWrapper) return;

        const infoCards = additionalWrapper.querySelectorAll('.facility-info-card');
        const visibleCards = Array.from(infoCards).filter(card =>
            card.style.display !== 'none'
        );

        if (visibleCards.length === 0) {
            additionalWrapper.style.display = 'none';
        } else {
            additionalWrapper.style.display = '';
        }
    }
}

// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', async () => {
    const facilityMapper = new FacilityMapper();
    try {
        await facilityMapper.loadData();
        await facilityMapper.mapPage();
    } catch (error) {
        console.error('Error initializing facility mapper:', error);
    }
});

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FacilityMapper;
} else {
    window.FacilityMapper = FacilityMapper;
}
