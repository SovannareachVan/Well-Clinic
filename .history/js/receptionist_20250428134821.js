// Import Firebase functions
import { db } from './firebase-config.js';
import { ref, push, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Address options data
const addressOptions = {
    villages: [
        { value: "Village 1", label: "ភូមិ ទួលក្របៅ" },
        { value: "Village 2", label: "ភូមិ សាមកុក" },
        { value: "Village 3", label: "ភូមិ ហាបី" }
    ],
    communes: [
        { value: "Commune 1", label: "ឃុំ គគីរ" },
        { value: "Commune 2", label: "ឃុំ កាស" },
        { value: "Commune 3", label: "ឃុំ ក្អែក" }
    ],
    districts: [
        { value: "District 1", label: "ស្រុក កៀនស្វាយ" },
        { value: "District 2", label: "ស្រុក ក្អែក" },
        { value: "District 3", label: "ស្រុក កាស" }
    ],
    provinces: [
        { value: "Province 1", label: "ខេត្ត ព្រៃវែង" },
        { value: "Province 2", label: "ខេត្ត កណ្តាល" },
        { value: "Province 3", label: "ខេត្ត ក្អាត់" }
    ]
};

// Function to populate dropdown options
function populateDropdown(selectId, options) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Clear existing options except the first one
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Add new options
    options.forEach(option => {
        const optElement = document.createElement('option');
        optElement.value = option.value;
        optElement.textContent = option.label;
        select.appendChild(optElement);
    });
}

// Function to show popup message
function showPopup(title, message) {
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const popupContainer = document.getElementById('popup-container');
    
    if (popupTitle && popupMessage && popupContainer) {
        popupTitle.textContent = title;
        popupMessage.textContent = message;
        popupContainer.style.display = 'flex';
    }
}

// Wait until DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get references to form and UI elements
    const patientForm = document.getElementById('patientForm');
    const closePopupBtn = document.querySelector('.close-popup');

    if (!patientForm) {
        console.error('patientForm not found!');
        return;
    }

    // Populate address dropdowns
    populateDropdown('village', addressOptions.villages);
    populateDropdown('commune', addressOptions.communes);
    populateDropdown('district', addressOptions.districts);
    populateDropdown('province', addressOptions.provinces);

    // Close popup event
    if (closePopupBtn) {
        closePopupBtn.addEventListener('click', () => {
            const popupContainer = document.getElementById('popup-container');
            if (popupContainer) {
                popupContainer.style.display = 'none';
            }
        });
    }

    // Optional: Hide popup when clicking outside of popup
    const popupContainer = document.getElementById('popup-container');
    if (popupContainer) {
        popupContainer.addEventListener('click', (event) => {
            if (event.target === popupContainer) {
                popupContainer.style.display = 'none';
            }
        });
    }

    // Handle form submission
    patientForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Get input values
        const fullName = document.getElementById('fullName').value.trim();
        const age = document.getElementById('age').value.trim();
        const gender = document.getElementById('gender').value;
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email')?.value.trim() || '';
        const notes = document.getElementById('notes').value.trim();

        const village = document.getElementById('village').value.trim();
        const commune = document.getElementById('commune').value.trim();
        const district = document.getElementById('district').value.trim();
        const province = document.getElementById('province').value.trim();

        // Create structured address object
        const address = {
            village: village.replace('Village ', ''),
            commune: commune.replace('Commune ', ''),
            district: district.replace('District ', ''),
            province: province.replace('Province ', '')
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
                address,  // Now saving as structured object
                notes,
                timestamp: new Date().toISOString()
            });

            showPopup("ជោគជ័យ", "ការចុះឈ្មោះបានជោគជ័យ!");
            patientForm.reset();
        } catch (error) {
            console.error("Error saving patient:", error);
            showPopup("កំហុស", "ការចុះឈ្មោះមានបញ្ហា សូមព្យាយាមម្ដងទៀត។");
        }
    });
});