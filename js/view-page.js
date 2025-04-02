// Import Firebase functions
import { db } from './firebase-config.js'; 
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Function to fetch patient data from Firebase and populate the view page
async function getPatientDetails(recordId) {
    try {
        // Reference to the patient data in the Firebase database
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();
            
            // Update the patient details on the page
            document.getElementById('patientFullName').textContent = patientData.fullName;
            document.getElementById('patientAge').textContent = patientData.age;
            document.getElementById('patientGender').textContent = patientData.gender;
            document.getElementById('patientPhone').textContent = patientData.phone;
            document.getElementById('patientEmail').textContent = patientData.email || 'N/A';
            document.getElementById('patientNotes').textContent = patientData.notes || 'No notes available';
            document.getElementById('patientName').textContent = patientData.fullName;
            document.getElementById('recordNumber').textContent = recordId; // Assuming recordId is unique
            
        } else {
            console.log('No data available for this patient.');
        }
    } catch (error) {
        console.error('Error fetching patient details:', error);
    }
}

// Call the getPatientDetails function when the page is loaded
window.onload = function() {
    const recordId = new URLSearchParams(window.location.search).get('recordId'); // Get the recordId from the URL query string
    if (recordId) {
        getPatientDetails(recordId);
    } else {
        console.log('No recordId provided.');
    }
};
