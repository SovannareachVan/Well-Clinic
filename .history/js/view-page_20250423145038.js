import { db } from './firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

async function getPatientDetails(recordId) {
    console.log("Fetching patient data for ID:", recordId);
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        console.log("Snapshot:", snapshot);
        console.log("Snapshot exists:", snapshot.exists());
        
        if (snapshot.exists()) {
            const patientData = snapshot.val();
            console.log("Patient data:", patientData);
            // ... rest of your function
            
            // Update basic patient info
            document.getElementById('patientFullName').textContent = patientData.fullName || 'N/A';
            document.getElementById('patientAge').textContent = patientData.age || 'N/A';
            document.getElementById('patientGender').textContent = patientData.gender || 'N/A';
            document.getElementById('patientPhone').textContent = patientData.phone || 'N/A';
            document.getElementById('patientEmail').textContent = patientData.email || 'N/A';

            // ===== FIRST VISIT (Initial Registration) =====
            let firstVisitHtml = '';
            const initialNotes = patientData.structuredNotes || {};
            const generalNotes = patientData.notes || 'មិនមានវេជ្ជបញ្ជា';
            
            // Medicine for first visit
            let firstVisitMedicine = '<div class="medicine-empty">មិនទាន់បំពេញ</div>';
            if (initialNotes.medicines && initialNotes.medicines.length > 0) {
                firstVisitMedicine = generateMedicineTable(initialNotes.medicines);
            }

            firstVisitHtml = `
                <div class="visit-note">
                    <div class="visit-note-header">
                        <h3>ព័ត័មានដំបូង (ចុះឈ្មោះលើកដំបូង)</h3>
                        <div class="visit-meta">
                            <div><strong>ថ្ងៃចូលមន្ទីពេទ្យ:</strong> ${patientData.checkIn || 'N/A'}</div>
                            ${patientData.checkOut ? `<div><strong>ថ្ងៃចេញពីមន្ទីពេទ្យ:</strong> ${patientData.checkOut}</div>` : ''}
                        </div>
                    </div>
                    <div class="visit-note-content">
                        <div class="note-item"><strong>វេជ្ជបញ្ជា:</strong> ${generalNotes}</div>
                        <div class="note-item"><strong>1. សញ្ញាណតម្អូញ:</strong> ${initialNotes.note1 || 'មិនទាន់បំពេញ'}</div>
                        <div class="note-item"><strong>2. ប្រវត្តិព្យាបាល:</strong> ${initialNotes.note2 || 'មិនទាន់បំពេញ'}</div>
                        <div class="note-item"><strong>3. តេស្តមន្ទីពិសោធន៍:</strong> ${initialNotes.note3 || 'មិនទាន់បំពេញ'}</div>
                        <div class="note-item"><strong>4. រោគវិនិច្ឆ័យ:</strong> ${initialNotes.note4 || 'មិនទាន់បំពេញ'}</div>
                        <div class="note-item"><strong>5. រោគវិនិច្ឆ័យញែក:</strong> ${initialNotes.note5 || 'មិនទាន់បំពេញ'}</div>
                        <div class="note-item"><strong>6. របៀបប្រើប្រាស់ថ្នាំ:</strong></div>
                        ${firstVisitMedicine}
                    </div>
                </div>
            `;

            // ===== SUBSEQUENT VISITS =====
            let subsequentVisitsHtml = '';
            
            if (patientData.visits) {
                const visits = Object.entries(patientData.visits);
                
                // Sort visits by check-in date (newest first)
                visits.sort((a, b) => new Date(b[1].checkIn) - new Date(a[1].checkIn));
                
                visits.forEach(([visitId, visit], index) => {
                    const visitInfo = visit.information || {};
                    const visitNumber = index + 1;
                    
                    let visitMedicineHtml = '<div class="medicine-empty">មិនទាន់បំពេញ</div>';
                    if (visitInfo.medicines && visitInfo.medicines.length > 0) {
                        visitMedicineHtml = generateMedicineTable(visitInfo.medicines);
                    }

                    subsequentVisitsHtml += `
                    <div class="visit-note">
                        <div class="visit-note-header">
                            <h3>មកលើកទី ${visitNumber + 1}</h3>
                            <div class="visit-meta">
                                <div><strong>ថ្ងៃចូលមន្ទីពេទ្យ:</strong> ${visit.checkIn || 'N/A'}</div>
                                <div><strong>ថ្ងៃចេញពីមន្ទីពេទ្យ:</strong> ${visit.checkOut || 'N/A'}</div>
                                <div><strong>មន្ទីពេទ្យ:</strong> ${visit.clinic || 'N/A'}</div>
                                <div><strong>ពិគ្រោះដោយ:</strong> ${visit.doctor || 'N/A'}</div>
                            </div>
                        </div>
                        <div class="visit-note-content">
                            <div class="note-item"><strong>ប្រវត្តិព្យាបាល:</strong> ${visitInfo.treatmentHistory || 'មិនទាន់បំពេញ'}</div>
                            <div class="note-item"><strong>តេស្តមន្ទីពិសោធន៍:</strong> ${visitInfo.labTest || 'មិនទាន់បំពេញ'}</div>

                            <div class="note-item"><strong>4. រោគវិនិច្ឆ័យ:</strong> ${initialNotes.note4 || 'មិនទាន់បំពេញ'}</div>

                            <div class="note-item"><strong>របៀបប្រើប្រាស់ថ្នាំ:</strong></div>
                            ${visitMedicineHtml}
                        </div>
                    </div>
                    `;
                });
            }

            // Combine all sections
            document.getElementById('patientNotes').innerHTML = `
                ${firstVisitHtml}
                ${subsequentVisitsHtml}
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

// Helper function to generate medicine tables (keep your existing implementation)
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
    const urlParams = new URLSearchParams(window.location.search);
    const recordId = urlParams.get('recordId');
    
    if (recordId) {
        // Add slight delay to ensure data is available
        setTimeout(() => {
            getPatientDetails(recordId);
        }, 500);
    } else {
        document.getElementById('patientNotes').innerHTML = `
            <div class="error-message">
                Error: No patient ID provided in URL.
            </div>
        `;
    }
};