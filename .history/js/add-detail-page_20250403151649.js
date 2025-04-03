import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Function to fetch patient data and populate the details
async function getPatientDetails(recordId) {
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();
            
            // Populate the details
            document.getElementById('patientFullName').textContent = patientData.fullName;
            document.getElementById('patientAge').textContent = patientData.age;
            document.getElementById('patientGender').textContent = patientData.gender;
            document.getElementById('patientPhone').textContent = patientData.phone;
            document.getElementById('patientEmail').textContent = patientData.email || 'N/A';
            document.getElementById('patientName').textContent = patientData.fullName;

            // Pre-fill existing notes (if any)
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

// Function to save new patient notes
async function savePatientNotes(recordId) {
    const notes = {
        note1: document.getElementById('patientNote1').value.trim(),
        note2: document.getElementById('patientNote2').value.trim(),
        note3: document.getElementById('patientNote3').value.trim(),
        note4: document.getElementById('patientNote4').value.trim(),
        note5: document.getElementById('patientNote5').value.trim(),
        note6: document.getElementById('patientNote6').value.trim(),
    };

    // Make sure all notes are filled
    if (Object.values(notes).every(note => note !== '')) {
        try {
            const patientRef = ref(db, 'patients/' + recordId);
            const snapshot = await get(patientRef);

            if (snapshot.exists()) {
                const patientData = snapshot.val();
                // Combine the existing notes with the new notes
                const updatedNotes = {
                    ...patientData.notes,
                    ...notes
                };

                // Update the notes in Firebase
                await update(patientRef, { notes: updatedNotes });
                alert('Notes saved successfully!');
                
                // Clear the note input fields after saving
                Object.keys(notes).forEach(key => {
                    document.getElementById(key).value = '';
                });
            } else {
                console.log('Patient data not found.');
            }
        } catch (error) {
            console.error('Error saving patient notes:', error);
        }
    } else {
        alert('Please fill in all note fields before saving.');
    }
}

// Fetch and display the patient details when the page loads
document.addEventListener('DOMContentLoaded', function () {
    const recordId = new URLSearchParams(window.location.search).get('id');
    if (recordId) {
        getPatientDetails(recordId);
        
        // Attach save button event listener after the page loads
        document.getElementById('saveBtn').addEventListener('click', function () {
            savePatientNotes(recordId);
        });
    } else {
        console.log('No recordId provided.');
    }
});
