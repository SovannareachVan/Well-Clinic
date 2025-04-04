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
                <th>ชื่อยา</th>
                <th>ขนาดยา</th>
                <th>เวลา</th>
                <th>ก่อน/หลังอาหาร</th>
                <th>อัตรา</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <select class="medicine-select">
                        <option value="">เลือกยา</option>
                        <option value="Amitriptyline CPE 25mgx">Amitriptyline CPE 25mgx</option>
                    </select>
                </td>
                <td>
                    <select class="dosage-select">
                        <option value="">เลือกขนาด</option>
                        <option value="นุษีลมเล็ง">นุษีลมเล็ง</option>
                    </select>
                </td>
                <td>
                    <input type="text" class="time-input" placeholder="เวลา">
                </td>
                <td>
                    <div class="checkbox-group">
                        <input type="checkbox" class="beforeMeal">
                        <label>ก่อนอาหาร</label>
                        <input type="checkbox" class="afterMeal">
                        <label>หลังอาหาร</label>
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

// Initialize when DOM is loaded
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