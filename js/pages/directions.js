/**
 * Directions Page Functionality
 * 오시는길 페이지 기능 (헤더/푸터 로딩 포함)
 */

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {

    // Load data mapper for content mapping
    setTimeout(() => {
        loadDataMapper();
    }, 100);
});


/**
 * Data mapper loader and initializer
 */
async function loadDataMapper() {
    // iframe 환경(어드민 미리보기)에서는 PreviewHandler가 초기화 담당
    if (window.APP_CONFIG && window.APP_CONFIG.isInIframe()) {
        return;
    }

    try {
        const dataPath = window.APP_CONFIG
            ? window.APP_CONFIG.getResourcePath('standard-template-data.json')
            : './standard-template-data.json';
        const response = await fetch(dataPath);
        const data = await response.json();

        window.dogFriendlyDataMapper = {
            data: data,
            isDataLoaded: true
        };

        const initMapper = () => {
            if (window.DirectionsMapper) {
                const mapper = new DirectionsMapper(data);
                mapper.mapPage();
            }
        };

        if (window.DirectionsMapper) {
            initMapper();
        } else {
            setTimeout(initMapper, 1000);
        }
    } catch (error) {
    }
}