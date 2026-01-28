/**
 * Base Data Mapper Class
 * 모든 페이지별 매퍼의 기반이 되는 클래스
 * 공통 기능과 유틸리티 메소드들을 제공
 */
class BaseDataMapper {
    constructor() {
        this.data = null;
        this.isDataLoaded = false;
        this.animationObserver = null;
    }

    // ============================================================================
    // 🔧 CORE UTILITIES
    // ============================================================================

    /**
     * 데이터 설정
     */
    setData(data) {
        this.data = data;
        this.isDataLoaded = !!data;
    }

    /**
     * 시간 포맷팅 함수 (HH:MM:SS -> HH:MM)
     */
    formatTime(timeString) {
        if (!timeString) return null;
        const timeParts = timeString.split(':');
        if (timeParts.length >= 2) {
            return `${timeParts[0]}:${timeParts[1]}`;
        }
        return timeString;
    }

    /**
     * 데이터 안전 접근 헬퍼
     */
    safeGet(obj, path, defaultValue = null) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : defaultValue;
        }, obj);
    }

    /**
     * 빈 값 체크 헬퍼 (private)
     */
    _isEmptyValue(value) {
        return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
    }

    /**
     * 텍스트 정제 헬퍼 (customFields 우선, fallback 지원)
     */
    sanitizeText(text, fallback = '') {
        if (this._isEmptyValue(text)) return fallback;
        return text.trim();
    }

    /**
     * DOM 요소 안전 선택
     */
    safeSelect(selector) {
        try {
            return document.querySelector(selector);
        } catch (error) {
            return null;
        }
    }

    /**
     * 여러 DOM 요소 안전 선택
     */
    safeSelectAll(selector) {
        try {
            return document.querySelectorAll(selector);
        } catch (error) {
            return [];
        }
    }

    /**
     * Favicon 업데이트 공통 메서드
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

    // ============================================================================
    // 🖼️ IMAGE UTILITIES
    // ============================================================================

    /**
     * Feature 코드에 따른 고품질 이미지 URL 반환
     */
    getFeatureImage(code) {
        const imageMap = {
            'WIFI': 'https://images.unsplash.com/photo-1606868306217-dbf5046868d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aWZpJTIwY29ubmVjdGlvbiUyMG1vZGVybnxlbnwwfHx8fDE3NTUwNjU4OTh8MA&ixlib=rb-4.1.0&q=80&w=800',
            'LAUNDRY': 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXVuZHJ5JTIwZmFjaWxpdHklMjBtb2Rlcm58ZW58MHx8fHwxNzU1MDY1ODk4fDA&ixlib=rb-4.1.0&q=80&w=800',
            'KITCHEN': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwbW9kZXJuJTIwZGVzaWduJTIwcGVuc2lvbnxlbnwwfHx8fDE3NTUwNjU4OTh8MA&ixlib=rb-4.1.0&q=80&w=800',
            'BARBECUE': 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZWN1ZSUyMGdyaWxsJTIwb3V0ZG9vciUyMGdyaWxsaW5nfGVufDB8fHx8MTc1NTA2NTg5OHww&ixlib=rb-4.1.0&q=80&w=800',
            'SPA': 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGElMjByZWxheCUyMGx1eHVyeSUyMHdlbGxuZXNzfGVufDB8fHx8MTc1NTA2NTg5OHww&ixlib=rb-4.1.0&q=80&w=800'
        };
        return imageMap[code] || null;
    }

    /**
     * 편의시설별 설명 반환
     */
    getAmenityDescription(code) {
        const descriptions = {
            'WIFI': '고속 무선 인터넷 서비스',
            'LAUNDRY': '24시간 이용 가능한 세탁 서비스',
            'KITCHEN': '완비된 주방 시설',
            'BARBECUE': '야외 바베큐 그릴',
            'SPA': '힐링과 휴식을 위한 스파 시설'
        };
        return descriptions[code] || '';
    }

    /**
     * 선택된 이미지만 필터링하고 정렬하는 공통 헬퍼 메서드
     * @param {Array} images - 이미지 배열
     * @param {string} [category] - 필터링할 카테고리 (선택적)
     * @returns {Array} 선택되고 정렬된 이미지 배열
     * @private
     */
    _getSelectedAndSortedImages(images, category = null) {
        if (!Array.isArray(images)) return [];
        return images
            .filter(img => img.isSelected && (category === null || img.category === category))
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }

    /**
     * HTML 특수 문자를 이스케이프 처리하는 헬퍼 메서드 (XSS 방지)
     * @private
     */
    _escapeHTML(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
        return text.replace(/[&<>"'\/]/g, (char) => map[char]);
    }

    /**
     * 텍스트의 줄바꿈을 HTML <br> 태그로 변환하는 헬퍼 메서드 (XSS 안전)
     * @private
     */
    _formatTextWithLineBreaks(text) {
        if (this._isEmptyValue(text)) return '';
        const trimmedText = text.trim();
        const escapedText = this._escapeHTML(trimmedText);
        return escapedText.replace(/\n/g, '<br>');
    }

    // ============================================================================
    // 🏠 CUSTOMFIELDS HELPERS (Property & Room)
    // ============================================================================

    /**
     * 숙소 이름 가져오기 (customFields 우선, 없으면 기본값)
     * @returns {string} 숙소 이름
     */
    getPropertyName() {
        const customName = this.safeGet(this.data, 'homepage.customFields.property.name');
        return this.sanitizeText(customName, this.safeGet(this.data, 'property.name') || '숙소명');
    }

    /**
     * 숙소 영문명 가져오기 (customFields 우선, 없으면 기본값)
     * @returns {string} 숙소 영문명
     */
    getPropertyNameEn() {
        const customNameEn = this.safeGet(this.data, 'homepage.customFields.property.nameEn');
        return this.sanitizeText(customNameEn, this.safeGet(this.data, 'property.nameEn') || 'PROPERTY NAME');
    }

    /**
     * 숙소 이미지 가져오기 (customFields의 카테고리별 이미지)
     * @param {string} imageCategory - 이미지 카테고리 (property_exterior, property_interior, property_thumbnail 등)
     * @returns {Array} 정렬된 이미지 배열
     */
    getPropertyImages(imageCategory) {
        const customImages = this.safeGet(this.data, 'homepage.customFields.property.images') || [];
        return this._getSelectedAndSortedImages(customImages, imageCategory);
    }

    /**
     * 객실 customFields 가져오기
     * @param {string} roomId - 객실 ID
     * @returns {Object|null} 객실 customFields 데이터
     */
    getRoomTypeCustomFields(roomId) {
        const roomtypes = this.safeGet(this.data, 'homepage.customFields.roomtypes') || [];
        return roomtypes.find(rt => rt.id === roomId) || null;
    }

    /**
     * 객실 이름 가져오기 (customFields 우선, 없으면 기본값)
     * @param {Object} room - 객실 데이터
     * @returns {string} 객실 이름
     */
    getRoomName(room) {
        const customFields = this.getRoomTypeCustomFields(room.id);
        return this.sanitizeText(customFields?.name, room.name || '객실명');
    }

    /**
     * 객실 영문명 가져오기 (customFields 우선, 없으면 기본값)
     * @param {Object} room - 객실 데이터
     * @returns {string} 객실 영문명
     */
    getRoomNameEn(room) {
        const customFields = this.getRoomTypeCustomFields(room.id);
        return this.sanitizeText(customFields?.nameEn, room.nameEn || 'ROOM NAME');
    }

    /**
     * 객실 이미지 가져오기 (customFields의 카테고리별 이미지)
     * @param {Object} room - 객실 데이터
     * @param {string} imageCategory - 이미지 카테고리 (roomtype_interior, roomtype_exterior, roomtype_thumbnail)
     * @returns {Array} 정렬된 이미지 배열
     */
    getRoomImages(room, imageCategory) {
        const customFields = this.getRoomTypeCustomFields(room.id);
        const customImages = customFields?.images || [];
        return this._getSelectedAndSortedImages(customImages, imageCategory);
    }

    // ============================================================================
    // 🎨 ANIMATION UTILITIES
    // ============================================================================

    /**
     * 스크롤 애니메이션 재초기화
     */
    reinitializeScrollAnimations() {
        if (this.animationObserver) {
            this.animationObserver.disconnect();
        }

        if (window.initScrollAnimations) {
            window.initScrollAnimations();
        } else {
            this.initDefaultScrollAnimations();
        }
    }

    /**
     * 기본 스크롤 애니메이션 초기화
     */
    initDefaultScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        this.animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (entry.target.classList.contains('gallery-item')) {
                        const galleryItems = Array.from(entry.target.parentElement.children);
                        const index = galleryItems.indexOf(entry.target);
                        const delays = [0, 0.2, 0.4, 0.6];

                        setTimeout(() => {
                            entry.target.classList.add('animate');
                        }, (delays[index] || 0) * 1000);
                    } else {
                        entry.target.classList.add('animate');
                    }
                }
            });
        }, observerOptions);

        // 애니메이션 가능한 요소들 관찰 시작
        this.safeSelectAll('.fade-in-up, .fade-in-scale, .gallery-item, .signature-item').forEach(el => {
            this.animationObserver.observe(el);
        });
    }

    // ============================================================================
    // 🏢 BUSINESS INFO UTILITIES
    // ============================================================================

    /**
     * E-commerce registration 매핑
     */
    mapEcommerceRegistration() {
        if (!this.isDataLoaded) return;

        const ecommerceNumber = this.safeGet(this.data, 'property.businessInfo.eCommerceRegistrationNumber');

        if (!ecommerceNumber) return;

        // 통신판매업신고번호 매핑
        const ecommerceElement = this.safeSelect('.ecommerce-registration');
        if (ecommerceElement) {
            ecommerceElement.textContent = `통신판매업신고번호 : ${ecommerceNumber}`;
        }
    }

    // ============================================================================
    // 📝 META & SEO UTILITIES
    // ============================================================================

    /**
     * 메타 태그 업데이트
     */
    updateMetaTags(property) {
        if (!property) return;

        // customFields 헬퍼를 통해 숙소명 가져오기
        const builderPropertyName = this.getPropertyName();

        // 타이틀 업데이트
        const title = this.safeSelect('title');
        if (title && property.subtitle) {
            title.textContent = `${builderPropertyName} - ${property.subtitle}`;
        }

        // 메타 description 업데이트
        const metaDescription = this.safeSelect('meta[name="description"]');
        if (metaDescription && property.description) {
            metaDescription.setAttribute('content', property.description);
        }

        // 메타 keywords 업데이트
        const metaKeywords = this.safeSelect('meta[name="keywords"]');
        if (metaKeywords && property.city && property.province) {
            const keywords = [
                property.city.name + '펜션',
                property.province.name + '숙박',
                builderPropertyName,
                '감성펜션',
                '자연휴양지'
            ].join(', ');
            metaKeywords.setAttribute('content', keywords);
        }
    }

    /**
     * SEO 정보 업데이트
     */
    updateSEOInfo(seo) {
        if (!seo) return;

        if (seo.title) {
            const title = this.safeSelect('title');
            if (title) title.textContent = seo.title;
        }

        if (seo.description) {
            const metaDescription = this.safeSelect('meta[name="description"]');
            if (metaDescription) metaDescription.setAttribute('content', seo.description);
        }

        if (seo.keywords) {
            const metaKeywords = this.safeSelect('meta[name="keywords"]');
            if (metaKeywords) metaKeywords.setAttribute('content', seo.keywords);
        }
    }

    // ============================================================================
    // 🔄 TEMPLATE METHODS (서브클래스에서 구현)
    // ============================================================================

    /**
     * 페이지별 매핑 실행 (서브클래스에서 오버라이드)
     */
    async mapPage() {
        throw new Error('mapPage() method must be implemented by subclass');
    }

    /**
     * 페이지별 초기화 (서브클래스에서 오버라이드)
     * 데이터는 생성자에서 전달받으므로 별도 로딩 불필요
     */
    async initialize() {
        try {
            await this.mapPage();
        } catch (error) {
        }
    }

    // ============================================================================
    // 🧹 CLEANUP
    // ============================================================================

    /**
     * 리소스 정리
     */
    cleanup() {
        if (this.animationObserver) {
            this.animationObserver.disconnect();
            this.animationObserver = null;
        }
    }
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseDataMapper;
} else {
    window.BaseDataMapper = BaseDataMapper;
}