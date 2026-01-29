/**
 * Fullscreen Menu
 * 풀스크린 메뉴의 모든 기능을 담당하는 클래스
 */

// 메뉴 이미지 데이터 (중복 로딩 방지)
if (!window.FALLBACK_MENU_IMAGES) {
    // 히어로 이미지에서 매핑
    window.FALLBACK_MENU_IMAGES = [
        {
            url: "", // main 페이지 히어로
            alt: "메인페이지",
            dataAttribute: "data-homepage-customFields-pages-main-sections-0-hero-images-0-url"
        },
        {
            url: "", // facility 페이지 히어로
            alt: "시설안내",
            dataAttribute: "data-homepage-customFields-pages-facility-sections-0-hero-images-0-url"
        },
        {
            url: "", // room 페이지 히어로
            alt: "객실안내",
            dataAttribute: "data-homepage-customFields-pages-room-sections-0-hero-images-0-url"
        },
        {
            url: "", // directions 페이지 히어로
            alt: "오시는길",
            dataAttribute: "data-homepage-customFields-pages-directions-sections-0-hero-images-0-url"
        },
    ];
}

// 메뉴 데이터 (중복 로딩 방지)
if (!window.menuDataLoaded) {
    window.menuDataLoaded = true;

    const menuData = {
        about: {
            label: "ABOUT",
            subMenus: [
                { id: "main", label: "소개" },
                { id: "directions", label: "오시는길" }
            ]
        },
        spaces: {
            label: "SPACES",
            subMenus: []  // 동적으로 로드됨 (rooms 데이터)
        },
        specials: {
            label: "SPECIALS",
            subMenus: []  // 동적으로 로드됨 (facilities 데이터)
        },
        reservation: {
            label: "RESERVATION",
            subMenus: [
                { id: "reservation", label: "예약안내" }
            ]
        }
    };

    // 전역에서 사용할 수 있도록 설정
    window.menuData = menuData;
}

