// Import Firebase functions
import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

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

// Correct Address fields (MUST match HTML IDs)
const province = document.getElementById("province");
const district = document.getElementById("district");
const commune = document.getElementById("commune");
const village = document.getElementById("village");

// Address options (these should match the options in your receptionist page)
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

// Function to populate address dropdowns
function populateAddressDropdowns() {
    const populateDropdown = (dropdown, options) => {
        dropdown.innerHTML = options.map(option => 
            `<option value="${option.value}">${option.label}</option>`
        ).join('');
    };

    populateDropdown(village, addressOptions.villages);
    populateDropdown(commune, addressOptions.communes);
    populateDropdown(district, addressOptions.districts);
    populateDropdown(province, addressOptions.provinces);
}

// Function to load patient data
// Function to load patient data
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
                // Check if address is an object (recommended format)
                if (typeof patientData.address === 'object') {
                    const { village, commune, district, province } = patientData.address;
                    
                    // Set dropdown values based on address object
                    village.value = village || "";
                    commune.value = commune || "";
                    district.value = district || "";
                    province.value = province || "";
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
                province: province.value,
                district: district.value,
                commune: commune.value,
                village: village.value
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

// Populate address dropdowns
populateAddressDropdowns();

// Load patient data on page load
loadPatientData();
