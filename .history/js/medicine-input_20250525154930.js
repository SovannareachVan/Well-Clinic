import { db } from './firebase-config.js';
import { ref, get, set, push, onValue } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { medicineOptions } from './medicine-dropdown.js';

// Function to sort medicines alphabetically (A-Z)
function sortMedicines(medicines) {
    return medicines.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

// Function to populate the table with medicines
function populateMedicineTable(medicines) {
    const tbody = document.querySelector('#medicineTable tbody');
    if (!tbody) {
        console.error('Medicine table body not found');
        return;
    }

    tbody.innerHTML = ''; // Clear existing rows
    medicines = [...new Set(medicines)].filter(name => name !== ''); // Remove duplicates and empty string
    medicines = sortMedicines(medicines);

    // Populate table
    medicines.forEach((medicine, index) => {
        const row = document.createElement('tr');
        const isDefaultMedicine = medicineOptions.includes(medicine);
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${medicine}</td>
            <td>${
                isDefaultMedicine
                    ? 'Default'
                    : `<button class="btn-delete" data-medicine="${medicine.replace(/'/g, "\\'")}" onclick="deleteMedicine('${medicine.replace(/'/g, "\\'")}', getPatientId())">❌</button>`
            }</td>
        `;
        tbody.appendChild(row);
    });
}

// Function to get patientId from URL
function getPatientId() {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    return patientId;
}

// Function to display the medicine list
function displayMedicineList() {
    const tbody = document.querySelector('#medicineTable tbody');
    if (!tbody) {
        console.error('Medicine table body not found');
        return;
    }

    const patientId = getPatientId();
    console.log('Patient ID:', patientId); // Debug log

    // Start with default medicine options
    let medicines = [...medicineOptions];
    populateMedicineTable(medicines); // Display default medicines immediately

    if (!patientId) {
        console.warn('No patientId found in URL. Displaying default medicines only.');
        return;
    }

    const medicinesRef = ref(db, `patients/${patientId}/medicines`);
    onValue(
        medicinesRef,
        (snapshot) => {
            console.log('Firebase snapshot received'); // Debug log
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const medicineData = childSnapshot.val();
                    if (medicineData.name && medicineData.name.trim() !== '' && medicineData.name !== 'undefined') {
                        medicines.push(medicineData.name);
                    }
                });
            } else {
                console.log('No custom medicines found in Firebase');
            }
            populateMedicineTable(medicines); // Update table with combined medicines
        },
        (error) => {
            console.error('Error fetching medicines from Firebase:', error);
            alert('Failed to load custom medicines: ' + error.message);
            populateMedicineTable(medicines); // Ensure default medicines are still displayed
        }
    );
}

// Function to delete a medicine
window.deleteMedicine = async function (medicineName, patientId) {
    if (!patientId) {
        alert('Cannot delete medicine: Missing patient information');
        return;
    }

    if (!confirm(`Are you sure you want to delete "${medicineName}"?`)) return;

    try {
        const medicinesRef = ref(db, `patients/${patientId}/medicines`);
        const snapshot = await get(medicinesRef);
        if (snapshot.exists()) {
            const medicines = snapshot.val();
            const medicineKey = Object.keys(medicines).find(key => medicines[key].name === medicineName);
            if (medicineKey) {
                await set(ref(db, `patients/${patientId}/medicines/${medicineKey}`), null);
                alert('Medicine deleted successfully!');
            } else {
                console.warn(`Medicine "${medicineName}" not found in Firebase`);
            }
        }
    } catch (error) {
        console.error('Error deleting medicine:', error);
        alert('Failed to delete medicine: ' + error.message);
    }
};

// Function to add a new medicine
async function addNewMedicine() {
    const medicineInput = document.getElementById('medicineNameInput');
    const medicineName = medicineInput.value.trim();
    const patientId = getPatientId();

    if (!patientId) {
        alert('Missing patient information');
        return;
    }

    if (!medicineName) {
        alert('Please enter a medicine name');
        return;
    }

    // Check for duplicate medicine
    const medicinesRef = ref(db, `patients/${patientId}/medicines`);
    const snapshot = await get(medicinesRef);
    if (snapshot.exists()) {
        const medicines = snapshot.val();
        const exists = Object.values(medicines).some(med => med.name.toLowerCase() === medicineName.toLowerCase());
        if (exists) {
            alert('This medicine already exists');
            return;
        }
    }

    // Check if it duplicates a default medicine
    if (medicineOptions.some(med => med.toLowerCase() === medicineName.toLowerCase())) {
        alert('This medicine already exists in the default list');
        return;
    }

    try {
        const newMedicineRef = push(medicinesRef);
        await set(newMedicineRef, { name: medicineName });
        alert('Medicine added successfully!');
        medicineInput.value = ''; // Clear input
        document.getElementById('addMedicineModal').style.display = 'none'; // Close modal
    } catch (error) {
        console.error('Error adding medicine:', error);
        alert('Failed to add medicine: ' + error.message);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing medicine-input.js'); // Debug log
    displayMedicineList();

    // Handle modal open/close
    const addMedicineBtn = document.querySelector('.add-medicine-btn');
    const modal = document.getElementById('addMedicineModal');
    const closeModal = document.querySelector('.close-modal');
    const submitMedicineBtn = document.getElementById('submitMedicine');

    if (addMedicineBtn && modal && closeModal && submitMedicineBtn) {
        addMedicineBtn.addEventListener('click', () => {
            modal.style.display = 'block';
        });

        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
            document.getElementById('medicineNameInput').value = '';
        });

        submitMedicineBtn.addEventListener('click', addNewMedicine);

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
                document.getElementById('medicineNameInput').value = '';
            }
        });
    } else {
        console.error('Modal or button elements not found');
    }
});