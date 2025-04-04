import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { note4Options } from './dropdown.js';

// Function to fetch patient data and populate the details
async function getPatientDetails(recordId) {
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();
            
            // Populate the details
            document.getElementById('patientFullName').textContent = patientData.fullName;
            document.getElementById('patientAge').textContent = patientData.age;
            document.getElementById('patientGender').textContent = patientData.gender;
            document.getElementById('patientPhone').textContent = patientData.phone;
            document.getElementById('patientEmail').textContent = patientData.email || 'N/A';
            document.getElementById('patientName').textContent = patientData.fullName;

            // Pre-fill existing notes (if any)
            document.getElementById('patientNote1').value = patientData.notes?.note1 || '';
            document.getElementById('patientNote2').value = patientData.notes?.note2 || '';
            document.getElementById('patientNote3').value = patientData.notes?.note3 || '';
            document.getElementById('patientNote4').value = patientData.notes?.note4 || '';
            document.getElementById('patientNote5').value = patientData.notes?.note5 || '';
            document.getElementById('patientNote6').value = patientData.notes?.note6 || '';

            // Call function to populate dropdown for note 4
            populateNote4Dropdown();
        } else {
            console.log('No data available for this patient.');
        }
    } catch (error) {
        console.error('Error fetching patient details:', error);
    }
}

// Function to save new patient notes
async function savePatientNotes(recordId) {
    const notes = {
        note1: document.getElementById('patientNote1').value.trim(),
        note2: document.getElementById('patientNote2').value.trim(),
        note3: document.getElementById('patientNote3').value.trim(),
        note4: document.getElementById('patientNote4').value.trim(),
        note5: document.getElementById('patientNote5').value.trim(),
        note6: document.getElementById('patientNote6').value.trim(),
    };

    // Make sure all notes are filled
    if (Object.values(notes).every(note => note !== '')) {
        try {
            const patientRef = ref(db, 'patients/' + recordId);
            const snapshot = await get(patientRef);

            if (snapshot.exists()) {
                const patientData = snapshot.val();
                // Combine the existing notes with the new notes
                const updatedNotes = {
                    ...patientData.notes,
                    ...notes
                };

                // Update the notes in Firebase
                await update(patientRef, { notes: updatedNotes });
                alert('Notes saved successfully!');
                
                // Clear the note input fields after saving
                Object.keys(notes).forEach(key => {
                    document.getElementById(key).value = '';
                });
            } else {
                console.log('Patient data not found.');
            }
        } catch (error) {
            console.error('Error saving patient notes:', error);
        }
    } else {
        alert('Please fill in all note fields before saving.');
    }
}

// Function to add medicine list item
function addMedicineItem() {
    const ul = document.getElementById('medicineList');

    if (!ul) {
        console.error("Error: 'medicineList' element not found!");
        return;
    }

    // Create list item
    const li = document.createElement('li');
    li.classList.add('medicine-item');

    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter medicine details...';
    input.classList.add('medicine-input');

    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '❌';
    deleteBtn.classList.add('btn-delete');
    deleteBtn.onclick = function () {
        li.remove(); // Remove this specific list item
    };

    // Append input and delete button to li
    li.appendChild(input);
    li.appendChild(deleteBtn);

    // Append li to ul
    ul.appendChild(li);
}

// Function to filter options for note 4 and display dropdown
function filterOptions() {
    const input = document.getElementById('patientNote4');
    const dropdown = document.getElementById('note4-dropdown');
    const query = input.value.toLowerCase();

    // Clear existing dropdown items
    dropdown.innerHTML = '';

    // If the user types, filter the options
    const filteredOptions = query 
        ? note4Options.filter(option => option.toLowerCase().includes(query)) 
        : note4Options;

    // Add filtered options to the dropdown
    filteredOptions.forEach(option => {
        const div = document.createElement("div");
        div.classList.add("dropdown-item");
        div.textContent = option;
        div.onclick = function() {
            input.value = option; // Set the value of input when an option is clicked
            dropdown.innerHTML = ''; // Clear dropdown after selection
            dropdown.style.display = 'none'; // Hide dropdown after selection
        };
        dropdown.appendChild(div);
    });

    // If there are filtered options, show the dropdown
    if (filteredOptions.length > 0) {
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none'; // Hide dropdown if no options
    }
}

// Show the dropdown when clicking the input box and filter options as the user types
document.getElementById('patientNote4').addEventListener('click', function() {
    const dropdown = document.getElementById('note4-dropdown');
    dropdown.style.display = 'block'; // Show the dropdown on click
});

// Attach filterOptions to the input field to trigger on input change
document.getElementById('patientNote4').addEventListener('input', filterOptions);

// Hide the dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('note4-dropdown');
    const input = document.getElementById('patientNote4');
    
    if (!input.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = 'none'; // Hide dropdown if clicked outside
    }
});

// Fetch and display the patient details when the page loads
document.addEventListener('DOMContentLoaded', function () {
    const recordId = new URLSearchParams(window.location.search).get('id');
    if (recordId) {
        getPatientDetails(recordId);
        
        // Attach save button event listener after the page loads
        document.getElementById('saveBtn').addEventListener('click', function () {
            savePatientNotes(recordId);
        });
    } else {
        console.log('No recordId provided.');
    }
});
