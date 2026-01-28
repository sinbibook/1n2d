/**
 * Header & Footer Data Mapper
 * header.html, footer.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 header/footer 공통 기능 제공
 */
class HeaderFooterMapper extends BaseDataMapper {
    constructor() {
        super();
    }

    // ============================================================================
    // 🏠 HEADER MAPPINGS
    // ============================================================================

    /**
     * Header 로고 텍스트 매핑 (펜션 이름)
     */
    mapHeaderLogo() {
        if (!this.isDataLoaded || !this.data.property) return;

        // customFields 헬퍼를 통해 숙소명 가져오기
        const builderPropertyName = this.getPropertyName();

        // Header 로고 텍스트 매핑 (.logo-text)
        const logoText = this.safeSelect('.logo-text');
        if (logoText) {
            logoText.textContent = builderPropertyName;
        }

        // Property name 매핑 (data-property-name 속성)
        const propertyNameElements = this.safeSelectAll('[data-property-name]');
        propertyNameElements.forEach(element => {
            if (element) {
                element.textContent = builderPropertyName;
            }
        });
    }

    /**
     * SEO 메타태그 매핑
     */
    mapSEOMetaTags() {
        if (!this.isDataLoaded || !this.data.homepage) return;

        const seoData = this.data.homepage.seo;
        if (!seoData) return;

        // 페이지 제목 매핑
        const titleElement = this.safeSelect('[data-homepage-seo-title]');
        if (titleElement && seoData.title) {
            titleElement.textContent = seoData.title;
        }

        // 메타 description 매핑
        const descriptionElement = this.safeSelect('[data-homepage-seo-description]');
        if (descriptionElement && seoData.description) {
            descriptionElement.setAttribute('content', seoData.description);
        }

        // 메타 keywords 매핑
        const keywordsElement = this.safeSelect('[data-homepage-seo-keywords]');
        if (keywordsElement && seoData.keywords) {
            keywordsElement.setAttribute('content', seoData.keywords);
        }
    }

    /**
     * Header 네비게이션 메뉴 동적 생성 (객실, 시설 메뉴 등)
     */
    mapHeaderNavigation() {
        if (!this.isDataLoaded) return;

        // 객실 메뉴 동적 생성
        this.mapRoomMenuItems();

        // 시설 메뉴 동적 생성
        this.mapFacilityMenuItems();
    }


    /**
     * 객실 메뉴 아이템 동적 생성
     */
    mapRoomMenuItems() {
        const roomData = this.safeGet(this.data, 'rooms');

        // Desktop Spaces 메뉴 (data-gnb="2")
        const spacesMenus = document.querySelectorAll('[data-gnb="2"] .subMenu');
        spacesMenus.forEach(submenu => {
            submenu.innerHTML = ''; // 기존 하드코딩된 내용 제거

            if (roomData && Array.isArray(roomData) && roomData.length > 0) {
                roomData.forEach((room, index) => {
                    // customFields 헬퍼를 통해 객실명 가져오기
                    const roomName = this.getRoomName(room);

                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = `room.html?id=${room.id}`;
                    a.textContent = roomName;
                    li.appendChild(a);
                    submenu.appendChild(li);
                });
            }
        });

        // Mobile Spaces 메뉴
        const mobileSpacesContainer = document.getElementById('mobile-spaces-items');
        if (mobileSpacesContainer) {
            mobileSpacesContainer.innerHTML = ''; // 기존 내용 제거

            if (roomData && Array.isArray(roomData) && roomData.length > 0) {
                roomData.forEach((room, index) => {
                    // customFields 헬퍼를 통해 객실명 가져오기
                    const roomName = this.getRoomName(room);

                    const button = document.createElement('button');
                    button.className = 'mobile-sub-item';
                    button.type = 'button';
                    button.textContent = roomName;
                    button.addEventListener('click', () => {
                        window.location.href = `room.html?id=${room.id}`;
                    });
                    mobileSpacesContainer.appendChild(button);
                });
            }
        }
    }

