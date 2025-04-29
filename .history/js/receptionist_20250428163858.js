// Import Firebase functions
import { db } from './firebase-config.js';
import { ref, push, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

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

    const village = document.getElementById('village').value.trim();
    const commune = document.getElementById('commune').value.trim();
    const district = document.getElementById('district').value.trim();
    const province = document.getElementById('province').value.trim();

    // Store the address as an object instead of a string
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
            address,  // Store the address object here
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
