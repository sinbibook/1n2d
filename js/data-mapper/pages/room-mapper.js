/**
 * Room Page Data Mapper
 * room.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 객실 페이지 전용 기능 제공
 * URL 파라미터로 ?index=0,1,2...를 받아서 동적으로 객실 정보 표시
 */
class RoomMapper extends BaseDataMapper {
    constructor() {
        super();
        this.currentRoom = null;
        this.currentRoomIndex = null;
        this.currentRoomPageData = null;
    }

    // ============================================================================
    // 🏠 ROOM PAGE SPECIFIC MAPPINGS
    // ============================================================================

    /**
     * 현재 객실 정보 가져오기 (URL 파라미터 기반)
     */
    getCurrentRoom() {
        if (!this.isDataLoaded || !this.data.rooms) {
            console.error('Data not loaded or no rooms data available');
            return null;
        }

        // URL에서 room id 추출
        const urlParams = new URLSearchParams(window.location.search);
        let roomId = urlParams.get('id');

        // id가 없으면 첫 번째 room으로 리다이렉트
        if (!roomId && this.data.rooms.length > 0) {
            console.warn('Room id not specified, redirecting to first room');
            window.location.href = this.buildUrl('room.html', { id: this.data.rooms[0].id });
            return null;
        }

        if (!roomId) {
            console.error('Room id not specified in URL and no rooms available');
            return null;
        }

        // rooms 배열에서 해당 id의 객실 찾기
        const roomIndex = this.data.rooms.findIndex(room => room.id === roomId);

        if (roomIndex === -1) {
            console.error(`Room with id ${roomId} not found`);
            return null;
        }

        const room = this.data.rooms[roomIndex];
        this.currentRoom = room;
        this.currentRoomIndex = roomIndex; // 인덱스도 저장 (페이지 데이터 접근용)
        return room;
    }

    /**
     * 현재 객실 페이지 데이터 가져오기 (캐시 포함)
     */
    getCurrentRoomPageData() {
        // 현재 room을 먼저 가져와서 캐시가 유효한지 확인
        const room = this.getCurrentRoom();
        if (!room || !room.id) {
            return null;
        }

        // 캐시된 데이터가 있고 같은 room이면 바로 반환
        if (this.currentRoomPageData && this.currentRoomPageData.id === room.id) {
            return this.currentRoomPageData;
        }

        const roomPages = this.safeGet(this.data, 'homepage.customFields.pages.room');
        if (!roomPages || !Array.isArray(roomPages)) {
            return null;
        }

        // pages.room 배열에서 현재 room.id와 일치하는 페이지 데이터 찾기
        const pageData = roomPages.find(page => page.id === room.id);
        if (!pageData) {
            return null;
        }

        // 캐시 저장
        this.currentRoomPageData = {
            id: room.id,
            data: pageData
        };

        return this.currentRoomPageData;
    }

    /**
     * Hero Slider 섹션 매핑 (페이지 상단)
     * rooms[index].images[0].interior → [data-hero-slider]
     */
    mapHeroSlider() {
        const room = this.getCurrentRoom();
        if (!room) return;

        const sliderContainer = this.safeSelect('[data-hero-slider]');
        if (!sliderContainer) return;

        // customFields 이미지 사용
        const selectedImages = this.getRoomImages(room, 'roomtype_interior');

        // 슬라이더 초기화
        sliderContainer.innerHTML = '';

        if (selectedImages.length === 0) {
            // 이미지가 없을 경우 placeholder 슬라이드 추가
            const slideDiv = document.createElement('div');
            slideDiv.className = 'hero-slide active';

            const imgElement = document.createElement('img');
            ImageHelpers.applyPlaceholder(imgElement);

            slideDiv.appendChild(imgElement);
            sliderContainer.appendChild(slideDiv);

            // Total 카운트 업데이트
            const totalSlidesEl = this.safeSelect('[data-total-slides]');
            if (totalSlidesEl) totalSlidesEl.textContent = '01';
            return;
        }

        // 이미지 생성
        selectedImages.forEach((img, index) => {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'hero-slide';
            if (index === 0) {
                slideDiv.classList.add('active');
            }

            const imgElement = document.createElement('img');
            imgElement.src = img.url;
            imgElement.alt = this.sanitizeText(img.description, room.name);
            imgElement.loading = index === 0 ? 'eager' : 'lazy';

            // 첫 번째 이미지가 로드되면 슬라이더 초기화
            if (index === 0) {
                imgElement.onload = () => {
                    // DOM 렌더링 완료를 위한 최소 지연 (슬라이더 레이아웃 계산에 필요)
                    setTimeout(() => {
                        if (typeof window.initRoomHeroSlider === 'function') {
                            window.initRoomHeroSlider();
                        }
                    }, 100);
                };
            }

            slideDiv.appendChild(imgElement);
            sliderContainer.appendChild(slideDiv);
        });

        // 네비게이션 총 개수 업데이트
        const totalSlidesEl = this.safeSelect('[data-total-slides]');
        if (totalSlidesEl) {
            totalSlidesEl.textContent = String(selectedImages.length).padStart(2, '0');
        }
    }

