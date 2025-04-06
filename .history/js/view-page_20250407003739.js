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
const editEmail = document.getElementById("editEmail");
const editNotes = document.getElementById("editNotes");

// Function to safely extract notes text
function getNotesText(notesData) {
    if (!notesData) return "";
    if (typeof notesData === "string") return notesData;
    if (notesData.original) return notesData.original;
    return JSON.stringify(notesData); // Fallback for unexpected formats
}

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
            editEmail.value = patientData.email || "";
            editNotes.value = getNotesText(patientData.notes);
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
        const patientRef = ref(db, `patients/${patientId}`);
        const snapshot = await get(patientRef);
        const currentData = snapshot.val();

        // Prepare updated data
        const updatedData = {
            fullName: editFullName.value.trim(),
            age: editAge.value.trim(),
            gender: editGender.value,
            phone: editPhone.value.trim(),
            email: editEmail.value.trim(),
            notes: {
                original: editNotes.value.trim(),
                structured: currentData.notes?.structured || {}
            }
        };

        await update(patientRef, updatedData);
        alert("Patient information updated successfully!");
        window.location.href = "doctor.html";
    } catch (error) {
        console.error("Error updating patient data:", error);
        alert("Failed to update patient information.");
    }
});

// Load patient data on page load
loadPatientData();