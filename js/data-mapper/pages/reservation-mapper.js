/**
 * Reservation Page Data Mapper
 * reservation.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 예약 페이지 전용 기능 제공
 */
class ReservationMapper extends BaseDataMapper {
    constructor(data = null) {
        super();
        if (data) {
            this.data = data;
            this.isDataLoaded = true;
        }
    }

    // ============================================================================
    // 📅 RESERVATION PAGE MAPPINGS
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
     * Hero 이미지 매핑 (reservation hero images)
     */
    mapHeroImages() {
        const heroImages = this.safeGet(this.data, 'homepage.customFields.pages.reservation.sections.0.hero.images');

        // Hero section 이미지 매핑 (선택된 이미지 필터링 및 정렬)
        const heroElement = this.safeSelect('[data-homepage-customfields-pages-reservation-sections-0-hero-images-0-url]');
        if (heroElement) {
            if (Array.isArray(heroImages) && heroImages.length > 0) {
                const firstImage = window.ImageHelpers.getFirstSelectedImage(heroImages);

                if (firstImage) {
                    heroElement.src = firstImage.url;
                    heroElement.alt = firstImage.description || '예약 히어로 이미지';
                    heroElement.classList.remove('empty-image-placeholder');
                } else {
                    heroElement.src = '';
                    heroElement.alt = '이미지 없음';
                    heroElement.classList.add('empty-image-placeholder');
                }
            } else {
                heroElement.src = '';
                heroElement.alt = '이미지 없음';
                heroElement.classList.add('empty-image-placeholder');
            }
        }

        // Wave section background image 매핑
        this.mapWaveBackground();
    }


    /**
     * About 이미지 매핑
     */
    mapAboutImages() {
        const aboutImages = this.safeGet(this.data, 'homepage.customFields.pages.reservation.sections.0.about.images');

        // About section 이미지 매핑 (선택된 이미지 필터링 및 정렬)
        const aboutElement = this.safeSelect('[data-homepage-customfields-pages-reservation-sections-0-about-images-0-url]');
        if (aboutElement) {
            if (Array.isArray(aboutImages) && aboutImages.length > 0) {
                const firstImage = window.ImageHelpers.getFirstSelectedImage(aboutImages);

                if (firstImage) {
                    aboutElement.src = firstImage.url;
                    aboutElement.alt = firstImage.description || '예약 안내 이미지';
                    aboutElement.classList.remove('empty-image-placeholder');
                } else {
                    aboutElement.src = '';
                    aboutElement.alt = '이미지 없음';
                    aboutElement.classList.add('empty-image-placeholder');
                }
            } else {
                aboutElement.src = '';
                aboutElement.alt = '이미지 없음';
                aboutElement.classList.add('empty-image-placeholder');
            }
        }
    }

    /**
     * 이용안내 매핑 (property.usageGuide 사용)
     */
    mapUsageGuide() {
        const usageGuide = this.safeGet(this.data, 'property.usageGuide');
        const usageElement = this.safeSelect('[data-property-usageGuide]');

        if (usageElement) {
            if (usageGuide && usageGuide.trim()) {
                // Description을 줄바꿈으로 나누어 <p> 태그로 감싸기
                const lines = usageGuide.split('\n').filter(line => line.trim());
                const htmlContent = lines.map(line => `<p class="ko-body">${line.trim()}</p>`).join('');
                usageElement.innerHTML = htmlContent;
            } else {
                usageElement.innerHTML = `
                    <p class="ko-body">이용 안내사항을 입력해주세요</p>
                `;
            }
        }
    }

