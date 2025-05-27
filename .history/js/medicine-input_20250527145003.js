import { db } from './firebase-config.js';
import { ref, onValue, push, remove } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { medicineOptions as hardcodedMedicineOptions } from './medicine-dropdown.js'; // Import hardcoded list

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
        const allMedicines = [...hardcodedMedicineOptions, ...firebaseList.map(m => m.name)]
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
        medicinesTableBody.innerHTML = "<tr><td colspan='3'>Error loading medicines. Please try again later.</td></tr>";
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

// Function to initialize medicine dropdown in the modal
function initMedicineDropdown(parentElement) {
    const input = parentElement.querySelector('.medicine-input');
    const dropdown = parentElement.querySelector('.medicine-dropdown');
    if (!input || !dropdown) {
        console.error('Medicine input or dropdown not found');
        return;
    }

    let medicineOptions = [];

    // Fetch medicines from the global medicines node and combine with hardcoded list
    const medicinesRef = ref(db, 'medicines');
    onValue(medicinesRef, (snapshot) => {
        medicineOptions = [...hardcodedMedicineOptions];
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const medicineData = childSnapshot.val();
                if (medicineData.name && medicineData.name.trim() !== "" && medicineData.name !== "undefined") {
                    medicineOptions.push(medicineData.name);
                }
            });
        }

        // Remove duplicates and sort alphabetically
        medicineOptions = [...new Set(medicineOptions)].filter(name => name !== "").sort();

        // Update dropdown content
        dropdown.innerHTML = '';
        medicineOptions.forEach(option => {
            const div = document.createElement("div");
            div.classList.add("dropdown-item");
            div.textContent = option;
            div.onclick = function () {
                input.value = option;
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(div);
        });
    }, (error) => {
        console.error("Error fetching medicines for dropdown:", error);
    });

    input.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        dropdown.innerHTML = '';
        const filteredOptions = query
            ? medicineOptions.filter(option => option.toLowerCase().includes(query))
            : medicineOptions;
        filteredOptions.forEach(option => {
            const div = document.createElement("div");
            div.classList.add("dropdown-item");
            div.textContent = option;
            div.onclick = function () {
                input.value = option;
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(div);
        });
        dropdown.style.display = filteredOptions.length ? 'block' : 'none';
    });

    input.addEventListener('click', function () {
        dropdown.style.display = 'block';
        if (dropdown.innerHTML === '') {
            medicineOptions.forEach(option => {
                const div = document.createElement("div");
                div.classList.add("dropdown-item");
                div.textContent = option;
                div.onclick = function () {
                    input.value = option;
                    dropdown.innerHTML = '';
                    dropdown.style.display = 'none';
                };
                dropdown.appendChild(div);
            });
        }
    });
}

// Modal controls
addMedicineBtn.addEventListener("click", () => {
    medicineModal.style.display = "block";
    // Initialize dropdown in the modal
    const modalContent = medicineModal.querySelector('.modal-content');
    if (modalContent) {
        initMedicineDropdown(modalContent);
    }
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
    const nameInput = document.getElementById("medicineName");
    const name = nameInput.value.trim();

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

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
    document.querySelectorAll('.medicine-dropdown').forEach(dropdown => {
        const input = dropdown.closest('.modal-content')?.querySelector('.medicine-input');
        if (input && !input.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });
});