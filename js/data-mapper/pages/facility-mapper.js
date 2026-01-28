/**
 * Facility Page Data Mapper
 * facility.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 시설 페이지 전용 기능 제공
 * URL 파라미터로 ?index=0,1,2...를 받아서 동적으로 시설 정보 표시
 */
class FacilityMapper extends BaseDataMapper {
    constructor(data = null) {
        super();
        this.currentFacility = null;
        this.currentFacilityIndex = null;
        if (data) {
            this.data = data;
            this.isDataLoaded = true;
        }
    }

    // ============================================================================
    // 🏢 FACILITY PAGE SPECIFIC MAPPINGS
    // ============================================================================

    /**
     * 현재 시설 정보 가져오기 (URL 파라미터 기반)
     */
    getCurrentFacility() {
        if (!this.isDataLoaded || !this.data.property?.facilities) {
            return null;
        }

        // URL에서 facility 파라미터 추출
        const urlParams = new URLSearchParams(window.location.search);
        const facilityId = urlParams.get('id'); // ?id=facility-001 형식
        const facilityIndex = urlParams.get('index'); // ?index=0 형식 (호환성)

        let facility = null;
        let index = -1;

        if (facilityId) {
            // ID로 검색 (예: facility-001)
            const facilities = this.data.property.facilities;
            for (let i = 0; i < facilities.length; i++) {
                if (facilities[i].id === facilityId) {
                    facility = facilities[i];
                    index = i;
                    break;
                }
            }

            if (!facility) {
                return null;
            }
        } else if (facilityIndex !== null) {
            // 인덱스로 검색 (레거시 지원)
            index = parseInt(facilityIndex, 10);

            if (index < 0 || index >= this.data.property.facilities.length) {
                return null;
            }

            facility = this.data.property.facilities[index];
        } else {
            // URL 파라미터가 없으면 첫 번째 시설 표시
            const facilities = this.data.property.facilities;
            if (facilities && facilities.length > 0) {
                facility = facilities[0];
                index = 0;
            } else {
                return null;
            }
        }

        this.currentFacility = facility;
        this.currentFacilityIndex = index;
        return facility;
    }

    /**
     * 현재 시설 인덱스 가져오기
     */
    getCurrentFacilityIndex() {
        if (this.currentFacilityIndex !== null) {
            return this.currentFacilityIndex;
        }

        // URL에서 인덱스 추출
        const urlParams = new URLSearchParams(window.location.search);
        const facilityIndex = urlParams.get('index');
        const index = facilityIndex ? parseInt(facilityIndex, 10) : null;

        if (index !== null && index >= 0 && this.data.property?.facilities?.length > index) {
            this.currentFacilityIndex = index;
            return index;
        }

        return null;
    }

    /**
     * 기본 시설 정보 매핑 (con2 섹션)
     */
    mapFacilityBasicInfo() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        // 시설명 매핑 - data 속성 사용
        const nameElement = this.safeSelect("[data-facility-name]");
        if (nameElement && facility.name) {
            nameElement.textContent = facility.name;
        }

        // 시설 설명 매핑 - customFields.facility.about.title 사용
        const descriptionElement = this.safeSelect("[data-facility-description]");
        if (descriptionElement) {
            let description = '';

            // customFields.facility.about.title
            const customFields = this.data.homepage?.customFields?.pages?.facility;
            if (customFields && Array.isArray(customFields)) {
                const facilityCustomData = customFields.find(cf => cf.id === facility.id);
                if (facilityCustomData?.sections?.[0]?.about?.title !== undefined &&
                    facilityCustomData?.sections?.[0]?.about?.title !== null) {
                    description = facilityCustomData.sections[0].about.title;
                }
            }

            descriptionElement.innerHTML = description.replace(/\n/g, '<br>');
        }

        // 이용안내 매핑 (usageGuide만 사용)
        const usageGuideEl = this.safeSelect("[data-facility-usage-guide]");
        if (usageGuideEl) {
            if (facility.usageGuide && facility.usageGuide.trim()) {
                // facility.usageGuide 사용
                const lines = facility.usageGuide.split('\n').filter(line => line.trim());
                const htmlContent = lines.map(line => `<p class="ko-body">${line.trim()}</p>`).join('');
                usageGuideEl.innerHTML = htmlContent;
            } else {
                // 이용안내가 없는 경우 빈 상태로 유지
                usageGuideEl.innerHTML = '';
            }
        }