    /**
     * 예약안내 매핑 (property.reservationGuide 사용)
     */
    mapReservationGuide() {
        const reservationGuide = this.safeGet(this.data, 'property.reservationGuide');
        const reservationElement = this.safeSelect('[data-property-reservationGuide]');

        if (reservationElement) {
            if (reservationGuide && reservationGuide.trim()) {
                // Description을 줄바꿈으로 나누어 <p> 태그로 감싸기
                const lines = reservationGuide.split('\n').filter(line => line.trim());
                const htmlContent = lines.map(line => `<p class="ko-body">${line.trim()}</p>`).join('');
                reservationElement.innerHTML = htmlContent;
            } else {
                reservationElement.innerHTML = `
                    <p class="ko-body">예약 안내사항을 입력해주세요</p>
                `;
            }
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
     * Property phone 매핑
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

    /**
     * Check-in/Check-out 정보 매핑
     */
    mapCheckInOutInfo() {
        if (!this.isDataLoaded || !this.data.property) return;

        const checkInOutInfo = this.data.property.checkInOutInfo;
        const checkInOutElement = this.safeSelect('[data-property-checkInOutInfo]');

        if (checkInOutElement) {
            if (checkInOutInfo && checkInOutInfo.trim()) {
                // CheckInOutInfo를 줄바꿈으로 나누어 <p> 태그로 감싸기
                const lines = checkInOutInfo.split('\n').filter(line => line.trim());
                const htmlContent = lines.map(line => `<p class="ko-body">${line.trim()}</p>`).join('');
                checkInOutElement.innerHTML = htmlContent;
            } else {
                checkInOutElement.innerHTML = `
                    <p class="ko-body">입/퇴실 정보를 입력해주세요</p>
                `;
            }
        }
    }

    /**
     * 환불규정 매핑 (refundPolicies 배열 사용)
     */
    mapRefundPolicy() {
        if (!this.isDataLoaded || !this.data.property) return;

        const refundPolicies = this.safeGet(this.data, 'property.refundPolicies');

        // 환불규정 섹션 매핑 (박스 자체를 테이블처럼 스타일링)
        const refundRulesElement = this.safeSelect('.refundRules');
        if (refundRulesElement) {
            if (Array.isArray(refundPolicies) && refundPolicies.length > 0) {
                // 헤더 추가
                const header = `
                    <div class="grid grid-cols-2 gap-4 pb-3 mb-3 border-b border-gray-300">
                        <div class="ko-title font-semibold text-center" style="color: var(--color-secondary);">취소 시점</div>
                        <div class="ko-title font-semibold text-center" style="color: var(--color-secondary);">환불율</div>
                    </div>
                `;

                // 데이터 행들
                const policyRows = refundPolicies.map((policy, index) => {
                    const daysText = policy.refundProcessingDays === 0 ? '당일' : `${policy.refundProcessingDays}일 전`;
                    const borderClass = index < refundPolicies.length - 1 ? 'border-b border-gray-200' : '';
                    return `
                        <div class="grid grid-cols-2 gap-4 py-2 ${borderClass}">
                            <div class="ko-body text-center">${daysText}</div>
                            <div class="ko-body text-center font-medium">${policy.refundRate}%</div>
                        </div>
                    `;
                }).join('');

                const htmlContent = header + policyRows;
                refundRulesElement.innerHTML = htmlContent;
            } else {
                refundRulesElement.innerHTML = `<p class="ko-body">환불규정을 입력해주세요</p>`;
            }
        }
    }

    /**
     * 취소 수수료 안내 매핑 (customerRefundNotice 사용)
     */
    mapCancelFeeInfo() {
        if (!this.isDataLoaded || !this.data.property) return;

        const refundNotice = this.safeGet(this.data, 'property.refundSettings.customerRefundNotice');
        const cancelFeeElements = this.safeSelectAll('[data-property-refundSettings-customerRefundNotice]');

        cancelFeeElements.forEach((element) => {
            if (refundNotice && refundNotice.trim()) {
                const lines = refundNotice.split('\n').filter(line => line.trim());
                const htmlContent = lines.map(line => `<p class="ko-body">${line.trim()}</p>`).join('');
                element.innerHTML = htmlContent;
            } else {
                element.innerHTML = `<p class="ko-body">취소 수수료 안내를 입력해주세요</p>`;
            }
        });
    }


    // ============================================================================
    // 🦶 FOOTER MAPPINGS
    // ============================================================================

    /**
     * Footer 사업자 정보 매핑
     */
    mapFooterInfo() {
        if (!this.isDataLoaded || !this.data.property) return;

        const businessInfo = this.data.property?.businessInfo;
        if (!businessInfo) return;

        // 펜션명 (로고 텍스트) - customFields 헬퍼 사용
        const logoText = this.safeSelect('.footer-logo');
        const builderPropertyName = this.getPropertyName();
        if (logoText && builderPropertyName) {
            logoText.textContent = builderPropertyName;
        }

        // 전화번호 매핑
        const footerPhone = this.safeSelect('.footer-phone p');
        if (footerPhone && businessInfo.businessPhone) {
            footerPhone.textContent = `숙소 전화번호 : ${businessInfo.businessPhone}`;
        }

        // 사업자번호 매핑
        const businessNumberElement = this.safeSelect('.footer-info > div:nth-child(3)');
        if (businessNumberElement && businessInfo.businessNumber) {
            businessNumberElement.textContent = `사업자번호 : ${businessInfo.businessNumber}`;
        }

        // 주소 매핑
        const addressElement = this.safeSelect('.footer-info > div:nth-child(4)');
        if (addressElement && businessInfo.businessAddress) {
            addressElement.textContent = `주소 : ${businessInfo.businessAddress}`;
        }

        // 저작권 정보 매핑
        const copyrightElement = this.safeSelect('.footer-copyright');
        if (copyrightElement && businessInfo.businessName) {
            const currentYear = new Date().getFullYear();
            copyrightElement.textContent = `© ${currentYear} ${businessInfo.businessName}. All rights reserved.`;
        }

        // 소셜미디어 링크 매핑
        this.mapSocialMediaLinks();
    }

    /**
     * 소셜미디어 링크 매핑
     */
    mapSocialMediaLinks() {
        if (!this.isDataLoaded || !this.data.homepage) return;

        const socialLinks = this.data.homepage.socialLinks;
        if (!socialLinks) return;

        // Facebook 링크
        const facebookLink = this.safeSelect('[data-homepage-socialLinks-facebook]');
        if (facebookLink && socialLinks.facebook) {
            facebookLink.href = socialLinks.facebook;
            facebookLink.style.display = 'inline';
        } else if (facebookLink) {
            facebookLink.style.display = 'none';
        }

        // Instagram 링크
        const instagramLink = this.safeSelect('[data-homepage-socialLinks-instagram]');
        if (instagramLink && socialLinks.instagram) {
            instagramLink.href = socialLinks.instagram;
            instagramLink.style.display = 'inline';
        } else if (instagramLink) {
            instagramLink.style.display = 'none';
        }

        // Blog 링크
        const blogLink = this.safeSelect('[data-homepage-socialLinks-blog]');
        if (blogLink && socialLinks.blog) {
            blogLink.href = socialLinks.blog;
            blogLink.style.display = 'inline';
        } else if (blogLink) {
            blogLink.style.display = 'none';
        }

        // YouTube 링크
        const youtubeLink = this.safeSelect('[data-homepage-socialLinks-youtube]');
        if (youtubeLink && socialLinks.youtube) {
            youtubeLink.href = socialLinks.youtube;
            youtubeLink.style.display = 'inline';
        } else if (youtubeLink) {
            youtubeLink.style.display = 'none';
        }
    }

    /**
     * Footer 전체 매핑 실행
     */
    async mapFooter() {
        if (!this.isDataLoaded) return;

        // Footer 매핑
        this.mapFooterInfo();

        // E-commerce registration 매핑
        this.mapEcommerceRegistration();
    }

    /**
     * Wave 배경 이미지 매핑
     */
    mapWaveBackground() {
        const waveElement = this.safeSelect('[data-reservation-wave-background]');
        if (!waveElement) return;

        // customFields 헬퍼를 통해 property_exterior 이미지 가져오기
        const exteriorImages = this.getPropertyImages('property_exterior');
        let imageUrl = '';

        if (exteriorImages.length > 0) {
            imageUrl = exteriorImages[0].url;
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
     * Reservation 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            return;
        }

        // 순차적으로 각 섹션 매핑
        this.mapSEOTags();
        this.mapPropertyAddress();
        this.mapPropertyPhone();
        this.mapHeroImages();
        this.mapAboutImages();
        this.mapUsageGuide();
        this.mapReservationGuide();
        this.mapCheckInOutInfo();
        this.mapRefundPolicy();
        this.mapCancelFeeInfo();

        // Footer 매핑
        await this.mapFooter();

        // 메타 태그 업데이트
        this.updateMetaTags(this.data.property);

        // HTML title 매핑
        this.updatePageTitle();

        // Favicon 업데이트
        this.updateFavicon();
    }

    /**
     * 페이지 제목 업데이트
     */
    updatePageTitle() {
        const htmlTitle = this.safeSelect('title');

        // customFields 헬퍼를 통해 숙소명 가져오기
        const builderPropertyName = this.getPropertyName();

        if (htmlTitle && builderPropertyName) {
            htmlTitle.textContent = `예약안내 - ${builderPropertyName}`;
        }
    }
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReservationMapper;
} else {
    window.ReservationMapper = ReservationMapper;
}