// Import Firebase functions
import { db } from './firebase-config.js'; 
import { ref, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Function to save notes to Firebase
async function savePatientNotes(recordId) {
    try {
        // Get notes from the textarea inputs
        const note1 = document.getElementById('patientNote1').value;
        const note2 = document.getElementById('patientNote2').value;
        const note3 = document.getElementById('patientNote3').value;
        const note4 = document.getElementById('patientNote4').value;
        const note5 = document.getElementById('patientNote5').value;
        const note6 = document.getElementById('patientNote6').value;

        // Reference to the patient notes data in the Firebase database
        const patientRef = ref(db, 'patients/' + recordId + '/notes');

        // Set the notes data in Firebase
        await set(patientRef, {
            note1: note1,
            note2: note2,
            note3: note3,
            note4: note4,
            note5: note5,
            note6: note6
        });

        // Inform the user that the notes have been saved
        alert('Notes saved successfully!');
    } catch (error) {
        console.error('Error saving notes:', error);
    }
}

// Function to fetch patient data from Firebase and populate the form
async function getPatientDetails(recordId) {
    try {
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

        // Add event listener to Save button
        document.getElementById('saveBtn').addEventListener('click', function() {
            savePatientNotes(recordId);
        });
    } else {
        console.log('No recordId provided.');
    }
};
