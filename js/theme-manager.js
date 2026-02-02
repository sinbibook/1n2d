/**
 * Theme Manager - 어드민에서 선택한 폰트와 색상을 동적으로 적용
 */
class ThemeManager {
    constructor() {
        this.defaultFonts = {
            koMain: "'Aritaburi', sans-serif",
            koSub: "'Aritaburi', sans-serif",
            enMain: "'Amandine', serif"
        };

        this.defaultColors = {
            primary: '#fdfcf4',
            secondary: '#31423d'
        };
    }

    /**
     * CDN URL로 폰트 로드 (link 태그)
     */
    loadFontFromCdn(key, cdnUrl) {
        if (!cdnUrl || !key) return;

        const linkId = `font-cdn-${key}`;

        // 이미 로드된 폰트는 스킵
        let existingLink = document.getElementById(linkId);
        if (existingLink) {
            existingLink.href = cdnUrl; // URL 업데이트
            return;
        }

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

        // 이미 로드된 폰트는 업데이트
        let existingStyle = document.getElementById(styleId);
        if (existingStyle) {
            existingStyle.textContent = `
                @font-face {
                    font-family: '${family}';
                    src: url('${woff2Url}') format('woff2');
                    font-weight: normal;
                    font-style: normal;
                    font-display: swap;
                }`;
            return;
        }

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @font-face {
                font-family: '${family}';
                src: url('${woff2Url}') format('woff2');
                font-weight: normal;
                font-style: normal;
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
            // cdn이 있으면 link 태그로 로드
            if (fontValue.cdn) {
                this.loadFontFromCdn(fontValue.key, fontValue.cdn);
            }
            // woff2가 있으면 @font-face로 로드
            else if (fontValue.woff2) {
                this.loadFontFromWoff2(fontValue.key, fontValue.family, fontValue.woff2);
            }

            // CSS 변수 설정
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

        // 유효한 색상값인지 검증
        if (colorValue && this.isValidColor(colorValue)) {
            root.style.setProperty(cssVar, colorValue);
        } else {
            root.style.setProperty(cssVar, defaultValue);
        }
    }

    /**
     * 색상값 유효성 검증
     */
    isValidColor(color) {
        // HEX 색상 검증
        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
            return true;
        }

        // RGB/RGBA 색상 검증
        if (/^rgba?\(/.test(color)) {
            return true;
        }

        // CSS 색상명 검증 (선택적)
        const cssColors = ['white', 'black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple'];
        if (cssColors.includes(color.toLowerCase())) {
            return true;
        }

        return false;
    }

    /**
     * 테마 CSS 변수 일괄 적용
     */
    applyTheme(theme) {
        if (!theme) return;

        // 폰트 적용
        if (theme.font || theme.fonts) {
            const fontData = theme.font || theme.fonts;

            if ('koMain' in fontData) {
                this.applyFont(fontData.koMain, '--font-ko-main', this.defaultFonts.koMain);
            }
            if ('koSub' in fontData) {
                this.applyFont(fontData.koSub, '--font-ko-sub', this.defaultFonts.koSub);
            }
            if ('enMain' in fontData) {
                this.applyFont(fontData.enMain, '--font-en-main', this.defaultFonts.enMain);
            }
        }

        // 색상 적용
        if (theme.color || theme.colors) {
            const colorData = theme.color || theme.colors;

            if (!colorData) {
                // color가 null이면 전체 기본값으로 리셋
                this.resetColors();
            } else {
                if ('primary' in colorData) {
                    this.applyColor(colorData.primary, '--color-primary', this.defaultColors.primary);
                }
                if ('secondary' in colorData) {
                    this.applyColor(colorData.secondary, '--color-secondary', this.defaultColors.secondary);
                }
            }
        }
    }

    /**
     * 색상 초기화
     */
    resetColors() {
        this.applyColor(null, '--color-primary', this.defaultColors.primary);
        this.applyColor(null, '--color-secondary', this.defaultColors.secondary);
    }

    /**
     * 폰트 초기화
     */
    resetFonts() {
        this.applyFont(null, '--font-ko-main', this.defaultFonts.koMain);
        this.applyFont(null, '--font-ko-sub', this.defaultFonts.koSub);
        this.applyFont(null, '--font-en-main', this.defaultFonts.enMain);
    }

    /**
     * 전체 테마 초기화
     */
    resetTheme() {
        this.resetFonts();
        this.resetColors();
    }

    /**
     * 현재 적용된 테마 가져오기
     */
    getCurrentTheme() {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);

        return {
            fonts: {
                koMain: computedStyle.getPropertyValue('--font-ko-main').trim(),
                koSub: computedStyle.getPropertyValue('--font-ko-sub').trim(),
                enMain: computedStyle.getPropertyValue('--font-en-main').trim()
            },
            colors: {
                primary: computedStyle.getPropertyValue('--color-primary').trim(),
                secondary: computedStyle.getPropertyValue('--color-secondary').trim()
            }
        };
    }
}

// 전역 인스턴스 생성
window.themeManager = new ThemeManager();

// postMessage 리스너 (어드민 통신용)
if (window.parent !== window) {
    window.addEventListener('message', (event) => {
        // 보안을 위한 origin 체크
        const allowedOrigins = [
            'http://localhost',
            'https://localhost',
            'https://admin.sinbibook.com',
            'https://admin.sinbibook.xyz'
        ];

        const isAllowed = allowedOrigins.some(origin =>
            event.origin.startsWith(origin) || event.origin === window.location.origin
        );

        if (!isAllowed) return;

        // 테마 업데이트 처리
        if (event.data && event.data.type === 'THEME_UPDATE') {
            window.themeManager.applyTheme(event.data.data);
        }
    });
}