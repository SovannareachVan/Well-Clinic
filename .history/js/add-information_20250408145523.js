import { db } from './firebase-config.js';
import { ref, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Initialize Firebase app and database
const patientForm = document.getElementById('patientForm');
const addMedicineBtn = document.getElementById('addMedicineBtn');
const medicineList = document.getElementById('medicineList');

let medicines = [];

// Add medicine item to the list
addMedicineBtn.addEventListener('click', function() {
    const medicineInput = document.getElementById('medicines');
    const medicineName = medicineInput.value.trim();

    if (medicineName) {
        medicines.push(medicineName);
        updateMedicineList();
        medicineInput.value = '';
    }
});

// Update the medicine list display
function updateMedicineList() {
    medicineList.innerHTML = '';
    medicines.forEach((medicine, index) => {
        const li = document.createElement('li');
        li.textContent = medicine;
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
            medicines.splice(index, 1);
            updateMedicineList();
        });
        li.appendChild(removeBtn);
        medicineList.appendChild(li);
    });
}

// Submit patient information
patientForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const age = document.getElementById('age').value.trim();
    const gender = document.getElementById('gender').value;
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const note1 = document.getElementById('note1').value.trim();
    const note2 = document.getElementById('note2').value.trim();
    const diagnosis = document.getElementById('diagnosis').value.trim();

    if (fullName && age && gender && phone) {
        const newPatientId = Date.now();  // Use a timestamp as a unique ID
        const patientData = {
            fullName,
            age,
            gender,
            phone,
            email,
            notes: {
                note1,
                note2
            },
            diagnosis,
            medicines,
        };

        // Save the patient data to Firebase
        set(ref(db, 'patients/' + newPatientId), patientData)
            .then(() => {
                alert('Patient information saved successfully');
                patientForm.reset();
                medicines = [];
                updateMedicineList();
            })
            .catch((error) => {
                console.error('Error saving patient information:', error);
                alert('Error saving data. Please try again.');
            });
    } else {
        alert('Please fill in all required fields.');
    }
});
