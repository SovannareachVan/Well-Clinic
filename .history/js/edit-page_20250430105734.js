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
        "Phnom Penh": "រាជធានី ភ្នំពេញ",
        "Banteay Meanchey": "បន្ទាយមានជ័យ",
        "Battambang": "បាត់ដំបង",
        "Kampong Cham": "កំពង់ចាម",
        "Kampong Chhnang": "កំពង់ឆ្នាំង",
        "Kampong Speu": "កំពង់ស្ពឺ",
        "Kampong Thom": "កំពង់ធំ",
        "Kampot": "កំពត",
        "Kandal": "កណ្តាល",
        "Kep": "កែប",
        "Koh Kong": "កោះកុង",
        "Kratie": "ក្រចេះ",
        "Mondulkiri": "មណ្ឌលគិរី",
        "Oddar Meanchey": "អូរដែរមានជ័យ",
        "Pailin": "ប៉ៃលិន",
        "Preah Vihear": "ព្រះវិហារ",
        "Prey Veng": "ព្រៃវែង",
        "Pursat": "ពោធិ៍សាត់",
        "Ratanakiri": "រតនគិរី",
        "Siem Reap": "សៀមរាប",
        "Preah Sihanouk": "ព្រះសីហនុ",
        "Stung Treng": "ស្ទឹងត្រែង",
        "Svay Rieng": "ស្វាយរៀង",
        "Takeo": "តាកែវ",
        "Tbong Khmum": "ត្បូងឃ្មុំ"
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
