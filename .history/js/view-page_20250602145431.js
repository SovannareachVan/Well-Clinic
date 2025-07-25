import { db } from './firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

async function getPatientDetails(recordId, visitId = null) {
    console.log("Fetching patient data for ID:", recordId, "Visit ID:", visitId);
    const patientNotesContainer = document.getElementById('patientNotes');
    patientNotesContainer.innerHTML = '<div class="loading">Loading...</div>';

    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (!snapshot.exists()) {
            patientNotesContainer.textContent = 'No patient records available.';
            return;
        }

        const patientData = snapshot.val();

        const patientNameHeader = document.getElementById('patientName');
        if (patientNameHeader) {
            patientNameHeader.textContent = patientData.fullName || 'N/A';
        }

        const fields = [
            { id: 'patientFullName', key: 'fullName' },
            { id: 'patientAge', key: 'age' },
            { id: 'patientGender', key: 'gender' },
            { id: 'patientPhone', key: 'phone' },
            { id: 'patientTelegram', key: 'telegram' }
        ];

        fields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                element.textContent = patientData[field.key] || 'N/A';
            }
        });

        const addressMapping = {
            village: {},
            commune: {},
            district: {},
            province: {}
        };

        if (patientData.address) {
            let addressString = '';
            const { village, commune, district, province } = patientData.address;

            const addressParts = [
                village ? `ភូមិ ${addressMapping.village[village] || village}` : '',
                commune ? `ឃុំ/សង្កាត់ ${addressMapping.commune[commune] || commune}` : '',
                district ? `ស្រុក/ខណ្ឌ ${addressMapping.district[district] || district}` : '',
                province ? `ខេត្ត/ក្រុង ${addressMapping.province[province] || province}` : ''
            ].filter(Boolean);

            addressString = addressParts.join(', ');
            const patientAddressElement = document.getElementById('patientAddress');
            if (patientAddressElement) {
                patientAddressElement.textContent = addressString || 'N/A';
            }
        } else {
            console.error('Address data not found or empty');
            const patientAddressElement = document.getElementById('patientAddress');
            if (patientAddressElement) {
                patientAddressElement.textContent = 'N/A';
            }
        }

        const visits = patientData.visits ? Object.entries(patientData.visits) : [];
        let outputHtml = '';

        if (patientData.notes) {
            outputHtml += `<div class="patient-general-notes">${patientData.notes}</div>`;
        }

        if (visits.length === 0) {
            outputHtml += `<div>មិនទាន់មានការចូលពិនិត្យ</div>`;
            patientNotesContainer.innerHTML = outputHtml;
            return;
        }

        // Sort visits in ascending order (oldest to newest)
        visits.sort((a, b) => {
            const checkInA = a[1].checkIn;
            const checkInB = b[1].checkIn;

            const dateA = checkInA === 'N/A' ? new Date() : new Date(checkInA);
            const dateB = checkInB === 'N/A' ? new Date() : new Date(checkInB);

            if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
            if (isNaN(dateA.getTime())) return -1;
            if (isNaN(dateB.getTime())) return 1;

            return dateA - dateB; // Sorts in ascending order (oldest first)
        });

        if (visitId) {
            const visitRef = ref(db, `patients/${recordId}/visits/${visitId}`);
            const visitSnapshot = await get(visitRef);
            if (!visitSnapshot.exists()) {
                console.error(`Visit ID ${visitId} not found.`);
                outputHtml += `<div>Visit not found.</div>`;
                patientNotesContainer.innerHTML = outputHtml;
                return;
            }

            const visit = visitSnapshot.val();
            const infoRef = ref(db, `patients/${recordId}/visits/${visitId}/information`);
            const infoSnapshot = await get(infoRef);
            const visitInfo = infoSnapshot.exists() ? infoSnapshot.val() : {};

            const isFirstVisit = visits.findIndex(v => v[0] === visitId) === 0; // First visit is now at index 0
            outputHtml += generateVisitHtml(
                'ព័ត៌មានពិនិត្យ',
                visit.checkIn,
                visit.checkOut,
                visit.clinic,
                visit.doctor,
                visitInfo,
                isFirstVisit
            );
        } else {
            for (const [currentVisitId, visit] of visits) {
                const infoRef = ref(db, `patients/${recordId}/visits/${currentVisitId}/information`);
                const infoSnapshot = await get(infoRef);
                const visitInfo = infoSnapshot.exists() ? infoSnapshot.val() : {};

                const isFirstVisit = visits.findIndex(v => v[0] === currentVisitId) === 0; // First visit is now at index 0
                outputHtml += generateVisitHtml(
                    `ព័ត៌មានពិនិត្យលើកទី ${visits.findIndex(v => v[0] === currentVisitId) + 1}`, // Adjust numbering
                    visit.checkIn,
                    visit.checkOut,
                    visit.clinic,
                    visit.doctor,
                    visitInfo,
                    isFirstVisit
                );
            }
        }

        patientNotesContainer.innerHTML = outputHtml;

    } catch (error) {
        console.error('Error loading patient data:', error);
        patientNotesContainer.textContent = 'Failed to load patient details.';
    }
}

