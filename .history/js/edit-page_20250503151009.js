// Import Firebase functions
import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Import address data
import { commune } from './commune-data.js';
import { district } from './district-data.js';
import { province } from './province-data.js';
import { addressRelationships } from './address-data.js'; // ✅ Add this line

// Get patient ID from URL
const urlParams = new URLSearchParams(window.location.search);
const patientId = urlParams.get("id");

// Get form elements
const editPatientForm = document.getElementById("editPatientForm");
const editFullName = document.getElementById("editFullName");
const editAge = document.getElementById("editAge");
const editGender = document.getElementById("editGender");
const editPhone = document.getElementById("editPhone");
const editNotes = document.getElementById("editNotes");

// Address fields (now text inputs with autocomplete)
const provinceInput = document.getElementById("province");
const districtInput = document.getElementById("district");
const communeInput = document.getElementById("commune");
const villageInput = document.getElementById("village");

// Initialize autocomplete for each field
function initAutocomplete() {
    initAutocompleteField('commune', commune);
    initAutocompleteField('district', district);
    initAutocompleteField('province', province);
}

// Set up autocomplete functionality
function initAutocompleteField(fieldId, options) {
    const input = document.getElementById(fieldId);
    const suggestions = document.getElementById(`${fieldId}-suggestions`);

    // Show suggestions on focus and input
    const showSuggestions = (value) => {
        const val = value.trim().toLowerCase();
        const filtered = options.filter(item => item.toLowerCase().includes(val));
        suggestions.innerHTML = '';

        filtered.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            li.addEventListener('click', () => {
                input.value = item;
                suggestions.style.display = 'none';

                // ✅ Auto-fill district and province if commune is selected
                if (fieldId === 'commune' && addressRelationships.communes[item]) {
                    const related = addressRelationships.communes[item];
                    document.getElementById('district').value = related.district;
                    document.getElementById('province').value = related.province;
                }
            });
            suggestions.appendChild(li);
        });

        suggestions.style.display = filtered.length > 0 ? 'block' : 'none';
    };

    input.addEventListener('focus', () => showSuggestions(input.value));
    input.addEventListener('input', () => showSuggestions(input.value));

    // Hide when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== input) {
            suggestions.style.display = 'none';
        }
    });
}

// Load patient data
async function loadPatientData() {
    if (!patientId) {
        alert("Invalid patient ID");
        window.location.href = "doctor.html"; 
        return;
    }

    try {
        const patientRef = ref(db, `patients/${patientId}`);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();

            // Fill form fields
            editFullName.value = patientData.fullName || "";
            editAge.value = patientData.age || "";
            editGender.value = patientData.gender || "";
            editPhone.value = patientData.phone || "";
            editNotes.value = patientData.notes || "";

            // Handle address data if it exists
            if (patientData.address) {
                villageInput.value = patientData.address.village || "";
                communeInput.value = patientData.address.commune || "";
                
                // ✅ Auto-fill based on stored commune
                const related = addressRelationships.communes[patientData.address.commune];
                if (related) {
                    districtInput.value = related.district;
                    provinceInput.value = related.province;
                } else {
                    districtInput.value = patientData.address.district || "";
                    provinceInput.value = patientData.address.province || "";
                }
            }
        } else {
            alert("Patient not found!");
            window.location.href = "doctor.html"; 
        }
    } catch (error) {
        console.error("Error fetching patient data:", error);
        alert("Failed to load patient data.");
    }
}

// Handle form submission
editPatientForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        const updatedData = {
            fullName: editFullName.value.trim(),
            age: editAge.value.trim(),
            gender: editGender.value,
            phone: editPhone.value.trim(),
            notes: editNotes.value.trim(),
            address: {
                province: provinceInput.value.trim(),
                district: districtInput.value.trim(),
                commune: communeInput.value.trim(),
                village: villageInput.value.trim()
            }
        };

        await update(ref(db, `patients/${patientId}`), updatedData);

        alert("Patient information updated successfully!");
        window.location.href = "doctor.html"; 
    } catch (error) {
        console.error("Error updating patient data:", error);
        alert("Failed to update patient information.");
    }
});

// ✅ Initialize everything
initAutocomplete();
loadPatientData();
