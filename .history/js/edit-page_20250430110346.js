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

// Address options
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
        { value: "Phnom Penh", label: "រាជធានី ភ្នំពេញ" },
        { value: "Banteay Meanchey", label: "ខេត្ត បន្ទាយមានជ័យ" },
        { value: "Battambang", label: "ខេត្ត បាត់ដំបង" },
        { value: "Kampong Cham", label: "ខេត្ត កំពង់ចាម" },
        { value: "Kampong Chhnang", label: "ខេត្ត កំពង់ឆ្នាំង" },
        { value: "Kampong Speu", label: "ខេត្ត កំពង់ស្ពឺ" },
        { value: "Kampong Thom", label: "ខេត្ត កំពង់ធំ" },
        { value: "Kampot", label: "ខេត្ត កំពត" },
        { value: "Kandal", label: "ខេត្ត កណ្តាល" },
        { value: "Kep", label: "ខេត្ត កែប" },
        { value: "Koh Kong", label: "ខេត្ត កោះកុង" },
        { value: "Kratie", label: "ខេត្ត ក្រចេះ" },
        { value: "Mondulkiri", label: "ខេត្ត មណ្ឌលគិរី" },
        { value: "Oddar Meanchey", label: "ខេត្ត អូរដែរមានជ័យ" },
        { value: "Pailin", label: "ខេត្ត ប៉ៃលិន" },
        { value: "Preah Vihear", label: "ខេត្ត ព្រះវិហារ" },
        { value: "Prey Veng", label: "ខេត្ត ព្រៃវែង" },
        { value: "Pursat", label: "ខេត្ត ពោធិ៍សាត់" },
        { value: "Ratanakiri", label: "ខេត្ត រតនគិរី" },
        { value: "Siem Reap", label: "ខេត្ត សៀមរាប" },
        { value: "Preah Sihanouk", label: "ខេត្ត ព្រះសីហនុ" },
        { value: "Stung Treng", label: "ខេត្ត ស្ទឹងត្រែង" },
        { value: "Svay Rieng", label: "ខេត្ត ស្វាយរៀង" },
        { value: "Takeo", label: "ខេត្ត តាកែវ" },
        { value: "Tbong Khmum", label: "ខេត្ត ត្បូងឃ្មុំ" }
    ]
};

// Populate dropdowns
function populateAddressDropdowns() {
    const populate = (dropdown, options) => {
        dropdown.innerHTML = options.map(opt =>
            `<option value="${opt.value}">${opt.label}</option>`
        ).join('');
    };
    populate(commune, addressOptions.communes);
    populate(district, addressOptions.districts);
    populate(province, addressOptions.provinces);
}

// Load patient data from Firebase
async function loadPatientData() {
    if (!patientId) {
        alert("Invalid patient ID");
        window.location.href = "doctor.html";
        return;
    }

    try {
        const snapshot = await get(ref(db, `patients/${patientId}`));
        if (snapshot.exists()) {
            const data = snapshot.val();

            // Fill form fields
            editFullName.value = data.fullName || "";
            editAge.value = data.age || "";
            editGender.value = data.gender || "";
            editPhone.value = data.phone || "";
            editNotes.value = data.notes || "";

            // Address
            if (data.address) {
                village.value = data.address.village || "";
                setSelectedValue(commune, data.address.commune);
                setSelectedValue(district, data.address.district);
                setSelectedValue(province, data.address.province);
            }
        } else {
            alert("Patient not found!");
            window.location.href = "doctor.html";
        }
    } catch (err) {
        console.error("Failed to fetch patient data:", err);
        alert("Error loading patient data.");
    }
}

// Helper to set selected value
function setSelectedValue(dropdown, valueToSet) {
    const options = Array.from(dropdown.options);
    options.forEach(opt => {
        if (opt.value === valueToSet) {
            opt.selected = true;
        }
    });
}

// Handle form submit
editPatientForm.addEventListener("submit", async (e) => {
    e.preventDefault();

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

    try {
        await update(ref(db, `patients/${patientId}`), updatedData);
        alert("Patient information updated successfully!");
        window.location.href = "doctor.html";
    } catch (error) {
        console.error("Update failed:", error);
        alert("Failed to update patient information.");
    }
});

// Init
populateAddressDropdowns();
loadPatientData();
