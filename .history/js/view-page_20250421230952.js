import { db } from './firebase-config.js';
import { ref, get, push, update, remove } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

document.getElementById('checkInBtn').addEventListener('click', checkIn);
document.getElementById('backBtn').addEventListener('click', () => window.history.back());

let rowCount = 1;
let recordId;

async function getPatientDetails(id) {
    try {
        const patientRef = ref(db, 'patients/' + id);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();
            document.getElementById('patientName').textContent = patientData.fullName;
            document.getElementById('patientFullName').textContent = patientData.fullName;
            document.getElementById('patientAge').textContent = patientData.age;
            document.getElementById('patientGender').textContent = patientData.gender;
            document.getElementById('patientPhone').textContent = patientData.phone;
            document.getElementById('patientEmail').textContent = patientData.email || 'N/A';
            document.getElementById('patientNotes').textContent = patientData.notes || 'No notes available.';
        }
    } catch (error) {
        console.error('Error fetching patient:', error);
    }
}

async function loadSavedVisits(id) {
    try {
        const visitsRef = ref(db, 'patients/' + id + '/visits');
        const snapshot = await get(visitsRef);

        if (snapshot.exists()) {
            const visits = snapshot.val();
            const visitsContainer = document.getElementById('visitsContainer');
            visitsContainer.innerHTML = '';

            Object.entries(visits).forEach(([visitId, visit], index) => {
                // Create visit card
                const visitCard = document.createElement('div');
                visitCard.className = 'visit-card';
                visitCard.dataset.visitId = visitId;

                // Visit header with serial number and dates
                const visitHeader = document.createElement('div');
                visitHeader.className = 'visit-header';
                visitHeader.innerHTML = `
                    <span class="serial-number">លេខរៀង: ${index + 1}</span>
                    <span class="visit-date">ថ្ងៃចូលមន្ទីពេទ្យ: ${visit.checkIn.replace(' ', '<br>')}</span>
                    <span class="visit-date">ថ្ងៃចេញពីមន្ទីពេទ្យ: ${visit.checkOut !== 'N/A' ? visit.checkOut.replace(' ', '<br>') : 'មិនទាន់ចេញ'}</span>
                `;
                visitCard.appendChild(visitHeader);

                // Clinic and doctor info
                const clinicInfo = document.createElement('div');
                clinicInfo.className = 'clinic-info';
                clinicInfo.innerHTML = `
                    <p><strong>មន្ទីពេទ្យ:</strong> ${visit.clinic || 'មិនទាន់បំពេញ'}</p>
                    <p><strong>ពិគ្រោះដោយ:</strong> ${visit.doctor || 'Dr. Minh Hong'}</p>
                `;
                visitCard.appendChild(clinicInfo);

                // Load visit information if available
                if (visit.information) {
                    const visitInfo = visit.information;
                    const infoSection = document.createElement('div');
                    infoSection.className = 'visit-info-section';

                    // Create medicine list HTML if medicines exist
                    let medicineHtml = '<p class="no-data">មិនទាន់បំពេញ</p>';
                    if (visitInfo.medicines && visitInfo.medicines.length > 0) {
                        medicineHtml = `
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
                            ${visitInfo.medicines.map(med => `
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

                    infoSection.innerHTML = `
                        <div class="info-item">
                            <strong>ប្រវត្តិព្យាបាល:</strong> ${visitInfo.treatmentHistory || 'មិនទាន់បំពេញ'}
                        </div>
                        <div class="info-item">
                            <strong>តេស្តមន្ទីពិសោធន៍:</strong> ${visitInfo.labTest || 'មិនទាន់បំពេញ'}
                        </div>
                        <div class="info-item">
                            <strong>រោគវិនិច្ឆ័យ:</strong> ${visitInfo.diagnosis || 'មិនទាន់បំពេញ'}
                        </div>
                        <div class="info-item">
                            <strong>របៀបប្រើប្រាស់ថ្នាំ:</strong>
                            ${medicineHtml}
                        </div>
                    `;
                    visitCard.appendChild(infoSection);
                } else {
                    const noInfo = document.createElement('div');
                    noInfo.className = 'no-info';
                    noInfo.textContent = 'មិនទាន់មានព័ត៌មានពិនិត្យ';
                    visitCard.appendChild(noInfo);
                }

                // Action buttons
                const actionButtons = document.createElement('div');
                actionButtons.className = 'action-buttons';

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-delete';
                deleteBtn.textContent = 'លុប';
                deleteBtn.addEventListener('click', () => {
                    if (confirm('តើអ្នកពិតជាចង់លុបការពិនិត្យនេះមែនទេ?')) {
                        deleteVisit(visitCard);
                    }
                });

                const checkOutBtn = document.createElement('button');
                checkOutBtn.className = visit.checkOut === 'N/A' ? 'btn-checkout' : 'btn-checkedout';
                checkOutBtn.textContent = visit.checkOut === 'N/A' ? 'ចេញពីមន្ទីពេទ្យ' : 'បានចេញរួច';
                checkOutBtn.disabled = visit.checkOut !== 'N/A';
                checkOutBtn.addEventListener('click', () => checkOutVisit(visitCard));

                const viewBtn = document.createElement('button');
                viewBtn.className = 'btn-view';
                viewBtn.textContent = 'មើល/កែសម្រួល';
                viewBtn.addEventListener('click', () => {
                    window.location.href = `add-information.html?patientId=${recordId}&visitId=${visitId}`;
                });

                actionButtons.appendChild(deleteBtn);
                actionButtons.appendChild(checkOutBtn);
                actionButtons.appendChild(viewBtn);
                visitCard.appendChild(actionButtons);

                visitsContainer.appendChild(visitCard);
            });
        }
    } catch (error) {
        console.error('Error loading saved visits:', error);
    }
}

function checkIn() {
    const visitsContainer = document.getElementById('visitsContainer');
    const visitId = push(ref(db, 'patients/' + recordId + '/visits')).key;
    
    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString('en-GB');
    const timeString = currentDate.toLocaleTimeString('en-GB');
    const checkInTime = `${dateString} ${timeString}`;

    // Create new visit card
    const visitCard = document.createElement('div');
    visitCard.className = 'visit-card';
    visitCard.dataset.visitId = visitId;

    visitCard.innerHTML = `
        <div class="visit-header">
            <span class="serial-number">លេខរៀង: ${document.querySelectorAll('.visit-card').length + 1}</span>
            <span class="visit-date">ថ្ងៃចូលមន្ទីពេទ្យ: ${dateString}<br>${timeString}</span>
            <span class="visit-date">ថ្ងៃចេញពីមន្ទីពេទ្យ: មិនទាន់ចេញ</span>
        </div>
        <div class="clinic-info">
            <p><strong>មន្ទីពេទ្យ:</strong> វែលគ្លីនិក I</p>
            <p><strong>ពិគ្រោះដោយ:</strong> Dr. Minh Hong</p>
        </div>
        <div class="no-info">មិនទាន់មានព័ត៌មានពិនិត្យ</div>
        <div class="action-buttons">
            <button class="btn-delete">លុប</button>
            <button class="btn-checkout">ចេញពីមន្ទីពេទ្យ</button>
            <button class="btn-view">មើល/កែសម្រួល</button>
        </div>
    `;

    // Add event listeners to new buttons
    visitCard.querySelector('.btn-delete').addEventListener('click', () => {
        if (confirm('តើអ្នកពិតជាចង់លុបការពិនិត្យនេះមែនទេ?')) {
            deleteVisit(visitCard);
        }
    });

    visitCard.querySelector('.btn-checkout').addEventListener('click', () => checkOutVisit(visitCard));

    visitCard.querySelector('.btn-view').addEventListener('click', () => {
        window.location.href = `add-information.html?patientId=${recordId}&visitId=${visitId}`;
    });

    visitsContainer.insertBefore(visitCard, visitsContainer.firstChild);

    // Save to Firebase
    const visitRef = ref(db, `patients/${recordId}/visits/${visitId}`);
    update(visitRef, {
        checkIn: checkInTime,
        checkOut: 'N/A',
        clinic: 'វែលគ្លីនិក I',
        doctor: 'Dr. Minh Hong'
    });
}

function checkOutVisit(visitCard) {
    const checkOutTime = new Date();
    const dateString = checkOutTime.toLocaleDateString('en-GB');
    const timeString = checkOutTime.toLocaleTimeString('en-GB');
    const checkOutValue = `${dateString} ${timeString}`;

    // Update UI
    visitCard.querySelector('.visit-date:nth-child(3)').innerHTML = `ថ្ងៃចេញពីមន្ទីពេទ្យ: ${dateString}<br>${timeString}`;
    const checkoutBtn = visitCard.querySelector('.btn-checkout');
    checkoutBtn.textContent = 'បានចេញរួច';
    checkoutBtn.disabled = true;
    checkoutBtn.classList.remove('btn-checkout');
    checkoutBtn.classList.add('btn-checkedout');

    // Update Firebase
    const visitId = visitCard.dataset.visitId;
    const visitRef = ref(db, `patients/${recordId}/visits/${visitId}`);
    update(visitRef, {
        checkOut: checkOutValue
    });
}

function deleteVisit(visitCard) {
    const visitId = visitCard.dataset.visitId;
    const visitRef = ref(db, `patients/${recordId}/visits/${visitId}`);
    
    remove(visitRef)
        .then(() => {
            visitCard.remove();
            // Update serial numbers
            document.querySelectorAll('.visit-card').forEach((card, index) => {
                card.querySelector('.serial-number').textContent = `លេខរៀង: ${index + 1}`;
            });
        })
        .catch(error => {
            console.error('Failed to delete visit:', error);
            alert('កំហុសក្នុងការលុបការពិនិត្យ');
        });
}

document.addEventListener('DOMContentLoaded', function() {
    const checkInBtn = document.getElementById('checkInBtn');
    const backBtn = document.getElementById('backBtn');
    
    if (checkInBtn) checkInBtn.addEventListener('click', checkIn);
    if (backBtn) backBtn.addEventListener('click', () => window.history.back());

    let rowCount = 1;
    let recordId;
    document.getElementById('checkInBtn').addEventListener('click', checkIn);
    document.getElementById('backBtn').addEventListener('click', () => window.history.back());
    recordId = new URLSearchParams(window.location.search).get('id');
    if (recordId) {
        getPatientDetails(recordId);
        loadSavedVisits(recordId);
    }
});