import { db } from './firebase-config.js';
import { ref, onValue, push, remove, update, get, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { medicineOptions } from './medicine-dropdown.js'; // Import hardcoded list

// Get references to HTML elements
const medicinesTableBody = document.getElementById("medicinesTableBody");
const addMedicineBtn = document.getElementById("addMedicineBtn");
const medicineModal = document.getElementById("medicineModal");
const closeModal = document.getElementsByClassName("close")[0];
const medicineForm = document.getElementById("medicineForm");

let firebaseMedicineMap = new Map(); // To map medicine names to their Firebase IDs

// Function to initialize Firebase with hardcoded medicines if they don't exist
async function initializeMedicines() {
    const medicinesRef = ref(db, 'medicines');
    const snapshot = await get(medicinesRef);
    const existingMedicines = new Set();

    // Collect existing medicines in Firebase
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const medicineData = childSnapshot.val();
            if (medicineData.name && medicineData.name.trim() !== "") {
                existingMedicines.add(medicineData.name);
            }
        });
    }

    // Add missing hardcoded medicines to Firebase
    const medicinesToAdd = medicineOptions.filter(name => !existingMedicines.has(name) && name && name.trim() !== "");
    for (const name of medicinesToAdd) {
        await push(medicinesRef, { name })
            .catch(err => console.error(`Error adding ${name} to Firebase:`, err));
    }
}

// Function to fetch and display all medicines from Firebase
function fetchMedicines() {
    const medicinesRef = ref(db, 'medicines');

    onValue(medicinesRef, (snapshot) => {
        medicinesTableBody.innerHTML = ""; // Clear existing rows

        // Collect all medicines from Firebase
        firebaseMedicineMap.clear();
        const allMedicines = [];

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const medicineData = childSnapshot.val();
                const medicineId = childSnapshot.key;

                if (medicineData.name && medicineData.name.trim() !== "") {
                    firebaseMedicineMap.set(medicineData.name, medicineId);
                    allMedicines.push(medicineData.name);
                }
            });
        }

        // Remove duplicates and sort alphabetically
        const uniqueMedicines = [...new Set(allMedicines)].sort();

        // Render all medicines
        let index = 1;
        uniqueMedicines.forEach(name => {
            if (!name) return; // Skip empty string

            const row = document.createElement("tr");

            row.innerHTML = `
                <td class="medicine-entry">${index++}. ${name}</td>
                <td>
                    <button class="edit-btn" onclick="editMedicine('${name}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="deleteMedicine('${name}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            medicinesTableBody.appendChild(row);
        });

        if (uniqueMedicines.length === 0) {
            medicinesTableBody.innerHTML = "<tr><td colspan='2'>No medicines found.</td></tr>";
        }
    }, (error) => {
        console.error("Error fetching medicines:", error);
    });
}

// Edit medicine name
window.editMedicine = function (name) {
    const newName = prompt(`Enter new name for "${name}":`, name);
    if (newName === null) return; // Cancelled

    const trimmedNewName = newName.trim();
    if (!trimmedNewName) {
        alert("Medicine name cannot be empty.");
        return;
    }

    if (trimmedNewName === name) {
        alert("No changes made.");
        return;
    }

    // Check for duplicates
    const allMedicines = Array.from(firebaseMedicineMap.keys());
    if (allMedicines.includes(trimmedNewName) && trimmedNewName !== name) {
        alert("Medicine name already exists. Please choose a different name.");
        return;
    }

    const medicineId = firebaseMedicineMap.get(name);
    if (medicineId) {
        const medicineRef = ref(db, `medicines/${medicineId}`);
        update(medicineRef, { name: trimmedNewName })
            .then(() => {
                alert(`"${name}" updated to "${trimmedNewName}" successfully.`);
            })
            .catch(err => {
                alert("Error updating medicine: " + err);
            });
    }
};

// Delete medicine
window.deleteMedicine = function (name) {
    const password = prompt("Enter password 12345 to delete:");

    if (password === "12345") {
        if (confirm(`Are you sure you want to delete "${name}"?`)) {
            const medicineId = firebaseMedicineMap.get(name);
            if (medicineId) {
                const medicineRef = ref(db, `medicines/${medicineId}`);
                remove(medicineRef)
                    .then(() => alert(`"${name}" deleted successfully.`))
                    .catch(err => alert("Error deleting: " + err));
            }
        }
    } else if (password !== null) {
        alert("Incorrect password. Deletion cancelled.");
    }
};

// Modal controls
addMedicineBtn.addEventListener("click", () => {
    medicineModal.style.display = "block";
});

closeModal.addEventListener("click", () => {
    medicineModal.style.display = "none";
    medicineForm.reset();
});

window.addEventListener("click", (event) => {
    if (event.target == medicineModal) {
        medicineModal.style.display = "none";
        medicineForm.reset();
    }
});

// Handle form submission
medicineForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("medicineName").value.trim();

    if (name && name !== "") {
        const medicinesRef = ref(db, 'medicines');
        push(medicinesRef, { name })
            .then(() => {
                alert("ថ្នាំបានបញ្ចូលដោយជោគជ័យ!");
                medicineModal.style.display = "none";
                medicineForm.reset();
            })
            .catch((error) => alert("Error adding medicine: " + error));
    } else {
        alert("សូមបញ្ចូលឈ្មោះថ្នាំ។");
    }
});

// Initialize and fetch medicines when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await initializeMedicines();
    fetchMedicines();
});