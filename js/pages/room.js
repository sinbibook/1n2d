/**
 * Room Page Functionality
 * 객실 페이지 기능 (header-footer-loader.js 사용)
 */

document.addEventListener('DOMContentLoaded', () => {
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
            if (window.RoomMapper) {
                const mapper = new RoomMapper(data);
                mapper.mapPage();
            }
        };

        if (window.RoomMapper) {
            initMapper();
        } else {
            setTimeout(initMapper, 1000);
        }
    } catch (error) {
    }
}


