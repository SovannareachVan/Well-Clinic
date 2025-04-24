import { db } from './firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

async function getPatientDetails(recordId, visitId = null) {
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (!snapshot.exists()) {
            document.getElementById('patientNotes').innerHTML = `
                <div class="error-message">មិនមានទិន្នន័យអ្នកជម្ងឺ</div>
            `;
            return;
        }

        const patientData = snapshot.val();
        updateBasicInfo(patientData);

        if (visitId) {
            displaySingleVisit(patientData, visitId);
        } else {
            displayAllVisits(patientData);
        }
    } catch (error) {
        console.error('Error loading patient data:', error);
        document.getElementById('patientNotes').innerHTML = `
            <div class="error-message">កំហុសក្នុងការផ្ទុកទិន្នន័យ</div>
        `;
    }
}

function updateBasicInfo(patientData) {
    document.getElementById('patientFullName').textContent = patientData.fullName || 'N/A';
    document.getElementById('patientAge').textContent = patientData.age || 'N/A';
    document.getElementById('patientGender').textContent = patientData.gender || 'N/A';
    document.getElementById('patientPhone').textContent = patientData.phone || 'N/A';
    document.getElementById('patientEmail').textContent = patientData.email || 'N/A';
}

function displaySingleVisit(patientData, visitId) {
    const visit = patientData.visits?.[visitId];
    if (!visit) {
        document.getElementById('patientNotes').innerHTML = `
            <div class="error-message">មិនមានកំណត់ត្រាពិនិត្យ</div>
        `;
        return;
    }

    const html = `
        ${generateInitialVisitSection(patientData)}
        ${generateFollowUpVisitSection(visit, visitId)}
    `;
    document.getElementById('patientNotes').innerHTML = html;
}

function displayAllVisits(patientData) {
    let html = generateInitialVisitSection(patientData);
    
    if (patientData.visits) {
        const visits = Object.entries(patientData.visits);
        visits.sort((a, b) => new Date(b[1].checkIn) - new Date(a[1].checkIn));
        
        visits.forEach(([id, visit], index) => {
            html += generateFollowUpVisitSection(visit, id, index + 2);
        });
    }
    
    document.getElementById('patientNotes').innerHTML = html;
}

function generateInitialVisitSection(patientData) {
    const notes = patientData.structuredNotes || {};
    return `
        <div class="visit-card initial-visit">
            <div class="visit-header">
                <h3>ការពិនិត្យដំបូង</h3>
                <div class="visit-meta">
                    <span>${patientData.checkIn || 'N/A'}</span>
                    ${patientData.checkOut ? `<span>ដល់ ${patientData.checkOut}</span>` : ''}
                </div>
            </div>
            
            <div class="visit-content">
                <div class="section-title">ព័ត៌មានវេជ្ជសាស្ត្រ</div>
                
                <div class="info-grid">
                    <div class="info-item">
                        <label>សញ្ញាណតម្អូញ:</label>
                        <div>${notes.note1 || 'មិនទាន់បំពេញ'}</div>
                    </div>
                    <div class="info-item">
                        <label>ប្រវត្តិព្យាបាល:</label>
                        <div>${notes.note2 || 'មិនទាន់បំពេញ'}</div>
                    </div>
                    <div class="info-item">
                        <label>តេស្តមន្ទីពិសោធន៍:</label>
                        <div>${notes.note3 || 'មិនទាន់បំពេញ'}</div>
                    </div>
                    <div class="info-item">
                        <label>រោគវិនិច្ឆ័យ:</label>
                        <div>${notes.note4 || 'មិនទាន់បំពេញ'}</div>
                    </div>
                    <div class="info-item">
                        <label>រោគវិនិច្ឆ័យញែក:</label>
                        <div>${notes.note5 || 'មិនទាន់បំពេញ'}</div>
                    </div>
                </div>
                
                ${notes.medicines?.length ? generateMedicineSection(notes.medicines) : ''}
                
                <div class="general-notes">
                    <label>កំណត់សម្គាល់:</label>
                    <div>${patientData.notes || 'មិនមានវេជ្ជបញ្ជា'}</div>
                </div>
            </div>
        </div>
    `;
}

function generateFollowUpVisitSection(visit, visitId, visitNumber = null) {
    const info = visit.information || {};
    return `
        <div class="visit-card follow-up-visit">
            <div class="visit-header">
                <h3>${visitNumber ? `មកលើកទី ${visitNumber}` : 'ការពិនិត្យតាមការណាត់ជួប'}</h3>
                <div class="visit-meta">
                    <span>${visit.checkIn || 'N/A'}</span>
                    ${visit.checkOut ? `<span>ដល់ ${visit.checkOut}</span>` : ''}
                    ${visit.clinic ? `<span>មន្ទីរពេទ្យ: ${visit.clinic}</span>` : ''}
                    ${visit.doctor ? `<span>វេជ្ជបណ្ឌិត: ${visit.doctor}</span>` : ''}
                </div>
            </div>
            
            <div class="visit-content">
                <div class="section-title">ព័ត៌មានបន្ថែម</div>
                
                <div class="info-grid">
                    <div class="info-item">
                        <label>ស្ថានភាពបច្ចុប្បន្ន:</label>
                        <div>${info.currentCondition || 'មិនទាន់បំពេញ'}</div>
                    </div>
                    <div class="info-item">
                        <label>ប្រវត្តិព្យាបាល:</label>
                        <div>${info.treatmentHistory || 'មិនទាន់បំពេញ'}</div>
                    </div>
                    <div class="info-item">
                        <label>តេស្តមន្ទីពិសោធន៍:</label>
                        <div>${info.labTest || 'មិនទាន់បំពេញ'}</div>
                    </div>
                    <div class="info-item">
                        <label>រោគវិនិច្ឆ័យ:</label>
                        <div>${info.diagnosis || 'មិនទាន់បំពេញ'}</div>
                    </div>
                    <div class="info-item">
                        <label>សកម្មភាពព្យាបាល:</label>
                        <div>${info.treatmentActivity || 'មិនទាន់បំពេញ'}</div>
                    </div>
                    <div class="info-item">
                        <label>ការណែនាំ:</label>
                        <div>${info.recommendations || 'មិនទាន់បំពេញ'}</div>
                    </div>
                </div>
                
                ${info.medicines?.length ? generateMedicineSection(info.medicines) : ''}
                
                ${info.notes ? `
                    <div class="general-notes">
                        <label>កំណត់សម្គាល់:</label>
                        <div>${info.notes}</div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function generateMedicineSection(medicines) {
    return `
        <div class="medicine-section">
            <div class="section-title">ថ្នាំបានផ្តល់ជូន</div>
            <div class="medicine-table">
                <div class="medicine-header">
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
        </div>
    `;
}

window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const recordId = urlParams.get('recordId');
    const visitId = urlParams.get('visitId');

    if (recordId) {
        getPatientDetails(recordId, visitId);
    } else {
        document.getElementById('patientNotes').innerHTML = `
            <div class="error-message">សូមបញ្ជាក់លេខអ្នកជម្ងឺ</div>
        `;
    }
};