    /**
     * Hero 슬라이더 재초기화
     */
    reinitializeHeroSlider() {
        // 이제 mapHeroSlider에서 직접 처리하므로 여기서는 호출하지 않음
        // if (typeof window.initRoomHeroSlider === 'function') {
        //     window.initRoomHeroSlider();
        // }
    }

    /**
     * 기본 정보 섹션 매핑 (객실명, 썸네일, 설명) - customFields 우선
     * customFields.roomtypes[index].name → [data-room-name]
     * customFields.roomtypes[index].images (roomtype_thumbnail) → [data-room-thumbnail]
     * homepage.customFields.pages.room[index].sections[0].hero.title → [data-room-description]
     */
    mapBasicInfo() {
        const room = this.getCurrentRoom();
        if (!room) return;

        // 객실명 매핑 (customFields 우선)
        const roomName = this.safeSelect('[data-room-name]');
        if (roomName) {
            roomName.textContent = this.getRoomName(room);
        }

        // 썸네일 이미지 매핑 (customFields)
        const roomThumbnail = this.safeSelect('[data-room-thumbnail]');
        if (roomThumbnail) {
            const customThumbnails = this.getRoomImages(room, 'roomtype_thumbnail');
            if (customThumbnails.length > 0) {
                roomThumbnail.src = customThumbnails[0].url;
                roomThumbnail.alt = customThumbnails[0].description || this.getRoomName(room);
            } else {
                ImageHelpers.applyPlaceholder(roomThumbnail);
            }
        }

        // 객실 설명 매핑 (CUSTOM FIELD)
        const roomDescription = this.safeSelect('[data-room-description]');
        if (roomDescription) {
            const roomPageData = this.getCurrentRoomPageData();
            const heroTitle = roomPageData?.data?.sections?.[0]?.hero?.title;
            const hasDescription = !this._isEmptyValue(heroTitle) && heroTitle.trim() !== '';

            // 객실설명 없으면 미노출
            roomDescription.style.display = hasDescription ? '' : 'none';
            roomDescription.innerHTML = hasDescription ? this._formatTextWithLineBreaks(heroTitle) : '';
        }
    }

