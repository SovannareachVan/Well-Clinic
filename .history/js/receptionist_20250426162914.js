// Import Firebase functions
import { db } from './firebase-config.js'; 
import { ref, push, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Get references to form and UI elements
const patientForm = document.getElementById('patientForm');
const popupContainer = document.getElementById('popup-container');
const popupTitle = document.getElementById('popup-title');
const popupMessage = document.getElementById('popup-message');
const closePopupBtn = document.querySelector('.close-popup');

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

// Optional: Hide popup when clicking outside
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
    const notes = document.getElementById('notes').value.trim();

    // New address fields
    const province = document.getElementById('province').value;
    const district = document.getElementById('district').value;
    const commune = document.getElementById('commune').value;
    const village = document.getElementById('village').value;

    // Validate required fields
    if (!fullName || !age || !gender || !phone || !province || !district || !commune || !village) {
        showPopup("Error", "សូមបញ្ចូលទិន្នន័យទាំងអស់ដែលត្រូវការ។"); // Please fill in all required fields.
        return;
    }
    if (!fullName || !age || !gender || !phone || !village || !district || !commune || !village) {
        showPopup("Error", "សូមបញ្ចូលទិន្នន័យទាំងអស់ដែលត្រូវការ។"); // Please fill in all required fields.
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
            address: {
                province,
                district,
                commune,
                village
            },
            notes,
            timestamp: new Date().toISOString()
        });

        // Show success popup
        showPopup("Success", "បញ្ចូលទិន្នន័យអ្នកជំងឺបានជោគជ័យ!"); // Patient registered successfully!

        // Reset form after submission
        patientForm.reset();
    } catch (error) {
        console.error("Error adding patient: ", error);
        showPopup("Error", "បរាជ័យក្នុងការបញ្ចូលទិន្នន័យ។ សូមព្យាយាមម្តងទៀត។"); // Failed to register patient.
    }
});