// FullScreenMenu 클래스 (중복 로딩 방지)
if (!window.FullScreenMenu) {

class FullScreenMenu {
    constructor() {
        this.isOpen = false;
        this.activeMainMenu = null;
        this.isClosing = false;
        this.isDataLoaded = false;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadDynamicData();
        this.initSliders();
        this.setupMobileMenu();
        this.setupDesktopMenu();
    }

    async loadDynamicData() {
        // 초기 로딩은 HeaderFooterMapper에서 호출될 때까지 대기
        // updateFromMapper() 메서드로 데이터를 받음
    }

    /**
     * HeaderFooterMapper로부터 데이터를 받아서 메뉴 업데이트
     */
    updateFromMapper(data) {
        if (!data) {
            return;
        }

        // 데이터 업데이트
        this.data = data;
        this.updateMenuFromData();
        this.isDataLoaded = true;
    }

    updateMenuFromData() {
        if (!this.data) {
            return;
        }

        const data = this.data;

        // SPACES 메뉴 업데이트 (rooms 데이터) - customFields 객실명 사용
        if (data.rooms && data.rooms.length > 0) {
            const builderRoomtypes = data.homepage?.customFields?.roomtypes || [];
            window.menuData.spaces.subMenus = data.rooms.map(room => {
                const builderRoom = builderRoomtypes.find(rt => rt.id === room.id);
                const roomName = (builderRoom?.name && builderRoom.name.trim()) ? builderRoom.name : room.name;
                return {
                    id: `room-${room.id}`,
                    label: roomName,
                    roomId: room.id
                };
            });
        }

        // SPECIALS 메뉴 업데이트 (facilities 데이터)
        if (data.property && data.property.facilities && data.property.facilities.length > 0) {
            window.menuData.specials.subMenus = data.property.facilities.map(facility => ({
                id: `facility-${facility.id}`,
                label: facility.name,
                facilityId: facility.id
            }));
        }

        // 히어로 이미지 매핑
        this.mapHeroImages();

        // 메뉴 다시 렌더링 (데이터가 업데이트되었으므로)
        this.setupDesktopMenu();
        this.setupMobileMenu()
    }

    mapHeroImages() {
        // 각 메뉴별 hero 이미지 매핑
        this.menuHeroImages = {
            about: this.getHeroImageFromData('main'),
            spaces: this.getHeroImageFromData('room'),
            specials: this.getHeroImageFromData('facility'),
            reservation: this.getHeroImageFromData('reservation'),
            directions: this.getHeroImageFromData('directions')
        };

        // 기본 이미지 표시 (about 메뉴의 이미지)
        if (this.menuHeroImages && this.menuHeroImages.about) {
            this.displaySingleImage(this.menuHeroImages.about);
        } else {
            this.displaySingleImage(this.getDefaultImage());
        }
    }

    getHeroImageFromData(pageType) {
        if (!this.data) {
            return this.getDefaultImage();
        }

        const data = this.data;
        let heroImage = null;

        try {
            switch (pageType) {
                case 'main':
                    // main 페이지와 동일한 로직
                    heroImage = data.homepage?.customFields?.pages?.main?.sections?.[0]?.hero?.images?.[0];
                    break;
                case 'room':
                    // room 페이지와 동일한 로직: 첫 번째 room의 thumbnail[0] 사용
                    if (data.rooms && data.rooms.length > 0) {
                        const firstRoom = data.rooms[0];
                        if (firstRoom.images && firstRoom.images.length > 0) {
                            const roomImagesData = firstRoom.images[0];
                            if (roomImagesData?.thumbnail && roomImagesData.thumbnail.length > 0) {
                                heroImage = roomImagesData.thumbnail[0];
                            }
                        }
                    }
                    break;
                case 'facility':
                    // facility 페이지와 동일한 로직: 첫 번째 facility의 images[0] 사용
                    if (data.property?.facilities && data.property.facilities.length > 0) {
                        const firstFacility = data.property.facilities[0];
                        if (Array.isArray(firstFacility.images) && firstFacility.images.length > 0) {
                            heroImage = firstFacility.images[0];
                        }
                    }
                    break;
                case 'reservation':
                    // reservation 페이지와 동일한 로직
                    heroImage = data.homepage?.customFields?.pages?.reservation?.sections?.[0]?.hero?.images?.[0];
                    break;
                case 'directions':
                    // directions 페이지와 동일한 로직
                    heroImage = data.homepage?.customFields?.pages?.directions?.sections?.[0]?.hero?.images?.[0];
                    break;
            }

            if (heroImage && heroImage.url) {
                return {
                    url: heroImage.url,
                    alt: heroImage.description || `${pageType} 이미지`
                };
            }
        } catch (error) {
        }

        return this.getDefaultImage();
    }

    getDefaultImage() {
        return {
            url: '', // 빈 URL로 empty-image-placeholder 처리됨
            alt: 'No Image Available'
        };
    }

    changeMenuImage(menuKey) {
        // menuHeroImages가 초기화되지 않았으면 스킵
        if (!this.menuHeroImages) {
            return;
        }

        const image = this.menuHeroImages[menuKey];
        if (image) {
            this.displaySingleImage(image);
        }
    }

    displaySingleImage(image) {
        const container = document.getElementById('desktop-menu-slides');
        if (!container) {
            return;
        }

        // 새로운 이미지 컨테이너 생성
        const imageDiv = document.createElement('div');
        imageDiv.className = 'w-full h-full relative overflow-hidden rounded-2xl';
        imageDiv.style.position = 'absolute';
        imageDiv.style.top = '0';
        imageDiv.style.left = '0';
        imageDiv.style.opacity = '1';

        const img = document.createElement('img');
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; display: block;';

        // 이미지 로딩을 동기적으로 처리
        const loadImage = () => {
            imageDiv.appendChild(img);
            container.appendChild(imageDiv);
            // 기존 이미지들 즉시 제거
            this.removeOldImages(container, imageDiv);
        };

        if (image && image.url) {
            // 이미지 URL이 있는 경우
            img.src = image.url;
            img.alt = image.alt || 'Menu Image';
            img.classList.remove('empty-image-placeholder');

            // 이미지 캐시 확인
            if (img.complete) {
                // 이미지가 이미 캐시되어 있음
                loadImage();
            } else {
                // 이미지 로딩 이벤트
                img.onload = loadImage;
                img.onerror = () => {
                    img.src = '';
                    img.classList.add('empty-image-placeholder');
                    loadImage();
                };
            }
        } else {
            // 이미지가 없으면 empty-image-placeholder 즉시 표시
            img.src = '';
            img.alt = 'No Image Available';
            img.classList.add('empty-image-placeholder');
            loadImage();
        }
    }

    removeOldImages(container, newImageDiv) {
        const existingImages = container.querySelectorAll('div');
        // 기존 이미지들 즉시 제거
        existingImages.forEach((div) => {
            if (div !== newImageDiv && div.parentNode) {
                div.parentNode.removeChild(div);
            }
        });
    }

    setupEventListeners() {
        // 닫기 버튼
        document.getElementById('close-menu-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeMenu();
        });

        // ESC 키로 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                e.preventDefault();
                this.closeMenu();
            }
        });
    }

    async initSliders() {
        // 단일 이미지 초기화 (나중에 mapHeroImages에서 실제 이미지로 교체됨)
    }

    setupMobileMenu() {
        const container = document.getElementById('mobile-menu-grid');
        container.innerHTML = '';

        Object.entries(window.menuData).forEach(([key, menu], index) => {
            const menuCard = document.createElement('div');
            menuCard.className = 'p-3';
            menuCard.style.minHeight = key === 'special' ? '200px' : '160px';

            const subMenuCount = menu.subMenus.length;

            // Create submenu HTML
            let subMenuHtml = '';
            menu.subMenus.forEach((subMenu, subIndex) => {
                subMenuHtml += `
                    <button class="menu-sub-item text-[#6B5B73] hover:text-[#5D4037] transition-colors duration-200 text-left py-1 text-sm ko-body w-full"
                            data-page="${subMenu.id}">
                        ${subMenu.label}
                    </button>
                `;
            });

            // Determine layout based on whether scroll is needed
            let subMenuLayout;
            let subMenuContainerStyle = '';

            if (key === 'spaces' || key === 'specials') {
                // Single column layout for spaces and specials to prevent text overlap
                subMenuLayout = 'flex flex-col space-y-2';
                subMenuContainerStyle = 'max-height: 300px; overflow-y: auto; overflow-x: hidden;';
            } else {
                // Original layout for other menus
                subMenuLayout = subMenuCount >= 4 ? 'grid grid-cols-2 gap-2' : 'flex flex-col space-y-2';
                subMenuContainerStyle = 'max-height: 300px; overflow-y: auto; overflow-x: hidden;';
            }

            menuCard.innerHTML = `
                <!-- 메인 타이틀 -->
                <div class="text-left mb-4">
                    <h3 class="text-[#8B6F47] text-sm font-medium tracking-wide en-title mobile-main-menu" data-menu-key="${key}">
                        ${menu.label}
                    </h3>
                </div>

                <!-- 서브메뉴 리스트 -->
                <div class="${subMenuLayout} mobile-submenu-container" style="${subMenuContainerStyle}">
                    ${subMenuHtml}
                </div>
            `;

            container.appendChild(menuCard);
        });

        // 모바일 메뉴 아이템 클릭 이벤트
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('menu-sub-item')) {
                e.preventDefault();
                e.stopPropagation();
                const pageId = e.target.dataset.page;
                this.handleMenuClick(pageId);
            } else if (e.target.classList.contains('mobile-main-menu')) {
                // 모바일 메인 메뉴 타이틀 클릭 시 이미지 변경
                e.preventDefault();
                e.stopPropagation();
                const menuKey = e.target.dataset.menuKey;
                this.changeMenuImage(menuKey);
            }
        });
    }

    setupDesktopMenu() {
        const mainMenuContainer = document.getElementById('main-menu-list');
        mainMenuContainer.innerHTML = '';

        Object.entries(window.menuData).forEach(([key, menu], index) => {
            // Create accordion item container
            const accordionItem = document.createElement('div');
            accordionItem.className = 'accordion-desktop-item border-b border-gray-300';
            accordionItem.setAttribute('data-menu-key', key);

            // Create main menu button
            const menuButton = document.createElement('button');
            const hasSubmenus = menu.subMenus && menu.subMenus.length > 0;

            // 메인 메뉴는 애니메이션 없이 즉시 표시
            menuButton.className = `main-menu-item text-left text-2xl lg:text-3xl font-medium transition-colors duration-200 en-title flex items-center justify-between w-full py-4 text-[#5D4037] hover:text-[#3E2723]`;

            // Create text span
            const textSpan = document.createElement('span');
            textSpan.className = 'en-title';
            textSpan.textContent = menu.label;
            menuButton.appendChild(textSpan);

            // Add accordion icon for menus with submenus
            if (hasSubmenus) {
                const iconSpan = document.createElement('span');
                iconSpan.className = 'accordion-icon text-2xl transition-transform duration-200';
                iconSpan.textContent = '+';
                iconSpan.style.fontFamily = 'monospace';
                iconSpan.style.fontWeight = '300';
                menuButton.appendChild(iconSpan);
            }

            menuButton.dataset.menuKey = key;

            menuButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // 클릭 시 이미지 변경
                this.changeMenuImage(key);

                if (hasSubmenus) {
                    this.toggleDesktopAccordion(key);
                } else {
                    this.handleMainMenuClick(key);
                }
            });

            accordionItem.appendChild(menuButton);

            // Create submenu container
            if (hasSubmenus) {
                const subMenuContainer = document.createElement('div');
                subMenuContainer.className = 'submenu-accordion-content overflow-y-auto overflow-x-hidden transition-all duration-300';
                subMenuContainer.style.position = 'relative';
                subMenuContainer.style.maxHeight = '0';
                subMenuContainer.dataset.menuKey = key;

                // Create inner container for submenus
                const innerContainer = document.createElement('div');

                // Apply grid layout for spaces and specials
                if (key === 'spaces' || key === 'specials') {
                    innerContainer.className = 'py-4 pl-8 grid grid-cols-3 gap-3';
                    innerContainer.style.alignItems = 'start';
                } else {
                    innerContainer.className = 'py-4 pl-8';
                }

                // Add submenu items
                menu.subMenus.forEach((subMenu) => {
                    const subMenuButton = document.createElement('button');
                    // Unified styling for all submenus
                    subMenuButton.className = 'block text-left text-lg lg:text-xl text-[#8D6E63] hover:text-[#5D4037] transition-all duration-200 hover:translate-x-2 ko-body py-2 w-full';
                    subMenuButton.textContent = subMenu.label;
                    subMenuButton.dataset.page = subMenu.id;

                    subMenuButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.handleMenuClick(subMenu.id);
                    });

                    innerContainer.appendChild(subMenuButton);
                });

                subMenuContainer.appendChild(innerContainer);
                accordionItem.appendChild(subMenuContainer);
            }

            mainMenuContainer.appendChild(accordionItem);
        });
    }

    toggleDesktopAccordion(menuKey) {
        const accordionItem = document.querySelector(`.accordion-desktop-item[data-menu-key="${menuKey}"]`);

        if (!accordionItem) {
            return;
        }

        const submenuContent = accordionItem.querySelector('.submenu-accordion-content');
        const icon = accordionItem.querySelector('.accordion-icon');

        if (!submenuContent) {
            return;
        }

        // 현재 아코디언이 열려있는지 확인 (실제 DOM 상태로 확인)
        const isCurrentlyOpen = submenuContent.style.maxHeight && submenuContent.style.maxHeight !== '0px';

        if (isCurrentlyOpen && this.activeMainMenu === menuKey) {
            // Close current accordion
            this.activeMainMenu = null;
            submenuContent.style.maxHeight = '0';
            if (icon) icon.style.transform = 'rotate(0deg)';
        } else {
            // Close all other accordions first
            document.querySelectorAll('.accordion-desktop-item').forEach(item => {
                const otherSubmenu = item.querySelector('.submenu-accordion-content');
                const otherIcon = item.querySelector('.accordion-icon');
                if (otherSubmenu) otherSubmenu.style.maxHeight = '0';
                if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
            });

            // Open this accordion
            this.activeMainMenu = menuKey;
            const innerContainer = submenuContent.firstElementChild;

            // Set fixed max height for scroll behavior
            submenuContent.style.maxHeight = '300px';

            if (icon) icon.style.transform = 'rotate(45deg)';
        }
    }

    handleMainMenuClick(menuKey) {
        const menu = window.menuData[menuKey];
        if (menu.subMenus.length === 1) {
            this.handleMenuClick(menu.subMenus[0].id);
        } else {
            this.setActiveMainMenu(menuKey);
        }
    }

    handleMenuClick(pageId) {
        if (pageId === "home") {
            if (typeof onHome === 'function') {
                onHome();
            } else {
                window.location.href = 'index.html';
            }
        } else if (pageId === "main") {
            window.location.href = 'main.html';
        } else if (pageId.startsWith("room-")) {
            // room-1, room-2 형태에서 ID 추출
            const roomId = pageId.replace("room-", "");
            window.location.href = `room.html?id=${roomId}`;
        } else if (pageId.startsWith("facility-")) {
            // facility-1, facility-2 형태에서 ID 추출
            const facilityId = pageId.replace("facility-", "");
            window.location.href = `facility.html?id=${facilityId}`;
        } else {
            if (typeof onNavigate === 'function') {
                onNavigate(pageId);
            } else {
                window.location.href = `${pageId}.html`;
            }
        }
        this.closeMenu();
    }

    handleReservation() {
        this.handleMenuClick("reservation");
    }

    openMenu() {
        if (this.isOpen) return; // 이미 열려있으면 중복 실행 방지

        this.isOpen = true;

        const menu = document.getElementById('fullscreen-menu');

        // 메뉴 표시
        menu.style.display = 'block';

        // 스크롤 비활성화
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        // 이미지 표시 로직 개선
        if (!this.menuHeroImages && this.data) {
            // 데이터가 있지만 이미지가 매핑되지 않은 경우
            this.mapHeroImages();
        }

        // 이미지 즉시 표시 (애니메이션 없이)
        if (this.menuHeroImages && this.menuHeroImages.about) {
            this.displaySingleImage(this.menuHeroImages.about);
        } else {
            // 기본 placeholder 이미지 표시
            this.displaySingleImage(this.getDefaultImage());
        }
    }

    closeMenu() {
        if (this.isClosing) {
            return;
        }

        this.isClosing = true;
        this.isOpen = false;
        const menu = document.getElementById('fullscreen-menu');

        // 메뉴 즉시 숨김
        menu.style.display = 'none';

        // 스크롤 복구
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';

        // 헤더의 햄버거 아이콘 상태 업데이트
        if (window.headerComponent) {
            window.headerComponent.setMenuOpen(false);
        }

        // 전역 콜백이 있으면 호출
        if (typeof window.onCloseMenu === 'function') {
            window.onCloseMenu();
        }

        this.isClosing = false;
    }

    // 외부 호출용 안전한 closeMenu
    safeCloseMenu() {
        if (!this.isOpen || this.isClosing) {
            return;
        }
        this.closeMenu();
    }
}

