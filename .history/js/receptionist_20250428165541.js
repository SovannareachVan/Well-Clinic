// Import Firebase functions
import { db } from './firebase-config.js';
import { ref, push, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Address Mapping (same as in your patient detail page)
const addressMapping = {
    village: {
        "Village 1": "ទួលក្របៅ",
        "Village 2": "សាមកុក",
        "Village 3": "ហាបី"
    },
    commune: {
        "Commune 1": "គគីរ",
        "Commune 2": "កាស",
        "Commune 3": "ក្អែក"
    },
    district: {
        "District 1": "កៀនស្វាយ",
        "District 2": "ក្អែក",
        "District 3": "កាស"
    },
    province: {
        "Province 1": "ព្រៃវែង",
        "Province 2": "កណ្តាល",
        "Province 3": "ក្អាត់"
    }
};

// Wait until DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get references to form and UI elements
    const patientForm = document.getElementById('patientForm');
    const popupContainer = document.getElementById('popup-container');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const closePopupBtn = document.querySelector('.close-popup');

    if (!patientForm) {
        console.error('patientForm not found!');
        return;
    }

    // Function to show popup message
    function showPopup(title, message) {
        popupTitle.textContent = title;
        popupMessage.textContent = message;
        popupContainer.style.display = 'flex';
    }

    // Close popup event
    closePopupBtn.addEventListener('click', () => {
        popupContainer.style.display = 'none';
    });

    // Optional: Hide popup when clicking outside of popup
    popupContainer.addEventListener('click', (event) => {
        if (event.target === popupContainer) {
            popupContainer.style.display = 'none';
        }
    });

    // Handle form submission
    patientForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Get input values
        const fullName = document.getElementById('fullName').value.trim();
        const age = document.getElementById('age').value.trim();
        const gender = document.getElementById('gender').value;
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
        const notes = document.getElementById('notes').value.trim();

        // Get address values and map to Khmer names
        const village = addressMapping.village[document.getElementById('village').value.trim()] || document.getElementById('village').value.trim();
        const commune = addressMapping.commune[document.getElementById('commune').value.trim()] || document.getElementById('commune').value.trim();
        const district = addressMapping.district[document.getElementById('district').value.trim()] || document.getElementById('district').value.trim();
        const province = addressMapping.province[document.getElementById('province').value.trim()] || document.getElementById('province').value.trim();

        // Store the address as an object with village, commune, district, province
        const address = {
            village,
            commune,
            district,
            province
        };

        // Validate required fields
        if (!fullName || !age || !gender || !phone || !village || !commune || !district || !province) {
            showPopup("កំហុស", "សូមបំពេញព័ត៌មានទាំងអស់។");
            return;
        }

        try {
            const patientRef = push(ref(db, 'patients'));
            await set(patientRef, {
                fullName,
                age,
                gender,
                phone,
                email,
                address,  // Save mapped address
                notes,
                timestamp: new Date().toISOString()
            });

            showPopup("ជោគជ័យ", "ការចុះឈ្មោះបានជោគជ័យ!");

            // Reset form
            patientForm.reset();
        } catch (error) {
            console.error("Error saving patient:", error);
            showPopup("កំហុស", "ការចុះឈ្មោះមានបញ្ហា សូមព្យាយាមម្ដងទៀត។");
        }
    });
});
