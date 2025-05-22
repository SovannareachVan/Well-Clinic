import { db } from './firebase-config.js';
import { ref, onValue, push, remove, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Medicine options
const medicineOptions = [
    "ACA 5mg",
    "Amithir 25mg",
    "Amitriptyline CPE 25mg",
    "Amitriptyline 25mg",
    "Arizap 10mg",
    "Asolan 0.5mg",
    "Avestalo 10mg",
    "Avestalo 5mg",
    "Bromark 150mg",
    "Chlorpromazine 100mg",
    "Clozapine 100mg",
    "Dezodone 50mg",
    "Diazepam 5mg",
    "DV-LEO",
    "DV-Lopram",
    "Euphytose",
    "Eziness 30mg",
    "Haloperidol 10mg",
    "Lamnet 25mg",
    "Lamnet 50mg",
    "Lamnet 100mg",
    "Lanzap 2.5mg",
    "Lanzap 5mg",
    "Lanzap 10mg",
    "Lumark 500mg",
    "Merlopam 0.5mg",
    "Merlopam 2mg",
    "Morcet 10mg",
    "MultiV",
    "Nortriptyline 25mg",
    "Perphenazine 8mg",
    "Persidal 2mg",
    "Phenobarbitale 100mg",
    "Phenobarbitale 50mg",
    "Polytanol 25mg",
    "Ratraline 50mg",
    "Rismek 2mg",
    "Sertaline 50mg",
    "Thioridazine 10mg",
    "Trihexyphenidule 8mg",
    "Valdoxan 25mg",
    "Carbamazepine 200mg",
    "Zoloft 50mg",
];

// Get references to HTML elements
const medicinesTableBody = document.getElementById("medicinesTableBody");
const addMedicineBtn = document.getElementById("addMedicineBtn");
const medicineModal = document.getElementById("medicineModal");
const closeModal = document.getElementsByClassName("close")[0];
const medicineForm = document.getElementById("medicineForm");

// Get patient ID from URL
const urlParams = new URLSearchParams(window.location.search);
const patientId = urlParams.get("id");

// Function to initialize medicines if none exist
function initializeMedicines() {
    const medicinesRef = ref(db, `patients/${patientId}/medicines`);
    onValue(medicinesRef, (snapshot) => {
        if (!snapshot.exists()) {
            const medicinesToAdd = {};
            medicineOptions.forEach((medicine, index) => {
                medicinesToAdd[index] = { name: medicine };
            });
            set(medicinesRef, medicinesToAdd)
                .catch((error) => console.error("Error initializing medicines: ", error));
        }
    }, { onlyOnce: true }); // Run only once to avoid infinite loops
}

// Function to fetch and display medicines
function fetchMedicines() {
    const medicinesRef = ref(db, `patients/${patientId}/medicines`);

    onValue(medicinesRef, (snapshot) => {
        medicinesTableBody.innerHTML = ""; // Clear existing list

        if (snapshot.exists()) {
            let index = 1;
            snapshot.forEach((childSnapshot) => {
                const medicineData = childSnapshot.val();
                const medicineId = childSnapshot.key;

                // Create table row with numbered index
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td class="medicine-number">${index++}.</td>
                    <td class="medicine-name">${medicineData.name}</td>
                    <td>
                        <button class="delete-btn" onclick="deleteMedicine('${medicineId}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                medicinesTableBody.appendChild(row);
            });
        } else {
            medicinesTableBody.innerHTML = "<tr><td colspan='3'>No medicines found.</td></tr>";
        }
    });
}

// Function to delete medicine
window.deleteMedicine = function (medicineId) {
    const password = prompt("Enter password 12345 to delete:");

    if (password === "12345") {
        if (confirm("Are you sure you want to delete this medicine?")) {
            remove(ref(db, `patients/${patientId}/medicines/${medicineId}`))
                .then(() => alert("Medicine deleted successfully!"))
                .catch((error) => alert("Error deleting medicine: " + error));
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

    if (name) {
        const medicinesRef = ref(db, `patients/${patientId}/medicines`);
        push(medicinesRef, { name })
            .then(() => {
                alert("Medicine added successfully!");
                medicineModal.style.display = "none";
                medicineForm.reset();
            })
            .catch((error) => alert("Error adding medicine: " + error));
    } else {
        alert("Please enter a medicine name.");
    }
});

// Initialize and fetch medicines when page loads
initializeMedicines();
fetchMedicines();

// Add Back button functionality
const backButton = document.createElement("button");
backButton.textContent = "Back";
backButton.className = "back-btn";
backButton.addEventListener("click", () => {
    window.history.back();
});

// Append Back button below the table
const medicinesTable = document.querySelector("table#medicinesTable");
if (medicinesTable) {
    medicinesTable.parentNode.insertBefore(backButton, medicinesTable.nextSibling);
}