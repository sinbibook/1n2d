// Mobile menu initialization
function initMobileMenu() {
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileCloseBtn = document.querySelector('.mobile-toggle--close');
  const menuSections = document.querySelectorAll('.mobile-menu-section');
  const body = document.body;

  // Get current page from URL
  function getCurrentPage() {
    const path = window.location.pathname;
    const pageName = path.substring(path.lastIndexOf('/') + 1).replace('.html', '');
    return pageName || 'index';
  }

  // Open mobile menu
  function openMenu() {
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';

    // Auto-open current page's menu section
    openCurrentPageSection();
  }

  // Open the menu section that contains current page
  function openCurrentPageSection() {
    const currentPage = getCurrentPage();
    let foundCurrentPage = false;

    menuSections.forEach(section => {
      const subItems = section.querySelectorAll('.mobile-sub-item');

      subItems.forEach(item => {
        // Remove any existing current-page class
        item.classList.remove('current-page');

        // Check if this item's link matches current page
        const onclick = item.getAttribute('onclick');
        const href = item.getAttribute('href');
        let isCurrentPage = false;

        if (onclick && onclick.includes(`'${currentPage}'`)) {
          isCurrentPage = true;
        } else if (href && href.includes(currentPage)) {
          isCurrentPage = true;
        } else if (onclick && onclick.includes('window.location.href')) {
          const match = onclick.match(/['"](.*?)['"]/);
          if (match && match[1].includes(currentPage)) {
            isCurrentPage = true;
          }
        }

        if (isCurrentPage) {
          // Mark as current page
          item.classList.add('current-page');
          foundCurrentPage = true;

          // Open this section
          section.classList.add('is-open');
          const sectionSubItems = section.querySelector('.mobile-sub-items');
          if (sectionSubItems) {
            sectionSubItems.classList.add('active');
          }
        }
      });
    });

    return foundCurrentPage;
  }

  // Close mobile menu
  function closeMenu() {
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';

    // Close all accordion sections when closing menu
    menuSections.forEach(section => {
      section.classList.remove('is-open');
      const subItems = section.querySelector('.mobile-sub-items');
      if (subItems) {
        subItems.classList.remove('active');
      }
    });
  }

  // Mobile menu toggle button
  if (mobileToggle) {
    mobileToggle.addEventListener('click', openMenu);
  }

  // Mobile menu close button
  if (mobileCloseBtn) {
    mobileCloseBtn.addEventListener('click', closeMenu);
  }

  // Accordion functionality for menu sections
  menuSections.forEach(section => {
    const title = section.querySelector('.mobile-menu-title');

    if (title) {
      title.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const isOpen = section.classList.contains('is-open');
        const subItems = section.querySelector('.mobile-sub-items');

        // Close all other sections
        menuSections.forEach(otherSection => {
          if (otherSection !== section) {
            otherSection.classList.remove('is-open');
            const otherSubItems = otherSection.querySelector('.mobile-sub-items');
            if (otherSubItems) {
              otherSubItems.classList.remove('active');
            }
          }
        });

        // Toggle current section
        if (!isOpen) {
          section.classList.add('is-open');
          if (subItems) {
            subItems.classList.add('active');
          }
        } else {
          section.classList.remove('is-open');
          if (subItems) {
            subItems.classList.remove('active');
          }
        }
      });
    }
  });

  // Close menu when clicking outside
  if (mobileMenu) {
    mobileMenu.addEventListener('click', function(e) {
      if (e.target === mobileMenu) {
        closeMenu();
      }
    });
  }

  // Close menu with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('is-open')) {
      closeMenu();
    }
  });
}

// Make function available globally
window.initMobileMenu = initMobileMenu;

// Initialize when DOM is ready or when called dynamically
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initMobileMenu, 200);
  });
} else {
  // DOM is already loaded - wait a bit for header to be injected
  setTimeout(initMobileMenu, 200);
}

// Also try to initialize when window fully loads (as backup)
window.addEventListener('load', () => {
  setTimeout(initMobileMenu, 300);
});