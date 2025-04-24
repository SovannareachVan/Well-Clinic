import { db } from './firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

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
        console.log("DEBUG - Full Patient Data:", patientData); // For troubleshooting

        // Update basic patient info
        document.getElementById('patientFullName').textContent = patientData.fullName || 'N/A';
        document.getElementById('patientAge').textContent = patientData.age || 'N/A';
        document.getElementById('patientGender').textContent = patientData.gender || 'N/A';
        document.getElementById('patientPhone').textContent = patientData.phone || 'N/A';
        document.getElementById('patientEmail').textContent = patientData.email || 'N/A';

        // ===== Handle Visit Display =====
        let outputHtml = '';
        
        // 1. First Visit (from add-detail-page.js)
        if (patientData.structuredNotes) {
            outputHtml += generateFirstVisitHtml(
                patientData.checkIn,
                patientData.checkOut,
                patientData.structuredNotes
            );
        }

        // 2. Subsequent Visits (from add-information.js)
        if (patientData.visits) {
            const visits = Object.entries(patientData.visits);
            visits.sort((a, b) => new Date(a[1].checkIn) - new Date(b[1].checkIn)); // Sort by date
            
            visits.forEach(([id, visit], index) => {
                outputHtml += generateFollowUpVisitHtml(
                    `ការពិនិត្យលើកទី ${index + 2}`,
                    visit.checkIn,
                    visit.checkOut,
                    visit.clinic,
                    visit.doctor,
                    visit.information || {}
                );
            });
        }

        document.getElementById('patientNotes').innerHTML = outputHtml || '<div>មិនទាន់មានការចូលពិនិត្យ</div>';

    } catch (error) {
        console.error('Error loading patient data:', error);
        document.getElementById('patientNotes').textContent = 'Failed to load patient details.';
    }
}

// ===== TEMPLATE GENERATORS =====

function generateFirstVisitHtml(checkIn, checkOut, notes) {
    return `
    <div class="visit-note first-visit">
        <div class="visit-note-header">
            <h3>ការពិនិត្យដំបូង</h3>
            <div class="visit-meta">
                <div><strong>ថ្ងៃចូល:</strong> ${checkIn || 'N/A'}</div>
                ${checkOut ? `<div><strong>ថ្ងៃចេញ:</strong> ${checkOut}</div>` : ''}
            </div>
        </div>
        <div class="visit-note-content">
            <div class="note-item"><strong>សញ្ញាណតម្អូញ:</strong> ${notes.note1 || 'មិនទាន់បំពេញ'}</div>
            <div class="note-item"><strong>ប្រវត្តិព្យាបាល:</strong> ${notes.note2 || 'មិនទាន់បំពេញ'}</div>
            <div class="note-item"><strong>តេស្តមន្ទីពិសោធន៍:</strong> ${notes.note3 || 'មិនទាន់បំពេញ'}</div>
            <div class="note-item"><strong>រោគវិនិច្ឆ័យ:</strong> ${notes.note4 || 'មិនទាន់បំពេញ'}</div>
            <div class="note-item"><strong>រោគវិនិច្ឆ័យញែក:</strong> ${notes.note5 || 'មិនទាន់បំពេញ'}</div>
            <div class="note-item"><strong>ថ្នាំ:</strong> ${notes.medicines?.length ? generateMedicineTable(notes.medicines) : 'មិនទាន់បំពេញ'}</div>
        </div>
    </div>
    `;
}

function generateFollowUpVisitHtml(title, checkIn, checkOut, clinic, doctor, info) {
    return `
    <div class="visit-note followup-visit">
        <div class="visit-note-header">
            <h3>${title}</h3>
            <div class="visit-meta">
                <div><strong>ថ្ងៃចូល:</strong> ${checkIn || 'N/A'}</div>
                ${checkOut ? `<div><strong>ថ្ងៃចេញ:</strong> ${checkOut}</div>` : ''}
                ${clinic ? `<div><strong>មន្ទីរពេទ្យ:</strong> ${clinic}</div>` : ''}
                ${doctor ? `<div><strong>វេជ្ជបណ្ឌិត:</strong> ${doctor}</div>` : ''}
            </div>
        </div>
        <div class="visit-note-content">
            <div class="note-item"><strong>ប្រវត្តិព្យាបាល:</strong> ${info.note1 || 'មិនទាន់បំពេញ'}</div>
            <div class="note-item"><strong>តេស្តមន្ទីពិសោធន៍:</strong> ${info.note2 || 'មិនទាន់បំពេញ'}</div>
            <div class="note-item"><strong>រោគវិនិច្ឆ័យ:</strong> ${info.note3 || 'មិនទាន់បំពេញ'}</div>
            <div class="note-item"><strong>ថ្នាំ:</strong> ${info.medicines?.length ? generateMedicineTable(info.medicines) : 'មិនទាន់បំពេញ'}</div>
        </div>
    </div>
    `;
}

function generateMedicineTable(medicines) {
    return `
    <div class="medicine-table">
        <div class="medicine-row header">
            <div>ឈ្មោះថ្នាំ</div>
            <div>ប្រភេទ</div>
            <div>រយៈពេល</div>
            <div>ព្រឹក</div>
            <div>ថ្ងៃ</div>
            <div>ល្ងាច</div>
            <div>ចំនួន</div>
        </div>
        ${medicines.map(med => `
            <div class="medicine-row">
                <div>${med.name || ''}</div>
                <div>${med.dosage || ''}</div>
                <div>${med.days || ''} ថ្ងៃ</div>
                <div>${med.morningDose || ''}</div>
                <div>${med.afternoonDose || ''}</div>
                <div>${med.eveningDose || ''}</div>
                <div>${med.quantity || ''}</div>
            </div>
        `).join('')}
    </div>
    `;
}

// Initialize when page loads
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const recordId = urlParams.get('recordId');
    const visitId = urlParams.get('visitId');

    if (recordId) {
        getPatientDetails(recordId, visitId);
    } else {
        document.getElementById('patientNotes').innerHTML = 
            '<div class="error">សូមបញ្ជាក់លេខអ្នកជម្ងឺ</div>';
    }
};