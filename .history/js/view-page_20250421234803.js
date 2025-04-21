import { db } from './firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

async function getPatientDetails(recordId) {
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();
            
            // Update basic patient info
            document.getElementById('patientFullName').textContent = patientData.fullName || 'N/A';
            document.getElementById('patientAge').textContent = patientData.age || 'N/A';
            document.getElementById('patientGender').textContent = patientData.gender || 'N/A';
            document.getElementById('patientPhone').textContent = patientData.phone || 'N/A';
            document.getElementById('patientEmail').textContent = patientData.email || 'N/A';

            // Get notes data - check both locations
            const notes = patientData.structuredNotes || {};
            const generalNotes = typeof patientData.notes === 'string' ? patientData.notes : 'មិនមានវេជ្ជបញ្ជា';
            
            // Create medicine list HTML if medicines exist
            let medicineHtml = '<div class="medicine-empty">មិនទាន់បំពេញ</div>';
            if (notes.medicines && notes.medicines.length > 0) {
                medicineHtml = generateMedicineTable(notes.medicines);
            }

            // ===== VISIT INFORMATION SECTION =====
            let visitHeaderHtml = '';
            let visitInfoHtml = '';
            
            if (patientData.visits) {
                const visits = Object.values(patientData.visits);
                const mostRecentVisit = visits[visits.length - 1];
                
                // Visit header information (from date-register)
                visitHeaderHtml = `
                <div class="visit-header-container">
                    <div class="visit-header-box">
                        <div class="visit-header-row">
                            <span class="visit-header-label">លេខរៀង:</span>
                            <span class="visit-header-value">${visits.length}</span>
                        </div>
                        <div class="visit-header-row">
                            <span class="visit-header-label">ថ្ងៃចូលមន្ទីពេទ្យ:</span>
                            <span class="visit-header-value">${mostRecentVisit.checkIn || 'N/A'}</span>
                        </div>
                        <div class="visit-header-row">
                            <span class="visit-header-label">ថ្ងៃចេញពីមន្ទីពេទ្យ:</span>
                            <span class="visit-header-value">${mostRecentVisit.checkOut || 'N/A'}</span>
                        </div>
                        <div class="visit-header-row">
                            <span class="visit-header-label">មន្ទីពេទ្យ:</span>
                            <span class="visit-header-value">${mostRecentVisit.clinic || 'N/A'}</span>
                        </div>
                        <div class="visit-header-row">
                            <span class="visit-header-label">ពិគ្រោះដោយ:</span>
                            <span class="visit-header-value">${mostRecentVisit.doctor || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                `;

                // Medical information from visit (from add-information)
                if (mostRecentVisit.information) {
                    const visitInfo = mostRecentVisit.information;
                    let visitMedicineHtml = '<div class="medicine-empty">មិនទាន់បំពេញ</div>';
                    
                    if (visitInfo.medicines && visitInfo.medicines.length > 0) {
                        visitMedicineHtml = generateMedicineTable(visitInfo.medicines);
                    }

                    visitInfoHtml = `
                    <div class="medical-info-section">
                        <div class="section-title">ព័ត៌មានពិនិត្យថ្មីបំផុត</div>
                        <div class="note-item"><strong>ប្រវត្តិព្យាបាល:</strong> ${visitInfo.treatmentHistory || 'មិនទាន់បំពេញ'}</div>
                        <div class="note-item"><strong>តេស្តមន្ទីពិសោធន៍:</strong> ${visitInfo.labTest || 'មិនទាន់បំពេញ'}</div>
                        <div class="note-item"><strong>រោគវិនិច្ឆ័យ:</strong> ${visitInfo.diagnosis || 'មិនទាន់បំពេញ'}</div>
                        <div class="note-item"><strong>របៀបប្រើប្រាស់ថ្នាំ:</strong></div>
                        ${visitMedicineHtml}
                    </div>
                    `;
                }
            }

            // ===== PATIENT NOTES SECTION =====
            const patientNotesHtml = `
                <div class="medical-info-section">
                    <div class="section-title">ព័ត៌មានអ្នកជំងឺ</div>
                    <div class="note-item"><strong>វេជ្ជបញ្ជា:</strong> ${generalNotes}</div>
                    <div class="note-item"><strong>1. សញ្ញាណតម្អូញ:</strong> ${notes.note1 || 'មិនទាន់បំពេញ'}</div>
                    <div class="note-item"><strong>2. ប្រវត្តិព្យាបាល:</strong> ${notes.note2 || 'មិនទាន់បំពេញ'}</div>
                    <div class="note-item"><strong>3. តេស្តមន្ទីពិសោធន៍:</strong> ${notes.note3 || 'មិនទាន់បំពេញ'}</div>
                    <div class="note-item"><strong>4. រោគវិនិច្ឆ័យ:</strong> ${notes.note4 || 'មិនទាន់បំពេញ'}</div>
                    <div class="note-item"><strong>5. រោគវិនិច្ឆ័យញែក:</strong> ${notes.note5 || 'មិនទាន់បំពេញ'}</div>
                    <div class="note-item"><strong>6. របៀបប្រើប្រាស់ថ្នាំ:</strong></div>
                    ${medicineHtml}
                </div>
            `;

            // Combine all sections
            document.getElementById('patientNotes').innerHTML = `
                ${visitHeaderHtml}
                ${visitInfoHtml}
                ${patientNotesHtml}
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

// Helper function to generate medicine tables
function generateMedicineTable(medicines) {
    return `
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
        ${medicines.map(med => `
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