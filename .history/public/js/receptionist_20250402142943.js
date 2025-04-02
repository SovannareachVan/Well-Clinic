import { db } from "../firebase-config.js";
import { ref, push, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Get form reference
const patientForm = document.getElementById("patientForm");

// Handle form submission
patientForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Get input values
    const fullName = document.getElementById("fullName").value.trim();
    const age = document.getElementById("age").value.trim();
    const gender = document.getElementById("gender").value;
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const notes = document.getElementById("notes").value.trim();

    // Validate inputs
    if (!fullName || !age || !gender || !phone) {
        alert("Please fill in all required fields.");
        return;
    }

    try {
        // Save data to Firebase
        const patientRef = push(ref(db, "patients"));
        await set(patientRef, {
            fullName,
            age,
            gender,
            phone,
            email,
            notes,
            timestamp: new Date().toISOString()
        });

        alert("Patient registered successfully!");
        patientForm.reset();
    } catch (error) {
        console.error("Error saving data: ", error);
        alert("Failed to register patient. Try again.");
    }
});
