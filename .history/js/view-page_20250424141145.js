import { db } from './firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

async function getPatientDetails(recordId, visitId = null) {
    console.log("Fetching patient data for ID:", recordId);
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (!snapshot.exists()) {
            console.log('No patient data found.');
            document.getElementById('patientNotes').textContent = 'No patient records available.';
            return;
        }

        const patientData = snapshot.val();
        const patientNotesContainer = document.getElementById('patientNotes');

        // Update basic patient info
        document.getElementById('patientFullName').textContent = patientData.fullName || 'N/A';
        document.getElementById('patientAge').textContent = patientData.age || 'N/A';
        document.getElementById('patientGender').textContent = patientData.gender || 'N/A';
        document.getElementById('patientPhone').textContent = patientData.phone || 'N/A';
        document.getElementById('patientEmail').textContent = patientData.email || 'N/A';

        // === View specific visit if visitId is provided ===
        if (visitId && patientData.visits?.[visitId]) {
            const visit = patientData.visits[visitId];
            const info = visit.information || {};
            
            const visitHtml = generateVisitHtml(
                `មកពិនិត្យ (${visitId})`,
                visit.checkIn,
                visit.checkOut,
                visit.clinic,
                visit.doctor,
                info
            );
            patientNotesContainer.innerHTML = visitHtml;
            return;
        }

        // === Default view: show all visits ===
        let outputHtml = '';

        // First visit (registration)
        const initialNotes = patientData.structuredNotes || {};
        outputHtml += generateInitialVisitHtml(
            patientData.checkIn,
            patientData.checkOut,
            patientData.notes || 'មិនមានវេជ្ជបញ្ជា',
            initialNotes
        );

        // Subsequent visits (second check-in and onwards)
        if (patientData.visits) {
            const visits = Object.entries(patientData.visits);
            visits.sort((a, b) => new Date(b[1].checkIn) - new Date(a[1].checkIn));

            visits.forEach(([id, visit], index) => {
                if (index > 0) { // Skip the first visit as it was already handled
                    const info = visit.information || {};
                    outputHtml += generateVisitHtml(
                        `មកលើកទី ${index + 1}`,
                        visit.checkIn,
                        visit.checkOut,
                        visit.clinic,
                        visit.doctor,
                        info
                    );
                }
            });
        }

        patientNotesContainer.innerHTML = outputHtml;

    } catch (error) {
        console.error('Error loading patient data:', error);
        document.getElementById('patientNotes').textContent = 'Failed to load patient details.';
    }
}

// Helper functions for generating HTML
function generateInitialVisitHtml(checkIn, checkOut, generalNotes, notes) {
    return `
        <div class="visit-note">
            <div class="visit-note-header">
                <h3>ការចូលពិនិត្យដំបូង</h3>
            <div class="visit-note-header">
                <h3>${title}</h3>
                <div class="visit-meta">
                    <div><strong>ថ្ងៃចូល:</strong> ${checkIn || 'N/A'}</div>
                    <div><strong>ថ្ងៃចេញ:</strong> ${checkOut || 'N/A'}</div>
                    <div><strong>មន្ទីរពេទ្យ:</strong> ${clinic || 'N/A'}</div>
                    <div><strong>វេជ្ជបណ្ឌិត:</strong> ${doctor || 'N/A'}</div>
                </div>
            </div
            </div>  
            <div class="visit-note-content">
                <div class="note-item"><strong>សញ្ញាណតម្អូញ:</strong> ${notes.note1 || notes.symptom || 'មិនទាន់បំពេញ'}</div>
                <div class="note-item"><strong>ប្រវត្តិព្យាបាល:</strong> ${notes.note2 || notes.treatmentHistory || 'មិនទាន់បំពេញ'}</div>
                <div class="note-item"><strong>តេស្តមន្ទីពិសោធន៍:</strong> ${notes.note3 || notes.labTest || 'មិនទាន់បំពេញ'}</div>
                <div class="note-item"><strong>រោគវិនិច្ឆ័យ:</strong> ${notes.note4 || notes.diagnosis || 'មិនទាន់បំពេញ'}</div>
                <div class="note-item"><strong>រោគវិនិច្ឆ័យញែក:</strong> ${notes.note5 || notes.subDiagnosis || 'មិនទាន់បំពេញ'}</div>
                <div class="note-item"><strong>របៀបប្រើប្រាស់ថ្នាំ:</strong></div>
                ${notes.medicines?.length > 0 ? generateMedicineTable(notes.medicines) : '<div class="medicine-empty">មិនទាន់បំពេញ</div>'}
            </div>
        </div>
    `;
}

function generateVisitHtml(title, checkIn, checkOut, clinic, doctor, info) {
    return `
        <div class="visit-note">
            <div class="visit-note-header">
                <h3>${title}</h3>
                <div class="visit-meta">
                    <div><strong>ថ្ងៃចូល:</strong> ${checkIn || 'N/A'}</div>
                    <div><strong>ថ្ងៃចេញ:</strong> ${checkOut || 'N/A'}</div>
                    <div><strong>មន្ទីរពេទ្យ:</strong> ${clinic || 'N/A'}</div>
                    <div><strong>វេជ្ជបណ្ឌិត:</strong> ${doctor || 'N/A'}</div>
                </div>
            </div>  
            <div class="visit-note-content">
                <div class="note-item"><strong>ប្រវត្តិព្យាបាល:</strong> ${info.note2 || info.treatmentHistory || 'មិនទាន់បំពេញ'}</div>
                <div class="note-item"><strong>តេស្តមន្ទីពិសោធន៍:</strong> ${info.note3 || info.labTest || 'មិនទាន់បំពេញ'}</div>
                <div class="note-item"><strong>រោគវិនិច្ឆ័យ:</strong> ${info.note4 || info.diagnosis || 'មិនទាន់បំពេញ'}</div>
                <div class="note-item"><strong>របៀបប្រើថ្នាំ:</strong></div>
                ${info.medicines?.length > 0 ? generateMedicineTable(info.medicines) : '<div class="medicine-empty">មិនទាន់បំពេញ</div>'}
            </div>
        </div>
    `;
}

function generateMedicineTable(medicines) {
    return `
    <div class="medicine-container">
        <div class="medicine-header">
            <div class="medicine-col">ឈ្មោះថ្នាំ</div>
            <div class="medicine-col">ប្រភេទថ្នាំ</div>
            <div class="medicine-col">រយៈពេល</div>
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

// Load when page is ready
window.onload = function () {
    const urlParams = new URLSearchParams(window.location.search);
    const recordId = urlParams.get('recordId');
    const visitId = urlParams.get('visitId');

    if (recordId) {
        getPatientDetails(recordId, visitId);
    } else {
        document.getElementById('patientNotes').innerHTML = `
            <div class="error-message">Error: No patient ID provided in URL.</div>
        `;
    }
};
