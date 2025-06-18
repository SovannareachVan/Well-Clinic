import { db } from './firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

async function getPatientDetails(recordId, visitId = null) {
    console.log("Fetching patient data for ID:", recordId, "Visit ID:", visitId);
    const patientNotesContainer = document.getElementById('patientNotes');
    if (!patientNotesContainer) {
        console.error("patientNotes container not found in DOM.");
        return { visits: [] };
    }
    patientNotesContainer.innerHTML = '<div class="loading">Loading...</div>';

    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (!snapshot.exists()) {
            patientNotesContainer.textContent = 'No patient records available.';
            return { visits: [] };
        }

        const patientData = snapshot.val();
        console.log("Patient data:", patientData);

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
            console.warn('Address data not found or empty');
            const patientAddressElement = document.getElementById('patientAddress');
            if (patientAddressElement) {
                patientAddressElement.textContent = 'N/A';
            }
        }

        const visits = patientData.visits ? Object.entries(patientData.visits).filter(([_, visit]) => visit && typeof visit === 'object') : [];
        console.log("Visits data before sorting:", visits.map(([visitId, visit]) => ({ visitId, checkIn: visit.checkIn, checkOut: visit.checkOut })));

        let outputHtml = '';

        if (patientData.notes) {
            outputHtml += `<div class="patient-general-notes">${patientData.notes}</div>`;
        }

        if (visits.length === 0) {
            outputHtml += `<div>មិនទាន់មានការចូលពិនិត្យ</div>`;
            patientNotesContainer.innerHTML = outputHtml;
            return { visits };
        }

        visits.sort((a, b) => {
            const checkInA = a[1].checkIn || 'N/A';
            const checkInB = b[1].checkIn || 'N/A';

            const dateA = checkInA === 'N/A' ? new Date(0) : new Date(checkInA);
            const dateB = checkInB === 'N/A' ? new Date(0) : new Date(checkInB);

            if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) {
                console.warn(`Both checkIn dates are invalid: ${a[0]} (${checkInA}) and ${b[0]} (${checkInB})`);
                return 0;
            }
            if (isNaN(dateA.getTime())) {
                console.warn(`Invalid checkIn date for visit ${a[0]}:`, checkInA);
                return 1;
            }
            if (isNaN(dateB.getTime())) {
                console.warn(`Invalid checkIn date for visit ${b[0]}:`, checkInB);
                return -1;
            }

            return dateA - dateB; // Oldest to newest
        });

        console.log("Visits data after sorting:", visits.map(([visitId, visit]) => ({ visitId, checkIn: visit.checkIn, checkOut: visit.checkOut })));

        if (visitId) {
            const visitIndex = visits.findIndex(v => v[0] === visitId);
            if (visitIndex === -1) {
                console.warn(`Visit ID ${visitId} not found, falling back to first visit for patient ${recordId}`);
                visitId = visits[0][0];
            }
            const [currentVisitId, visit] = visits.find(v => v[0] === visitId) || [];
            if (currentVisitId) {
                const infoRef = ref(db, `patients/${recordId}/visits/${currentVisitId}/information`);
                const infoSnapshot = await get(infoRef);
                const visitInfo = infoSnapshot.exists() ? infoSnapshot.val() : {};
                console.log(`Visit info for ${currentVisitId}:`, visitInfo);
                const isFirstVisit = visits.findIndex(v => v[0] === currentVisitId) === 0;
                const visitNumber = visits.findIndex(v => v[0] === currentVisitId) + 1;
                outputHtml += generateVisitHtml(
                    `ព័ត៌មានពិនិត្យលើកទី ${visitNumber}`,
                    visit.checkIn,
                    visit.checkOut,
                    visit.clinic,
                    visit.doctor,
                    visitInfo,
                    isFirstVisit,
                    currentVisitId
                );
            } else {
                outputHtml += `<div>No valid visits found.</div>`;
            }
        } else {
            visits.forEach(([currentVisitId, visit], index) => {
                const infoRef = ref(db, `patients/${recordId}/visits/${currentVisitId}/information`);
                const infoSnapshot = await get(infoRef);
                const visitInfo = infoSnapshot.exists() ? infoSnapshot.val() : {};
                console.log(`Visit info for ${currentVisitId}:`, visitInfo);
                const isFirstVisit = index === 0;
                outputHtml += generateVisitHtml(
                    `ព័ត៌មានពិនិត្យលើកទី ${index + 1}`,
                    visit.checkIn,
                    visit.checkOut,
                    visit.clinic,
                    visit.doctor,
                    visitInfo,
                    isFirstVisit,
                    currentVisitId
                );
            });
        }

        patientNotesContainer.innerHTML = outputHtml;
        return { visits };

    } catch (error) {
        console.error('Error loading patient data:', error);
        patientNotesContainer.textContent = 'Failed to load patient details.';
        return { visits: [] };
    }
}

