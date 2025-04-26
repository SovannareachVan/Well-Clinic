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

// Optional: Hide popup when clicking outside of it
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
    const province = document.getElementById('province').value;
    const district = document.getElementById('district').value;
    const commune = document.getElementById('commune').value;
    const village = document.getElementById('village').value;
    const notes = document.getElementById('notes').value.trim();

    // Validate inputs
    if (!fullName || !age || !gender || !phone || !province || !district || !commune) {
        showPopup("Error", "សូមបំពេញព័ត៌មានចាំបាច់ទាំងអស់។"); // "Please fill in all required fields."
        return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[0-9]{9,10}$/;
    if (!phoneRegex.test(phone)) {
        showPopup("Error", "លេខទូរស័ព្ទមិនត្រឹមត្រូវ។"); // "Invalid phone number format."
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
                village: village || '', // Optional field
                street: street || ''    // Optional field
            },
            notes: notes || '', // Optional field
            timestamp: new Date().toISOString(),
            status: "registered" // You can add status tracking
        });

        // Show success popup
        showPopup("Success", "អ្នកជំងឺត្រូវបានចុះឈ្មោះដោយជោគជ័យ!"); // "Patient registered successfully!"

        // Reset form after submission (except address fields)
        patientForm.reset();
        // Reset address dropdowns
        document.getElementById('district').innerHTML = '<option value="">ជ្រើសរើសស្រុក/ខណ្ឌ</option>';
        document.getElementById('commune').innerHTML = '<option value="">ជ្រើសរើសឃុំ/សង្កាត់</option>';
        document.getElementById('village').innerHTML = '<option value="">ជ្រើសរើសភូមិ</option>';
        
    } catch (error) {
        console.error("Error adding document: ", error);
        showPopup("Error", "មានបញ្ហាក្នុងការចុះឈ្មោះអ្នកជំងឺ។ សូមព្យាយាមម្តងទៀត។"); 
        // "Failed to register patient. Try again."
    }
});

// Address dropdown population logic
const addressData = {
    "Phnom Penh": {
        "Chamkarmon": ["Tonle Bassac", "Boeng Keng Kang", "Tuol Svay Prey"],
        "Doun Penh": ["Phsar Thmei", "Phsar Kandal", "Chey Chumneas"],
        // Add more districts and communes
    },
    "Kandal": {
        "Ang Snuol": ["Phnom Baset", "Kamboul", "Chrey Loas"],
        "Kien Svay": ["Kampong Os", "Preaek Ambel", "Preaek Thmei"],
        // Add more districts and communes
    }
    // Add more provinces
};

// Province change handler
document.getElementById('province').addEventListener('change', function() {
    const province = this.value;
    const districtSelect = document.getElementById('district');
    
    // Clear existing options
    districtSelect.innerHTML = '<option value="">ជ្រើសរើសស្រុក/ខណ្ឌ</option>';
    
    if (province && addressData[province]) {
        // Add new options
        for (const district in addressData[province]) {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            districtSelect.appendChild(option);
        }
    }
    
    // Clear commune and village dropdowns
    document.getElementById('commune').innerHTML = '<option value="">ជ្រើសរើសឃុំ/សង្កាត់</option>';
    document.getElementById('village').innerHTML = '<option value="">ជ្រើសរើសភូមិ</option>';
});

// District change handler
document.getElementById('district').addEventListener('change', function() {
    const province = document.getElementById('province').value;
    const district = this.value;
    const communeSelect = document.getElementById('commune');
    
    // Clear existing options
    communeSelect.innerHTML = '<option value="">ជ្រើសរើសឃុំ/សង្កាត់</option>';
    
    if (province && district && addressData[province] && addressData[province][district]) {
        // Add new options
        addressData[province][district].forEach(commune => {
            const option = document.createElement('option');
            option.value = commune;
            option.textContent = commune;
            communeSelect.appendChild(option);
        });
    }
    
    // Clear village dropdown
    document.getElementById('village').innerHTML = '<option value="">ជ្រើសរើសភូមិ</option>';
});

// Commune change handler (sample village data)
document.getElementById('commune').addEventListener('change', function() {
    const villageSelect = document.getElementById('village');
    villageSelect.innerHTML = '<option value="">ជ្រើសរើសភូមិ</option>';
    
    // Sample villages - in a real app you would have actual data
    const sampleVillages = ["ភូមិ ១", "ភូមិ ២", "ភូមិ ៣"];
    sampleVillages.forEach(village => {
        const option = document.createElement('option');
        option.value = village;
        option.textContent = village;
        villageSelect.appendChild(option);
    });
});