        // 메인 이미지 매핑
        this.mapFacilityMainImage(facility);

        // 갤러리 이미지 매핑
        this.mapFacilityGallery(facility);
    }

    /**
     * 시설 메인 이미지 매핑
     */
    mapFacilityMainImage(facility) {
        const mainImageEl = this.safeSelect('[data-facility-main-image]');
        if (!mainImageEl) {
            return;
        }

        // 선택된 이미지 필터링 및 정렬 후 1번째 이미지 사용
        let mainImage = null;

        if (Array.isArray(facility.images) && facility.images.length > 0) {
            const selectedImages = window.ImageHelpers.getSelectedImages(facility.images);

            if (selectedImages.length > 1) {
                mainImage = selectedImages[1]; // 1번째 이미지
            } else if (selectedImages.length > 0) {
                mainImage = selectedImages[0]; // fallback to 0번째
            }
        }

        if (mainImage && mainImage.url) {
            mainImageEl.src = mainImage.url;
            mainImageEl.alt = mainImage.description || facility.name;
            mainImageEl.classList.remove('empty-image-placeholder');

            // 이미지 로드 실패 처리
            mainImageEl.onerror = () => {
                mainImageEl.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"%3E%3Crect fill="%23d1d5db" width="800" height="600"/%3E%3C/svg%3E';
                mainImageEl.classList.add('empty-image-placeholder');
            };

        } else {
            // 이미지 데이터가 없으면 empty placeholder 사용
            mainImageEl.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"%3E%3Crect fill="%23d1d5db" width="800" height="600"/%3E%3C/svg%3E';
            mainImageEl.classList.add('empty-image-placeholder');
        }
    }

    /**
     * 시설 갤러리 매핑 (facility.html의 #facility-gallery-container용)
     */
    mapFacilityGallery(facility) {
        const galleryContainer = this.safeSelect('#facility-gallery-container');
        if (!galleryContainer) {
            return;
        }

        // 선택된 이미지만 필터링 및 정렬
        let images = [];
        if (Array.isArray(facility.images)) {
            images = window.ImageHelpers.getSelectedImages(facility.images);
        }


        // 안정적인 폴링 방식으로 facilityGallery 대기
        this.waitForFacilityGallery(images, facility);
    }

    /**
     * 안정적인 방식으로 facilityGallery 로딩 대기
     */
    waitForFacilityGallery(images, facility, maxAttempts = 30, delay = 100) {
        let attempts = 0;

        const checkGallery = () => {
            attempts++;

            if (window.facilityGallery) {
                // facilityGallery가 로드된 경우
                try {
                    window.facilityGallery.images = images.map(img => ({
                        url: img.url,
                        title: img.description || facility.name,
                        description: img.description || ''
                    }));

                    // 즉시 초기화 (setTimeout 제거)
                    window.facilityGallery.init();
                } catch (error) {
                    this.showGalleryFallback();
                }
                return;
            }

            if (attempts >= maxAttempts) {
                // 최대 시도 횟수 초과 시 fallback 처리
                this.showGalleryFallback();
                return;
            }

            // 다음 시도
            setTimeout(checkGallery, delay);
        };

        checkGallery();
    }

    /**
     * 갤러리 로딩 실패 시 fallback UI 표시
     */
    showGalleryFallback() {
        const container = document.getElementById('facility-gallery-container');
        if (container) {
            container.innerHTML = `
                <div class="empty-image-placeholder w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <p class="text-gray-500">갤러리를 불러올 수 없습니다</p>
                </div>
            `;
        }
    }


    /**
     * Wave 배경 이미지 매핑 (마지막 이미지 사용)
     */
    mapWaveBackground() {
        const waveElement = this.safeSelect('[data-facility-wave-background]');
        if (!waveElement) return;

        const facility = this.getCurrentFacility();
        if (!facility) return;

        let imageUrl = '';

        // 선택된 시설 이미지의 마지막 이미지 사용
        if (Array.isArray(facility.images) && facility.images.length > 0) {
            const selectedImages = window.ImageHelpers.getSelectedImages(facility.images);

            if (selectedImages.length > 0) {
                const lastImage = selectedImages[selectedImages.length - 1]; // 마지막 이미지
                if (lastImage && lastImage.url) {
                    imageUrl = lastImage.url;
                }
            }
        }

        // 시설 이미지가 없으면 customFields 헬퍼를 통해 property_exterior 이미지 fallback
        if (!imageUrl) {
            const exteriorImages = this.getPropertyImages('property_exterior');
            if (exteriorImages.length > 0) {
                imageUrl = exteriorImages[0].url;
            }
        }

        if (imageUrl) {
            waveElement.style.backgroundImage = `url('${imageUrl}')`;
            waveElement.classList.remove('empty-image-placeholder');
        } else {
            waveElement.style.backgroundImage = `url('${ImageHelpers.EMPTY_IMAGE_WITH_ICON}')`;
            waveElement.classList.add('empty-image-placeholder');
        }
    }

    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Facility hero image 매핑 (0번째 이미지 사용)
     */
    mapFacilityHeroImage() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        const heroImageElement = this.safeSelect('[data-facility-hero-image]');
        if (!heroImageElement) return;

        // 선택된 이미지 필터링 및 정렬 후 0번째 이미지를 히어로 배경으로 사용
        let heroImage = null;

        if (Array.isArray(facility.images) && facility.images.length > 0) {
            heroImage = window.ImageHelpers.getFirstSelectedImage(facility.images);
        }

        if (heroImage && heroImage.url) {
            heroImageElement.src = heroImage.url;
            heroImageElement.alt = heroImage.description || facility.name || '시설 이미지';
            heroImageElement.classList.remove('empty-image-placeholder');
        } else {
            heroImageElement.src = '';
            heroImageElement.alt = '이미지 없음';
            heroImageElement.classList.add('empty-image-placeholder');
        }
    }

    /**
     * 커스텀 필드 additional infos 매핑
     */
    mapAdditionalInfos(showDefaultIfEmpty = false) {
        const facility = this.getCurrentFacility();
        if (!facility) return false;

        // 커스텀필드에서 additionalInfos 가져오기 (ID 기준)
        const customFields = this.data.homepage?.customFields?.pages?.facility;
        let additionalInfos = [];

        if (customFields && Array.isArray(customFields)) {
            // ID로 매칭되는 커스텀 데이터 찾기
            const facilityCustomData = customFields.find(cf => cf.id === facility.id);
            if (facilityCustomData?.sections?.[0]?.experience?.additionalInfos) {
                additionalInfos = facilityCustomData.sections[0].experience.additionalInfos;
            }
        }

        // additionalInfos 컨테이너 찾기
        const container = this.safeSelect('[data-facility-experience-additional-info]');
        if (!container) {
            return false;
        }

        // 전체 섹션 찾기 (data 속성 사용)
        const sectionElement = this.safeSelect('[data-additional-info-section]');

        // 의미있는 데이터 필터링
        const validInfos = additionalInfos.filter(
            info => (info.title && info.title.trim()) || (info.description && info.description.trim())
        );

        // 데이터가 있으면 렌더링
        if (validInfos.length > 0) {
            container.innerHTML = validInfos.map((info, index) => `
                <div class="mb-3 last:mb-0 ${index === 0 ? 'pt-3 border-t border-gray-200' : 'mt-4 pt-3 border-t border-gray-200'}">
                    <div class="font-semibold text-[#5D4037] mb-1 ko-title">${info.title || ''}</div>
                    <div class="text-gray-600 text-sm leading-relaxed ko-body">${(info.description || '').replace(/\n/g, '<br>')}</div>
                </div>
            `).join('');

            if (sectionElement) {
                sectionElement.classList.remove('hidden');
            }
            return true;
        }

        // 데이터가 없으면 섹션 숨기기
        if (sectionElement) {
            sectionElement.classList.add('hidden');
        }
        return false;
    }

    /**
     * 커스텀 필드 benefits 매핑
     */
    mapBenefits(showDefaultIfEmpty = false) {
        const facility = this.getCurrentFacility();
        if (!facility) return false;

        // 커스텀필드에서 benefits 가져오기 (ID 기준)
        const customFields = this.data.homepage?.customFields?.pages?.facility;
        let benefits = [];

        if (customFields && Array.isArray(customFields)) {
            // ID로 매칭되는 커스텀 데이터 찾기
            const facilityCustomData = customFields.find(cf => cf.id === facility.id);
            if (facilityCustomData?.sections?.[0]?.experience?.benefits) {
                benefits = facilityCustomData.sections[0].experience.benefits;
            }
        }

        // benefits 컨테이너 찾기
        const container = this.safeSelect('[data-facility-experience-benefits]');
        if (!container) {
            return false;
        }

        // 전체 섹션 찾기 (data 속성 사용)
        const sectionElement = this.safeSelect('[data-benefits-section]');

        // 의미있는 데이터 필터링
        const validBenefits = benefits.filter(
            b => (b.title && b.title.trim()) || (b.description && b.description.trim())
        );

        // 데이터가 있으면 렌더링
        if (validBenefits.length > 0) {
            container.innerHTML = validBenefits.map((benefit, index) => `
                <div class="mb-3 last:mb-0 ${index === 0 ? 'pt-3 border-t border-gray-200' : 'mt-4 pt-3 border-t border-gray-200'}">
                    <div class="font-semibold text-[#5D4037] mb-1 ko-title">${benefit.title || ''}</div>
                    <div class="text-gray-600 text-sm leading-relaxed ko-body">${(benefit.description || '').replace(/\n/g, '<br>')}</div>
                </div>
            `).join('');

            if (sectionElement) {
                sectionElement.classList.remove('hidden');
            }
            return true;
        }

        // 데이터가 없으면 섹션 숨기기
        if (sectionElement) {
            sectionElement.classList.add('hidden');
        }
        return false;
    }

    /**
     * 커스텀 필드 features 매핑
     */
    mapFeatures(showDefaultIfEmpty = false) {
        const facility = this.getCurrentFacility();
        if (!facility) return false;

        // 커스텀필드에서 features 가져오기 (ID 기준)
        const customFields = this.data.homepage?.customFields?.pages?.facility;
        let features = [];

        if (customFields && Array.isArray(customFields)) {
            // ID로 매칭되는 커스텀 데이터 찾기
            const facilityCustomData = customFields.find(cf => cf.id === facility.id);
            if (facilityCustomData?.sections?.[0]?.experience?.features) {
                features = facilityCustomData.sections[0].experience.features;
            }
        }

        // features 컨테이너 찾기
        const container = this.safeSelect('[data-facility-experience-features]');
        if (!container) {
            return false;
        }

        // 전체 섹션 찾기 (data 속성 사용)
        const sectionElement = this.safeSelect('[data-features-section]');

        // 의미있는 데이터 필터링
        const validFeatures = features.filter(
            f => (f.title && f.title.trim()) || (f.description && f.description.trim())
        );

        // 데이터가 있으면 렌더링
        if (validFeatures.length > 0) {
            container.innerHTML = validFeatures.map((feature, index) => `
                <div class="mb-3 last:mb-0 ${index === 0 ? 'pt-3 border-t border-gray-200' : 'mt-4 pt-3 border-t border-gray-200'}">
                    <div class="font-semibold text-[#5D4037] mb-1 ko-title">${feature.title || ''}</div>
                    <div class="text-gray-600 text-sm leading-relaxed ko-body">${(feature.description || '').replace(/\n/g, '<br>')}</div>
                </div>
            `).join('');

            if (sectionElement) {
                sectionElement.classList.remove('hidden');
            }
            return true;
        }

        // 데이터가 없으면 섹션 숨기기
        if (sectionElement) {
            sectionElement.classList.add('hidden');
        }
        return false;
    }

    /**
     * Experience 섹션의 그리드 레이아웃을 표시되는 박스 수에 따라 동적 조정
     */
    adjustExperienceGridLayout() {
        const gridContainer = this.safeSelect('.experience-section .grid');
        if (!gridContainer) {
            return;
        }

        // 현재 표시되는 섹션 확인
        const featuresSection = this.safeSelect('[data-features-section]');
        const additionalInfoSection = this.safeSelect('[data-additional-info-section]');
        const benefitsSection = this.safeSelect('[data-benefits-section]');

        const visibleSections = [];
        if (featuresSection && !featuresSection.classList.contains('hidden')) {
            visibleSections.push('features');
        }
        if (additionalInfoSection && !additionalInfoSection.classList.contains('hidden')) {
            visibleSections.push('additionalInfo');
        }
        if (benefitsSection && !benefitsSection.classList.contains('hidden')) {
            visibleSections.push('benefits');
        }

        const visibleCount = visibleSections.length;

        // experience-section 요소 가져오기
        const experienceSection = this.safeSelect('.experience-section');

        // 기존 그리드 클래스 제거
        gridContainer.className = gridContainer.className.replace(/grid-cols-\d+/g, '');
        gridContainer.className = gridContainer.className.replace(/md:grid-cols-\d+/g, '');
        gridContainer.className = gridContainer.className.replace(/lg:grid-cols-\d+/g, '');

        // 표시되는 박스 수에 따라 그리드 클래스 설정 (전체 영역 꽉 채우기)
        if (visibleCount === 0) {
            // 0개: 전체 섹션 숨기기
            if (experienceSection) {
                experienceSection.style.display = 'none';
            }
        } else {
            // 1개 이상: 전체 섹션 보이기
            if (experienceSection) {
                experienceSection.style.display = '';
            }

            if (visibleCount === 1) {
                // 1개: 전체 너비 사용
                gridContainer.classList.add('grid-cols-1');
                gridContainer.style.maxWidth = '';
                gridContainer.style.margin = '';
            } else if (visibleCount === 2) {
                // 2개: 각각 50% 너비로 전체 영역 꽉 채우기
                gridContainer.classList.add('grid-cols-1', 'md:grid-cols-2');
                gridContainer.style.maxWidth = '';
                gridContainer.style.margin = '';
            } else if (visibleCount === 3) {
                // 3개: 1열 → 2열 → 3열 (기본)
                gridContainer.classList.add('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
                gridContainer.style.maxWidth = '';
                gridContainer.style.margin = '';
            }
        }

    }

    /**
     * Facility 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            return;
        }

        const facility = this.getCurrentFacility();
        if (!facility) {
            return;
        }

        // 페이지 제목 업데이트
        this.updatePageTitle(facility);

        // 히어로 이미지 매핑
        this.mapFacilityHeroImage();

        // Wave 배경 이미지 매핑
        this.mapWaveBackground();

        // 시설 기본 정보 매핑
        this.mapFacilityBasicInfo();

        // 갤러리 매핑
        this.mapFacilityGallery(facility);

        // 커스텀 필드 매핑
        this.mapAdditionalInfos();
        this.mapFeatures();
        this.mapBenefits();

        // 동적 그리드 레이아웃 조정
        this.adjustExperienceGridLayout();

        // 메타 태그 업데이트
        this.updateMetaTags(this.data.property);

        // E-commerce registration 매핑
        this.mapEcommerceRegistration();

        // Favicon 업데이트
        this.updateFavicon();
    }

    /**
     * Favicon 업데이트
     */
    updateFavicon() {
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

    /**
     * 페이지 제목 업데이트
     */
    updatePageTitle(facility) {
        // customFields 헬퍼를 통해 숙소명 가져오기
        const builderPropertyName = this.getPropertyName();

        // HTML title 업데이트
        document.title = `${facility.name} - ${builderPropertyName}`;

        // page-title 엘리먼트 업데이트
        const pageTitleElement = this.safeSelect('#page-title');
        if (pageTitleElement) {
            pageTitleElement.textContent = `${facility.name} - ${builderPropertyName}`;
        }
    }

}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FacilityMapper;
} else {
    window.FacilityMapper = FacilityMapper;
}
