// Import necessary Firebase methods
import { getDatabase, ref, set, push } from "firebase/database";

// Initialize Firebase (Assuming you already initialized Firebase in firebase-config.js)
const db = getDatabase(app);

// Select the form elements
const patientForm = document.getElementById("patientForm");
const errorMessage = document.getElementById("error-message");

// Function to handle form submission
patientForm.addEventListener("submit", function(event) {
    event.preventDefault();  // Prevent default form submission

    // Get form data
    const fullName = document.getElementById("fullName").value;
    const age = document.getElementById("age").value;
    const gender = document.getElementById("gender").value;
    const phone = document.getElementById("phone").value;
    const email = document.getElementById("email").value;
    const notes = document.getElementById("notes").value;

    // Validate the form data
    if (!fullName || !age || !gender || !phone) {
        errorMessage.style.display = "block";
        errorMessage.textContent = "Please fill in all required fields!";
        return;
    }

    // Create a reference to the 'patients' node in Firebase
    const patientsRef = ref(db, 'patients'); // You can use 'patients' or any other path you prefer

    // Use 'push' to generate a unique ID for each new patient
    const newPatientRef = push(patientsRef);

    // Store patient data in the database
    set(newPatientRef, {
        fullName: fullName,
        age: age,
        gender: gender,
        phone: phone,
        email: email,
        notes: notes,
        createdAt: new Date().toISOString()  // Timestamp when the record is created
    }).then(() => {
        alert("Patient data saved successfully!");
        patientForm.reset();  // Reset the form
    }).catch((error) => {
        errorMessage.style.display = "block";
        errorMessage.textContent = "Error saving patient data: " + error.message;
    });
});
