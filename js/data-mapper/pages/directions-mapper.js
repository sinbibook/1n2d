/**
 * Directions Page Data Mapper
 * directions.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 오시는길 페이지 전용 기능 제공
 */
class DirectionsMapper extends BaseDataMapper {
    // Kakao Map 설정 상수
    static KAKAO_MAP_ZOOM_LEVEL = 5;
    static SDK_WAIT_INTERVAL = 100; // ms

    constructor() {
        super();
    }

    // ============================================================================
    // 🗺️ DIRECTIONS PAGE MAPPINGS
    // ============================================================================

    /**
     * Hero Slider 섹션 매핑
     * homepage.customFields.pages.directions.sections[0].hero.images → [data-hero-slider]
     */
    mapSliderSection() {
        if (!this.isDataLoaded) return;

        const directionsData = this.safeGet(this.data, 'homepage.customFields.pages.directions.sections.0');
        if (!directionsData) return;

        // 슬라이더 이미지 매핑
        if (directionsData.hero?.images && Array.isArray(directionsData.hero.images)) {
            this.mapHeroSlider(directionsData.hero.images);
        }
    }

    /**
     * Hero Slider 동적 생성
     * homepage.customFields.pages.directions.sections[0].hero.images → [data-hero-slider]
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
            ImageHelpers.applyPlaceholder(imgElement);

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
            imgElement.alt = this.sanitizeText(img.description, '오시는길 이미지');
            imgElement.loading = index === 0 ? 'eager' : 'lazy';

            slideDiv.appendChild(imgElement);
            sliderContainer.appendChild(slideDiv);
        });

        // 네비게이션 총 개수 업데이트
        const totalSlides = document.querySelector('[data-total-slides]');
        if (totalSlides) {
            totalSlides.textContent = String(selectedImages.length).padStart(2, '0');
        }
    }

    /**
     * Location Info 섹션 매핑 (숙소명, 주소)
     * property.name → [data-property-name]
     * property.address → [data-directions-address]
     */
    mapLocationInfo() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;

        // 숙소명 매핑 (타이틀 내 span)
        const propertyNameElement = this.safeSelect('[data-property-name]');
        if (propertyNameElement) {
            propertyNameElement.textContent = this.sanitizeText(property?.name, '숙소명');
        }

