// Import necessary Firebase methods
import { getDatabase, ref, set, push } from "firebase/database";
import { db } from './firebase-config';  // Import the database instance from your config file

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
        // Show success pop-up
        showPopup("Success", "Customer data saved successfully!", "success");
        patientForm.reset();  // Reset the form
    }).catch((error) => {
        // Show error pop-up
        showPopup("Error", "Could not save customer data: " + error.message, "error");
    });
});

// Function to show the success/error pop-up
function showPopup(title, message, type) {
    const popupContainer = document.getElementById('popup-container');
    const popup = document.getElementById('popup');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');

    // Set the content of the pop-up
    popupTitle.textContent = title;
    popupMessage.textContent = message;

    // Change the class based on success or error
    popup.classList.add(type);  // Add "success" or "error" class

    // Show the pop-up
    popupContainer.style.display = "block";

    // Close the pop-up when the close button is clicked
    document.querySelector('.close-popup').addEventListener('click', function() {
        popupContainer.style.display = "none";
    });

    // Automatically remove the pop-up after 5 seconds
    setTimeout(() => {
        popupContainer.style.display = "none";
    }, 5000);
}
