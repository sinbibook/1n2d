/**
 * Popup Manager
 * 홈페이지 팝업 기능 관리
 * - standard-template-data.json에서 팝업 데이터 로드
 * - 미리보기 모드에서 postMessage로 실시간 업데이트
 */

// 중복 선언 방지
if (typeof window.PopupManager === 'undefined') {

class PopupManager {
    constructor() {
        this.popups = [];
        this.currentIndex = 0;
        this.container = null;
        this.isPreviewMode = false;
        this.isInitialized = false;
        this._baseMapper = window.BaseMapper ? new BaseMapper() : null;
        this.sliderIndex = 0; // 슬라이더 현재 인덱스
        this.autoPlayTimer = null; // 자동 슬라이드 타이머
        this.autoPlayInterval = 5000; // 자동 슬라이드 간격 (5초)
        this._slides = null; // 슬라이드 DOM 캐시
        this._dots = null; // 도트 DOM 캐시
    }

    /**
     * 초기화
     */
    async init() {
        // 이미 초기화된 경우 스킵
        if (this.isInitialized) return;
        this.isInitialized = true;

        // 팝업 컨테이너 가져오기 또는 생성
        this.container = document.getElementById('popup-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'popup-container';
            document.body.appendChild(this.container);
        }

        // 미리보기 모드 감지 (iframe 내부인 경우)
        this.isPreviewMode = window.parent !== window;

        // 메인 페이지에서만 실행 (미리보기 모드에서는 항상 실행)
        if (!this.isPreviewMode && !this.isMainPage()) {
            return;
        }

        // 미리보기 모드가 아닌 경우에만 JSON에서 데이터 로드
        if (!this.isPreviewMode) {
            await this.loadPopupData();
        }
    }

    /**
     * 메인 페이지 여부 확인
     */
    isMainPage() {
        const path = window.location.pathname;
        return path.endsWith('/') || path.endsWith('/index.html');
    }

    /**
     * standard-template-data.json에서 팝업 데이터 로드
     */
    async loadPopupData() {
        try {
            const response = await fetch('./standard-template-data.json');
            if (!response.ok) {
                return;
            }

            const data = await response.json();
            const popupData = data?.homepage?.customFields?.popup?.popups || [];

            this.processPopups(popupData);
        } catch (error) {
            // 팝업 데이터 로드 실패 시 조용히 무시
        }
    }

    /**
     * 팝업 데이터 처리 및 표시
     */
    processPopups(popupData) {
        if (!Array.isArray(popupData)) {
            this.popups = [];
            return;
        }

        // 오늘 날짜 캐싱 (필터링에서 재사용)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // 활성화된 팝업만 필터링하고 정렬
        this.popups = popupData
            .filter(p => {
                // enabled: true인 팝업만
                if (!p.enabled) return false;

                // 표시 기간 체크
                if (!this.isWithinDisplayPeriod(p, today)) return false;

                // 미리보기 모드가 아닌 경우에만 오늘 숨김 체크
                if (!this.isPreviewMode && this.isHiddenToday(p.id)) return false;

                // 이미지가 있는 팝업만 (images 배열에서 isSelected: true인 것)
                const selectedImage = this.getSelectedImage(p);
                if (!selectedImage) return false;

                return true;
            })
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        // 팝업이 있으면 첫 번째 팝업 표시
        this.currentIndex = 0;
        if (this.popups.length > 0) {
            this.show();
        } else {
            this.hide();
        }
    }

    /**
     * 팝업에서 선택된 이미지 가져오기
     */
    getSelectedImage(popup) {
        if (!popup.images || !Array.isArray(popup.images)) {
            return null;
        }

        // isSelected: true인 이미지 찾기
        const selected = popup.images.find(img => img.isSelected === true);
        if (selected && selected.url) {
            return selected.url;
        }

        // 선택된 이미지가 없으면 첫 번째 이미지 사용
        if (popup.images.length > 0 && popup.images[0].url) {
            return popup.images[0].url;
        }

        return null;
    }

    /**
     * 표시 기간 내인지 확인
     */
    isWithinDisplayPeriod(popup, today) {
        // startDate가 있고 아직 시작 안됨
        if (popup.startDate) {
            const start = new Date(popup.startDate);
            const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
            if (today < startDay) return false;
        }

        // endDate가 있고 이미 종료됨
        if (popup.endDate) {
            const end = new Date(popup.endDate);
            const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
            if (today > endDay) return false;
        }

        return true;
    }

    /**
     * 오늘 숨김 여부 확인
     */
    isHiddenToday(id) {
        try {
            const hidden = localStorage.getItem(`popup_hidden_${id}`);
            if (!hidden) return false;
            return new Date(hidden).toDateString() === new Date().toDateString();
        } catch (e) {
            // localStorage 접근 실패 시 false 반환
            return false;
        }
    }

    /**
     * 오늘 하루 보지 않기 설정
     */
    hideToday(id) {
        try {
            localStorage.setItem(`popup_hidden_${id}`, new Date().toISOString());
        } catch (e) {
            // localStorage 접근 실패 시 무시
        }
    }

    /**
     * 팝업 표시
     */
    show() {
        const popup = this.popups[this.currentIndex];
        if (!popup) {
            this.hide();
            return;
        }

        // 슬라이더 인덱스 초기화
        this.sliderIndex = 0;

        this.container.innerHTML = this.render(popup);

        // body 스크롤 막기
        document.body.classList.add('popup-open');
        document.documentElement.classList.add('popup-open');

        // 약간의 딜레이 후 active 클래스 추가 (애니메이션 효과)
        requestAnimationFrame(() => {
            const overlay = this.container.querySelector('.popup-overlay');
            if (overlay) {
                overlay.classList.add('active');
            }
        });

        this.bindEvents(popup);
    }

    /**
     * 팝업 숨기기
     */
    hide() {
        const overlay = this.container.querySelector('.popup-overlay');
        if (overlay) {
            overlay.classList.remove('active');

            // 애니메이션 완료 후 DOM 제거
            setTimeout(() => {
                this.container.innerHTML = '';
                // body 스크롤 복원
                document.body.classList.remove('popup-open');
                document.documentElement.classList.remove('popup-open');
            }, 300);
        } else {
            this.container.innerHTML = '';
            // body 스크롤 복원
            document.body.classList.remove('popup-open');
                document.documentElement.classList.remove('popup-open');
        }
    }

    /**
     * 팝업 HTML 렌더링
     */
    render(popup) {
        const hasLink = popup.link && popup.link.trim() !== '';
        const hasTitle = popup.title && popup.title.trim() !== '';
        const hasDescription = popup.description && popup.description.trim() !== '';

        // 슬라이더 모드 vs 단일 이미지 모드
        const selectedImages = popup.images ? popup.images.filter(img => img.url && img.isSelected === true) : [];
        const isSlider = popup.slider === true && selectedImages.length > 1;
        const imageSection = isSlider
            ? this.renderSlider(popup, hasLink, hasTitle, hasDescription, selectedImages)
            : this.renderSingleImage(popup, hasLink, hasTitle, hasDescription);

        return `
            <div class="popup-overlay" role="dialog" aria-modal="true"${hasTitle ? ` aria-labelledby="popup-title-${popup.id}"` : ''}>
                <div class="popup-content${isSlider ? ' popup-content--slider' : ''}">
                    <button class="popup-close" data-action="close" aria-label="팝업 닫기">&times;</button>
                    ${imageSection}
                    <div class="popup-footer">
                        <button class="popup-today-hide" data-action="hide-today">오늘 하루 보지 않기</button>
                        <button class="popup-close-text" data-action="close">닫기</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 단일 이미지 렌더링
     */
    renderSingleImage(popup, hasLink, hasTitle, hasDescription) {
        const imageUrl = this.getSelectedImage(popup);

        const imageContent = `
            <div class="popup-image" style="background-image: url('${this.escapeHtml(imageUrl)}')">
                ${hasTitle || hasDescription ? `
                    <div class="popup-text-content">
                        ${hasTitle ? `<h3 id="popup-title-${popup.id}" class="popup-title">${this.escapeHtml(popup.title)}</h3>` : ''}
                        ${hasDescription ? `<p class="popup-description">${this.formatTextWithLineBreaks(popup.description)}</p>` : ''}
                    </div>
                ` : ''}
            </div>
        `;

        return hasLink
            ? `<a href="${this.escapeHtml(popup.link)}" target="_blank" rel="noopener noreferrer" class="popup-image-link">${imageContent}</a>`
            : imageContent;
    }

    /**
     * 슬라이더 렌더링
     */
    renderSlider(popup, hasLink, hasTitle, hasDescription, images) {

        // 슬라이드 아이템들
        const slides = images.map((img, index) => `
            <div class="popup-slide${index === 0 ? ' active' : ''}" data-slide-index="${index}">
                <div class="popup-image" style="background-image: url('${this.escapeHtml(img.url)}')">
                    ${hasTitle || hasDescription ? `
                        <div class="popup-text-content">
                            ${hasTitle ? `<h3${index === 0 ? ` id="popup-title-${popup.id}"` : ''} class="popup-title">${this.escapeHtml(popup.title)}</h3>` : ''}
                            ${hasDescription ? `<p class="popup-description">${this.formatTextWithLineBreaks(popup.description)}</p>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // 도트 네비게이션
        const dots = images.map((_, index) => `
            <button class="popup-dot${index === 0 ? ' active' : ''}" data-slide-index="${index}" aria-label="슬라이드 ${index + 1}"></button>
        `).join('');

        const sliderContent = `
            <div class="popup-slider">
                <div class="popup-slides">
                    ${slides}
                </div>
                ${images.length > 1 ? `
                    <button class="popup-arrow popup-arrow--prev" data-action="prev" aria-label="이전">&#10094;</button>
                    <button class="popup-arrow popup-arrow--next" data-action="next" aria-label="다음">&#10095;</button>
                    <div class="popup-dots">
                        ${dots}
                    </div>
                ` : ''}
            </div>
        `;

        return hasLink
            ? `<a href="${this.escapeHtml(popup.link)}" target="_blank" rel="noopener noreferrer" class="popup-image-link">${sliderContent}</a>`
            : sliderContent;
    }

    /**
     * HTML 이스케이프 (BaseMapper 활용)
     */
    escapeHtml(str) {
        if (this._baseMapper) {
            return this._baseMapper._escapeHTML(str);
        }
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * 텍스트의 줄바꿈을 HTML <br> 태그로 변환 (BaseMapper 활용)
     */
    formatTextWithLineBreaks(text) {
        if (this._baseMapper) {
            return this._baseMapper._formatTextWithLineBreaks(text);
        }
        if (!text) return '';
        const trimmedText = text.trim();
        const escapedText = this.escapeHtml(trimmedText);
        return escapedText.replace(/\n/g, '<br>');
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents(popup) {
        // 닫기 버튼들
        this.container.querySelectorAll('[data-action="close"]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.close();
            });
        });

        // 오늘 하루 보지 않기
        const hideTodayBtn = this.container.querySelector('[data-action="hide-today"]');
        if (hideTodayBtn) {
            hideTodayBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideToday(popup.id);
                this.close();
            });
        }

        // 오버레이 클릭으로 닫기
        const overlay = this.container.querySelector('.popup-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });
        }

        // ESC 키로 닫기
        this._escHandler = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        document.addEventListener('keydown', this._escHandler);

        // 슬라이더 이벤트
        this.bindSliderEvents(popup);
    }

    /**
     * 슬라이더 이벤트 바인딩
     */
    bindSliderEvents(popup) {
        // DOM 캐싱
        this._slides = this.container.querySelectorAll('.popup-slide');
        this._dots = this.container.querySelectorAll('.popup-dot');

        if (this._slides.length <= 1) return;

        const total = this._slides.length;

        // 이전 버튼
        const prevBtn = this.container.querySelector('[data-action="prev"]');
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.goToSlide(this.sliderIndex - 1);
                this.resetAutoPlay();
            });
        }

        // 다음 버튼
        const nextBtn = this.container.querySelector('[data-action="next"]');
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.goToSlide(this.sliderIndex + 1);
                this.resetAutoPlay();
            });
        }

        // 도트 네비게이션
        this._dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(dot.dataset.slideIndex, 10);
                this.goToSlide(index);
                this.resetAutoPlay();
            });
        });

        // 자동 슬라이드 시작
        this.startAutoPlay();

        // 마우스 호버 시 일시정지
        const slider = this.container.querySelector('.popup-slider');
        if (slider) {
            slider.addEventListener('mouseenter', () => this.stopAutoPlay());
            slider.addEventListener('mouseleave', () => this.startAutoPlay());

            // 터치 스와이프 이벤트
            this.bindTouchEvents(slider);
        }
    }

    /**
     * 터치 스와이프 이벤트 바인딩
     */
    bindTouchEvents(slider) {
        let touchStartX = 0;
        let touchEndX = 0;
        const minSwipeDistance = 50;

        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            this.stopAutoPlay();
        }, { passive: true });

        slider.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > minSwipeDistance) {
                if (diff > 0) {
                    // 왼쪽 스와이프 → 다음
                    this.goToSlide(this.sliderIndex + 1);
                } else {
                    // 오른쪽 스와이프 → 이전
                    this.goToSlide(this.sliderIndex - 1);
                }
            }
            this.resetAutoPlay();
        }, { passive: true });
    }

    /**
     * 자동 슬라이드 시작
     */
    startAutoPlay() {
        if (!this._slides || this._slides.length <= 1) return;
        this.stopAutoPlay();
        this.autoPlayTimer = setInterval(() => {
            this.goToSlide(this.sliderIndex + 1);
        }, this.autoPlayInterval);
    }

    /**
     * 자동 슬라이드 정지
     */
    stopAutoPlay() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
    }

    /**
     * 자동 슬라이드 리셋 (수동 조작 후)
     */
    resetAutoPlay() {
        this.stopAutoPlay();
        this.startAutoPlay();
    }

    /**
     * 슬라이드 이동
     */
    goToSlide(index) {
        if (!this._slides) return;
        const total = this._slides.length;

        // 순환 처리
        if (index < 0) index = total - 1;
        if (index >= total) index = 0;

        this.sliderIndex = index;

        // 슬라이드 활성화 (캐시된 DOM 사용)
        this._slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });

        // 도트 활성화 (캐시된 DOM 사용)
        if (this._dots) {
            this._dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }
    }

    /**
     * 이벤트 리스너 정리
     */
    cleanupEvents() {
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
            this._escHandler = null;
        }
        this.stopAutoPlay();
        this._slides = null;
        this._dots = null;
    }

    /**
     * 팝업 닫기 (다음 팝업 표시 또는 완전 숨김)
     */
    close() {
        this.cleanupEvents();
        this.currentIndex++;

        if (this.currentIndex < this.popups.length) {
            // 다음 팝업 표시
            this.show();
        } else {
            // 모든 팝업 닫기
            this.hide();
        }
    }

    /**
     * 미리보기 모드에서 팝업 데이터 업데이트
     */
    updateFromPreview(popupData) {
        // 미리보기 모드 활성화
        this.isPreviewMode = true;

        // 팝업 데이터 처리
        const popups = popupData?.popups || popupData || [];
        this.processPopups(Array.isArray(popups) ? popups : []);
    }

    /**
     * 전체 데이터에서 팝업 추출 및 업데이트
     */
    updateFromTemplateData(data) {
        this.isPreviewMode = true;
        const popupData = data?.homepage?.customFields?.popup?.popups || [];
        this.processPopups(popupData);
    }
}

// 전역 인스턴스 생성
window.PopupManager = PopupManager;

// DOM 로드 완료 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.popupManager = new PopupManager();
        window.popupManager.init();
    });
} else {
    window.popupManager = new PopupManager();
    window.popupManager.init();
}

} // PopupManager 중복 선언 방지 끝
