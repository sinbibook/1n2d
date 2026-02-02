// Footer JavaScript
(function() {
    'use strict';

    // Footer functionality can be added here if needed
    // For example: dynamic year update, form submissions, etc.

    // Update copyright year dynamically
    function updateCopyrightYear() {
        const yearElements = document.querySelectorAll('.copyright');
        const currentYear = new Date().getFullYear();

        yearElements.forEach(element => {
            element.innerHTML = element.innerHTML.replace(/\d{4}/, currentYear);
        });
    }

    // Get property data from mapped data
    async function getPropertyData(key) {
        try {
            // Try to get from session storage first
            const storedData = sessionStorage.getItem('templateData');
            if (storedData) {
                const data = JSON.parse(storedData);
                return data.property?.[key];
            }

            // Otherwise, try to load from JSON files
            const jsonFiles = ['demo-filled.json', 'standard-template-data.json'];
            for (const file of jsonFiles) {
                try {
                    const response = await fetch(`/${file}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.property?.[key]) {
                            return data.property[key];
                        }
                    }
                } catch (error) {
                    console.log(`Error loading ${file}:`, error);
                }
            }
        } catch (error) {
            console.error('Error getting property data:', error);
        }
        return null;
    }

    // Handle Gpension reservation
    async function handleGpensionReservation() {
        const realtimeBookingId = await getPropertyData('realtimeBookingId');

        if (realtimeBookingId && realtimeBookingId !== '지펜션ID') {
            const reservationUrl = `https://www.bookingplay.co.kr/booking/1/${realtimeBookingId}`;
            window.open(reservationUrl, '_blank');
        }
    }

    // Initialize footer
    document.addEventListener('DOMContentLoaded', function() {
        updateCopyrightYear();

        // Set up Gpension reservation button
        const realtimeBtn = document.querySelector('[data-property-realtime-booking-id]');
        if (realtimeBtn) {
            realtimeBtn.addEventListener('click', handleGpensionReservation);
        }
    });

})();