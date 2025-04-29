// Import Firebase functions
import { db } from './firebase-config.js'; 
import { ref, push, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Get references to form and UI elements
const patientForm = document.getElementById('patientForm');
const popupContainer = document.getElementById('popup-container');
const popupTitle = document.getElementById('popup-title');
const popupMessage = document.getElementById('popup-message');
const closePopupBtn = document.querySelector('.close-popup');

// Function to show popup message (Keep only one instance)
function showPopup(title, message) {
    popupTitle.textContent = title;
    popupMessage.textContent = message;
    popupContainer.style.display = 'flex';
}

// Close popup event
closePopupBtn.addEventListener('click', () => {
    popupContainer.style.display = 'none';
});

// Optional: Hide popup when clicking outside of it
popupContainer.addEventListener('click', (event) => {
    if (event.target === popupContainer) {
        popupContainer.style.display = 'none';
    }
});

patientForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Get input values
    const fullName = document.getElementById('fullName').value.trim();
    const age = document.getElementById('age').value.trim();
    const gender = document.getElementById('gender').value; // select -> no .trim()
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const notes = document.getElementById('notes').value.trim();

    // Get address select values (select -> no .trim())
    const village = document.getElementById('village').value;
    const commune = document.getElementById('commune').value;
    const district = document.getElementById('district').value;
    const province = document.getElementById('province').value;

    // Combine address fields
    const address = `${village}, ${commune}, ${district}, ${province}`;

    // Validate inputs
    if (!fullName || !age || !gender || !phone || !village || !commune || !district || !province) {
        showPopup("Error", "សូមបំពេញព័ត៌មានទាំងអស់ (Please fill in all required fields).");
        return;
    }

    try {
        // Push data to Firebase
        const patientRef = push(ref(db, 'patients'));
        await set(patientRef, {
            fullName,
            age,
            gender,
            phone,
            email,
            address, // new combined address
            notes,
            timestamp: new Date().toISOString()
        });

        // Show success popup
        showPopup("Success", "Patient registered successfully!");

        // Reset form after submission
        patientForm.reset();
    } catch (error) {
        console.error("Error adding document: ", error);
        showPopup("Error", "Failed to register patient. Try again.");
    }
});
