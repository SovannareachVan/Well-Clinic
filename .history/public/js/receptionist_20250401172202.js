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
    const popup = document.createElement('div');
    popup.classList.add('popup', type);  // Add class based on success or error type
    popup.innerHTML = `
        <div class="popup-content">
            <h3>${title}</h3>
            <p>${message}</p>
            <button class="close-popup">Close</button>
        </div>
    `;
    document.body.appendChild(popup);

    // Close the popup when the close button is clicked
    popup.querySelector('.close-popup').addEventListener('click', function() {
        popup.remove();
    });

    // Automatically remove the popup after 5 seconds
    setTimeout(() => {
        popup.remove();
    }, 5000);
}
