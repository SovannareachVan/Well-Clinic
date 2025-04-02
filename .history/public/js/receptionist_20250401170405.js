// Import the necessary Firebase SDKs
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuY7JOzrw4sp9qqOZ_DcYZFixrMUXBKio",
  authDomain: "customer-management-syst-8cb9e.firebaseapp.com",
  databaseURL: "https://customer-management-syst-8cb9e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "customer-management-syst-8cb9e",
  storageBucket: "customer-management-syst-8cb9e.firebasestorage.app",
  messagingSenderId: "671327791621",
  appId: "1:671327791621:web:ef915738be80238db80a6c",
  measurementId: "G-YNJ27NE48Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Select the form elements
const patientForm = document.getElementById("patientForm");
const errorMessage = document.getElementById("error-message");

// Function to handle form submission
// Import the necessary Firebase SDKs
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuY7JOzrw4sp9qqOZ_DcYZFixrMUXBKio",
  authDomain: "customer-management-syst-8cb9e.firebaseapp.com",
  databaseURL: "https://customer-management-syst-8cb9e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "customer-management-syst-8cb9e",
  storageBucket: "customer-management-syst-8cb9e.firebasestorage.app",
  messagingSenderId: "671327791621",
  appId: "1:671327791621:web:ef915738be80238db80a6c",
  measurementId: "G-YNJ27NE48Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Select the form elements
const patientForm = document.getElementById("patientForm");
const errorMessage = document.getElementById("error-message");

// Function to handle form submission
patientForm.addEventListener("submit", function(event) {
    event.preventDefault();  // Prevent default form submission

    // Get the form data
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

    // Store the data in Firebase Realtime Database
    const patientId = Date.now();  // Use the current timestamp as a unique ID for the patient
    const patientRef = ref(db, 'patients/' + patientId);  // Define the path to store data

    set(patientRef, {
        fullName: fullName,
        age: age,
        gender: gender,
        phone: phone,
        email: email,
        notes: notes,
        createdAt: new Date().toISOString()  // Add a timestamp for when the record was created
    }).then(() => {
        alert("Patient data saved successfully!");
        patientForm.reset();  // Reset the form after submission
    }).catch((error) => {
        errorMessage.style.display = "block";
        errorMessage.textContent = "Error saving patient data: " + error.message;
    });
});
patientForm.addEventListener("submit", function(event) {
    event.preventDefault();  // Prevent default form submission

    // Get the form data
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

    // Store the data in Firebase Realtime Database
    const patientId = Date.now();  // Use the current timestamp as a unique ID for the patient
    const patientRef = ref(db, 'patients/' + patientId);  // Define the path to store data

    set(patientRef, {
        fullName: fullName,
        age: age,
        gender: gender,
        phone: phone,
        email: email,
        notes: notes,
        createdAt: new Date().toISOString()  // Add a timestamp for when the record was created
    }).then(() => {
        alert("Patient data saved successfully!");
        patientForm.reset();  // Reset the form after submission
    }).catch((error) => {
        errorMessage.style.display = "block";
        errorMessage.textContent = "Error saving patient data: " + error.message;
    });
});