function generateVisitHtml(title, checkIn, checkOut, clinic, doctor, info, isFirstVisit = false, visitId) {
    const checkInDisplay = checkIn && isValidDate(checkIn) ? checkIn : 'N/A';
    const checkOutDisplay = checkOut && isValidDate(checkOut) ? checkOut : 'N/A';
    console.log(`Generating HTML for visit ${visitId}: checkInDisplay=${checkInDisplay}, checkOutDisplay=${checkOutDisplay}`);

    return `
        <div class="visit-note" data-visit-id="${visitId}">
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
           day >= 1 && day <= 31 && 
           month >= 1 && month <= 12 && 
           year >= 1900 && year <= new Date().getFullYear() + 10 &&
           hours >= 0 && hours <= 23 &&
           minutes >= 0 && minutes <= 59 &&
           seconds >= 0 && seconds <= 59;
}

function generateFirstVisitContent(info) { 
    console.log("Generating first visit content with info:", info);
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
    console.log("Generating second visit content with info:", info);
    return `
        <div class="note-item"><strong>ប្រវត្តិព្យាបាល:</strong> ${info.treatmentHistory || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>តេស្តមន្ទីពិសោធន៍:</strong> ${info.labTest || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>រោគវិនិច្ឆ័យ:</strong> ${info.diagnosis || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>របៀបប្រើប្រាស់ថ្នាំ:</strong> ${info.medicines ? generateMedicineTable(info.medicines) : 'មិនទាន់បំពេញ'}</div>
    `;
}

function generateMedicineTable(medicines) {
    console.log("Generating medicine table with data:", medicines);

    let medicineArray = [];
    if (medicines) {    
        if (Array.isArray(medicines)) {
            medicineArray = medicines.filter(med => med && typeof med === 'object');
            console.log("Medicines is an array:", medicineArray);
        } else if (typeof medicines === 'object' && medicines !== null) {
            medicineArray = Object.entries(medicines)
                .filter(([_, med]) => med && typeof med === 'object')
                .map(([itemId, med]) => ({ ...med, itemId }));
            console.log("Medicines is an object, converted to array with itemId:", medicineArray);
        } else {
            console.warn("Unexpected medicines data type:", typeof medicines, medicines);
            return 'មិនទាន់បំពេញ';
        }
    }

    if (medicineArray.length === 0) {
        console.log("No valid medicines to display.");
        return 'មិនទាន់បំពេញ';
    }

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
                <div class="medicine-col">កំណត់ចំណាំ</div>
            </div>
            ${medicineArray.map((med, index) => `
                <div class="medicine-row" data-item-id="${med.itemId || ''}">
                    <div class="medicine-col">${index + 1}.</div>
                    <div class="medicine-col">${med.name || ''}</div>
                    <div class="medicine-col">${med.dosage || ''}</div>
                    <div class="medicine-col">${med.days || ''} ថ្ងៃ</div>
                    <div class="medicine-col">${med.morningDose || ''}</div>
                    <div class="medicine-col">${med.afternoonDose || ''}</div>
                    <div class="medicine-col">${med.eveningDose || ''}</div>
                    <div class="medicine-col">${med.quantity || ''}</div>
                    <div class="medicine-col">
                        ${med.globalNote ? `<button class="global-note-icon" title="View Note"><i class="fa-solid fa-file"></i></button>` : 'N/A'}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    `;
}

function showGlobalNotePopup(recordId, visitId, itemId, rowElement) {
    console.log("Opening global note popup for:", { recordId, visitId, itemId });
    const backdrop = document.createElement('div');
    backdrop.classList.add('global-note-backdrop');
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.background = 'rgba(0, 0, 0, 0.5)';
    backdrop.style.zIndex = '999';

    const popup = document.createElement('div');
    popup.classList.add('global-note-popup');

    if (!recordId || !visitId || !itemId) {
        console.error('Missing required parameters:', { recordId, visitId, itemId });
        popup.innerHTML = `
            <div class="global-note-popup-content">
                <span class="close-global-note-popup">×</span>
                <h3>Note</h3>
                <p>Error: Missing recordId, visitId, or itemId</p>
            </div>
        `;
        finalizePopup();
        return;
    }

    const noteRef = ref(db, `patients/${recordId}/visits/${visitId}/information/medicines/${itemId}/globalNote`);
    get(noteRef).then(snapshot => {
        const globalNote = snapshot.exists() && typeof snapshot.val() === 'string' ? snapshot.val() : 'No global note available';
        console.log(`Global note for item ${itemId}:`, globalNote);
        popup.innerHTML = `
            <div class="global-note-popup-content">
                <span class="close-global-note-popup">×</span>
                <h3>Note</h3>
                <p>${globalNote}</p>
            </div>
        `;
        finalizePopup();
    }).catch(error => {
        console.error('Error fetching global note:', error);
        popup.innerHTML = `
            <div class="global-note-popup-content">
                <span class="close-global-note-popup">×</span>
                <h3>កំណត់ចំណាំសាកល</h3>
                <p>Error loading note: ${error.message}</p>
            </div>
        `;
        finalizePopup();
    });

    function finalizePopup() {
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.zIndex = '1000';
        popup.style.background = '#fff';
        popup.style.border = '1px solid #ccc';
        popup.style.padding = '10px';
        popup.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        popup.style.minWidth = '200px';

        document.body.appendChild(backdrop);
        document.body.appendChild(popup);

        const closeBtn = popup.querySelector('.close-global-note-popup');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                popup.remove();
                backdrop.remove();
            });
        }

        const handleOutsideClick = (event) => {
            if (!popup.contains(event.target) && !rowElement.contains(event.target)) {
                popup.remove();
                backdrop.remove();
                document.removeEventListener('click', handleOutsideClick);
            }
        };
        document.addEventListener('click', handleOutsideClick);
    }
}

window.onload = function () {
    const urlParams = new URLSearchParams(window.location.search);
    const recordId = urlParams.get('recordId');
    let visitId = urlParams.get('visitId');

    if (recordId) {
        getPatientDetails(recordId, visitId).then(({ visits }) => {
            console.log(`Loaded data for recordId: ${recordId}, visitId: ${visitId}`);
            if (!visitId && visits && visits.length > 0) {
                visitId = visits[0][0];
                console.log('Using default visitId:', visitId);
            }

            const patientNotesContainer = document.getElementById('patientNotes');
            if (patientNotesContainer) {
                patientNotesContainer.addEventListener('click', (event) => {
                    const button = event.target.closest('.global-note-icon');
                    if (button) {
                        const row = button.closest('.medicine-row');
                        const itemId = row ? row.dataset.itemId : null;
                        console.log('Clicked row itemId:', itemId, 'recordId:', recordId, 'visitId:', row?.closest('.visit-note')?.dataset.visitId || visitId);
                        if (itemId && recordId) {
                            const effectiveVisitId = row?.closest('.visit-note')?.dataset.visitId || visitId;
                            if (effectiveVisitId) {
                                showGlobalNotePopup(recordId, effectiveVisitId, itemId, row);
                            } else {
                                console.warn('No visitId available for this row');
                            }
                        } else {
                            console.warn('Missing itemId or recordId:', { itemId, recordId });
                        }
                    }
                });
            }
        }).catch(error => {
            console.error('Failed to load patient details:', error);
            document.getElementById('patientNotes').innerHTML = `
                <div class="error-message">Error: Failed to load patient details: ${error.message}</div>
            `;
        });
    } else {
        console.error('No recordId found in URL');
        document.getElementById('patientNotes').innerHTML = `
            <div class="error-message">Error: No patient ID provided in URL.</div>
        `;
    }
};