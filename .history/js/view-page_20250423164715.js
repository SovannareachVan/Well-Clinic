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

        // Update patient info
        document.getElementById('patientFullName').textContent = patientData.fullName || 'N/A';
        document.getElementById('patientAge').textContent = patientData.age || 'N/A';
        document.getElementById('patientGender').textContent = patientData.gender || 'N/A';
        document.getElementById('patientPhone').textContent = patientData.phone || 'N/A';
        document.getElementById('patientEmail').textContent = patientData.email || 'N/A';

        // === View specific visit if visitId is provided ===
        if (visitId && patientData.visits?.[visitId]) {
            const visit = patientData.visits[visitId];
            const info = visit.information || {};

            const visitHtml = `
                <div class="visit-note">
                    <div class="visit-note-header">
                        <h3>មកពិនិត្យ (${visitId})</h3>
                        <div class="visit-meta">
                            <div><strong>ថ្ងៃចូល:</strong> ${visit.checkIn || 'N/A'}</div>
                            <div><strong>ថ្ងៃចេញ:</strong> ${visit.checkOut || 'N/A'}</div>
                            <div><strong>មន្ទីរពេទ្យ:</strong> ${visit.clinic || 'N/A'}</div>
                            <div><strong>វេជ្ជបណ្ឌិត:</strong> ${visit.doctor || 'N/A'}</div>
                        </div>
                    </div>
                    <div class="visit-note-content">
                                        <div class="note-item"><strong>1. សញ្ញាណតម្អូញ:</strong> ${initialNotes.note1 || 'មិនទាន់បំពេញ'}</div>
                        <div class="note-item"><strong>ប្រវត្តិព្យាបាល:</strong> ${info.note2 || info.treatmentHistory || 'មិនទាន់បំពេញ'}</div>
                        <div class="note-item"><strong>តេស្តមន្ទីពិសោធន៍:</strong> ${info.note3 || info.labTest || 'មិនទាន់បំពេញ'}</div>
                        <div class="note-item"><strong>រោគវិនិច្ឆ័យ:</strong> ${info.note4 || info.diagnosis || 'មិនទាន់បំពេញ'}</div>
                        <div class="note-item"><strong>របៀបប្រើថ្នាំ:</strong></div>
                        ${info.medicines?.length > 0 ? generateMedicineTable(info.medicines) : '<div class="medicine-empty">មិនទាន់បំពេញ</div>'}
                    </div>
                </div>
            `;
            patientNotesContainer.innerHTML = visitHtml;
            return;
        }

        // === Default view: show all visits ===
        let outputHtml = '';

        // First visit (registration) - now using structuredNotes format
        const initialNotes = patientData.structuredNotes || {};
        const generalNotes = patientData.notes || 'មិនមានវេជ្ជបញ្ជា';

        outputHtml += `
            <div class="visit-note">
                <div class="visit-note-header">
                    <h3>ព័ត៌មានដំបូង (ចុះឈ្មោះ)</h3>
                    <div class="visit-meta">
                        <div><strong>ថ្ងៃចូល:</strong> ${patientData.checkIn || 'N/A'}</div>
                        ${patientData.checkOut ? `<div><strong>ថ្ងៃចេញ:</strong> ${patientData.checkOut}</div>` : ''}
                    </div>
                </div>
                <div class="visit-note-content">
                    <div class="note-item"><strong>វេជ្ជបញ្ជា:</strong> ${generalNotes}</div>
                    <div class="note-item"><strong>1. សញ្ញាណតម្អូញ:</strong> ${initialNotes.note1 || 'មិនទាន់បំពេញ'}</div>
                    <div class="note-item"><strong>2. ប្រវត្តិព្យាបាល:</strong> ${initialNotes.note2 || 'មិនទាន់បំពេញ'}</div>
                    <div class="note-item"><strong>3. តេស្តមន្ទីពិសោធន៍:</strong> ${initialNotes.note3 || 'មិនទាន់បំពេញ'}</div>
                    <div class="note-item"><strong>4. រោគវិនិច្ឆ័យ:</strong> ${initialNotes.note4 || 'មិនទាន់បំពេញ'}</div>
                    <div class="note-item"><strong>5. រោគវិនិច្ឆ័យញែក:</strong> ${initialNotes.note5 || 'មិនទាន់បំពេញ'}</div>
                    <div class="note-item"><strong>6. របៀបប្រើថ្នាំ:</strong></div>
                    ${initialNotes.medicines?.length > 0 ? generateMedicineTable(initialNotes.medicines) : '<div class="medicine-empty">មិនទាន់បំពេញ</div>'}
                </div>
            </div>
        `;

        // Subsequent visits
        if (patientData.visits) {
            const visits = Object.entries(patientData.visits);
            // Sort visits by check-in date (newest first)
            visits.sort((a, b) => new Date(b[1].checkIn) - new Date(a[1].checkIn));

            visits.forEach(([id, visit], index) => {
                const info = visit.information || {};
                outputHtml += `
                    <div class="visit-note">
                        <div class="visit-note-header">
                            <h3>មកលើកទី ${index + 2}</h3>
                            <div class="visit-meta">
                                <div><strong>ថ្ងៃចូល:</strong> ${visit.checkIn || 'N/A'}</div>
                                <div><strong>ថ្ងៃចេញ:</strong> ${visit.checkOut || 'N/A'}</div>
                                <div><strong>មន្ទីរពេទ្យ:</strong> ${visit.clinic || 'N/A'}</div>
                                <div><strong>វេជ្ជបណ្ឌិត:</strong> ${visit.doctor || 'N/A'}</div>
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
            });
        }

        patientNotesContainer.innerHTML = outputHtml;

    } catch (error) {
        console.error('Error loading patient data:', error);
        document.getElementById('patientNotes').textContent = 'Failed to load patient details.';
    }
}

// Helper: render medicine info
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
    const visitId = urlParams.get('visitId'); // optional

    if (recordId) {
        getPatientDetails(recordId, visitId);
    } else {
        document.getElementById('patientNotes').innerHTML = `
            <div class="error-message">Error: No patient ID provided in URL.</div>
        `;
    }
};