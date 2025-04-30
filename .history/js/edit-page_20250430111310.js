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
const village = document.getElementById("village"); // now a text input

// Address options (commune, district, province only)
const addressOptions = {
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
        { value: "Province 3", label: "ខេត្ត ក្អាត់" },
        { value: "Province 4", label: "រាជធានី ភ្នំពេញ" },
        { value: "Province 5", label: "ខេត្ត បន្ទាយមានជ័យ" },
        { value: "Province 6", label: "ខេត្ត បាត់ដំបង" },
        { value: "Province 7", label: "ខេត្ត កំពង់ចាម" },
        { value: "Province 8", label: "ខេត្ត កំពង់ឆ្នាំង" },
        { value: "Province 9", label: "ខេត្ត កំពង់ស្ពឺ" },
        { value: "Province 10", label: "ខេត្ត កំពង់ធំ" },
        { value: "Province 11", label: "ខេត្ត កំពត" },
        { value: "Province 12", label: "ខេត្ត កែប" },
        { value: "Province 13", label: "ខេត្ត កោះកុង" },
        { value: "Province 14", label: "ខេត្ត ក្រចេះ" },
        { value: "Province 15", label: "ខេត្ត មណ្ឌលគិរី" },
        { value: "Province 16", label: "ខេត្ត អូរដែរមានជ័យ" },
        { value: "Province 17", label: "ខេត្ត ប៉ៃលិន" },
        { value: "Province 18", label: "ខេត្ត ព្រះវិហារ" },
        { value: "Province 19", label: "ខេត្ត ពោធិ៍សាត់" },
        { value: "Province 20", label: "ខេត្ត រតនគិរី" },
        { value: "Province 21", label: "ខេត្ត សៀមរាប" },
        { value: "Province 22", label: "ខេត្ត ព្រះសីហនុ" },
        { value: "Province 23", label: "ខេត្ត ស្ទឹងត្រែង" },
        { value: "Province 24", label: "ខេត្ត ស្វាយរៀង" },
        { value: "Province 25", label: "ខេត្ត តាកែវ" },
        { value: "Province 26", label: "ខេត្ត ត្បូងឃ្មុំ" }
    ]    
    
};

// Populate commune, district, and province dropdowns
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
                village.value = patientData.address.village || ""; // Text input
                setSelectedValue(commune, patientData.address.commune, "commune");
                setSelectedValue(district, patientData.address.district, "district");
                setSelectedValue(province, patientData.address.province, "province");
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

// Helper to set selected value in dropdown
function setSelectedValue(value, currentValue, dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
        const options = Array.from(dropdown.options);
        options.forEach(option => {
            if (option.value === currentValue) {
                option.selected = true;
            }
        });
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
                village: village.value.trim() // free text
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

// Init
populateAddressDropdowns();
loadPatientData();
