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

            // Display all visits in cards
            if (patientData.visits) {
                const visitsContainer = document.getElementById('visitsContainer');
                visitsContainer.innerHTML = ''; // Clear existing content

                Object.entries(patientData.visits).forEach(([visitId, visit], index) => {
                    const visitInfo = visit.information || {};
                    
                    const visitCard = document.createElement('div');
                    visitCard.className = 'visit-card';
                    visitCard.innerHTML = `
                        <div class="visit-header">
                            <h3>Note ${index + 1}</h3>
                            <div class="visit-meta">
                                <span><strong>លេខរៀង:</strong> ${index + 1}</span>
                                <span><strong>ថ្ងៃចូលមន្ទីពេទ្យ:</strong> ${visit.checkIn || 'N/A'}</span>
                                <span><strong>ថ្ងៃចេញពីមន្ទីពេទ្យ:</strong> ${visit.checkOut || 'N/A'}</span>
                                <span><strong>មន្ទីពេទ្យ:</strong> ${visit.clinic || 'N/A'}</span>
                                <span><strong>ពិគ្រោះដោយ:</strong> ${visit.doctor || 'Dr. Minh Hong'}</span>
                            </div>
                        </div>
                        <div class="visit-details">
                            <h4>ព័ត៌មានពិនិត្យថ្មីបំផុត</h4>
                            <p><strong>ប្រវត្តិព្យាបាល:</strong> ${visitInfo.treatmentHistory || 'មិនទាន់បំពេញ'}</p>
                            <p><strong>តេស្តមន្ទីពិសោធន៍:</strong> ${visitInfo.labTest || 'មិនទាន់បំពេញ'}</p>
                            <p><strong>រោគវិនិច្ឆ័យ:</strong> ${visitInfo.diagnosis || 'មិនទាន់បំពេញ'}</p>
                            <div class="medicine-section">
                                <strong>របៀបប្រើប្រាស់ថ្នាំ:</strong>
                                ${visitInfo.medicines?.length ? generateMedicineTable(visitInfo.medicines) : '<div class="medicine-empty">មិនទាន់បំពេញ</div>'}
                            </div>
                        </div>
                    `;
                    visitsContainer.appendChild(visitCard);
                });
            }
        } else {
            document.getElementById('visitsContainer').innerHTML = '<p>No patient records found.</p>';
        }
    } catch (error) {
        console.error('Error loading patient data:', error);
        document.getElementById('visitsContainer').innerHTML = '<p>Failed to load patient details.</p>';
    }
}

function generateMedicineTable(medicines) {
    return `
    <div class="medicine-container">
        <div class="medicine-header">
            <div>ឈ្មោះថ្នាំ</div>
            <div>ប្រភេទថ្នាំ</div>
            <div>រយះពេល</div>
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

window.onload = function() {
    const recordId = new URLSearchParams(window.location.search).get('recordId');
    if (recordId) {
        getPatientDetails(recordId);
    } else {
        document.getElementById('visitsContainer').innerHTML = '<p>Error: Missing patient ID.</p>';
    }
};

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