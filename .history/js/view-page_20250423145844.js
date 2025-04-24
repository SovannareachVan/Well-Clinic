import { db } from './firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

async function getPatientDetails(recordId) {
    console.log("Fetching patient data for ID:", recordId);
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        console.log("Snapshot:", snapshot);
        
        if (!snapshot.exists()) {
            console.warn("No data found for patient ID:", recordId);
            document.getElementById('patientNotes').innerHTML = `
                <div class="error-message">
                    No patient records found for ID: ${recordId}
                </div>
            `;
            return;
        }

        const patientData = snapshot.val();
        console.log("Patient data retrieved:", patientData);

        // Update basic patient info
        document.getElementById('patientFullName').textContent = patientData.fullName || 'N/A';
        document.getElementById('patientAge').textContent = patientData.age || 'N/A';
        document.getElementById('patientGender').textContent = patientData.gender || 'N/A';
        document.getElementById('patientPhone').textContent = patientData.phone || 'N/A';
        document.getElementById('patientEmail').textContent = patientData.email || 'N/A';

        // Determine which notes to display
        const urlParams = new URLSearchParams(window.location.search);
        const isFirstVisit = urlParams.get('isFirstVisit') === 'true';
        
        let notesToDisplay = {};
        if (isFirstVisit) {
            // Display first visit data from root level
            notesToDisplay = patientData.structuredNotes || {};
        } else {
            // Display data from the most recent visit
            if (patientData.visits) {
                const visits = Object.entries(patientData.visits);
                visits.sort((a, b) => new Date(b[1].checkIn) - new Date(a[1].checkIn));
                notesToDisplay = visits[0][1].information || {};
            }
        }

        // Generate HTML for display
        let visitHtml = generateVisitHtml(notesToDisplay, isFirstVisit);
        document.getElementById('patientNotes').innerHTML = visitHtml;

    } catch (error) {
        console.error('Error loading patient data:', error);
        document.getElementById('patientNotes').innerHTML = `
            <div class="error-message">
                Error loading patient details. Please try again.
            </div>
        `;
    }
}

function generateVisitHtml(notesData, isFirstVisit) {
    let medicineHtml = '<div class="medicine-empty">មិនទាន់បំពេញ</div>';
    if (notesData.medicines && notesData.medicines.length > 0) {
        medicineHtml = generateMedicineTable(notesData.medicines);
    }

    return `
        <div class="visit-note">
            <div class="visit-note-header">
                <h3>${isFirstVisit ? 'ព័ត័មានដំបូង' : 'ព័ត័មានថ្មី'}</h3>
            </div>
            <div class="visit-note-content">
                ${isFirstVisit ? `
                    <div class="note-item"><strong>1. សញ្ញាណតម្អូញ:</strong> ${notesData.note1 || 'មិនទាន់បំពេញ'}</div>
                    <div class="note-item"><strong>2. ប្រវត្តិព្យាបាល:</strong> ${notesData.note2 || 'មិនទាន់បំពេញ'}</div>
                    <div class="note-item"><strong>3. តេស្តមន្ទីពិសោធន៍:</strong> ${notesData.note3 || 'មិនទាន់បំពេញ'}</div>
                    <div class="note-item"><strong>4. រោគវិនិច្ឆ័យ:</strong> ${notesData.note4 || 'មិនទាន់បំពេញ'}</div>
                    <div class="note-item"><strong>5. រោគវិនិច្ឆ័យញែក:</strong> ${notesData.note5 || 'មិនទាន់បំពេញ'}</div>
                ` : `
                    <div class="note-item"><strong>ប្រវត្តិព្យាបាល:</strong> ${notesData.treatmentHistory || 'មិនទាន់បំពេញ'}</div>
                    <div class="note-item"><strong>តេស្តមន្ទីពិសោធន៍:</strong> ${notesData.labTest || 'មិនទាន់បំពេញ'}</div>
                    <div class="note-item"><strong>រោគវិនិច្ឆ័យ:</strong> ${notesData.diagnosis || 'មិនទាន់បំពេញ'}</div>
                `}
                <div class="note-item"><strong>របៀបប្រើប្រាស់ថ្នាំ:</strong></div>
                ${medicineHtml}
            </div>
        </div>
    `;
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