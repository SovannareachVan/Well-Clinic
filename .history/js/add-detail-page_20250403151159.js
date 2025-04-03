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
                document.getElementById('patientNotes').textContent = patientData.notes || 'No notes available';
                document.getElementById('patientName').textContent = patientData.fullName;
            } else {
                console.log('No data available for this patient.');
            }
        } catch (error) {
            console.error('Error fetching patient details:', error);
        }
    }

    // Function to save new patient detail
    async function savePatientDetail() {
        const recordId = new URLSearchParams(window.location.search).get('id');
        const newDetail = document.getElementById('newPatientDetail').value.trim();

        if (newDetail) {
            try {
                const patientRef = ref(db, 'patients/' + recordId);
                const snapshot = await get(patientRef);

                if (snapshot.exists()) {
                    const patientData = snapshot.val();
                    const updatedNotes = patientData.notes ? patientData.notes + '\n' + newDetail : newDetail;

                    // Update the notes in Firebase
                    await update(patientRef, { notes: updatedNotes });
                    alert('New detail added successfully!');
                    document.getElementById('newPatientDetail').value = ''; // Clear the textarea
                } else {
                    console.log('Patient data not found.');
                }
            } catch (error) {
                console.error('Error saving patient detail:', error);
            }
        } else {
            alert('Please enter a detail before saving.');
        }
    }

    // Fetch and display the patient details when the page loads
    window.onload = function () {
        const recordId = new URLSearchParams(window.location.search).get('id');
        if (recordId) {
            getPatientDetails(recordId);
        } else {
            console.log('No recordId provided.');
        }
    };