    /**
     * Room Detail 슬라이더 매핑 (customFields 우선)
     * customFields.roomtypes[index].images (roomtype_interior, index 2~5) → [data-room-slider-wrapper], [data-room-thumbnails]
     */
    mapRoomDetailSlider() {
        const room = this.getCurrentRoom();
        if (!room) return;

        const sliderWrapper = this.safeSelect('[data-room-slider-wrapper]');
        const indicatorsContainer = this.safeSelect('[data-room-slider-indicators]');
        const thumbnailsContainer = this.safeSelect('[data-room-thumbnails]');

        if (!sliderWrapper) return;

        // customFields 이미지 사용
        const selectedImages = this.getRoomImages(room, 'roomtype_interior');

        // 인덱스 2번부터 4개 이미지 (Room Detail용)
        const detailImages = selectedImages.slice(2, 6);

        // 슬라이더 이미지 생성
        sliderWrapper.innerHTML = '';
        if (detailImages.length === 0) {
            const img = document.createElement('img');
            img.className = 'room-slide active';
            ImageHelpers.applyPlaceholder(img);
            sliderWrapper.appendChild(img);
        } else {
            detailImages.forEach((image, index) => {
                const img = document.createElement('img');
                img.src = image.url;
                img.alt = this.sanitizeText(image.description, room.name);
                img.className = `room-slide ${index === 0 ? 'active' : ''}`;
                img.loading = index === 0 ? 'eager' : 'lazy';
                sliderWrapper.appendChild(img);
            });
        }

        // 인디케이터 생성
        if (indicatorsContainer) {
            indicatorsContainer.innerHTML = '';
            const count = detailImages.length || 1;
            for (let i = 0; i < count; i++) {
                const indicator = document.createElement('span');
                indicator.className = `indicator ${i === 0 ? 'active' : ''}`;
                indicator.setAttribute('data-slide', i);
                indicatorsContainer.appendChild(indicator);
            }
        }

        // 썸네일 이미지 생성
        if (thumbnailsContainer) {
            thumbnailsContainer.innerHTML = '';
            if (detailImages.length === 0) {
                const img = document.createElement('img');
                img.className = 'thumb-img active';
                img.setAttribute('data-slide', '0');
                ImageHelpers.applyPlaceholder(img);
                thumbnailsContainer.appendChild(img);
            } else {
                detailImages.forEach((image, index) => {
                    const img = document.createElement('img');
                    img.src = image.url;
                    img.alt = this.sanitizeText(image.description, room.name);
                    img.className = `thumb-img ${index === 0 ? 'active' : ''}`;
                    img.setAttribute('data-slide', index);
                    img.loading = 'lazy';
                    thumbnailsContainer.appendChild(img);
                });
            }
        }

        // Room Detail 슬라이더 재초기화 (DOM 렌더링 완료 후)
        // requestAnimationFrame을 두 번 사용하여 확실한 DOM 업데이트 보장
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (typeof window.initRoomDetailSlider === 'function') {
                    window.initRoomDetailSlider();
                }
            });
        });
    }

    /**
     * 객실 상세 정보 매핑
     */
    mapRoomDetails() {
        const room = this.getCurrentRoom();
        if (!room) return;

        // 객실 크기 (시스템 데이터)
        const roomSize = this.safeSelect('[data-room-size]');
        if (roomSize) {
            const size = room.size ? `${room.size}㎡` : '-';
            roomSize.textContent = size;
        }

        // 침대 타입 (시스템 데이터)
        const roomBedTypes = this.safeSelect('[data-room-bed-types]');
        if (roomBedTypes) {
            const bedTypes = room.bedTypes || [];
            roomBedTypes.textContent = bedTypes.length > 0 ? bedTypes.join(', ') : '-';
        }

        // 객실 구성 (시스템 데이터)
        const roomComposition = this.safeSelect('[data-room-composition]');
        if (roomComposition) {
            const roomStructures = room.roomStructures || [];
            roomComposition.textContent = roomStructures.length > 0 ? roomStructures.join(', ') : '-';
        }

        // 인원 (시스템 데이터)
        const roomCapacity = this.safeSelect('[data-room-capacity]');
        if (roomCapacity) {
            const capacity = `기준 ${room.baseOccupancy || 2}인 / 최대 ${room.maxOccupancy || 4}인`;
            roomCapacity.textContent = capacity;
        }

        // 체크인 (시스템 데이터)
        const roomCheckin = this.safeSelect('[data-room-checkin]');
        if (roomCheckin) {
            roomCheckin.textContent = room.timeSettings?.checkin || '-';
        }

        // 체크아웃 (시스템 데이터)
        const roomCheckout = this.safeSelect('[data-room-checkout]');
        if (roomCheckout) {
            roomCheckout.textContent = room.timeSettings?.checkout || '-';
        }

        // 객실 이용규칙/안내사항 (시스템 데이터)
        const roomGuide = this.safeSelect('[data-room-guide]');
        if (roomGuide) {
            const usageGuideSection = roomGuide.closest('[data-room-usage-guide]');
            const amenitiesSection = this.safeSelect('[data-room-amenities]');
            const roomInfo = (room.roomInfo || '').trim();

            // roomInfo가 없으면 Room Information 섹션(제목 포함) 미노출
            if (!roomInfo) {
                if (usageGuideSection) usageGuideSection.style.display = 'none';
                roomGuide.innerHTML = '';
                // 사라진 섹션만큼 amenities에 하단 여백 보정
                if (amenitiesSection) amenitiesSection.classList.add('room-info-hidden');
            } else {
                if (usageGuideSection) usageGuideSection.style.display = '';
                roomGuide.innerHTML = this._formatTextWithLineBreaks(roomInfo);
                if (amenitiesSection) amenitiesSection.classList.remove('room-info-hidden');
            }
        }
    }

    /**
     * 객실 편의시설/특징 매핑
     * rooms[index].amenities → [data-room-amenities-grid]
     */
    mapRoomAmenities() {
        const room = this.getCurrentRoom();
        if (!room) return;

        const amenitiesGrid = this.safeSelect('[data-room-amenities-grid]');
        const amenitiesSection = this.safeSelect('[data-room-amenities]');

        if (!amenitiesGrid) return;

        // amenities가 없으면 섹션 숨김
        if (!room.amenities || room.amenities.length === 0) {
            if (amenitiesSection) amenitiesSection.style.display = 'none';
            return;
        }

        // DocumentFragment를 사용하여 성능 최적화
        const fragment = document.createDocumentFragment();

        // 어메니티 아이템들 생성
        room.amenities.forEach(amenity => {
            const amenityDiv = document.createElement('div');
            amenityDiv.className = 'amenity-item';

            const amenityName = amenity.name?.ko || amenity.name || amenity;

            amenityDiv.innerHTML = `
                <span class="amenity-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0.5" y="0.5" width="15" height="15" rx="2" stroke="currentColor"/>
                        <path d="M4 8L6.5 10.5L12 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
                <span class="amenity-name">${this.sanitizeText(amenityName, '편의시설')}</span>
            `;

            fragment.appendChild(amenityDiv);
        });

        // DOM에 한 번만 추가하여 리플로우 최소화
        amenitiesGrid.innerHTML = '';
        amenitiesGrid.appendChild(fragment);
    }


    /**
     * 갤러리 아이템 생성 헬퍼 메서드 - 간소화된 버전
     */
    _createGalleryItem(image, roomName) {

        const item = document.createElement('div');
        item.className = 'gallery-item';

        // 이미지 요소
        const img = document.createElement('img');
        if (image && image.url) {
            img.src = image.url;
            img.alt = image.description || roomName || 'Room Gallery';
        } else {
            // ImageHelpers.applyPlaceholder() 사용
            ImageHelpers.applyPlaceholder(img);
            img.alt = 'Gallery Image';
        }

        // 이미지 로드 실패 시 에러 로깅
        img.onerror = () => console.error('Image failed to load:', img.src);

        // 오버레이
        const overlay = document.createElement('div');
        overlay.className = 'gallery-item-overlay';

        // 설명 - description이 있고 빈 문자열이 아닐 경우에만 표시
        const description = document.createElement('p');
        description.className = 'gallery-item-description';
        if (image?.description && image.description.trim() !== '') {
            description.textContent = image.description;
        } else {
            description.textContent = ''; // 빈 문자열로 설정하여 숨김
        }

        // 구조 조립
        item.appendChild(img);
        item.appendChild(overlay);
        item.appendChild(description);

        return item;
    }

    /**
     * 활성 갤러리 아이템 설정
     */
    setActiveGalleryItem(activeItem) {
        const container = this.safeSelect('[data-room-gallery]');
        if (!container) return;

        // 모든 아이템에서 active 클래스 제거
        const allItems = container.querySelectorAll('.gallery-item');
        allItems.forEach(item => {
            item.classList.remove('gallery-item-active');
        });

        // 클릭된 아이템에 active 클래스 추가
        activeItem.classList.add('gallery-item-active');
    }


    /**
     * 갤러리 섹션 매핑 (customFields 우선)
     * homepage.customFields.pages.room[index].sections[0].gallery.title → [data-room-gallery-title]
     * customFields.roomtypes[index].images (roomtype_exterior) → [data-room-gallery]
     */
    mapGallerySection() {
        const room = this.getCurrentRoom();
        if (!room) {
            console.error('No room found, exiting mapGallerySection');
            return;
        }

        // 갤러리 제목 매핑
        const galleryTitle = this.safeSelect('[data-room-gallery-title]');
        if (galleryTitle) {
            const roomPageData = this.getCurrentRoomPageData();
            const galleryTitleText = roomPageData?.data?.sections?.[0]?.gallery?.title;
            galleryTitle.textContent = this.sanitizeText(galleryTitleText, '객실 갤러리');
        }

        // 갤러리 컨테이너
        const galleryContainer = this.safeSelect('[data-room-gallery]');
        if (!galleryContainer) return;

        // customFields 이미지 사용 (실제 선택된 이미지만 반환, 최대 4장)
        const GALLERY_MAX_COUNT = 4;
        const selectedImages = this.getRoomImages(room, 'roomtype_exterior').slice(0, GALLERY_MAX_COUNT);

        // 기존 갤러리 초기화
        galleryContainer.innerHTML = '';

        // 이미지가 없으면 섹션 자체를 숨김
        const gallerySection = galleryContainer.closest('.room-gallery-section');
        if (selectedImages.length === 0) {
            if (gallerySection) gallerySection.style.display = 'none';
            return;
        }
        if (gallerySection) gallerySection.style.display = '';

        // 1장이면 풀 이미지, 2장 이상이면 아코디언
        galleryContainer.classList.toggle('gallery-single', selectedImages.length === 1);

        // 실제 이미지 개수만큼 갤러리 아이템 생성 (1~4개)
        selectedImages.forEach(imgData => {
            const item = this._createGalleryItem(imgData, room.name);
            galleryContainer.appendChild(item);
        });


        // 갤러리 초기화
        setTimeout(() => {
            if (typeof window.initRoomGallery === 'function') {
                window.initRoomGallery();
            }
        }, 100);
    }



    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Room 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            console.error('Cannot map room page: data not loaded');
            return;
        }

        const room = this.getCurrentRoom();
        if (!room) {
            console.error('Cannot map room page: room not found');
            return;
        }

        // 순차적으로 각 섹션 매핑
        this.mapHeroSlider();            // Hero slider at top
        this.mapBasicInfo();             // Room name, thumbnail, description
        this.mapRoomDetailSlider();      // Room detail slider + thumbnails
        this.mapRoomDetails();           // Size, bed types, composition, capacity, checkin, checkout, guide
        this.mapRoomAmenities();         // Amenities grid
        this.mapGallerySection();        // Exterior gallery section

        // 메타 태그 업데이트 (페이지별 SEO 적용)
        const property = this.data.property;
        const pageSEO = {
            title: (room?.name && property?.name) ? `${room.name} - ${property.name}` : 'SEO 타이틀',
            description: room?.description || property?.description || 'SEO 설명'
        };
        this.updateMetaTags(pageSEO);

        // OG 이미지 업데이트 (객실 이미지 사용)
        this.updateOGImage(room);

        // E-commerce registration 매핑
        this.mapEcommerceRegistration();

        // 슬라이더 재초기화는 이미지 onload에서 처리
        // this.reinitializeHeroSlider();

        // 애니메이션 재초기화 (동적 요소들에 대해)
        this.reinitializeAnimations();
    }

    /**
     * 애니메이션 재초기화
     */
    reinitializeAnimations() {
        if (typeof window.initRoomAnimations === 'function') {
            window.initRoomAnimations();
        }
    }


    /**
     * OG 이미지 업데이트 (객실 이미지 사용, 없으면 로고)
     * @param {Object} room - 현재 객실 데이터
     */
    updateOGImage(room) {
        if (!this.isDataLoaded || !room) return;

        const ogImage = this.safeSelect('meta[property="og:image"]');
        if (!ogImage) return;

        // room.images[0]에서 thumbnail, interior, exterior 순으로 첫 번째 이미지 찾기
        const imageSources = [
            room.images?.[0]?.thumbnail,
            room.images?.[0]?.interior,
            room.images?.[0]?.exterior,
        ];

        const firstImageArray = imageSources.find(arr => Array.isArray(arr) && arr.length > 0);
        const imageUrl = firstImageArray?.[0]?.url;

        // 우선순위: 객실 이미지 > 로고 이미지
        if (imageUrl) {
            ogImage.setAttribute('content', imageUrl);
        } else {
            const defaultImage = this.getDefaultOGImage();
            if (defaultImage) {
                ogImage.setAttribute('content', defaultImage);
            }
        }
    }
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoomMapper;
} else {
    window.RoomMapper = RoomMapper;
}

// ============================================================================
// 🚀 INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    const roomMapper = new RoomMapper();

    try {
        // 데이터 로드
        await roomMapper.loadData();

        // 페이지 매핑 실행
        await roomMapper.mapPage();
    } catch (error) {
        console.error('Error initializing room mapper:', error);
    }
});