function generateVisitHtml(title, checkIn, checkOut, clinic, doctor, info, isFirstVisit = false) {
    const checkInDisplay = checkIn && checkIn !== 'N/A' && isValidDate(checkIn) ? checkIn : 'N/A';
    const checkOutDisplay = checkOut && checkOut !== 'N/A' && isValidDate(checkOut) ? checkOut : 'N/A';

    return `
        <div class="visit-note">
            <div class="visit-note-header">
                <h3>${title}</h3>
                <div class="visit-meta">
                    <div><strong>ថ្ងៃចូល:</strong> ${checkInDisplay}</div>
                    <div><strong>ថ្ងៃចេញ:</strong> ${checkOutDisplay}</div>
                    <div><strong>មន្ទីរពេទ្យ:</strong> ${clinic || 'N/A'}</div>
                    <div><strong>វេជ្ជបណ្ឌិត:</strong> ${doctor || 'N/A'}</div>
                </div>
            </div>
            <div class="visit-note-content">
                ${isFirstVisit ? generateFirstVisitContent(info) : generateSecondVisitContent(info)}
            </div>
        </div>
    `;
}

function isValidDate(dateStr) {
    if (!dateStr || dateStr === 'N/A') return false;
    const [datePart, timePart] = dateStr.split(' ');
    if (!datePart || !timePart) return false;
    const [day, month, year] = datePart.split('/').map(num => parseInt(num, 10));
    const [hours, minutes, seconds] = timePart.split(':').map(num => parseInt(num, 10));
    const date = new Date(year, month - 1, day, hours, minutes, seconds);
    return !isNaN(date.getTime()) && 
           dateStr.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/) && 
           day >= 1 && day <= 31 && 
           month >= 1 && month <= 12 && 
           year >= 1900 && year <= new Date().getFullYear() &&
           hours >= 0 && hours <= 23 &&
           minutes >= 0 && minutes <= 59 &&
           seconds >= 0 && seconds <= 59;
}

function generateFirstVisitContent(info) {
    return `
        <div class="note-item"><strong>សញ្ញាណតម្អូញ:</strong> ${info.note1 || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>ប្រវត្តិព្យាបាល:</strong> ${info.note2 || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>តេស្តមន្ទីពិសោធន៍:</strong> ${info.note3 || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>រោគវិនិច្ឆ័យ:</strong> ${info.diagnosis || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>រោគវិនិច្ឆ័យញែក:</strong> ${info.note5 || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>របៀបប្រើប្រាស់ថ្នាំ:</strong> ${info.medicines ? generateMedicineTable(info.medicines) : 'មិនទាន់បំពេញ'}</div>
    `;
}

function generateSecondVisitContent(info) {
    return `
        <div class="note-item"><strong>ប្រវត្តិព្យាបាល:</strong> ${info.treatmentHistory || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>តេស្តមន្ទីពិសោធន៍:</strong> ${info.labTest || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>រោគវិនិច្ឆ័យ:</strong> ${info.diagnosis || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>របៀបប្រើប្រាស់ថ្នាំ:</strong> ${info.medicines ? generateMedicineTable(info.medicines) : 'មិនទាន់បំពេញ'}</div>
    `;
}

function generateMedicineTable(medicines) {
    return `
    <div class="medicine-container">
        <div class="medication-table">
            <div class="medicine-header">
                <div class="medicine-col">ល.រ</div>
                <div class="medicine-col">ឈ្មោះថ្នាំ</div>
                <div class="medicine-col">ប្រភេទថ្នាំ</div>
                <div class="medicine-col">រយៈពេល</div>
                <div class="medicine-col">ព្រឹក</div>
                <div class="medicine-col">ថ្ងៃ</div>
                <div class="medicine-col">ល្ងាច</div>
                <div class="medicine-col">ចំនួន</div>
            </div>
            ${medicines.map((med, index) => `
                <div class="medicine-row">
                    <div class="medicine-col">${index + 1}.</div>
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
    </div>
    `;
}

window.onload = function () {
    const urlParams = new URLSearchParams(window.location.search);
    const recordId = urlParams.get('recordId');
    const visitId = urlParams.get('visitId');
    if (recordId) {
        getPatientDetails(recordId, visitId).then(() => {
            console.log(`Loaded data for recordId: ${recordId}, visitId: ${visitId}`);
        });
    } else {
        document.getElementById('patientNotes').innerHTML = `
            <div class="error-message">Error: No patient ID provided in URL.</div>
        `;
        console.error('No recordId found in URL');
    }
};