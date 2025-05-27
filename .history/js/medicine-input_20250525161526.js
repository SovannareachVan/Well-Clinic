import { db } from './firebase-config.js';
import { ref, onValue, push, remove, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Get references to HTML elements
const medicinesTableBody = document.getElementById("medicinesTableBody");
const addMedicineBtn = document.getElementById("addMedicineBtn");
const medicineModal = document.getElementById("medicineModal");
const closeModal = document.getElementsByClassName("close")[0];
const medicineForm = document.getElementById("medicineForm");

// Function to fetch and display all medicines from the global medicines node
function fetchMedicines() {
    const medicinesRef = ref(db, 'medicines'); // Global medicines node

    onValue(medicinesRef, (snapshot) => {
        medicinesTableBody.innerHTML = ""; // Clear existing list

        if (snapshot.exists()) {
            let index = 1;
            snapshot.forEach((childSnapshot) => {
                const medicineData = childSnapshot.val();
                const medicineId = childSnapshot.key;
                if (medicineData.name && medicineData.name.trim() !== "" && medicineData.name !== "undefined") {
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
        }
    });
}

// Function to delete medicine
window.deleteMedicine = function (medicineId) {
    const password = prompt("Enter password 12345 to delete:");

    if (password === "12345") {
        if (confirm("Are you sure you want to delete this medicine?")) {
            remove(ref(db, `medicines/${medicineId}`))
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
        const medicinesRef = ref(db, 'medicines');
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

// Fetch medicines when page loads
fetchMedicines();