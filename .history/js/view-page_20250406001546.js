import { db } from './firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

async function getPatientDetails(recordId) {
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();
            
            // Update patient info
            document.getElementById('patientFullName').textContent = patientData.fullName || 'N/A';
            document.getElementById('patientAge').textContent = patientData.age || 'N/A';
            document.getElementById('patientGender').textContent = patientData.gender || 'N/A';
            document.getElementById('patientPhone').textContent = patientData.phone || 'N/A';
            document.getElementById('patientEmail').textContent = patientData.email || 'N/A';

            // Check if notes exist and render them
            const notes = patientData.notes || {};
            
            // Display general notes from receptionist page
            const generalNotes = notes.general || 'មិនមានវេជ្ជបញ្ជា';
            
            // Create medicine list HTML if medicines exist
            let medicineHtml = '<div class="medicine-empty">មិនទាន់បំពេញ</div>';
            if (notes.medicines && notes.medicines.length > 0) {
                medicineHtml = `
                <div class="medicine-container">
                    <div class="medicine-header">
                        <div class="medicine-col">ឈ្មោះថ្នាំ</div>
                        <div class="medicine-col">ប្រភេទថ្នាំ</div>
                        <div class="medicine-col">រយះពេល</div>
                        <div class="medicine-col">ព្រឹក</div>
                        <div class="medicine-col">ថ្ងៃ</div>
                        <div class="medicine-col">ល្ងាច</div>
                        <div class="medicine-col">ចំនួន</div>
                    </div>
                    ${notes.medicines.map(med => `
                        <div class="medicine-row">
                            <div class="medicine-col">${med.name || ''}</div>
                            <div class="medicine-col">${med.dosage || ''}</div>
                            <div class="medicine-col">${med.days || ''} ថ្ងៃ</div>
                            <div class="medicine-col">${med.morningDose || ''}</div>
                            <div class="medicine-col">${med.afternoonDose || ''}</div>
                            <div class="medicine-col">${med.eveningDose || ''}</div>
                            <div class="medicine-col">${med.quantity || ''}</div>
                        </div>
                    `).join('')}
                </div>
                `;
            }

            // Display all notes with proper structure
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