import { db } from './firebase-config.js';
import { ref, onValue, push, remove, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Medicine options (for reference, not auto-initialized)
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
const patientId = urlParams.get("patientId") || urlParams.get("id"); // Support both parameters
if (!patientId) {
    console.error("patientId is undefined. Please ensure the URL includes ?patientId=...");
}

// Function to initialize medicines (only if explicitly triggered)
function initializeMedicines() {
    if (!patientId) return;
    const medicinesRef = ref(db, `patients/${patientId}/medicines`);
    onValue(medicinesRef, (snapshot) => {
        if (!snapshot.exists()) {
            console.log("No medicines found. Use 'Add Medicine' to start adding medicines.");
        }
    }, { onlyOnce: true });
}

// Function to fetch and display medicines
function fetchMedicines() {
    if (!patientId) {
        medicinesTableBody.innerHTML = "<tr><td colspan='2'>patientId is undefined.</td></tr>";
        return;
    }
    const medicinesRef = ref(db, `patients/${patientId}/medicines`);

    onValue(medicinesRef, (snapshot) => {
        medicinesTableBody.innerHTML = ""; // Clear existing list

        if (snapshot.exists()) {
            let index = 1;
            snapshot.forEach((childSnapshot) => {
                const medicineData = childSnapshot.val();
                const medicineId = childSnapshot.key;

                // Create table row with number and name in a single column
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td class="medicine-entry">${index++}. ${medicineData.name}</td>
                    <td>
                        <button class="delete-btn" onclick="deleteMedicine('${medicineId}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                medicinesTableBody.appendChild(row);
            });
        } else {
            medicinesTableBody.innerHTML = "<tr><td colspan='2'>No medicines found.</td></tr>";
        }
    }, (error) => {
        console.error("Error fetching medicines:", error);
        medicinesTableBody.innerHTML = "<tr><td colspan='2'>Error loading medicines.</td></tr>";
    });
}

// Function to delete medicine
window.deleteMedicine = function (medicineId) {
    if (!patientId) {
        alert("Cannot delete: patientId is undefined.");
        return;
    }
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
    if (!patientId) {
        alert("Cannot add medicine: patientId is undefined.");
        return;
    }
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

    if (!patientId) {
        alert("Cannot add medicine: patientId is undefined.");
        return;
    }

    if (name) {
        const medicinesRef = ref(db, `patients/${patientId}/medicines`);
        push(medicinesRef, { name })
            .then(() => {
                console.log("Medicine added:", name);
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
document.addEventListener("DOMContentLoaded", () => {
    initializeMedicines();
    fetchMedicines();

    // Add Back button functionality
    const backButton = document.createElement("button");
    backButton.textContent = "Back";
    backButton.className = "back-btn";
    backButton.onclick = () => window.history.back();

    const medicinesTable = document.querySelector("table#medicinesTable");
    if (medicinesTable) {
        medicinesTable.parentNode.insertBefore(backButton, medicinesTable.nextSibling);
    }
});