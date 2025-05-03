// Import Firebase functions
import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Import address data
import { commune } from './commune-data.js';
import { district } from './district-data.js';
import { province } from './province-data.js';
import { addressRelationships } from './address-data.js';

// Get patient ID from URL
const urlParams = new URLSearchParams(window.location.search);
const patientId = urlParams.get("id");

// Debug log
console.log("Patient ID from URL:", patientId);

// Get form elements
const editPatientForm = document.getElementById("editPatientForm");
const editFullName = document.getElementById("editFullName");
const editAge = document.getElementById("editAge");
const editGender = document.getElementById("editGender");
const editPhone = document.getElementById("editPhone");
const editNotes = document.getElementById("editNotes");

// Address fields
const provinceInput = document.getElementById("province");
const districtInput = document.getElementById("district");
const communeInput = document.getElementById("commune");
const villageInput = document.getElementById("village");
const villageSuggestions = document.getElementById("village-suggestions");

// Initialize autocomplete for commune, district, and province
function initAutocompleteField(fieldId, options) {
    const input = document.getElementById(fieldId);
    const suggestions = document.getElementById(`${fieldId}-suggestions`);

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

                // Auto-fill based on selected commune
                if (fieldId === 'commune' && addressRelationships.communes[item]) {
                    const related = addressRelationships.communes[item];
                    districtInput.value = related.district;
                    provinceInput.value = related.province;
                    showVillageSuggestions(); // Load new village list
                }
            });
            suggestions.appendChild(li);
        });

        suggestions.style.display = filtered.length > 0 ? 'block' : 'none';
    };

    input.addEventListener('focus', () => showSuggestions(input.value));
    input.addEventListener('input', () => showSuggestions(input.value));

    document.addEventListener('click', (e) => {
        if (e.target !== input) {
            suggestions.style.display = 'none';
        }
    });
}

// Village dropdown linked to selected commune
function showVillageSuggestions() {
    const selectedCommune = communeInput.value.trim();
    const enteredVillage = villageInput.value.trim().toLowerCase();
    const villages = addressRelationships.villages[selectedCommune] || [];

    villageSuggestions.innerHTML = '';

    const filtered = villages.filter(v => v.toLowerCase().includes(enteredVillage));
    filtered.forEach(v => {
        const li = document.createElement('li');
        li.textContent = v;
        li.addEventListener('click', () => {
            villageInput.value = v;
            villageSuggestions.style.display = 'none';
        });
        villageSuggestions.appendChild(li);
    });

    villageSuggestions.style.display = filtered.length > 0 ? 'block' : 'none';
}

// Show suggestions on input and focus
villageInput.addEventListener('input', showVillageSuggestions);
villageInput.addEventListener('focus', showVillageSuggestions);

// Hide village dropdown on outside click
document.addEventListener('click', (e) => {
    if (e.target !== villageInput) {
        villageSuggestions.style.display = 'none';
    }
});

// Load patient data
async function loadPatientData() {
    if (!patientId) {
        alert("Invalid patient ID");
        console.error("No patient ID found in URL.");
        window.location.href = "doctor.html";
        return;
    }

    try {
        const patientRef = ref(db, `patients/${patientId}`);
        console.log("Fetching from path:", `patients/${patientId}`);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();
            console.log("Patient data found:", patientData);

            editFullName.value = patientData.fullName || "";
            editAge.value = patientData.age || "";
            editGender.value = patientData.gender || "";
            editPhone.value = patientData.phone || "";
            editNotes.value = patientData.notes || "";

            if (patientData.address) {
                villageInput.value = patientData.address.village || "";
                communeInput.value = patientData.address.commune || "";

                const related = addressRelationships.communes[patientData.address.commune];
                if (related) {
                    districtInput.value = related.district;
                    provinceInput.value = related.province;
                } else {
                    districtInput.value = patientData.address.district || "";
                    provinceInput.value = patientData.address.province || "";
                }

                showVillageSuggestions();
            }
        } else {
            console.warn("No data found at patients/" + patientId);
            alert("Patient not found!");
            window.location.href = "doctor.html";
        }
    } catch (error) {
        console.error("Firebase error:", error.message);
        alert("Failed to load patient data. See console for details.");
    }
}


// Submit form
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

// Initialize
initAutocompleteField('commune', commune);
initAutocompleteField('district', district);
initAutocompleteField('province', province);
loadPatientData();
