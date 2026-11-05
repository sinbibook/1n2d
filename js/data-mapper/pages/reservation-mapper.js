/**
 * Reservation Page Data Mapper
 * reservation.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 예약 페이지 전용 기능 제공
 */
class ReservationMapper extends BaseDataMapper {
    constructor() {
        super();
    }

    // ============================================================================
    // 📅 RESERVATION PAGE SPECIFIC MAPPINGS
    // ============================================================================

    /**
     * Hero 섹션 매핑 (단일 이미지)
     * homepage.customFields.pages.reservation.sections[0].hero.images → [data-hero-image]
     */
    mapHeroSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        const reservationData = this.safeGet(this.data, 'homepage.customFields.pages.reservation.sections.0');
        this.mapHeroImage(reservationData?.hero?.images, '예약안내');
    }

    /**
     * 예약 정보 섹션 매핑
     */
    mapReservationInfoSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        const reservationData = this.safeGet(this.data, 'homepage.customFields.pages.reservation.sections.0');

        // CUSTOM FIELD 제목 매핑 (about.title)
        const reservationTitle = this.safeSelect('[data-reservation-title]');
        if (reservationTitle) {
            reservationTitle.textContent = this.sanitizeText(reservationData?.about?.title, '예약정보 타이틀');
        }

        // CUSTOM FIELD 설명 매핑 (about.description)
        const reservationDescription = this.safeSelect('[data-reservation-description]');
        if (reservationDescription) {
            reservationDescription.innerHTML = this._formatTextWithLineBreaks(
                reservationData?.about?.description,
                '예약정보 설명'
            );
        }
    }


    /**
     * 숙소명 매핑 (customFields 우선)
     */
    mapPropertyName() {
        if (!this.isDataLoaded || !this.data.property) return;

        // 숙소명 한글 매핑 (customFields 우선)
        const propertyNameEl = this.safeSelect('[data-property-name]');
        if (propertyNameEl) {
            propertyNameEl.textContent = this.getPropertyName();
        }
    }

    /**
     * 이용안내 섹션 매핑
     */
    mapUsageSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;
        const usageGuideElement = this.safeSelect('[data-usage-guide]');
        const boxElement = this.safeSelect('[data-usage-guide-box]');

        if (!property.usageGuide) {
            if (boxElement) boxElement.style.display = 'none';
            return;
        }

        if (boxElement) boxElement.style.display = '';
        if (usageGuideElement) {
            usageGuideElement.innerHTML = this._formatTextWithLineBreaks(property.usageGuide);
        }
    }

    /**
     * 예약안내 섹션 매핑
     */
    mapReservationGuideSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;
        const reservationGuideElement = this.safeSelect('[data-reservation-guide]');
        const boxElement = this.safeSelect('[data-reservation-guide-box]');

        if (!property.reservationGuide) {
            if (boxElement) boxElement.style.display = 'none';
            return;
        }

        if (boxElement) boxElement.style.display = '';
        if (reservationGuideElement) {
            reservationGuideElement.innerHTML = this._formatTextWithLineBreaks(property.reservationGuide);
        }
    }

    /**
     * 입/퇴실 안내 섹션 매핑
     */
    mapCheckInOutSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;
        const boxElement = this.safeSelect('[data-checkin-guide-box]');

        // 체크인/체크아웃 정보가 모두 없으면 박스 숨김
        if (!property.checkin && !property.checkout && !property.checkInOutInfo) {
            if (boxElement) boxElement.style.display = 'none';
            return;
        }

        if (boxElement) boxElement.style.display = '';

        // 체크인 시간 매핑
        const checkinTime = this.safeSelect('[data-checkin-time]');
        if (checkinTime) {
            checkinTime.textContent = property.checkin ? this.formatTime(property.checkin) : '--:--';
        }

        // 체크아웃 시간 매핑
        const checkoutTime = this.safeSelect('[data-checkout-time]');
        if (checkoutTime) {
            checkoutTime.textContent = property.checkout ? this.formatTime(property.checkout) : '--:--';
        }

        // 운영정보 텍스트 매핑
        const operationInfo = this.safeSelect('[data-operation-info]');
        if (operationInfo) {
            if (property.checkInOutInfo) {
                operationInfo.innerHTML = this._formatTextWithLineBreaks(property.checkInOutInfo);
            } else {
                operationInfo.closest('.operation-info-section')?.style.setProperty('display', 'none');
            }
        }
    }

    /**
     * 환불규정 섹션 매핑
     */
    mapRefundSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;
        const boxElement = this.safeSelect('[data-refund-guide-box]');
        const refundNotesElement = this.safeSelect('[data-refund-notes]');
        const refundTextSection = this.safeSelect('.refund-text-section');

        // 환불 정책과 안내문이 모두 없으면 박스 숨김
        if (!property.refundPolicies && !property.refundSettings?.customerRefundNotice) {
            if (boxElement) boxElement.style.display = 'none';
            return;
        }

        if (boxElement) boxElement.style.display = '';

        // 환불 안내문 매핑
        if (refundNotesElement) {
            if (property.refundSettings?.customerRefundNotice) {
                refundNotesElement.innerHTML = this._formatTextWithLineBreaks(property.refundSettings.customerRefundNotice);
                if (refundTextSection) refundTextSection.style.display = '';
            } else {
                if (refundTextSection) refundTextSection.style.display = 'none';
            }
        }

        // 환불 정책 테이블 매핑
        if (property.refundPolicies) {
            this.mapRefundPolicies(property.refundPolicies);
        }
    }

    /**
     * 환불 정책 테이블 매핑
     */
    mapRefundPolicies(refundPolicies) {
        const tableBody = this.safeSelect('.refund-table-body');
        if (!tableBody || !refundPolicies || !Array.isArray(refundPolicies)) return;

        tableBody.innerHTML = '';
        refundPolicies.forEach(policy => {
            const row = document.createElement('tr');

            // refundProcessingDays를 기반으로 취소 시점 텍스트 생성
            let period;
            if (policy.refundProcessingDays === 0) {
                period = '이용일 당일';
            } else if (policy.refundProcessingDays === 1) {
                period = '이용일 1일 전';
            } else {
                period = `이용일 ${policy.refundProcessingDays}일 전`;
            }

            // refundRate를 기반으로 환불율 텍스트 생성
            const refundRateText = policy.refundRate === 0 ? '환불 불가' : `${policy.refundRate}% 환불`;

            row.innerHTML = `
                <td>${period}</td>
                <td class="${policy.refundRate === 0 ? 'no-refund' : ''}">${refundRateText}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    /**
     * 예약 페이지 About 이미지 매핑 (reservation > about > images)
     */
    mapReservationAboutImage() {
        if (!this.isDataLoaded || !this.data.property) return;

        const reservationData = this.safeGet(this.data, 'homepage.customFields.pages.reservation.sections.0');
        const imageContainer = this.safeSelect('[data-reservation-about-image]');
        if (!imageContainer) return;

        const img = imageContainer.querySelector('img');
        if (!img) return;

        // reservation.about.images에서 첫 번째 선택된 이미지 사용
        const aboutImages = reservationData?.about?.images;
        const selectedImages = ImageHelpers.getSelectedImages(aboutImages);

        if (selectedImages.length > 0) {
            img.src = selectedImages[0].url;
            img.alt = selectedImages[0].description || 'Reservation About Image';
        } else {
            ImageHelpers.applyPlaceholder(img);
        }
    }

    /**
     * 예약 이미지 섹션 매핑 (customFields 우선)
     */
    mapReservationImage() {
        if (!this.isDataLoaded || !this.data.property) return;

        const imageContainer = this.safeSelect('[data-reservation-image]');
        if (!imageContainer) return;

        const img = imageContainer.querySelector('img');
        if (!img) return;

        // customFields property_exterior 이미지 사용
        const exteriorImages = this.getPropertyImages('property_exterior');

        if (exteriorImages.length > 0) {
            img.src = exteriorImages[0].url;
            img.alt = exteriorImages[0].description || this.getPropertyName();
        } else {
            ImageHelpers.applyPlaceholder(img);
        }
    }

    /**
     * 배너 이미지 및 숙소명 매핑 (customFields 우선)
     */
    mapBannerAndMarquee() {
        if (!this.isDataLoaded || !this.data.property) return;

        // 숙소 영문명 매핑 (customFields 우선)
        const bannerTitleElement = this.safeSelect('[data-property-name-en]');
        if (bannerTitleElement) {
            bannerTitleElement.textContent = this.getPropertyNameEn().toUpperCase();
        }

        // 배너 이미지 매핑 (customFields 우선)
        const bannerImageElement = this.safeSelect('[data-banner-image]');
        if (bannerImageElement) {
            // customFields property_exterior 이미지 사용
            const exteriorImages = this.getPropertyImages('property_exterior');
            // 두 번째 외경 이미지 사용 (인덱스 1)
            const bannerImage = exteriorImages[1];

            if (bannerImage && bannerImage.url) {
                bannerImageElement.style.backgroundImage = `url('${bannerImage.url}')`;
            } else {
                // placeholder 배경 이미지
                ImageHelpers.applyPlaceholder(bannerImageElement);
            }
        }

    }

    /**
     * Full Banner 섹션 매핑
     * property.nameEn → [data-reservation-banner-title]
     * property.images[0].exterior[] → [data-reservation-banner-bg] 배경 이미지
     */
    mapFullBanner() {
        if (!this.isDataLoaded) return;

        // 배너 타이틀 매핑 (customFields 우선)
        const bannerTitle = this.safeSelect('[data-reservation-banner-title]');
        if (bannerTitle) {
            bannerTitle.textContent = this.getPropertyNameEn().toUpperCase();
        }

        // 배너 배경 이미지 매핑 (customFields 우선)
        const bannerBg = this.safeSelect('[data-reservation-banner-bg]');
        if (!bannerBg) return;

        // customFields에서 property_exterior 카테고리 이미지 가져오기
        const exteriorImages = this.getPropertyImages('property_exterior');

        if (exteriorImages.length > 0) {
            bannerBg.style.backgroundImage = `url('${exteriorImages[0].url}')`;
        } else {
            bannerBg.style.backgroundImage = `url('${ImageHelpers.EMPTY_IMAGE_WITH_ICON}')`;
        }
    }

    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Reservation 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            console.error('Cannot map reservation page: data not loaded');
            return;
        }

        // 순차적으로 각 섹션 매핑
        this.mapHeroSection();
        this.mapPropertyName();
        this.mapReservationInfoSection();
        this.mapUsageSection();
        this.mapReservationGuideSection();
        this.mapCheckInOutSection();
        this.mapRefundSection();
        this.mapReservationAboutImage();
        this.mapReservationImage();
        this.mapBannerAndMarquee();
        this.mapFullBanner();

        // 메타 태그 업데이트 (페이지별 SEO 적용)
        const property = this.data.property;
        const reservationData = this.safeGet(this.data, 'homepage.customFields.pages.reservation.sections.0.hero');
        const pageSEO = {
            title: property?.name ? `예약안내 - ${property.name}` : 'SEO 타이틀',
            description: reservationData?.description || property?.description || 'SEO 설명'
        };
        this.updateMetaTags(pageSEO);

        // OG 이미지 업데이트 (hero 이미지 사용)
        this.updateOGImage(reservationData);

        // E-commerce registration 매핑
        this.mapEcommerceRegistration();
    }

    /**
     * OG 이미지 업데이트 (reservation hero 이미지 사용, 없으면 로고)
     * @param {Object} reservationData - reservation hero 섹션 데이터
     */
    updateOGImage(reservationData) {
        if (!this.isDataLoaded) return;

        const ogImage = this.safeSelect('meta[property="og:image"]');
        if (!ogImage) return;

        // 우선순위: hero 이미지 > 로고 이미지
        if (reservationData?.images && reservationData.images.length > 0 && reservationData.images[0]?.url) {
            ogImage.setAttribute('content', reservationData.images[0].url);
        } else {
            const defaultImage = this.getDefaultOGImage();
            if (defaultImage) {
                ogImage.setAttribute('content', defaultImage);
            }
        }
    }

    /**
     * Reservation 페이지 텍스트만 업데이트
     */
    mapReservationText() {
        if (!this.isDataLoaded) return;

        // 순차적으로 각 섹션 텍스트 매핑
        this.mapHeroSection();
        this.mapReservationInfoSection();
        this.mapUsageSection();
        this.mapReservationGuideSection();
        this.mapCheckInOutSection();
        this.mapRefundSection();
        this.mapBannerAndMarquee();
    }

    /**
     * 네비게이션 함수 설정
     */
    setupNavigation() {
        // 홈으로 이동 함수 설정
        window.navigateToHome = () => {
            window.location.href = './index.html';
        };
    }
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReservationMapper;
} else {
    window.ReservationMapper = ReservationMapper;
}

// DOMContentLoaded 초기화
document.addEventListener('DOMContentLoaded', async () => {
    const reservationMapper = new ReservationMapper();
    try {
        await reservationMapper.loadData();
        await reservationMapper.mapPage();
    } catch (error) {
        console.error('Error initializing reservation mapper:', error);
    }
});
