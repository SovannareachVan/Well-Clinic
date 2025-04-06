import { db } from './firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

async function getPatientDetails(recordId) {
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();
            
            // Update patient info
            document.getElementById('patientFullName').textContent = patientData.fullName || 'N/A';
            document.getElementById('patientAge').textContent = patientData.age || 'N/A';
            document.getElementById('patientGender').textContent = patientData.gender || 'N/A';
            document.getElementById('patientPhone').textContent = patientData.phone || 'N/A';
            document.getElementById('patientEmail').textContent = patientData.email || 'N/A';

            // Handle both old and new note formats
            let notes = {};
            if (typeof patientData.notes === 'string') {
                // Old format - simple string notes
                notes.original = patientData.notes;
                notes.structured = {};
            } else if (patientData.notes?.original) {
                // New format with original notes
                notes = patientData.notes;
            } else if (patientData.structuredNotes) {
                // New format with separate structuredNotes
                notes.structured = patientData.structuredNotes;
                notes.original = '';
            }

            // Get structured notes
            const structured = notes.structured || {};
            
            // Display all notes with proper structure
            document.getElementById('patientNotes').innerHTML = `
                <div class="notes-container">
                    <div class="notes-section">
                        <h3>General Notes</h3>
                        <div class="note-content">${notes.original || 'No general notes available'}</div>
                    </div>
                    
                    <div class="notes-section">
                        <h3>Medical Notes</h3>
                        <div class="structured-notes">
                            <div class="note-field">
                                <span class="note-label">1. សញ្ញាណតម្អូញ:</span>
                                <span class="note-value">${structured.note1 || 'មិនទាន់បំពេញ'}</span>
                            </div>
                            <div class="note-field">
                                <span class="note-label">2. ប្រវត្តិព្យាបាល:</span>
                                <span class="note-value">${structured.note2 || 'មិនទាន់បំពេញ'}</span>
                            </div>
                            <div class="note-field">
                                <span class="note-label">3. តេស្តមន្ទីពិសោធន៍:</span>
                                <span class="note-value">${structured.note3 || 'មិនទាន់បំពេញ'}</span>
                            </div>
                            <div class="note-field">
                                <span class="note-label">4. រោគវិនិច្ឆ័យ:</span>
                                <span class="note-value">${structured.note4 || 'មិនទាន់បំពេញ'}</span>
                            </div>
                            <div class="note-field">
                                <span class="note-label">5. រោគវិនិច្ឆ័យញែក:</span>
                                <span class="note-value">${structured.note5 || 'មិនទាន់បំពេញ'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="notes-section">
                        <h3>Medication Prescription</h3>
                        ${renderMedications(structured.medicines)}
                    </div>
                </div>
            `;
        } else {
            document.getElementById('patientNotes').textContent = 'No patient records available.';
        }
    } catch (error) {
        console.error('Error loading patient data:', error);
        document.getElementById('patientNotes').textContent = 'Failed to load patient details.';
    }
}

function renderMedications(medicines) {
    if (!medicines || medicines.length === 0) {
        return '<div class="no-medicines">មិនទាន់បំពេញ</div>';
    }

    return `
    <div class="medication-table">
        <div class="medication-header">
            <div>ឈ្មោះថ្នាំ</div>
            <div>ប្រភេទថ្នាំ</div>
            <div>រយះពេល</div>
            <div>ព្រឹក</div>
            <div>ថ្ងៃ</div>
            <div>ល្ងាច</div>
            <div>ចំនួន</div>
        </div>
        ${medicines.map(med => `
        <div class="medication-row">
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

// Load patient data when page opens
window.onload = function() {
    const recordId = new URLSearchParams(window.location.search).get('recordId');
    if (recordId) {
        getPatientDetails(recordId);
    } else {
        document.getElementById('patientNotes').textContent = 'Error: Missing patient ID.';
    }
};