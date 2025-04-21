import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Sample diagnosis options (can be expanded)
const diagnosisOptions = [
    "ជំងឺផ្តាសាយ",
    "ជំងឺក្តៅ",
    "ជំងឺគ្រុនចាញ់",
    "ជំងឺលឿង",
    "ជំងឺឆ្កួត",
    "ជំងឺហឺត",
    "ជំងឺរលាកបំពង់ក",
    "ជំងឺរលាកសួត",
    "ជំងឺរលាកពោះវៀន",
    "ជំងឺស្ពឹកស្ពត់"
];

// Initialize diagnosis dropdown
function initDiagnosisDropdown() {
    const input = document.getElementById('patientNote4');
    const dropdown = document.getElementById('note4-dropdown');

    if (!input || !dropdown) return;

    input.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        dropdown.innerHTML = '';

        const filteredOptions = query 
            ? diagnosisOptions.filter(option => option.toLowerCase().includes(query))
            : diagnosisOptions;

        filteredOptions.forEach(option => {
            const div = document.createElement("div");
            div.classList.add("dropdown-item");
            div.textContent = option;
            div.onclick = function() {
                input.value = option;
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(div);
        });

        dropdown.style.display = filteredOptions.length ? 'block' : 'none';
    });

    input.addEventListener('click', function() {
        dropdown.style.display = 'block';
        if (dropdown.innerHTML === '') {
            diagnosisOptions.forEach(option => {
                const div = document.createElement("div");
                div.classList.add("dropdown-item");
                div.textContent = option;
                div.onclick = function() {
                    input.value = option;
                    dropdown.innerHTML = '';
                    dropdown.style.display = 'none';
                };
                dropdown.appendChild(div);
            });
        }
    });
}

// Fetch patient data and visit details
async function getPatientDetails(recordId, visitIndex) {
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();

            // Display basic info
            document.getElementById('patientFullName').textContent = patientData.fullName;
            document.getElementById('patientAge').textContent = patientData.age;
            document.getElementById('patientGender').textContent = patientData.gender;
            document.getElementById('patientName').textContent = patientData.fullName;

            // Display visit date if available
            if (patientData.visits && patientData.visits[visitIndex]) {
                const visit = patientData.visits[visitIndex];
                const visitDate = visit.checkIn.split(' ')[0]; // Get date part only
                document.getElementById('visitDate').textContent = visitDate;

                // Load existing notes if they exist
                if (visit.notes) {
                    document.getElementById('patientNote2').value = visit.notes.note2 || '';
                    document.getElementById('patientNote3').value = visit.notes.note3 || '';
                    document.getElementById('patientNote4').value = visit.notes.note4 || '';
                }
            }
        }
    } catch (error) {
        console.error('Error fetching patient details:', error);
    }
}

// Save notes for this specific visit
async function savePatientNotes(recordId, visitIndex) {
    const notes = {
        note2: document.getElementById('patientNote2').value.trim(),
        note3: document.getElementById('patientNote3').value.trim(),
        note4: document.getElementById('patientNote4').value.trim()
    };

    try {
        // Get current patient data
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);
        const patientData = snapshot.val();

        // Update the specific visit with notes
        const visits = patientData.visits || [];
        if (visits[visitIndex]) {
            visits[visitIndex].notes = notes;
            
            // Update the patient data with modified visits
            await update(patientRef, { 
                visits: visits
            });
            
            alert('Notes saved successfully!');
            window.history.back();
        } else {
            alert('Error: Visit not found!');
        }
    } catch (error) {
        console.error('Error saving patient notes:', error);
        alert('Failed to save notes.');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const recordId = urlParams.get('id');
    const visitIndex = urlParams.get('visitIndex'); // Passed from date-register page
    
    if (recordId && visitIndex !== null) {
        // Initialize dropdown
        initDiagnosisDropdown();
        
        // Load patient details and visit data
        getPatientDetails(recordId, parseInt(visitIndex));
        
        // Set up save button
        document.getElementById('saveBtn').addEventListener('click', function() {
            savePatientNotes(recordId, parseInt(visitIndex));
        });
    } else {
        alert('Error: Missing patient ID or visit index!');
        window.history.back();
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('note4-dropdown');
        const input = document.getElementById('patientNote4');
        if (dropdown && input && !input.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });
});