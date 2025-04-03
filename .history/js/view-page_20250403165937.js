import { db } from './firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Function to fetch patient details from Firebase and display them
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
        document.getElementById('patientName').textContent = patientData.fullName || 'Patient';
  
        // Display all notes (if they exist)
        const notes = patientData.notes || {};
        document.getElementById('patientNotes').innerHTML = `
          <div class="note-item"><strong>1. សញ្ញាណតម្អូញ:</strong> ${notes.note1 || 'N/A'}</div>
          <div class="note-item"><strong>2. ប្រវត្តិព្យាបាល:</strong> ${notes.note2 || 'N/A'}</div>
          <div class="note-item"><strong>3. តេស្តមន្ទីពិសោធន៍:</strong> ${notes.note3 || 'N/A'}</div>
          <div class="note-item"><strong>4. Diagnosis:</strong> ${notes.note4 || 'N/A'}</div>
          <div class="note-item"><strong>5. Differential Diagnosis:</strong> ${notes.note5 || 'N/A'}</div>
          <div class="note-item"><strong>6. Medication Instructions:</strong> ${notes.note6 || 'N/A'}</div>
        `;
      } else {
        console.log('No patient data found.');
        document.getElementById('patientNotes').textContent = 'No patient records available.';
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
      document.getElementById('patientNotes').textContent = 'Failed to load patient details.';
    }
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