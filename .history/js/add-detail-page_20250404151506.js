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

            // Populate medicines if they exist
            if (patientData.notes?.medicines) {
                const ul = document.getElementById('medicineList');
                patientData.notes.medicines.forEach(med => {
                    addMedicineItem();
                    const lastItem = ul.lastChild;
                    lastItem.querySelector('.medicine-select').value = med.name;
                    lastItem.querySelector('.dosage-select').value = med.dosage;
                    lastItem.querySelector('.time-input').value = med.time;
                    lastItem.querySelector('.beforeMeal').checked = med.beforeMeal;
                    lastItem.querySelector('.afterMeal').checked = med.afterMeal;
                    lastItem.querySelector('.rate-select').value = med.rate;
                });
            }
        } else {
            console.log('No data available for this patient.');
        }
    } catch (error) {
        console.error('Error fetching patient details:', error);
    }
}


// Function to save new patient notes
async function savePatientNotes(recordId) {
    // Collect medicine data
    const medicines = [];
    document.querySelectorAll('.medicine-item').forEach(item => {
        medicines.push({
            name: item.querySelector('.medicine-select').value,
            dosage: item.querySelector('.dosage-select').value,
            time: item.querySelector('.time-input').value,
            beforeMeal: item.querySelector('.beforeMeal').checked,
            afterMeal: item.querySelector('.afterMeal').checked,
            rate: item.querySelector('.rate-select').value
        });
    });

    const notes = {
        note1: document.getElementById('patientNote1').value.trim(),
        note2: document.getElementById('patientNote2').value.trim(),
        note3: document.getElementById('patientNote3').value.trim(),
        note4: document.getElementById('patientNote4').value.trim(),
        note5: document.getElementById('patientNote5').value.trim(),
        medicines: medicines
    };

    try {
        const patientRef = ref(db, 'patients/' + recordId);
        await update(patientRef, { notes: notes });
        alert('Notes saved successfully!');
    } catch (error) {
        console.error('Error saving patient notes:', error);
    }
}

// Function to add medicine list item
// Function to add medicine list item (updated to match your image)
// Make functions globally available
window.addMedicineItem = function() {
    const ul = document.getElementById('medicineList');
    
    if (!ul) {
        console.error("Error: 'medicineList' element not found!");
        return;
    }

    // Create list item
    const li = document.createElement('li');
    li.classList.add('medicine-item');

    // Create table structure
    const tableHTML = `
    <table class="medicine-table">
        <thead>
            <tr>
                <th>ប្រភេទថ្នាំ</th>
                <th>របៀបប្រើប្រាស់</th>
                <th>រយះពេល</th>
                <th>ព្រឹក</th>
                <th>ថ្ងៃ</th>
                <th>ល្ងាច</th>
                <th>ចំនួនថ្នាំ</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            <tr>
<th>ប្រភេទថ្នាំ</th>
<td>
    <div class="dropdown-wrapper">
        <input type="text" class="medicine-input" placeholder="សូមជ្រើសរើសថ្នាំ..." autocomplete="off">
        <div class="medicine-dropdown dropdown"></div>
    </div>
</td>
                <td>
                    <select class="dosage-select">
                        <option value="">ex</option>
                        <option value="ex">ex</option>
                    </select>
                </td>
                <td>
                    <input type="text" class="time-input" placeholder="เวลา">
                </td>
                <td>
                    <div class="checkbox-group">
                        <input type="checkbox" class="beforeMeal">
                        <label>យក</label>
                    </div>
                    
                </td>
                                <td>
                    <div class="checkbox-group">
                        <input type="checkbox" class="beforeMeal">
                        <label>យក</label>
                    </div>
                    
                </td>
                                <td>
                    <div class="checkbox-group">
                        <input type="checkbox" class="beforeMeal">
                        <label>យក</label>
                    </div>
                    
                </td>
                
                <td>
                    <select class="rate-select">
                        <option value="✗">✗</option>
                        <option value="✓">✓</option>
                    </select>
                </td>
                <td>
                    <button class="btn-delete" onclick="this.closest('li').remove()">❌</button>
                </td>
            </tr>
        </tbody>
    </table>
    `;

    li.innerHTML = tableHTML;
    ul.appendChild(li);
};
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
document.addEventListener('DOMContentLoaded', function() {
    const recordId = new URLSearchParams(window.location.search).get('id');
    if (recordId) {
        getPatientDetails(recordId);
        
        document.getElementById('saveBtn').addEventListener('click', function() {
            savePatientNotes(recordId);
        });

        document.getElementById('addMedicineBtn').addEventListener('click', addMedicineItem);
    }
});