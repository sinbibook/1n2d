/**
 * Accordion functionality for room.html and other pages
 * Handles expand/collapse animation with smooth transitions
 */
class AccordionController {
    constructor() {
        this.accordions = [];
        this.init();
    }

    /**
     * Initialize all accordions on the page
     */
    init() {
        const accordionButtons = document.querySelectorAll('[data-accordion-button], .accordion-content ~ button, button + .accordion-content');

        // Find buttons that have accordion-content siblings
        const buttons = document.querySelectorAll('button');
        buttons.forEach((button, index) => {
            const nextElement = button.nextElementSibling;
            if (nextElement && nextElement.classList.contains('accordion-content')) {
                this.setupAccordion(button, nextElement);
            }
        });


    }

    /**
     * Setup individual accordion
     */
    setupAccordion(button, content) {
        const accordion = {
            button: button,
            content: content,
            isOpen: content.classList.contains('accordion-open')
        };

        // Add click event listener
        button.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAccordion(accordion);
        });

        // Store reference
        this.accordions.push(accordion);

        // Setup initial state - check if already open
        if (accordion.isOpen) {
            // For initially open accordion, set up proper state
            setTimeout(() => {
                const icon = button.querySelector('svg');
                if (icon) {
                    icon.style.transform = 'rotate(45deg)';
                }
                content.style.maxHeight = content.scrollHeight + 'px';
                // Remove the accordion-open class after initial setup
                content.classList.remove('accordion-open');
            }, 50);
        } else {
            this.closeAccordion(accordion, false);
        }
    }

    /**
     * Toggle accordion open/close
     */
    toggleAccordion(accordion) {
        if (accordion.isOpen) {
            this.closeAccordion(accordion);
        } else {
            // Close all other accordions first
            this.closeAll();
            this.openAccordion(accordion);
        }
    }

    /**
     * Open accordion with animation
     */
    openAccordion(accordion, animated = true) {
        const { button, content } = accordion;

        // Update state
        accordion.isOpen = true;

        // Rotate plus icon to X
        const icon = button.querySelector('svg');
        if (icon) {
            icon.style.transform = 'rotate(45deg)';
        }

        if (animated) {
            // Get the natural height
            content.style.maxHeight = 'none';
            const naturalHeight = content.scrollHeight + 'px';
            content.style.maxHeight = '0';

            // Trigger reflow
            content.offsetHeight;

            // Animate to natural height
            content.style.maxHeight = naturalHeight;

            // Clean up after animation
            setTimeout(() => {
                if (accordion.isOpen) {
                    content.style.maxHeight = 'none';
                }
            }, 300);
        } else {
            content.style.maxHeight = 'none';
        }

    }

    /**
     * Close accordion with animation
     */
    closeAccordion(accordion, animated = true) {
        const { button, content } = accordion;

        // Update state
        accordion.isOpen = false;

        // Reset plus icon
        const icon = button.querySelector('svg');
        if (icon) {
            icon.style.transform = 'rotate(0deg)';
        }

        if (animated) {
            // Get current height first
            const currentHeight = content.scrollHeight + 'px';
            content.style.maxHeight = currentHeight;

            // Trigger reflow
            content.offsetHeight;

            // Animate to 0
            content.style.maxHeight = '0';
        } else {
            content.style.maxHeight = '0';
        }

    }

    /**
     * Close all accordions
     */
    closeAll() {
        this.accordions.forEach(accordion => {
            if (accordion.isOpen) {
                this.closeAccordion(accordion);
            }
        });
    }

    /**
     * Open specific accordion by index
     */
    openByIndex(index) {
        if (index >= 0 && index < this.accordions.length) {
            this.openAccordion(this.accordions[index]);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.accordionController = new AccordionController();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccordionController;
}