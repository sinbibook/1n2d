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
        this._previewDismissed = false; // 미리보기에서 사용자가 팝업을 닫은 경우
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

                // 보여줄 이미지·영상이 있는 팝업만
                if (this.getPopupMedia(p).length === 0) return false;

                return true;
            })
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        // 팝업이 있으면 첫 번째 팝업 표시
        this.currentIndex = 0;
        if (this.popups.length > 0) {
            // 미리보기에서 이미 닫은 경우 다시 표시하지 않음
            if (this.isPreviewMode && this._previewDismissed) {
                return;
            }
            this.show();
        } else {
            this.hide();
        }
    }

    /**
     * 팝업의 노출 영상 URL (isSelected 우선, 없으면 첫 영상, 영상이 없으면 null)
     */
    getSelectedVideo(popup) {
        if (!popup || !Array.isArray(popup.videos)) return null;
        const videos = popup.videos
            .filter(video => video && video.url)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        const selected = videos.find(video => video.isSelected === true);
        if (selected) return selected.url;
        return videos.length ? videos[0].url : null;
    }

    /**
     * 팝업의 노출 미디어 목록 [{ kind: 'image' | 'video', url }]
     * - 선택 이미지들(없으면 첫 이미지) 뒤에 노출 영상 1개를 붙인다
     * - 슬라이더는 이 목록을 한 장씩 넘긴다 (이미지 1장 + 영상이어도 2장)
     */
    getPopupMedia(popup) {
        const images = Array.isArray(popup.images) ? popup.images : [];
        const selectedImages = images.filter(img => img && img.url && img.isSelected === true);
        const imageUrls = selectedImages.length
            ? selectedImages.map(img => img.url)
            : (images[0] && images[0].url ? [images[0].url] : []);

        const media = imageUrls.map(url => ({ kind: 'image', url }));
        const videoUrl = this.getSelectedVideo(popup);
        if (videoUrl) media.push({ kind: 'video', url: videoUrl });
        return media;
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
        this.bindFitBox();

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

        // 슬라이더 모드 vs 단일 미디어 모드 (슬라이더를 끄면 첫 미디어만 — 이미지가 있으면 이미지)
        const media = this.getPopupMedia(popup);
        const isSlider = popup.slider === true && media.length > 1;
        const imageSection = isSlider
            ? this.renderSlider(popup, hasLink, hasTitle, hasDescription, media)
            : this.renderSingleImage(popup, hasLink, hasTitle, hasDescription, media[0]);
        const boxWidth = this.getBoxWidth(popup);

        return `
            <div class="popup-overlay" role="dialog" aria-modal="true"${hasTitle ? ` aria-labelledby="popup-title-${popup.id}"` : ''}>
                <div class="popup-content${isSlider ? ' popup-content--slider' : ''}" data-box-width="${boxWidth}" style="width: ${boxWidth}px; max-width: min(90vw, ${boxWidth}px)">
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
     * 미디어 1개 렌더링 — 이미지는 <img>, 영상은 음소거 자동재생·반복 <video> + 재생/정지 버튼
     */
    renderMedia(popup, item) {
        if (item.kind === 'video') {
            return `<video class="popup-image popup-video" src="${this.escapeHtml(item.url)}" muted autoplay loop playsinline preload="metadata"></video>
                <button type="button" class="popup-video-toggle" data-action="toggle-video" aria-label="영상 정지">❚❚</button>`;
        }
        return `<img class="popup-image" src="${this.escapeHtml(item.url)}" alt="${this.escapeHtml(popup.title || '팝업 이미지')}">`;
    }

    /**
     * 단일 미디어 렌더링
     */
    renderSingleImage(popup, hasLink, hasTitle, hasDescription, item) {
        const imageContent = `
            <div class="popup-image-wrap">
                ${this.renderMedia(popup, item)}
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

        // 슬라이드 아이템들 (이미지·영상)
        const slides = images.map((item, index) => `
            <div class="popup-slide${index === 0 ? ' active' : ''}" data-slide-index="${index}">
                <div class="popup-image-wrap">
                    ${this.renderMedia(popup, item)}
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
     * 팝업 폭 (백오피스에서 고른 popup.width, 없으면 기본 폭)
     */
    getBoxWidth(popup) {
        const width = Number(popup && popup.width);
        return width > 0 ? width : PopupManager.DEFAULT_BOX_WIDTH;
    }

    /**
     * 팝업 박스 폭 맞추기
     * - 고른 폭으로 고정하고 이미지는 폭 100% 로 채운다
     * - 세로가 화면을 넘는 이미지만 비율을 유지한 채 폭을 줄인다 (닫기 버튼이 화면 안에 남도록)
     * - 슬라이더는 첫 미디어 비율로 높이를 고정한다 (넘길 때 팝업 높이가 바뀌지 않도록)
     */
    fitBox() {
        if (!this.container) return;
        const box = this.container.querySelector('.popup-content');
        const img = this.container.querySelector('.popup-image');
        if (!box || !img || !PopupManager.isMediaReady(img)) return;

        const size = PopupManager.getMediaSize(img);
        const ratio = size.width / size.height;
        const slides = box.querySelector('.popup-slides');
        if (slides) slides.style.aspectRatio = `${size.width} / ${size.height}`;

        const footer = box.querySelector('.popup-footer');
        const footerHeight = footer ? footer.offsetHeight : 0;
        const boxWidth = Number(box.dataset.boxWidth) || PopupManager.DEFAULT_BOX_WIDTH;
        const maxImageHeight = window.innerHeight * 0.85 - footerHeight;

        let w = Math.min(window.innerWidth * 0.9, boxWidth);
        if (w / ratio > maxImageHeight) w = maxImageHeight * ratio;
        box.style.width = Math.round(Math.max(w, 1)) + 'px';
    }

    /**
     * 첫 미디어 크기를 알게 되면 폭을 맞추고, 창 크기가 바뀌면 다시 맞춘다
     */
    bindFitBox() {
        const img = this.container.querySelector('.popup-image');
        if (img) {
            if (PopupManager.isMediaReady(img)) {
                this.fitBox();
            } else {
                const eventName = img.tagName === 'VIDEO' ? 'loadedmetadata' : 'load';
                img.addEventListener(eventName, () => this.fitBox(), { once: true });
            }
        }
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
        }
        this._resizeHandler = () => this.fitBox();
        window.addEventListener('resize', this._resizeHandler);
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

        // 영상 재생/정지
        this.bindVideoEvents();

        // 슬라이더 이벤트
        this.bindSliderEvents(popup);
    }

    /**
     * 영상: 음소거 자동재생을 보장하고 재생/정지 버튼을 연결한다
     * - 슬라이더 안의 영상은 보이는 슬라이드일 때만 재생한다
     */
    bindVideoEvents() {
        this.container.querySelectorAll('.popup-video').forEach(video => {
            video.muted = true;
            const toggle = video.parentNode.querySelector('[data-action="toggle-video"]');
            const syncToggle = () => {
                if (!toggle) return;
                toggle.textContent = video.paused ? '▶' : '❚❚';
                toggle.setAttribute('aria-label', video.paused ? '영상 재생' : '영상 정지');
            };
            video.addEventListener('play', syncToggle);
            video.addEventListener('pause', syncToggle);
            if (toggle) {
                // 링크 팝업이어도 버튼 클릭은 이동하지 않게 막는다
                toggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (video.paused) {
                        video.play().catch(() => {});
                    } else {
                        video.pause();
                    }
                });
            }

            const slide = video.closest('.popup-slide');
            if (slide && !slide.classList.contains('active')) {
                video.pause();
                syncToggle();
                return;
            }
            video.play().catch(() => syncToggle());
        });
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

        // 슬라이드 활성화 (캐시된 DOM 사용). 영상은 보이는 슬라이드만 재생한다
        this._slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
            const video = slide.querySelector('.popup-video');
            if (!video) return;
            if (i === index) {
                video.play().catch(() => {});
            } else {
                video.pause();
            }
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
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
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
            if (this.isPreviewMode) {
                this._previewDismissed = true;
            }
            this.hide();
        }
    }

    /**
     * 미리보기 모드에서 팝업 데이터 업데이트
     */
    updateFromPreview(popupData) {
        // 미리보기 모드 활성화
        this.isPreviewMode = true;
        // 팝업 설정 자체가 변경된 경우 닫힘 플래그 리셋
        this._previewDismissed = false;

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

// 팝업 폭을 고르지 않은 팝업의 기본 폭 (styles/popup.css .popup-content width 와 동일하게 유지)
PopupManager.DEFAULT_BOX_WIDTH = 350;

// 이미지·영상 원본 크기
PopupManager.getMediaSize = (el) => (el.tagName === 'VIDEO'
    ? { width: el.videoWidth, height: el.videoHeight }
    : { width: el.naturalWidth, height: el.naturalHeight });

// 크기를 알 수 있는 상태인지 (영상은 메타데이터 로드 이후)
PopupManager.isMediaReady = (el) => (el.tagName === 'VIDEO'
    ? el.readyState >= 1 && el.videoWidth > 0
    : el.complete && el.naturalWidth > 0);

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
