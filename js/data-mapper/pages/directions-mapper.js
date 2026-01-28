/**
 * Directions Page Data Mapper
 * directions.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 오시는길 페이지 전용 기능 제공
 */
class DirectionsMapper extends BaseDataMapper {
    // Kakao Map 설정 상수
    static KAKAO_MAP_ZOOM_LEVEL = 5;
    static SDK_WAIT_INTERVAL = 100; // ms

    constructor(data = null) {
        super();
        if (data) {
            this.data = data;
            this.isDataLoaded = true;
        }
    }

    // ============================================================================
    // 🗺️ DIRECTIONS PAGE MAPPINGS
    // ============================================================================

    /**
     * SEO 메타태그 매핑
     */
    mapSEOTags() {
        if (!this.isDataLoaded || !this.data.homepage) return;

        const seo = this.data.homepage.seo;
        if (!seo) return;

        // Title
        const titleEl = this.safeSelect('[data-homepage-seo-title]');
        if (titleEl && seo.title) {
            titleEl.textContent = seo.title;
        }

        // Description
        const descEl = this.safeSelect('[data-homepage-seo-description]');
        if (descEl && seo.description) {
            descEl.setAttribute('content', seo.description);
        }

        // Keywords
        const keywordsEl = this.safeSelect('[data-homepage-seo-keywords]');
        if (keywordsEl && seo.keywords) {
            keywordsEl.setAttribute('content', seo.keywords);
        }
    }

    /**
     * Property address 매핑
     */
    mapPropertyAddress() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;

        this.safeSelectAll('[data-property-address]').forEach((addressEl) => {
            if (addressEl && property.address) {
                addressEl.textContent = property.address;
            }
        });
    }

    /**
     * Hero 이미지 매핑 (directions hero images)
     */
    mapHeroImages() {
        const heroImages = this.safeGet(this.data, 'homepage.customFields.pages.directions.sections.0.hero.images');

        // 선택된 이미지 필터링 및 정렬
        const selectedImages = window.ImageHelpers.getSelectedImages(heroImages || []);

        // Hero section 0번째 이미지 매핑
        const heroElement = this.safeSelect('[data-homepage-customfields-pages-directions-sections-0-hero-images-0-url]');
        if (heroElement) {
            if (selectedImages.length > 0) {
                heroElement.src = selectedImages[0].url;
                heroElement.alt = selectedImages[0].description || '오시는길 히어로 이미지';
                heroElement.classList.remove('empty-image-placeholder');
            } else {
                heroElement.src = '';
                heroElement.alt = '이미지 없음';
                heroElement.classList.add('empty-image-placeholder');
            }
        }

        // Circular section 1번째 이미지 매핑
        const circularElement = this.safeSelect('[data-homepage-customfields-pages-directions-sections-0-hero-images-1-url]');
        if (circularElement) {
            if (selectedImages.length > 1) {
                circularElement.src = selectedImages[1].url;
                circularElement.alt = selectedImages[1].description || '오시는길 원형 이미지';
                circularElement.classList.remove('empty-image-placeholder');
            } else {
                circularElement.src = '';
                circularElement.alt = '이미지 없음';
                circularElement.classList.add('empty-image-placeholder');
            }
        }
    }


    /**
     * 새로운 notice 영역 매핑 (JSON directions.sections 사용)
     */
    mapDirectionsNoticeNew() {
        const directionsData = this.safeGet(this.data, 'homepage.customFields.pages.directions.sections.0');
        const noticeSectionElement = this.safeSelect('[data-directions-notice-section]');
        const noticeTitleElement = this.safeSelect('[data-directions-notice-title]');
        const noticeDescElement = this.safeSelect('[data-directions-notice-description]');

        if (!noticeSectionElement || !noticeTitleElement || !noticeDescElement) {
            return;
        }

        const title = directionsData?.notice?.title?.trim();
        const description = directionsData?.notice?.description?.trim();

        const hasContent = title || description;
        noticeSectionElement.classList.toggle('hidden', !hasContent);

        if (hasContent) {
            noticeTitleElement.textContent = title || '';
            noticeTitleElement.classList.toggle('hidden', !title);

            noticeDescElement.innerHTML = (description || '').replace(/\n/g, '<br>');
            noticeDescElement.classList.toggle('hidden', !description);
        }
    }



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
                // customFields 헬퍼를 통해 숙소명 가져오기
                const builderPropertyName = this.getPropertyName();

                // 검색 쿼리 및 URL 생성 (한 번만)
                const searchQuery = property.address || builderPropertyName || '선택한 위치';
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
                infowindowContent.innerHTML = `${builderPropertyName}<br/><small style="color:#666;">클릭하면 카카오맵으로 이동</small>`;
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

    /**
     * Property phone 매핑 (맵 하단 문의전화)
     */
    mapPropertyPhone() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;
        const businessInfo = property?.businessInfo;

        // businessPhone이 있으면 우선 사용, 없으면 contactPhone 사용
        const phoneNumber = (businessInfo?.businessPhone && businessInfo.businessPhone.trim())
            ? businessInfo.businessPhone
            : property.contactPhone;

        const phoneElements = this.safeSelectAll('[data-property-phone]');
        phoneElements.forEach((phoneEl) => {
            if (phoneEl && phoneNumber) {
                phoneEl.textContent = phoneNumber;
            }
        });
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

        this.mapSEOTags();
        this.mapPropertyAddress();
        this.mapPropertyPhone();
        this.mapHeroImages();
        this.mapDirectionsNoticeNew();
        this.initKakaoMap(); // 카카오맵 초기화 및 표시
        this.updateMetaTags(this.data.property);
        this.updatePageTitle();
        this.updateFavicon();
    }

    /**
     * 페이지 제목 업데이트
     */
    updatePageTitle() {
        // customFields 헬퍼를 통해 숙소명 가져오기
        const builderPropertyName = this.getPropertyName();
        const htmlTitle = this.safeSelect('title');

        if (htmlTitle && builderPropertyName) {
            htmlTitle.textContent = `오시는길 - ${builderPropertyName}`;
        }
    }
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DirectionsMapper;
} else {
    window.DirectionsMapper = DirectionsMapper;
}