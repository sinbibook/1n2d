/**
 * Intro Blocks Dynamic Generation
 * 홀수 블록: 이미지 왼쪽, 텍스트 오른쪽 (오른쪽 정렬)
 * 짝수 블록: 텍스트 왼쪽 (왼쪽 정렬), 이미지 오른쪽
 */

document.addEventListener('DOMContentLoaded', function() {
    // 예시 데이터 - 실제로는 API나 JSON에서 가져올 수 있음
    const introData = [
        {
            title: '특별한 휴식',
            description: '자연과 함께하는 프라이빗한 공간에서 진정한 휴식을 경험하세요.',
            image: 'images/pool.jpg'
        },
        // 두 번째 블록 예시 (필요시 주석 해제)
        /*
        {
            title: '프라이빗 공간',
            description: '오직 당신만을 위한 특별한 시간과 공간을 제공합니다.',
            image: 'images/pool2.jpg'
        }
        */
    ];

    function generateIntroBlocks() {
        const container = document.querySelector('.intro-section');
        if (!container) return;

        // 기존 블록 제거 (하드코딩된 것 제외)
        const existingBlocks = container.querySelectorAll('.intro-block');
        existingBlocks.forEach(block => {
            if (!block.hasAttribute('data-static')) {
                block.remove();
            }
        });

        // 데이터가 없으면 하드코딩된 블록만 유지
        if (!introData || introData.length === 0) {
            return;
        }

        // 동적 블록 생성
        introData.forEach((data, index) => {
            const blockElement = createIntroBlock(data, index);
            container.appendChild(blockElement);
        });
    }

    function createIntroBlock(data, index) {
        const block = document.createElement('div');
        block.className = 'intro-block';

        // 이미지 컨테이너
        const imageContainer = document.createElement('div');
        imageContainer.className = 'intro-block-image';

        const img = document.createElement('img');
        img.src = data.image;
        img.alt = data.title;

        imageContainer.appendChild(img);

        // 텍스트 컨테이너
        const contentContainer = document.createElement('div');
        contentContainer.className = 'intro-block-content';

        const title = document.createElement('h2');
        title.className = 'intro-block-title';
        title.textContent = data.title;

        const description = document.createElement('p');
        description.className = 'intro-block-description';
        description.textContent = data.description;

        contentContainer.appendChild(title);
        contentContainer.appendChild(description);

        // 블록에 추가
        block.appendChild(imageContainer);
        block.appendChild(contentContainer);

        return block;
    }

    // 동적 블록 생성 실행 (선택사항 - 필요시 주석 해제)
    // generateIntroBlocks();
});