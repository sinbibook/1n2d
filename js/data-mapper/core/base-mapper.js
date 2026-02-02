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
     * URL 생성 헬퍼 (preview 쿼리스트링 자동 유지)
     * @param {string} page - 페이지 파일명 (예: 'room.html')
     * @param {Object} params - 추가 쿼리 파라미터 (예: { id: 'room-001' })
     * @returns {string} 완성된 URL
     */
    buildUrl(page, params = {}) {
        const urlParams = new URLSearchParams(window.location.search);
        const isPreview = urlParams.get('preview') === 'true';

        const queryParams = new URLSearchParams(params);
        if (isPreview) {
            queryParams.set('preview', 'true');
        }

        const queryString = queryParams.toString();
        return queryString ? `${page}?${queryString}` : page;
    }

    /**
     * 스네이크 케이스를 카멜 케이스로 변환
     * API 데이터(snake_case) → JavaScript 표준(camelCase)
     */
    convertToCamelCase(obj) {
        if (Array.isArray(obj)) {
            return obj.map(item => this.convertToCamelCase(item));
        } else if (obj !== null && typeof obj === 'object') {
            return Object.keys(obj).reduce((result, key) => {
                // 스네이크 케이스를 카멜 케이스로 변환
                const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
                result[camelKey] = this.convertToCamelCase(obj[key]);
                return result;
            }, {});
        }
        return obj;
    }

    /**
     * JSON 데이터 로드
     * URL에 ?preview=true가 있으면 preview-data.json, 없으면 standard-template-data.json 로드
     * 잘못된 쿼리스트링은 자동으로 제거
     */
    async loadData() {
        try {
            // URL 파라미터 확인
            const urlParams = new URLSearchParams(window.location.search);
            const previewValue = urlParams.get('preview');
            const isPreview = previewValue === 'true';

            // 잘못된 쿼리스트링 감지 시 index로 리다이렉트
            // 허용된 파라미터: preview (값이 true일 때만), id
            const allowedParams = ['preview', 'id'];
            const allParamsValid = Array.from(urlParams.keys()).every(key => {
                if (key === 'preview') return urlParams.get('preview') === 'true';
                if (key === 'id') return true;
                return false;
            });

            if (window.location.search && !allParamsValid) {
                // 루트로 리다이렉트
                window.location.href = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
                return;
            }

            // 데이터 파일 선택
            const dataFile = isPreview ? 'preview-data.json' : 'standard-template-data.json';

            // 캐시 방지를 위한 타임스탬프 추가
            const timestamp = new Date().getTime();
            const response = await fetch(`./${dataFile}?t=${timestamp}`);
            const rawData = await response.json();

            // 스네이크 케이스를 카멜 케이스로 자동 변환
            this.data = this.convertToCamelCase(rawData);
            this.isDataLoaded = true;
            return this.data;
        } catch (error) {
            console.error('Failed to load property data:', error);
            this.isDataLoaded = false;
            throw error;
        }
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
     * DOM 요소 안전 선택
     */
    safeSelect(selector) {
        try {
            return document.querySelector(selector);
        } catch (error) {
            console.warn(`Invalid selector: ${selector}`);
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
            console.warn(`Invalid selector: ${selector}`);
            return [];
        }
    }

    // ============================================================================
    // 📝 TEXT UTILITIES
    // ============================================================================

    /**
     * 값이 비어있는지 확인하는 헬퍼 메서드
     * @private
     * @param {any} value - 확인할 값
     * @returns {boolean} 비어있으면 true
     */
    _isEmptyValue(value) {
        return value === null || value === undefined || value === '';
    }

    /**
     * HTML 특수 문자를 이스케이프 처리하는 헬퍼 메서드 (XSS 방지)
     * @private
     * @param {string} text - 이스케이프할 텍스트
     * @returns {string} 이스케이프 처리된 텍스트
     */
    _escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 텍스트를 정제하는 헬퍼 메서드
     * 빈 값이면 fallback 반환, 아니면 trim된 값 반환
     * @param {string} text - 정제할 텍스트
     * @param {string} fallback - 빈 값일 때 반환할 기본값
     * @returns {string} 정제된 텍스트 또는 fallback
     */
    sanitizeText(text, fallback = '') {
        if (this._isEmptyValue(text)) return fallback;
        return text.trim();
    }

    /**
     * 텍스트의 줄바꿈을 HTML <br> 태그로 변환하는 헬퍼 메서드 (XSS 안전)
     * @private
     * @param {string} text - 변환할 텍스트
     * @param {string} fallback - 빈 값일 때 반환할 기본값
     * @returns {string} 줄바꿈이 <br>로 변환된 HTML 문자열
     */
    _formatTextWithLineBreaks(text, fallback = '') {
        if (this._isEmptyValue(text)) return fallback;
        // 앞뒤 공백 제거
        const trimmedText = text.trim();
        // 먼저 HTML 특수 문자를 이스케이프 처리한 후 줄바꿈 변환
        const escapedText = this._escapeHTML(trimmedText);
        return escapedText.replace(/\n/g, '<br>');
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
     * 메타 태그 업데이트 (homepage.seo + 페이지별 SEO 병합)
     * @param {Object} pageSEO - 페이지별 SEO 데이터 (선택사항, 전역 SEO보다 우선 적용)
     */
    updateMetaTags(pageSEO = null) {
        // homepage.seo 글로벌 SEO 데이터 적용
        const globalSEO = this.safeGet(this.data, 'homepage.seo') || {};
        // 전역 SEO와 페이지별 SEO를 병합합니다. 페이지별 설정이 우선됩니다.
        const finalSEO = { ...globalSEO, ...(pageSEO || {}) };
        if (Object.keys(finalSEO).length > 0) {
            this.updateSEOInfo(finalSEO);
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

            // OG Title도 같이 업데이트
            const ogTitle = this.safeSelect('meta[property="og:title"]');
            if (ogTitle) ogTitle.setAttribute('content', seo.title);
        }

        if (seo.description) {
            const metaDescription = this.safeSelect('meta[name="description"]');
            if (metaDescription) metaDescription.setAttribute('content', seo.description);

            // OG Description도 같이 업데이트
            const ogDescription = this.safeSelect('meta[property="og:description"]');
            if (ogDescription) ogDescription.setAttribute('content', seo.description);
        }

        if (seo.keywords) {
            const metaKeywords = this.safeSelect('meta[name="keywords"]');
            if (metaKeywords) metaKeywords.setAttribute('content', seo.keywords);
        }

        // OG URL은 현재 페이지 URL로 설정
        const ogUrl = this.safeSelect('meta[property="og:url"]');
        if (ogUrl) ogUrl.setAttribute('content', window.location.href);
    }

    /**
     * 기본 OG 이미지 가져오기 (로고 이미지 사용)
     */
    getDefaultOGImage() {
        if (!this.isDataLoaded) return null;

        const logoImages = this.safeGet(this.data, 'homepage.images.0.logo');
        if (logoImages && logoImages.length > 0 && logoImages[0]?.url) {
            return logoImages[0].url;
        }

        return null;
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
     */
    async initialize() {
        try {
            await this.loadData();
            await this.mapPage();
        } catch (error) {
            console.error('Failed to initialize mapper:', error);
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