// 전역에 클래스 등록 (component 제거)
window.FullScreenMenu = FullScreenMenu;

} // FullScreenMenu 클래스 조건문 종료

// 전역 인스턴스 생성 (중복 방지)
if (!window.fullScreenMenu) {
    window.fullScreenMenu = new window.FullScreenMenu();

    // 이미 로드된 데이터가 있으면 즉시 적용 (타이밍 이슈 해결)
    // HeaderFooterMapper가 먼저 실행된 경우를 대비
    setTimeout(() => {
        if (!window.fullScreenMenu.isDataLoaded) {
            // 페이지별 mapper에서 데이터 찾기
            const mapperData =
                (window.indexMapper && window.indexMapper.data) ||
                (window.mainMapper && window.mainMapper.data) ||
                (window.roomMapper && window.roomMapper.data) ||
                (window.facilityMapper && window.facilityMapper.data) ||
                (window.directionsMapper && window.directionsMapper.data) ||
                (window.reservationMapper && window.reservationMapper.data);

            if (mapperData) {
                window.fullScreenMenu.updateFromMapper(mapperData);
            }
        }
    }, 100);
}

// 전역 함수들 (항상 재정의)
window.openFullScreenMenu = function() {
    if (window.fullScreenMenu && !window.fullScreenMenu.isOpen) {
        window.fullScreenMenu.openMenu();
    }
};

window.closeFullScreenMenu = function() {
    if (window.fullScreenMenu) {
        window.fullScreenMenu.safeCloseMenu();
    }
};

// 기존 호환성을 위한 별칭
window.fullScreenMenuComponent = window.fullScreenMenu;