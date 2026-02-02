/**
 * Preview Handler - 어드민에서 postMessage로 전송되는 데이터 수신 및 처리
 * 어드민 페이지와 iframe 템플릿 간의 실시간 연동을 담당
 */

// 중복 선언 방지
if (typeof window.PreviewHandler === 'undefined') {

class PreviewHandler {
    constructor() {
        this.currentData = null;
        this.isInitialized = false;
        this.adminDataReceived = false;  // 어드민 데이터 수신 여부
        this.fallbackTimeout = null;     // 백업 타이머
        this.parentOrigin = null;         // 신뢰할 수 있는 부모 창 origin
        this._baseMapper = null;          // Lazy initialization
        this.init();
    }

    /**
     * BaseDataMapper 인스턴스 가져오기 (Lazy initialization)
     */
    get baseMapper() {
        if (!this._baseMapper && window.BaseDataMapper) {
            this._baseMapper = new BaseDataMapper();
        }
        return this._baseMapper;
    }

    /**
     * API 데이터를 카멜 케이스로 변환 (중복 변환 방지)
     */
    convertData(data) {
        // BaseDataMapper가 없으면 원본 그대로 반환 (fallback)
        if (!this.baseMapper) {
            console.warn('BaseDataMapper not loaded, returning original data');
            return data;
        }
        return this.baseMapper.convertToCamelCase(data);
    }

    init() {
        // postMessage 리스너 등록
        window.addEventListener('message', (event) => {
            this.handleMessage(event);
        });

        // 부모 창에 준비 완료 신호 전송
        this.notifyReady();

        // 어드민 데이터 대기 (1초 후 fallback)
        this.fallbackTimeout = setTimeout(() => {
            if (!this.adminDataReceived) {
                this.loadFallbackData();
            }
        }, 1000);

    }

    /**
     * 부모 창(어드민)에 템플릿 준비 완료 신호 전송
     */
    notifyReady() {
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'TEMPLATE_READY',
                data: {
                    url: window.location.pathname,
                    timestamp: Date.now()
                }
            }, this.parentOrigin || '*');
        }
    }

    /**
     * 메시지 처리 메인 함수
     */
    handleMessage(event) {
        // 보안을 위해 origin 체크 (정확한 매칭)
        const allowedOrigins = [
            'localhost',              // 로컬 개발 환경
            'admin.sinbibook.com',    // 운영 환경
            'admin.sinbibook.xyz',    // 개발 환경
            'sinbibook.github.io',    // GitHub Pages
            'file://',                // 로컬 파일 시스템
            'null'                    // iframe null origin
        ];

        const isAllowedOrigin = allowedOrigins.some(allowed => {
            // 같은 origin은 항상 허용
            if (event.origin === window.location.origin) {
                return true;
            }

            // localhost는 포트 번호 포함하여 체크
            if (allowed === 'localhost') {
                return event.origin.startsWith('http://localhost:') ||
                       event.origin.startsWith('https://localhost:') ||
                       event.origin === 'http://localhost' ||
                       event.origin === 'https://localhost';
            }

            // file:// 와 null은 정확히 매칭
            if (allowed === 'file://' || allowed === 'null') {
                return event.origin === allowed;
            }

            // 도메인은 https 프로토콜과 정확히 매칭
            return event.origin === `https://${allowed}` ||
                   event.origin === `http://${allowed}`;
        });

        if (!isAllowedOrigin) {
            return;
        }

        // 신뢰할 수 있는 origin 저장 (첫 메시지 수신 시)
        if (!this.parentOrigin) {
            this.parentOrigin = event.origin;
        }

        // PostMessage 구조 확인
        if (!event.data || typeof event.data !== 'object') {
            return;
        }

        const { type, data } = event.data;

        switch (type) {
            case 'INITIAL_DATA':
                this.handleInitialData(data);
                break;
            case 'TEMPLATE_UPDATE':
                this.handleTemplateUpdate(data);
                break;
            case 'PROPERTY_CHANGE':
                this.handlePropertyChange(data);
                break;
            case 'PAGE_NAVIGATION':
                this.handlePageNavigation(event.data);
                break;
            case 'section_update':
                this.handleSectionUpdate(event.data);
                break;
            case 'THEME_UPDATE':
                this.handleThemeUpdate(data);
                break;
            case 'POPUP_UPDATE':
                this.handlePopupUpdate(data);
                break;
            default:
                break;
        }
    }

    /**
     * 초기 데이터 처리 (숙소 선택 + 템플릿 초기 설정)
     */
    async handleInitialData(data) {
        // API 데이터를 카멜 케이스로 변환해서 저장
        this.currentData = this.convertData(data);
        this.isInitialized = true;
        this.adminDataReceived = true;  // 어드민 데이터 수신됨

        // fallback 타이머 취소
        if (this.fallbackTimeout) {
            clearTimeout(this.fallbackTimeout);
            this.fallbackTimeout = null;
        }

        // 전체 템플릿 렌더링 (완료 대기) - 이미 변환된 데이터 사용
        await this.renderTemplate(this.currentData);

        // 부모 창에 렌더링 완료 신호
        this.notifyRenderComplete('INITIAL_RENDER_COMPLETE');
    }

    /**
     * 템플릿 설정 변경 처리 (실시간 업데이트)
     */
    async handleTemplateUpdate(data) {
        // 어드민 데이터 수신됨 표시
        this.adminDataReceived = true;

        // fallback 타이머 취소
        if (this.fallbackTimeout) {
            clearTimeout(this.fallbackTimeout);
            this.fallbackTimeout = null;
        }

        // theme 데이터가 있으면 CSS 변수 즉시 업데이트
        const theme = data?.homepage?.customFields?.theme || data?.theme;
        if (theme) {
            this.applyThemeVariables(theme);
        }

        // 초기화되지 않은 경우 초기 데이터로 처리
        if (!this.isInitialized) {
            await this.handleInitialData(data);
            return;
        }

        // 새로 들어온 데이터를 카멜 케이스로 변환
        const convertedData = this.convertData(data);

        // 기존 데이터와 병합
        if (convertedData.rooms && Array.isArray(convertedData.rooms)) {
            this.currentData = {
                ...this.currentData,
                rooms: [...convertedData.rooms]  // 완전히 새로운 배열로 교체
            };

            // 나머지 데이터는 병합
            const dataWithoutRooms = { ...convertedData };
            delete dataWithoutRooms.rooms;
            this.currentData = this.mergeData(this.currentData, dataWithoutRooms);
        } else {
            // 기존 데이터와 병합
            this.currentData = this.mergeData(this.currentData, convertedData);
        }

        // 전체 페이지 다시 렌더링 (완료 대기)
        await this.renderTemplate(this.currentData);

        // 팝업 데이터가 있으면 팝업도 업데이트
        const popupData = data?.homepage?.customFields?.popup;
        if (popupData && window.popupManager) {
            window.popupManager.updateFromTemplateData(data);
        }

        // 부모 창에 업데이트 완료 신호
        this.notifyRenderComplete('UPDATE_COMPLETE');
    }

    /**
     * 기본 폰트 fallback 값 (theme.css 기본값과 동일)
     */
    getDefaultFonts() {
        return {
            koMain: "'ReperepointSpecialItalic', sans-serif",
            koSub: "'Pretendard', sans-serif",
            enMain: "'Chonburi', sans-serif"
        };
    }

    /**
     * 기본 색상 fallback 값 (theme.css 기본값과 동일)
     */
    getDefaultColors() {
        return {
            primary: '#f5f5f5',
            secondary: '#1D3A5F'
        };
    }

    /**
     * CDN URL로 폰트 로드 (link 태그)
     */
    loadFontFromCdn(key, cdnUrl) {
        if (!cdnUrl || !key) return;

        const linkId = `font-cdn-${key}`;
        if (document.getElementById(linkId)) return;

        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = cdnUrl;
        document.head.appendChild(link);
    }

    /**
     * woff2 URL로 폰트 로드 (@font-face)
     */
    loadFontFromWoff2(key, family, woff2Url) {
        if (!woff2Url || !family) return;

        const styleId = `font-woff2-${key}`;
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
@font-face {
    font-family: '${family}';
    src: url('${woff2Url}') format('woff2');
    font-weight: 400;
    font-display: swap;
}`;
        document.head.appendChild(style);
    }

    /**
     * 단일 폰트 CSS 변수 적용
     */
    applyFont(fontValue, cssVar, defaultValue) {
        const root = document.documentElement;

        // fontValue가 유효한 객체인 경우
        if (fontValue && typeof fontValue === 'object' && fontValue.family) {
            // cdn이 있으면 link 태그, woff2만 있으면 style 태그
            if (fontValue.cdn) {
                this.loadFontFromCdn(fontValue.key, fontValue.cdn);
            } else if (fontValue.woff2) {
                this.loadFontFromWoff2(fontValue.key, fontValue.family, fontValue.woff2);
            }
            root.style.setProperty(cssVar, `'${fontValue.family}', sans-serif`);
            return;
        }

        // null/undefined인 경우 기본값으로 리셋
        root.style.setProperty(cssVar, defaultValue);
    }

    /**
     * 단일 색상 CSS 변수 적용
     */
    applyColor(colorValue, cssVar, defaultValue) {
        const root = document.documentElement;
        root.style.setProperty(cssVar, colorValue || defaultValue);
    }

    /**
     * 테마 CSS 변수 적용 (font/color)
     */
    applyThemeVariables(theme) {
        const defaultFonts = this.getDefaultFonts();
        const defaultColors = this.getDefaultColors();
        const fontData = theme.font || theme;

        // 폰트 변수 업데이트
        if (fontData) {
            if ('koMain' in fontData) this.applyFont(fontData.koMain, '--font-ko-main', defaultFonts.koMain);
            if ('koSub' in fontData) this.applyFont(fontData.koSub, '--font-ko-sub', defaultFonts.koSub);
            if ('enMain' in fontData) this.applyFont(fontData.enMain, '--font-en-main', defaultFonts.enMain);
        }

        // 색상 변수 업데이트
        if ('color' in theme) {
            if (!theme.color) {
                // color가 null이면 전체 기본값으로 리셋
                this.applyColor(null, '--color-primary', defaultColors.primary);
                this.applyColor(null, '--color-secondary', defaultColors.secondary);
            } else {
                if ('primary' in theme.color) this.applyColor(theme.color.primary, '--color-primary', defaultColors.primary);
                if ('secondary' in theme.color) this.applyColor(theme.color.secondary, '--color-secondary', defaultColors.secondary);
            }
        }
    }

    /**
     * 테마 업데이트 처리 (폰트/색상 실시간 변경)
     */
    handleThemeUpdate(data) {
        if (!data) return;
        this.applyThemeVariables(data);
        this.notifyRenderComplete('THEME_UPDATE_COMPLETE');
    }

    /**
     * 팝업 업데이트 처리
     */
    handlePopupUpdate(data) {
        if (window.popupManager) {
            window.popupManager.updateFromPreview(data);
        } else if (window.PopupManager) {
            window.popupManager = new PopupManager();
            window.popupManager.init().then(() => {
                window.popupManager.updateFromPreview(data);
            });
        }

        this.notifyRenderComplete('POPUP_UPDATE_COMPLETE');
    }

    /**
     * 숙소 변경 처리 (다른 숙소 선택)
     */
    async handlePropertyChange(data) {
        // API 데이터를 카멜 케이스로 변환해서 저장
        this.currentData = this.convertData(data);
        this.isInitialized = true;

        // 전체 다시 렌더링 (완료 대기) - 이미 변환된 데이터 사용
        await this.renderTemplate(this.currentData);

        this.notifyRenderComplete('PROPERTY_CHANGE_COMPLETE');
    }

    /**
     * 페이지 네비게이션 처리 (라우팅)
     */
    handlePageNavigation(messageData) {
        if (!messageData || !messageData.page) {
            return;
        }

        const pageMap = {
            'index': 'index.html',
            'main': 'main.html',
            'room': 'room.html',
            'facility': 'facility.html',
            'reservation': 'reservation.html',
            'directions': 'directions.html'
        };

        const targetPage = pageMap[messageData.page];

        if (!targetPage) {
            return;
        }

        // 현재 페이지와 동일하고 동일한 ID이면 리로드하지 않음
        const currentPage = this.getCurrentPageType();
        const urlParams = new URLSearchParams(window.location.search);
        const currentId = urlParams.get('id');

        const isSamePage = currentPage === messageData.page;
        const newId = messageData.roomId || messageData.facilityId || null;
        const isSameId = currentId === newId;

        if (isSamePage && isSameId) {
            return;
        }

        // 페이지 이동 전에 부모 창에 네비게이션 시작 알림
        this.notifyNavigationStart(messageData.page);

        // 페이지 이동 (현재 디렉토리 기준)
        const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        let newPath = `${basePath}${targetPage}`;

        // 현재 URL의 preview 파라미터 확인
        const currentParams = new URLSearchParams(window.location.search);
        const isPreview = currentParams.get('preview');

        // room 또는 facility 페이지인 경우 id 쿼리 파라미터 추가
        if (messageData.page === 'room' && messageData.roomId) {
            newPath += `?id=${encodeURIComponent(messageData.roomId)}`;
            if (isPreview) newPath += `&preview=${isPreview}`;
        } else if (messageData.page === 'facility' && messageData.facilityId) {
            newPath += `?id=${encodeURIComponent(messageData.facilityId)}`;
            if (isPreview) newPath += `&preview=${isPreview}`;
        } else if (isPreview) {
            newPath += `?preview=${isPreview}`;
        }

        window.location.href = newPath;
    }

    /**
     * 네비게이션 시작 알림
     */
    notifyNavigationStart(page) {
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'NAVIGATION_START',
                data: {
                    page: page,
                    timestamp: Date.now()
                }
            }, this.parentOrigin || '*');
        }
    }

    /**
     * 전체 템플릿 렌더링 (초기 로드 또는 숙소 변경 시)
     */
    async renderTemplate(data) {
        const currentPage = this.getCurrentPageType();
        let mapper = null;

        // 현재 페이지에 맞는 매퍼 선택
        switch (currentPage) {
            case 'index':
                if (window.IndexMapper) {
                    mapper = new IndexMapper();
                }
                break;
            case 'main':
                if (window.MainMapper) {
                    mapper = new MainMapper();
                }
                break;
            case 'room':
                if (window.RoomMapper) {
                    mapper = new RoomMapper();
                }
                break;
            case 'facility':
                if (window.FacilityMapper) {
                    mapper = new FacilityMapper();
                }
                break;
            case 'reservation':
                if (window.ReservationMapper) {
                    mapper = new ReservationMapper();
                }
                break;
            case 'directions':
                if (window.DirectionsMapper) {
                    mapper = new DirectionsMapper();
                }
                break;
            default:
                return;
        }

        if (mapper) {
            // 이미 변환된 데이터 주입 (handleInitialData/handlePropertyChange에서 변환됨)
            mapper.data = data;
            mapper.isDataLoaded = true;

            // 기존 매핑 로직 실행 (완료 대기)
            await mapper.mapPage();

            // mapPage 완료 후 슬라이더는 이미 초기화되어 있음
            // (IndexMapper.mapPage 내부에서 _reinitializeHeroSlider 호출)
        }

        // Header & Footer 매핑 (모든 페이지에서 공통 실행)
        // 헤더 DOM이 로드될 때까지 대기
        await this.waitForHeaderDOM();

        if (window.HeaderFooterMapper) {
            const headerFooterMapper = new window.HeaderFooterMapper();
            // 이미 변환된 데이터 사용
            headerFooterMapper.data = data;
            headerFooterMapper.isDataLoaded = true;
            await headerFooterMapper.mapHeaderFooter();

            // 매핑 완료 후 헤더 표시 (FOUC 방지)
            if (window.showHeaders) window.showHeaders();
        }

        // Logo 매핑 (모든 페이지에서 공통 실행)
        const logoElement = document.querySelector('[data-logo]');
        const logoTextElement = document.querySelector('[data-logo-text]');

        if (logoElement && data?.template?.logo) {
            logoElement.src = data.template.logo;
        }

        if (logoTextElement && data?.template?.logoText) {
            logoTextElement.textContent = data.template.logoText;
        }
    }


    /**
     * 헤더 DOM이 로드될 때까지 대기
     */
    async waitForHeaderDOM() {
        const maxWaitTime = 5000; // 최대 5초 대기
        const checkInterval = 50; // 50ms마다 체크
        let waitedTime = 0;

        return new Promise((resolve) => {
            const checkHeader = () => {
                const headerContainer = document.getElementById('header-container');

                if (headerContainer) {
                    // 헤더 컨테이너 존재
                    resolve();
                } else if (waitedTime >= maxWaitTime) {
                    // 타임아웃 - 헤더 없이 진행
                    resolve();
                } else {
                    // 계속 대기
                    waitedTime += checkInterval;
                    setTimeout(checkHeader, checkInterval);
                }
            };

            checkHeader();
        });
    }

    /**
     * 데이터 구조 초기화 헬퍼 함수
     */
    ensureDataStructure() {
        if (!this.currentData.homepage) this.currentData.homepage = {};
        if (!this.currentData.homepage.customFields) this.currentData.homepage.customFields = {};
        if (!this.currentData.homepage.customFields.pages) this.currentData.homepage.customFields.pages = {};
    }

    /**
     * 엔티티 페이지(room/facility) 섹션 데이터 업데이트
     */
    updateEntityPageSection(page, section, data) {
        const urlParams = new URLSearchParams(window.location.search);
        const entityId = urlParams.get('id');

        if (!entityId) {
            return false;
        }

        if (!this.currentData.homepage.customFields.pages[page]) {
            this.currentData.homepage.customFields.pages[page] = [];
        }

        let pageDataIndex = this.currentData.homepage.customFields.pages[page].findIndex(p => p.id === entityId);

        if (pageDataIndex === -1) {
            this.currentData.homepage.customFields.pages[page].push({
                id: entityId,
                sections: [{}]
            });
            pageDataIndex = this.currentData.homepage.customFields.pages[page].length - 1;
        }

        if (!this.currentData.homepage.customFields.pages[page][pageDataIndex].sections) {
            this.currentData.homepage.customFields.pages[page][pageDataIndex].sections = [{}];
        }

        this.currentData.homepage.customFields.pages[page][pageDataIndex].sections[0][section] = data;
        return true;
    }

    /**
     * 일반 페이지 섹션 데이터 업데이트
     */
    updateRegularPageSection(page, section, data) {
        if (!this.currentData.homepage.customFields.pages[page]) {
            this.currentData.homepage.customFields.pages[page] = {};
        }
        if (!this.currentData.homepage.customFields.pages[page].sections) {
            this.currentData.homepage.customFields.pages[page].sections = [{}];
        }

        this.currentData.homepage.customFields.pages[page].sections[0][section] = data;
    }

    /**
     * 섹션별 업데이트 처리 (새로운 구조)
     */
    handleSectionUpdate(messageData) {
        const { page, section, data } = messageData;

        // logo 섹션 특별 처리 (모든 페이지 공통)
        if (section === 'logo') {
            if (!this.currentData.homepage) this.currentData.homepage = {};
            if (!this.currentData.homepage.images) this.currentData.homepage.images = [{}];

            this.currentData.homepage.images[0].logo = data.images || [];

            this.updateSpecificSection(page, section);
            this.notifyRenderComplete('SECTION_UPDATE_COMPLETE');
            return;
        }

        // 지원하는 페이지 확인
        const supportedPages = ['index', 'main', 'room', 'facility', 'reservation', 'directions'];
        if (!supportedPages.includes(page)) {
            return;
        }

        // 데이터 구조 초기화
        this.ensureDataStructure();

        // room/facility는 배열 구조, 나머지는 객체 구조
        const isEntityPage = page === 'room' || page === 'facility';

        if (isEntityPage) {
            if (!this.updateEntityPageSection(page, section, data)) {
                return;
            }
        } else {
            this.updateRegularPageSection(page, section, data);
        }

        // 섹션별 업데이트 실행
        this.updateSpecificSection(page, section);

        // 부모 창에 업데이트 완료 신호
        this.notifyRenderComplete('SECTION_UPDATE_COMPLETE');
    }

    /**
     * 특정 섹션만 업데이트
     */
    updateSpecificSection(page, section) {
        // Header/Footer 관련 섹션 (모든 페이지 공통)
        if (section === 'logo' && window.HeaderFooterMapper) {
            const mapper = this.createMapper(HeaderFooterMapper);
            mapper.mapHeaderLogo();
            mapper.mapFooterInfo();
            return;
        }

        if (page === 'index' && window.IndexMapper) {
            const mapper = this.createMapper(IndexMapper);

            switch (section) {
                case 'hero':
                    mapper.mapHeroSection();
                    break;
                case 'essence':
                    mapper.mapEssenceSection();
                    break;
                case 'gallery':
                    mapper.mapGallerySection();
                    break;
                case 'signature':
                    mapper.mapSignatureSection();
                    break;
                case 'closing':
                    mapper.mapClosingSection();
                    break;
            }
        } else if (page === 'main') {
            if (window.MainMapper) {
                const mapper = this.createMapper(MainMapper);

                switch (section) {
                    case 'hero':
                        mapper.mapHeroSlider();
                        break;
                    case 'about':
                        mapper.mapAboutSection();
                        mapper.mapIntroductionSection();
                        break;
                }
            }
        } else if (page === 'room') {
            if (window.RoomMapper) {
                const mapper = this.createMapper(RoomMapper);

                switch (section) {
                    case 'hero':
                        mapper.mapBasicInfo();
                        break;
                    case 'gallery':
                        mapper.mapGallerySection();
                        break;
                }
            }
        } else if (page === 'facility') {
            if (window.FacilityMapper) {
                const mapper = this.createMapper(FacilityMapper);
                mapper.mapBasicInfo();
            }
        } else if (page === 'reservation') {
            if (window.ReservationMapper) {
                const mapper = this.createMapper(ReservationMapper);
                mapper.mapPage();
            }
        } else if (page === 'directions') {
            if (window.DirectionsMapper) {
                const mapper = this.createMapper(DirectionsMapper);

                switch (section) {
                    case 'hero':
                        mapper.mapSliderSection();
                        mapper.mapLocationInfo();
                        break;
                    default:
                        mapper.mapPage();
                        break;
                }
            }
        }
    }





    /**
     * Mapper 생성 및 초기화 Helper
     */
    createMapper(MapperClass) {
        const mapper = new MapperClass();
        // currentData는 이미 변환된 상태 (handleInitialData/handlePropertyChange에서 변환)
        mapper.data = this.currentData;
        mapper.isDataLoaded = true;
        return mapper;
    }



    /**
     * 현재 페이지 타입 감지
     */
    getCurrentPageType() {
        const path = window.location.pathname;

        if (path.includes('index.html') || path.endsWith('/') || path === '') return 'index';
        if (path.includes('main.html')) return 'main';
        if (path.includes('room.html')) return 'room';
        if (path.includes('facility.html')) return 'facility';
        if (path.includes('reservation.html')) return 'reservation';
        if (path.includes('directions.html')) return 'directions';

        // 루트 경로 또는 기본값으로 index 처리
        return 'index';
    }



    /**
     * 데이터 병합 (깊은 병합)
     */
    mergeData(existing, updates) {
        return this.deepMerge(existing || {}, updates || {});
    }

    /**
     * 깊은 객체 병합 헬퍼
     */
    deepMerge(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source[key] === null || source[key] === undefined) {
                // null이나 undefined는 그대로 설정
                result[key] = source[key];
            } else if (Array.isArray(source[key])) {
                // 배열은 완전히 대체 (병합하지 않음)
                result[key] = [...source[key]];
            } else if (typeof source[key] === 'object') {
                // 객체는 깊은 병합
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                // 원시값은 그대로 대체
                result[key] = source[key];
            }
        }

        return result;
    }


    /**
     * 렌더링 완료 신호 전송
     */
    notifyRenderComplete(type) {
        if (window.parent !== window) {
            window.parent.postMessage({
                type: type,
                data: {
                    timestamp: Date.now(),
                    page: this.getCurrentPageType()
                }
            }, this.parentOrigin || '*');
        }

    }


    /**
     * 현재 데이터 반환 (디버깅용)
     */
    getCurrentData() {
        return this.currentData;
    }

    /**
     * 어드민 데이터 수신 실패 시 기본 JSON 데이터 로드
     */
    async loadFallbackData() {
        const currentPage = this.getCurrentPageType();

        const mapperConfig = {
            'index': 'IndexMapper',
            'main': 'MainMapper',
            'room': 'RoomMapper',
            'facility': 'FacilityMapper',
            'reservation': 'ReservationMapper',
            'directions': 'DirectionsMapper'
        };

        const mapperClass = mapperConfig[currentPage];
        if (mapperClass && window[mapperClass]) {
            const mapper = new window[mapperClass]();
            await mapper.initialize(); // 데이터 로드 후 매핑
        }

        // Header & Footer도 기본 JSON으로 로드
        if (window.HeaderFooterMapper) {
            const headerFooterMapper = new HeaderFooterMapper();
            await headerFooterMapper.initialize(); // 데이터 로드 후 매핑

            // 매핑 완료 후 헤더 표시 (FOUC 방지)
            if (window.showHeaders) window.showHeaders();
        }
    }
}

// 전역 인스턴스 생성 (iframe 내부일 때만 - 어드민 미리보기)
if (!window.previewHandler && window.parent !== window) {
    window.previewHandler = new PreviewHandler();
}

// ES6 모듈 지원
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PreviewHandler;
}

} // PreviewHandler 중복 선언 방지 끝