    /**
     * 시설 메뉴 아이템 동적 생성
     */
    mapFacilityMenuItems() {
        const facilityData = this.safeGet(this.data, 'property.facilities');

        // Desktop Specials 메뉴 (data-gnb="3")
        const specialsMenus = document.querySelectorAll('[data-gnb="3"] .subMenu');
        specialsMenus.forEach(submenu => {
            submenu.innerHTML = ''; // 기존 하드코딩된 내용 제거

            if (facilityData && Array.isArray(facilityData) && facilityData.length > 0) {
                facilityData.forEach((facility, index) => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = `facility.html?index=${index}`;
                    a.textContent = facility.name || `시설${index + 1}`;
                    li.appendChild(a);
                    submenu.appendChild(li);
                });
            }
        });

        // Mobile Specials 메뉴
        const mobileSpecialsContainer = document.getElementById('mobile-specials-items');
        if (mobileSpecialsContainer) {
            mobileSpecialsContainer.innerHTML = ''; // 기존 내용 제거

            if (facilityData && Array.isArray(facilityData) && facilityData.length > 0) {
                facilityData.forEach((facility, index) => {
                    const button = document.createElement('button');
                    button.className = 'mobile-sub-item';
                    button.type = 'button';
                    button.textContent = facility.name || `시설${index + 1}`;
                    button.addEventListener('click', () => {
                        window.location.href = `facility.html?index=${index}`;
                    });
                    mobileSpecialsContainer.appendChild(button);
                });
            }
        }
    }

    // ============================================================================
    // 🦶 FOOTER MAPPINGS
    // ============================================================================

    /**
     * Footer 사업자 정보 매핑 (JSON 구조에 맞게 수정)
     */
    mapFooterInfo() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;
        const businessInfo = property?.businessInfo;


        // 대표자명 매핑 (data-footer-representative-name)
        const representativeElements = this.safeSelectAll('[data-footer-representative-name]');
        representativeElements.forEach(repEl => {
            if (repEl && businessInfo?.representativeName) {
                repEl.textContent = `대표 : ${businessInfo.representativeName}`;
            }
        });

        // 전화번호 매핑 (data-footer-contact-phone)
        const phoneElements = this.safeSelectAll('[data-footer-contact-phone]');
        phoneElements.forEach(phoneEl => {
            if (phoneEl && property.contactPhone) {
                phoneEl.textContent = `전화번호 : ${property.contactPhone}`;
            }
        });

        // 주소 매핑 (data-footer-contact-address)
        const addressElements = this.safeSelectAll('[data-footer-contact-address]');
        addressElements.forEach(addressEl => {
            if (addressEl && property.address) {
                addressEl.textContent = `주소 : ${property.address}`;
            }
        });

        // 사업자번호 매핑 (data-footer-business-number)
        const businessNumberElements = this.safeSelectAll('[data-footer-business-number]');
        businessNumberElements.forEach(businessEl => {
            if (businessEl && businessInfo?.businessNumber) {
                businessEl.textContent = `사업자등록번호 : ${businessInfo.businessNumber}`;
            }
        });

        // 통신판매업신고번호 매핑 (data-footer-ecommerce-registration)
        const ecommerceElements = this.safeSelectAll('[data-footer-ecommerce-registration]');
        ecommerceElements.forEach(ecommerceEl => {
            if (ecommerceEl && businessInfo?.eCommerceRegistrationNumber) {
                ecommerceEl.textContent = `통신판매업신고번호 : ${businessInfo.eCommerceRegistrationNumber}`;
            }
        });

        // 저작권 정보 매핑 (data-footer-copyright)
        const copyrightElements = this.safeSelectAll('[data-footer-copyright]');
        copyrightElements.forEach(copyrightEl => {
            if (copyrightEl) {
                const currentYear = new Date().getFullYear();
                copyrightEl.innerHTML = `<a href="https://www.sinbibook.com/" target="_blank" rel="noopener">© ${currentYear} 신비서. All rights reserved.</a>`;
            }
        });

        // 소셜미디어 링크 매핑
        this.mapSocialMediaLinks();
    }


    /**
     * 소셜미디어 링크 매핑
     */
    mapSocialMediaLinks() {
        if (!this.isDataLoaded || !this.data.homepage) return;

        const socialLinks = this.data.homepage.socialLinks;

        // 소셜 미디어 플랫폼 배열로 처리
        const socialMediaPlatforms = ['facebook', 'instagram', 'blog'];

        socialMediaPlatforms.forEach(platform => {
            // 모든 매칭되는 요소 선택 (모바일 + 데스크톱)
            const linkElements = this.safeSelectAll(`[data-homepage-socialLinks-${platform}]`);

            linkElements.forEach(linkElement => {
                if (socialLinks && socialLinks[platform]) {
                    // 데이터가 있으면 href 설정 및 표시
                    linkElement.href = socialLinks[platform];
                    linkElement.style.display = 'flex';
                    linkElement.classList.remove('hidden-social-link');
                } else {
                    // 데이터가 없으면 강제로 숨김
                    linkElement.style.display = 'none';
                    linkElement.classList.add('hidden-social-link');
                }
            });
        });
    }

    // ============================================================================
    // 🍔 FULLSCREEN MENU MAPPINGS
    // ============================================================================

    /**
     * Fullscreen 메뉴 데이터 업데이트 (window.FullScreenMenu에 데이터 전달)
     * 재시도 로직 포함 - fullscreen-menu.js 비동기 로딩 대응
     */
    mapFullscreenMenu(retryCount = 0) {
        if (!this.isDataLoaded) return;

        const MAX_RETRIES = 10;
        const RETRY_DELAY = 200; // ms

        // FullScreenMenu 인스턴스가 있으면 데이터 업데이트
        if (window.fullScreenMenu && typeof window.fullScreenMenu.updateFromMapper === 'function') {
            window.fullScreenMenu.updateFromMapper(this.data);
        } else if (retryCount < MAX_RETRIES) {
            // fullscreen-menu.js가 아직 로드되지 않았으면 재시도
            setTimeout(() => {
                this.mapFullscreenMenu(retryCount + 1);
            }, RETRY_DELAY);
        }
    }

    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Header 전체 매핑 실행
     */
    async mapHeader() {
        if (!this.isDataLoaded) {
            return;
        }

        // Header 매핑
        this.mapHeaderLogo();
        this.mapHeaderNavigation();

        // SEO 메타태그 매핑
        this.mapSEOMetaTags();

        // SEO 데이터가 없을 때만 기존 메타 태그 업데이트
        if (!this.data.homepage?.seo) {
            this.updateMetaTags(this.data.property);
        }

        // Fullscreen 메뉴 매핑
        this.mapFullscreenMenu();
    }

    /**
     * Footer 전체 매핑 실행
     */
    async mapFooter() {
        if (!this.isDataLoaded) {
            return;
        }

        // Footer 매핑 (통신판매업신고번호 포함)
        this.mapFooterInfo();

        // 예약 버튼 이벤트 설정
        this.setupBookingButton();
    }

    /**
     * 예약 버튼 클릭 이벤트 설정
     */
    setupBookingButton() {
        const bookingButton = document.querySelector('[data-property-gpension-id]');
        if (bookingButton && this.data?.property?.realtimeBookingId) {
            bookingButton.addEventListener('click', () => {
                const bookingUrl = this.data.property.realtimeBookingId;
                window.open(bookingUrl, '_blank');
            });
        }
    }

    /**
     * Header & Footer 전체 매핑 실행
     */
    async mapHeaderFooter() {
        if (!this.isDataLoaded) {
            return;
        }

        // 동시에 실행
        await Promise.all([
            this.mapHeader(),
            this.mapFooter()
        ]);
    }

    /**
     * BaseMapper에서 요구하는 mapPage 메서드 구현
     */
    async mapPage() {
        return this.mapHeaderFooter();
    }
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeaderFooterMapper;
} else {
    window.HeaderFooterMapper = HeaderFooterMapper;
}