        // 주소 매핑
        const addressElement = this.safeSelect('[data-directions-address]');
        if (addressElement) {
            addressElement.textContent = this.sanitizeText(property?.address, '숙소 주소');
        }
    }

    /**
     * Notes 섹션 매핑 (안내사항)
     * homepage.customFields.pages.directions.sections[0].notice.description → [data-directions-notes]
     * 줄바꿈(\n)을 p 태그로 분리하여 표시
     */
    mapNotesSection() {
        if (!this.isDataLoaded) return;

        const directionsData = this.safeGet(this.data, 'homepage.customFields.pages.directions.sections.0');
        const notesElement = this.safeSelect('[data-directions-notes]');
        const dividerElement = this.safeSelect('.location-divider');

        if (!notesElement) return;

        // 기존 내용 초기화
        notesElement.innerHTML = '';

        // notice 데이터가 있으면 description 사용
        if (directionsData?.notice?.description) {
            notesElement.innerHTML = this._formatTextWithLineBreaks(directionsData.notice.description);
            notesElement.style.display = '';
            // 구분선도 표시
            if (dividerElement) dividerElement.style.display = '';
        } else {
            // 데이터가 없으면 노트와 구분선 모두 숨김
            notesElement.style.display = 'none';
            if (dividerElement) dividerElement.style.display = 'none';
        }
    }

    /**
     * Full Banner 섹션 매핑
     * property.nameEn → [data-directions-banner-title]
     * property.images[0].exterior[] → full-banner 섹션 배경 이미지
     */
    mapFullBanner() {
        if (!this.isDataLoaded) return;

        // 배너 타이틀 매핑 (property.nameEn)
        const bannerTitle = this.safeSelect('[data-directions-banner-title]');
        if (bannerTitle) {
            const nameEn = this.safeGet(this.data, 'property.nameEn');
            bannerTitle.textContent = this.sanitizeText(nameEn, 'PROPERTY NAME').toUpperCase();
        }

        // 배너 배경 이미지 매핑 - 섹션 자체에 배경 설정
        const bannerSection = this.safeSelect('.full-banner');
        if (!bannerSection) return;

        const propertyImages = this.safeGet(this.data, 'property.images');
        const exteriorImages = this.safeGet(propertyImages?.[0], 'exterior');

        // ImageHelpers를 사용하여 첫 번째 선택된 이미지 가져오기
        const selectedImages = ImageHelpers.getSelectedImages(exteriorImages);

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
     * Marquee 섹션 매핑
     * property.nameEn → [data-marquee-property-name] 내부 span들 (uppercase)
     */

    /**
     * 카카오맵 초기화 및 표시
     */
    initKakaoMap() {
        if (!this.isDataLoaded || !this.data.property) {
            return;
        }

        const property = this.data.property;
        const mapContainer = document.getElementById('kakao-map');

        if (!mapContainer || !property.latitude || !property.longitude) {
            return;
        }

        // 지도 생성 함수
        const createMap = () => {
            try {
                // 검색 쿼리 및 URL 생성 (한 번만)
                const searchQuery = property.address || property.name || '선택한 위치';
                const kakaoMapUrl = `https://map.kakao.com/?q=${encodeURIComponent(searchQuery)}`;
                const openKakaoMap = () => window.open(kakaoMapUrl, '_blank');

                // 지도 중심 좌표
                const mapCenter = new kakao.maps.LatLng(property.latitude, property.longitude);

                // 지도 옵션
                const mapOptions = {
                    center: mapCenter,
                    level: DirectionsMapper.KAKAO_MAP_ZOOM_LEVEL,
                    draggable: false,
                    scrollwheel: false,
                    disableDoubleClick: true,
                    disableDoubleClickZoom: true
                };

                // 지도 생성
                const map = new kakao.maps.Map(mapContainer, mapOptions);
                map.setZoomable(false);

                // 마커 생성 및 클릭 이벤트
                const marker = new kakao.maps.Marker({
                    position: mapCenter,
                    map: map
                });
                kakao.maps.event.addListener(marker, 'click', openKakaoMap);

                // 인포윈도우 콘텐츠 DOM 생성 및 이벤트 핸들러 연결
                const infowindowContent = document.createElement('div');
                infowindowContent.style.cssText = 'padding:5px; font-size:14px; cursor:pointer;';
                infowindowContent.innerHTML = `${property.name}<br/><small style="color:#666;">클릭하면 카카오맵으로 이동</small>`;
                infowindowContent.addEventListener('click', openKakaoMap);

                const infowindow = new kakao.maps.InfoWindow({
                    content: infowindowContent
                });
                infowindow.open(map, marker);
            } catch (error) {
                console.error('Failed to create Kakao Map:', error);
            }
        };

        // SDK 로드 확인 및 지도 생성
        const checkSdkAndLoad = (retryCount = 0) => {
            const MAX_RETRIES = 20; // 20 * 100ms = 2초
            if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
                // kakao.maps.load() 공식 API 사용
                window.kakao.maps.load(createMap);
            } else if (retryCount < MAX_RETRIES) {
                // SDK가 아직 로드되지 않았으면 대기
                setTimeout(() => checkSdkAndLoad(retryCount + 1), DirectionsMapper.SDK_WAIT_INTERVAL);
            } else {
                console.error('Failed to load Kakao Map SDK after multiple retries.');
            }
        };

        checkSdkAndLoad();
    }

    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Directions 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            return;
        }

        // 순차적으로 각 섹션 매핑
        this.mapSliderSection(); // Hero 슬라이더 매핑
        this.mapLocationInfo(); // 숙소명, 주소 매핑
        this.mapNotesSection(); // 안내사항 매핑
        this.mapFullBanner(); // Full Banner 섹션 매핑
        this.initKakaoMap(); // 카카오맵 초기화 및 표시

        // 메타 태그 업데이트 (페이지별 SEO 적용)
        const property = this.data.property;
        const directionsData = this.safeGet(this.data, 'homepage.customFields.pages.directions.sections.0.hero');
        const pageSEO = {
            title: property?.name ? `오시는길 - ${property.name}` : 'SEO 타이틀',
            description: directionsData?.description || property?.description || 'SEO 설명'
        };
        this.updateMetaTags(pageSEO);

        // OG 이미지 업데이트 (hero 이미지 사용)
        this.updateOGImage(directionsData);

        // E-commerce registration 매핑
        this.mapEcommerceRegistration();

        // 슬라이더 재초기화 (동적 슬라이드 생성 후)
        this.reinitializeSlider();

        // 페이지 스크립트 재초기화
        this.reinitializePageScripts();
    }

    /**
     * 슬라이더 재초기화
     */
    reinitializeSlider() {
        // Hero 슬라이더 재초기화
        if (typeof window.initDirectionsHeroSlider === 'function') {
            window.initDirectionsHeroSlider();
        }
    }

    /**
     * 페이지 스크립트 재초기화 (directions.js 함수들 호출)
     */
    reinitializePageScripts() {
        // 스크롤 애니메이션 재초기화 (동적 요소들에 대해)
        if (typeof window.initDirectionsAnimations === 'function') {
            window.initDirectionsAnimations();
        }
    }

    /**
     * OG 이미지 업데이트 (directions hero 이미지 사용, 없으면 로고)
     * @param {Object} directionsData - directions hero 섹션 데이터
     */
    updateOGImage(directionsData) {
        if (!this.isDataLoaded) return;

        const ogImage = this.safeSelect('meta[property="og:image"]');
        if (!ogImage) return;

        // 우선순위: hero 이미지 > 로고 이미지
        if (directionsData?.images && directionsData.images.length > 0 && directionsData.images[0]?.url) {
            ogImage.setAttribute('content', directionsData.images[0].url);
        } else {
            const defaultImage = this.getDefaultOGImage();
            if (defaultImage) {
                ogImage.setAttribute('content', defaultImage);
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
        const mapper = new DirectionsMapper();
        await mapper.initialize();
    });
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DirectionsMapper;
} else {
    window.DirectionsMapper = DirectionsMapper;
}