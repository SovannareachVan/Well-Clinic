import { db } from './firebase-config.js';
import { ref, onValue, push, remove } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js ';
import { medicineOptions } from './medicine-dropdown.js '; // Import hardcoded list

// Get references to HTML elements
const medicinesTableBody = document.getElementById("medicinesTableBody");
const addMedicineBtn = document.getElementById("addMedicineBtn");
const medicineModal = document.getElementById("medicineModal");
const closeModal = document.getElementsByClassName("close")[0];
const medicineForm = document.getElementById("medicineForm");

let firebaseMedicineNames = new Set(); // To track Firebase-added meds

// Function to fetch and display all medicines (Firebase + hardcoded)
function fetchMedicines() {
    const medicinesRef = ref(db, 'medicines');

    onValue(medicinesRef, (snapshot) => {
        medicinesTableBody.innerHTML = ""; // Clear existing rows

        // Collect Firebase medicines
        firebaseMedicineNames.clear();
        const firebaseList = [];

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const medicineData = childSnapshot.val();
                const medicineId = childSnapshot.key;

                if (medicineData.name && medicineData.name.trim() !== "") {
                    firebaseMedicineNames.add(medicineData.name);
                    firebaseList.push({ name: medicineData.name, source: "Firebase" });
                }
            });
        }

        // Merge hardcoded and Firebase medicines
        const allMedicines = [...medicineOptions, ...firebaseList.map(m => m.name)]
            .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

        // Sort alphabetically
        allMedicines.sort();

        // Render all medicines
        let index = 1;
        allMedicines.forEach(name => {
            if (!name) return; // Skip empty string

            const row = document.createElement("tr");
            const source = firebaseMedicineNames.has(name) ? "ថ្មី" : "មានស្រាប់";

            row.innerHTML = `
                <td class="medicine-entry">${index++}. ${name}</td>
                <td>${source}</td>
                <td>
                    ${source === "ថ្មី" 
                        ? `<button class="delete-btn" onclick="deleteMedicine('${name}')">
                            <i class="fas fa-trash"></i> Delete
                          </button>`
                        : ''
                    }
                </td>
            `;
            medicinesTableBody.appendChild(row);
        });

        if (allMedicines.filter(Boolean).length === 0) {
            medicinesTableBody.innerHTML = "<tr><td colspan='3'>No medicines found.</td></tr>";
        }
    }, (error) => {
        console.error("Error fetching medicines:", error);
    });
}

// Delete Firebase-added medicine
window.deleteMedicine = function (name) {
    const password = prompt("Enter password 12345 to delete:");

    if (password === "12345") {
        if (confirm(`Are you sure you want to delete "${name}"?`)) {
            const medicinesRef = ref(db, 'medicines');
            onValue(medicinesRef, (snapshot) => {
                snapshot.forEach((childSnapshot) => {
                    const data = childSnapshot.val();
                    if (data.name === name) {
                        remove(ref(db, `medicines/${childSnapshot.key}`))
                            .then(() => alert(`"${name}" deleted successfully.`))
                            .catch(err => alert("Error deleting: " + err));
                    }
                });
            }, { onlyOnce: true });
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

// Fetch medicines when page loads
fetchMedicines();