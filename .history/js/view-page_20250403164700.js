import { db } from './firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Function to fetch patient details from Firebase and display them
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

            // Update the individual notes if available
            document.getElementById('patientNote1').value = patientData.notes?.note1 || '';
            document.getElementById('patientNote2').value = patientData.notes?.note2 || '';
            document.getElementById('patientNote3').value = patientData.notes?.note3 || '';
            document.getElementById('patientNote4').value = patientData.notes?.note4 || '';
            document.getElementById('patientNote5').value = patientData.notes?.note5 || '';
            document.getElementById('patientNote6').value = patientData.notes?.note6 || '';
        } else {
            console.log('No data available for this patient.');
        }
    } catch (error) {
        console.error('Error fetching patient details:', error);
    }
}

// Fetch patient data when the page is loaded
window.onload = function() {
    const recordId = new URLSearchParams(window.location.search).get('recordId'); // Get the recordId from the URL
    if (recordId) {
        getPatientDetails(recordId);
    } else {
        console.log('No recordId provided.');
    }
}
