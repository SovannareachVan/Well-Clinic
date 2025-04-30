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

// Address fields
const province = document.getElementById("province");
const district = document.getElementById("district");
const commune = document.getElementById("commune");
const village = document.getElementById("village");

// Address options (direct Khmer values)
const addressOptions = {
    communes: [
        { value: "ឃុំ គគីរ", label: "ឃុំ គគីរ" },
        { value: "ឃុំ កាស", label: "ឃុំ កាស" },
        { value: "ឃុំ ក្អែក", label: "ឃុំ ក្អែក" }
    ],
    districts: [
        { value: "ស្រុក កៀនស្វាយ", label: "ស្រុក កៀនស្វាយ" },
        { value: "ស្រុក ក្អែក", label: "ស្រុក ក្អែក" },
        { value: "ស្រុក កាស", label: "ស្រុក កាស" }
    ],
    provinces: [
        { value: "ខេត្ត ព្រៃវែង", label: "ខេត្ត ព្រៃវែង" },
        { value: "ខេត្ត កណ្តាល", label: "ខេត្ត កណ្តាល" },
        { value: "ខេត្ត ក្អាត់", label: "ខេត្ត ក្អាត់" }
    ]
};

// Populate dropdowns
function populateAddressDropdowns() {
    const populateDropdown = (dropdown, options) => {
        dropdown.innerHTML = options.map(option => 
            `<option value="${option.value}">${option.label}</option>`
        ).join('');
    };

    populateDropdown(commune, addressOptions.communes);
    populateDropdown(district, addressOptions.districts);
    populateDropdown(province, addressOptions.provinces);
}

// Set selected dropdown value
function setSelectedValue(dropdown, currentValue) {
    for (let option of dropdown.options) {
        if (option.value === currentValue) {
            option.selected = true;
            return;
        }
    }
    dropdown.selectedIndex = 0; // Fallback
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

            // Address data
            if (patientData.address) {
                village.value = patientData.address.village || "";
                setSelectedValue(commune, patientData.address.commune);
                setSelectedValue(district, patientData.address.district);
                setSelectedValue(province, patientData.address.province);
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
                village: village.value.trim()
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
populateAddressDropdowns();
loadPatientData();