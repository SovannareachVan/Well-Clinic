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
const editProvince = document.getElementById("editProvince");
const editDistrict = document.getElementById("editDistrict");
const editCommune = document.getElementById("editCommune");
const editVillage = document.getElementById("editVillage");

// Function to load patient data
async function loadPatientData() {
    if (!patientId) {
        alert("Invalid patient ID");
        window.location.href = "doctor.html"; // Redirect if no ID
        return;
    }

    try {
        const patientRef = ref(db, `patients/${patientId}`);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();

            // Fill form fields with existing data
            editFullName.value = patientData.fullName || "";
            editAge.value = patientData.age || "";
            editGender.value = patientData.gender || "";
            editPhone.value = patientData.phone || "";
            editNotes.value = patientData.notes || "";

            // Fill address fields (village, commune, district, province)
            if (patientData.address) {
                editProvince.value = patientData.address.province || "";
                editDistrict.value = patientData.address.district || "";
                editCommune.value = patientData.address.commune || "";
                editVillage.value = patientData.address.village || "";
            }
        } else {
            alert("Patient not found!");
            window.location.href = "doctor.html"; // Redirect if patient not found
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
                province: editProvince.value,
                district: editDistrict.value,
                commune: editCommune.value,
                village: editVillage.value
            }
        };

        // Update patient in Firebase
        await update(ref(db, `patients/${patientId}`), updatedData);

        alert("Patient information updated successfully!");
        window.location.href = "doctor.html"; // Redirect back to doctor page
    } catch (error) {
        console.error("Error updating patient data:", error);
        alert("Failed to update patient information.");
    }
});

// Load patient data on page load
loadPatientData();
