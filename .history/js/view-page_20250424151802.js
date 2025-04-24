// Import Firebase modules
import { db } from './firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// =============== Fetch Patient Details ================
async function getPatientDetails(recordId, visitId = null) {
    console.log("Fetching patient data for ID:", recordId);
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (!snapshot.exists()) {
            document.getElementById('patientNotes').textContent = 'No patient records available.';
            return;
        }

        const patientData = snapshot.val(); 
        const patientNotesContainer = document.getElementById('patientNotes');

        // Show basic info
        document.getElementById('patientFullName').textContent = patientData.fullName || 'N/A';
        document.getElementById('patientAge').textContent = patientData.age || 'N/A';
        document.getElementById('patientGender').textContent = patientData.gender || 'N/A';
        document.getElementById('patientPhone').textContent = patientData.phone || 'N/A';
        document.getElementById('patientEmail').textContent = patientData.email || 'N/A';

        const visits = patientData.visits ? Object.entries(patientData.visits) : [];

        if (visits.length === 0) {
            patientNotesContainer.innerHTML = `<div>មិនទាន់មានការចូលពិនិត្យ</div>`;
            return;
        }

        // Sort visits by checkIn date (newest first)
        visits.sort((a, b) => new Date(b[1].checkIn) - new Date(a[1].checkIn));

        let outputHtml = '';

        if (visitId && patientData.visits?.[visitId]) {
            const visit = patientData.visits[visitId];
            outputHtml = generateVisitHtml('ព័ត៌មានពិនិត្យ', visit.checkIn, visit.checkOut, visit.clinic, visit.doctor, visit.information || {}, visitId === '2');
        } else {
            // Show all visits if no specific visitId is provided
            visits.forEach(([visitId, visit], index) => {
                outputHtml += generateVisitHtml(
                    `ព័ត៌មានពិនិត្យលើកទី ${index + 1}`,
                    visit.checkIn,
                    visit.checkOut,
                    visit.clinic,
                    visit.doctor,
                    visit.information || {},
                    index === 1 // If it's the second visit, treat it differently
                );
            });
        }

        patientNotesContainer.innerHTML = outputHtml;

    } catch (error) {
        console.error('Error loading patient data:', error);
        document.getElementById('patientNotes').textContent = 'Failed to load patient details.';
    }
}

function generateVisitHtml(title, checkIn, checkOut, clinic, doctor, info, isSecondVisit = false) {
    return `
        <div class="visit-note">
            <div class="visit-note-header">
                <h3>${title}</h3>
                <div class="visit-meta">
                    <div><strong>ថ្ងៃចូល:</strong> ${formatDate(checkIn)}</div>
                    <div><strong>ថ្ងៃចេញ:</strong> ${formatDate(checkOut)}</div>
                    <div><strong>មន្ទីរពេទ្យ:</strong> ${clinic || 'N/A'}</div>
                    <div><strong>វេជ្ជបណ្ឌិត:</strong> ${doctor || 'N/A'}</div>
                </div>
            </div>  
            <div class="visit-note-content">
                ${isSecondVisit ? generateSecondVisitContent(info) : generateFirstVisitContent(info)}
            </div>
        </div>
    `;
}

// For the first visit, display the fields exactly as needed
function generateFirstVisitContent(info) {
    return `
        <div class="note-item"><strong>សញ្ញាណតម្អូញ:</strong> ${info.sign || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>ប្រវត្តិព្យាបាល:</strong> ${info.note1 || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>តេស្តមន្ទីពិសោធន៍:</strong> ${info.note2 || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>រោគវិនិច្ឆ័យ:</strong> ${info.note3 || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>រោគវិនិច្ឆ័យញែក:</strong> ${info.note4 || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>របៀបប្រើប្រាស់ថ្នាំ:</strong> ${info.medicines ? generateMedicineTable(info.medicines) : 'មិនទាន់បំពេញ'}</div>
    `;
}

// For the second visit, display a simpler set of fields
function generateSecondVisitContent(info) {
    return `
        <div class="note-item"><strong>ប្រវត្តិព្យាបាល:</strong> ${info.note1 || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>តេស្តមន្ទីពិសោធន៍:</strong> ${info.note2 || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>រោគវិនិច្ឆ័យ:</strong> ${info.note3 || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>របៀបប្រើប្រាស់ថ្នាំ:</strong> ${info.medicines ? generateMedicineTable(info.medicines) : 'មិនទាន់បំពេញ'}</div>
    `;
}

// Generate the medicine table if applicable
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

// Format the date correctly
function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

// =============== Load when page ready ================
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