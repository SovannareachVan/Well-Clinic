// Import Firebase functions
import { db } from './firebase-config.js'; 
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Get patient ID from URL
const urlParams = new URLSearchParams(window.location.search);
const patientId = urlParams.get("id");

// Address data structure
const addressData = {
    "Phnom Penh": {
        "Chamkarmon": ["Tonle Bassac", "Boeng Keng Kang", "Tuol Svay Prey"],
        "Doun Penh": ["Phsar Thmei", "Phsar Kandal", "Chey Chumneas"],
    },
    "Kandal": {
        "Ang Snuol": ["Phnom Baset", "Kamboul", "Chrey Loas"],
        "Kien Svay": ["Kampong Os", "Preaek Ambel", "Preaek Thmei"],
    },
    "Kampong Cham": {
        "Kampong Cham": ["Kampong Cham", "Boeng Kok", "Preaek Taten"],
    }
};

// Get form elements
const editPatientForm = document.getElementById("editPatientForm");
const editFullName = document.getElementById("editFullName");
const editAge = document.getElementById("editAge");
const editGender = document.getElementById("editGender");
const editPhone = document.getElementById("editPhone");
const editProvince = document.getElementById("editProvince");
const editDistrict = document.getElementById("editDistrict");
const editCommune = document.getElementById("editCommune");
const editVillage = document.getElementById("editVillage");
const editStreet = document.getElementById("editStreet");
const editNotes = document.getElementById("editNotes");

// Function to populate districts based on province
function populateDistricts(province) {
    editDistrict.innerHTML = '<option value="">ជ្រើសរើសស្រុក/ខណ្ឌ</option>';
    if (province && addressData[province]) {
        Object.keys(addressData[province]).forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            editDistrict.appendChild(option);
        });
    }
}

// Function to populate communes based on district
function populateCommunes(province, district) {
    editCommune.innerHTML = '<option value="">ជ្រើសរើសឃុំ/សង្កាត់</option>';
    if (province && district && addressData[province] && addressData[province][district]) {
        addressData[province][district].forEach(commune => {
            const option = document.createElement('option');
            option.value = commune;
            option.textContent = commune;
            editCommune.appendChild(option);
        });
    }
}

// Province change event
editProvince.addEventListener('change', () => {
    populateDistricts(editProvince.value);
    editCommune.innerHTML = '<option value="">ជ្រើសរើសឃុំ/សង្កាត់</option>';
    editVillage.innerHTML = '<option value="">ជ្រើសរើសភូមិ</option>';
});

// District change event
editDistrict.addEventListener('change', () => {
    populateCommunes(editProvince.value, editDistrict.value);
    editVillage.innerHTML = '<option value="">ជ្រើសរើសភូមិ</option>';
});

// Commune change event (sample villages)
editCommune.addEventListener('change', () => {
    editVillage.innerHTML = '<option value="">ជ្រើសរើសភូមិ</option>';
    // Sample villages - in real app use actual data
    const villages = ["ភូមិ ១", "ភូមិ ២", "ភូមិ ៣"];
    villages.forEach(village => {
        const option = document.createElement('option');
        option.value = village;
        option.textContent = village;
        editVillage.appendChild(option);
    });
});

// Function to load patient data
async function loadPatientData() {
    if (!patientId) {
        alert("មិនមានលេខសម្គាល់អ្នកជំងឺ!");
        window.location.href = "doctor.html";
        return;
    }

    try {
        const patientRef = ref(db, `patients/${patientId}`);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();

            // Fill basic information
            editFullName.value = patientData.fullName || "";
            editAge.value = patientData.age || "";
            editGender.value = patientData.gender || "";
            editPhone.value = patientData.phone || "";
            editNotes.value = patientData.notes || "";

            // Fill address information
            if (patientData.address) {
                editProvince.value = patientData.address.province || "";
                populateDistricts(editProvince.value);
                
                // Need timeout to allow districts to populate
                setTimeout(() => {
                    editDistrict.value = patientData.address.district || "";
                    populateCommunes(editProvince.value, editDistrict.value);
                    
                    setTimeout(() => {
                        editCommune.value = patientData.address.commune || "";
                        editVillage.value = patientData.address.village || "";
                        editStreet.value = patientData.address.street || "";
                    }, 100);
                }, 100);
            }
        } else {
            alert("រកមិនឃើញអ្នកជំងឺ!");
            window.location.href = "doctor.html";
        }
    } catch (error) {
        console.error("Error fetching patient data:", error);
        alert("មានបញ្ហាក្នុងការទាញយកទិន្នន័យ!");
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
                province: editProvince.value,
                district: editDistrict.value,
                commune: editCommune.value,
                village: editVillage.value || "",
                street: editStreet.value.trim() || ""
            }
        };

        // Update patient in Firebase
        await update(ref(db, `patients/${patientId}`), updatedData);

        alert("ព័ត៌មានអ្នកជំងឺត្រូវបានកែប្រែដោយជោគជ័យ!");
        window.location.href = "doctor.html";
    } catch (error) {
        console.error("Error updating patient data:", error);
        alert("មានបញ្ហាក្នុងការកែប្រែទិន្នន័យ!");
    }
});

// Load patient data on page load
loadPatientData();