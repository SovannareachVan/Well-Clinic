import { db } from './firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Function to fetch patient details from Firebase and display them
async function getPatientDetails(recordId) {
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();
            console.log(patientData); // Check the data structure in console
            
            // Update patient info
            document.getElementById('patientFullName').textContent = patientData.fullName || 'N/A';
            document.getElementById('patientAge').textContent = patientData.age || 'N/A';
            document.getElementById('patientGender').textContent = patientData.gender || 'N/A';
            document.getElementById('patientPhone').textContent = patientData.phone || 'N/A';
            document.getElementById('patientEmail').textContent = patientData.email || 'N/A';
            document.getElementById('patientName').textContent = patientData.fullName || 'Patient';

            // Display general notes from receptionist page
            const generalNotes = patientData.notes ? patientData.notes.general || 'មិនមានវេជ្ជបញ្ជា' : 'មិនមានវេជ្ជបញ្ជា';
            
            // Check if notes exist and render them
            const notes = patientData.notes || {};
            
            // Create medicine list HTML if medicines exist
            let medicineHtml = 'មិនទាន់បំពេញ';
            if (notes.medicines && notes.medicines.length > 0) {
                medicineHtml = `
                    <table class="medicine-table">
                        <thead>
                            <tr>
                                <th>ឈ្មោះថ្នាំ</th>
                                <th>ប្រភេទថ្នាំ</th>
                                <th>រយះពេល (ថ្ងៃ)</th>
                                <th>ព្រឹក</th>
                                <th>ថ្ងៃ</th>
                                <th>ល្ងាច</th>
                                <th>ចំនួនថ្នាំ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${notes.medicines.map(med => `
                                <tr>
                                    <td>${med.name || ''}</td>
                                    <td>${med.dosage || ''}</td>
                                    <td>${med.days || ''}</td>
                                    <td>${med.morningDose || ''}</td>
                                    <td>${med.afternoonDose || ''}</td>
                                    <td>${med.eveningDose || ''}</td>
                                    <td>${med.quantity || ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }

            document.getElementById('patientNotes').innerHTML = `
                <div class="note-item"><strong>វេជ្ជបញ្ជា:</strong> ${generalNotes}</div>
                <div class="note-item"><strong>1. សញ្ញាណតម្អូញ:</strong> ${notes.note1 || 'មិនទាន់បំពេញ'}</div>
                <div class="note-item"><strong>2. ប្រវត្តិព្យាបាល:</strong> ${notes.note2 || 'មិនទាន់បំពេញ'}</div>
                <div class="note-item"><strong>3. តេស្តមន្ទីពិសោធន៍:</strong> ${notes.note3 || 'មិនទាន់បំពេញ'}</div>
                <div class="note-item"><strong>4. រោគវិនិច្ឆ័យ:</strong> ${notes.note4 || 'មិនទាន់បំពេញ'}</div>
                <div class="note-item"><strong>5. រោគវិនិច្ឆ័យញែក:</strong> ${notes.note5 || 'មិនទាន់បំពេញ'}</div>
                <div class="note-item"><strong>6. របៀបប្រើប្រាស់ថ្នាំ:</strong></div>
                ${medicineHtml}
            `;
        } else {
            console.log('No patient data found.');
            document.getElementById('patientNotes').textContent = 'No patient records available.';
        }
    } catch (error) {
        console.error('Error loading patient data:', error);
        document.getElementById('patientNotes').textContent = 'Failed to load patient details.';
    }
}

// Load patient data when page opens
window.onload = function() {
    const recordId = new URLSearchParams(window.location.search).get('recordId');
    if (recordId) {
        getPatientDetails(recordId);
    } else {
        console.error('No patient ID provided in URL.');
        document.getElementById('patientNotes').textContent = 'Error: Missing patient ID.';
    }
};