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
            const visitHtml = generateVisitHtml(
                `មកពិនិត្យ (${visitId})`,
                visit.checkIn,
                visit.checkOut,
                visit.clinic,
                visit.doctor,
                visit.information || {},  // From add-information.js
                patientData.structuredNotes || {}  // From add-detail-page.js
            );
            patientNotesContainer.innerHTML = visitHtml;
            return;
        }

        // === Default view: show all visits ===
        let outputHtml = '';

        // First visit (registration) - from add-detail-page.js
        outputHtml += generateInitialVisitHtml(
            patientData.checkIn,
            patientData.checkOut,
            patientData.notes || 'មិនមានវេជ្ជបញ្ជា',
            patientData.structuredNotes || {}
        );

        // Subsequent visits - from add-information.js
        if (patientData.visits) {
            const visits = Object.entries(patientData.visits);
            visits.sort((a, b) => new Date(b[1].checkIn) - new Date(a[1].checkIn));

            visits.forEach(([id, visit], index) => {
                outputHtml += generateVisitHtml(
                    `មកលើកទី ${index + 2}`,
                    visit.checkIn,
                    visit.checkOut,
                    visit.clinic,
                    visit.doctor,
                    visit.information || {},  // From add-information.js
                    {}  // Empty for follow-up visits
                );
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

    `;
}

function generateVisitHtml(title, checkIn, checkOut, clinic, doctor, info, medicalDetails) {
    // info comes from add-information.js
    // medicalDetails comes from add-detail-page.js (only for initial visit)
    
    return `
        <div class="visit-note follow-up-visit">
            <div class="visit-note-header">
                <h3>${title}</h3>
                <div class="visit-meta">
                    <div><strong>ថ្ងៃចូល:</strong> ${checkIn || 'N/A'}</div>
                    <div><strong>ថ្ងៃចេញ:</strong> ${checkOut || 'N/A'}</div>
                    ${clinic ? `<div><strong>មន្ទីរពេទ្យ:</strong> ${clinic}</div>` : ''}
                    ${doctor ? `<div><strong>វេជ្ជបណ្ឌិត:</strong> ${doctor}</div>` : ''}
                </div>
            </div>
            
            <div class="visit-note-content">
                <!-- From add-information.js -->
                <div class="section-title">ព័ត៌មានពិនិត្យ</div>
                <div class="note-item"><strong>ប្រវត្តិព្យាបាល:</strong> ${info.treatmentHistory || 'មិនទាន់បំពេញ'}</div>
                <div class="note-item"><strong>តេស្តមន្ទីពិសោធន៍:</strong> ${info.labTest || 'មិនទាន់បំពេញ'}</div>
                <div class="note-item"><strong>រោគវិនិច្ឆ័យ:</strong> ${info.diagnosis || 'មិនទាន់បំពេញ'}</div>
                
                ${info.medicines?.length > 0 ? `
                    <div class="note-item"><strong>ថ្នាំបានផ្តល់ជូន:</strong></div>
                    ${generateMedicineTable(info.medicines)}
                ` : ''}
                
                <!-- From add-detail-page.js (only for initial visit) -->
                ${medicalDetails.note1 ? `
                    <div class="section-title">ព័ត៌មានដំបូង</div>
                    <div class="note-item"><strong>សញ្ញាណតម្អូញ:</strong> ${medicalDetails.note1}</div>
                    <div class="note-item"><strong>រោគវិនិច្ឆ័យញែក:</strong> ${medicalDetails.note5 || 'មិនទាន់បំពេញ'}</div>
                ` : ''}
            </div>
        </div>
                <div class="visit-note follow-up-visit">
            <div class="visit-note-header">
                <h3>${title}</h3>
                <div class="visit-meta">
                    <div><strong>ថ្ងៃចូល:</strong> ${checkIn || 'N/A'}</div>
                    <div><strong>ថ្ងៃចេញ:</strong> ${checkOut || 'N/A'}</div>
                    ${clinic ? `<div><strong>មន្ទីរពេទ្យ:</strong> ${clinic}</div>` : ''}
                    ${doctor ? `<div><strong>វេជ្ជបណ្ឌិត:</strong> ${doctor}</div>` : ''}
                </div>
            </div>
            
            <div class="visit-note-content">
                <!-- From add-information.js -->
                <div class="section-title">ព័ត៌មានពិនិត្យ</div>
                <div class="note-item"><strong>ប្រវត្តិព្យាបាល:</strong> ${info.treatmentHistory || 'មិនទាន់បំពេញ'}</div>
                <div class="note-item"><strong>តេស្តមន្ទីពិសោធន៍:</strong> ${info.labTest || 'មិនទាន់បំពេញ'}</div>
                <div class="note-item"><strong>រោគវិនិច្ឆ័យ:</strong> ${info.diagnosis || 'មិនទាន់បំពេញ'}</div>
                
                ${info.medicines?.length > 0 ? `
                    <div class="note-item"><strong>ថ្នាំបានផ្តល់ជូន:</strong></div>
                    ${generateMedicineTable(info.medicines)}
                ` : ''}
                
                <!-- From add-detail-page.js (only for initial visit) -->
                ${medicalDetails.note1 ? `
                    <div class="section-title">ព័ត៌មានដំបូង</div>
                    <div class="note-item"><strong>សញ្ញាណតម្អូញ:</strong> ${medicalDetails.note1}</div>
                    <div class="note-item"><strong>រោគវិនិច្ឆ័យញែក:</strong> ${medicalDetails.note5 || 'មិនទាន់បំពេញ'}</div>
                ` : ''}
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
window.onload = function() {
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