import { db } from './firebase-config.js';
import { ref, onValue, push, remove, set, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

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

// Get patient ID from URL, with fallback to ensure it exists
const urlParams = new URLSearchParams(window.location.search);
let patientId = urlParams.get("id");
if (!patientId) {
    console.error("No patient ID found in URL. Please ensure ?id= is provided.");
    patientId = prompt("Please enter the patient ID:");
    if (!patientId) {
        alert("A patient ID is required to proceed.");
        // Redirect to a patient selection page or stop execution
        window.location.href = "patient-selection.html"; // Replace with your actual page
        throw new Error("Patient ID is required."); // Stop further execution
    }
}

// Function to initialize and display all medicines
async function initializeMedicines() {
    const medicinesRef = ref(db, `patients/${patientId}/medicines`);
    const snapshot = await get(medicinesRef);

    if (!snapshot.exists()) {
        // If no medicines exist, initialize with medicineOptions
        const medicinesToAdd = {};
        medicineOptions.forEach((medicine, index) => {
            if (medicine && medicine.trim() !== "" && medicine !== "undefined") {
                medicinesToAdd[index] = { name: medicine };
            }
        });
        await set(medicinesRef, medicinesToAdd)
            .catch((error) => console.error("Error initializing medicines: ", error));
    }

    // Always fetch and display medicines, including existing ones
    fetchMedicines();
}

// Function to fetch and display all medicines
function fetchMedicines() {
    const medicinesRef = ref(db, `patients/${patientId}/medicines`);

    onValue(medicinesRef, (snapshot) => {
        medicinesTableBody.innerHTML = ""; // Clear existing list

        if (snapshot.exists()) {
            let index = 1;
            const existingMedicines = {};
            snapshot.forEach((childSnapshot) => {
                const medicineData = childSnapshot.val();
                const medicineId = childSnapshot.key;
                if (medicineData.name && medicineData.name.trim() !== "" && medicineData.name !== "undefined") {
                    existingMedicines[medicineData.name] = true;
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
                }
            });

            // Add any missing medicines from medicineOptions
            medicineOptions.forEach((medicine) => {
                if (medicine && medicine.trim() !== "" && medicine !== "undefined" && !existingMedicines[medicine]) {
                    push(medicinesRef, { name: medicine })
                        .then(() => {
                            const row = document.createElement("tr");
                            row.innerHTML = `
                                <td class="medicine-entry">${index++}. ${medicine}</td>
                                <td>
                                    <button class="delete-btn" onclick="deleteMedicine('${medicine}')">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </td>
                            `;
                            medicinesTableBody.appendChild(row);
                        })
                        .catch((error) => console.error("Error adding missing medicine: ", error));
                }
            });
        } else {
            // If no medicines exist, populate with medicineOptions
            const medicinesToAdd = {};
            medicineOptions.forEach((medicine, index) => {
                if (medicine && medicine.trim() !== "" && medicine !== "undefined") {
                    medicinesToAdd[index] = { name: medicine };
                }
            });
            set(medicinesRef, medicinesToAdd)
                .then(() => fetchMedicines())
                .catch((error) => console.error("Error initializing medicines: ", error));
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

    if (name && name !== "undefined") {
        const medicinesRef = ref(db, `patients/${patientId}/medicines`);
        push(medicinesRef, { name })
            .then(() => {
                alert("Medicine added successfully!");
                medicineModal.style.display = "none";
                medicineForm.reset();
            })
            .catch((error) => alert("Error adding medicine: " + error));
    } else {
        alert("Please enter a valid medicine name.");
    }
});

// Initialize and fetch medicines when page loads
initializeMedicines();