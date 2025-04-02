// Import Firebase functions
import { db } from './firebase-config.js';
import { ref, onValue, remove } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Get references to HTML elements
const patientsTableBody = document.getElementById("patientsTableBody");
const searchInput = document.getElementById("searchInput");

// Function to fetch and display patients from Firebase
function fetchPatients() {
    const patientsRef = ref(db, "patients");

    onValue(patientsRef, (snapshot) => {
        patientsTableBody.innerHTML = ""; // Clear existing list

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const patientData = childSnapshot.val();
                const patientId = childSnapshot.key; // Unique ID from Firebase

                // Create table row
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${patientData.fullName}</td>
                    <td>
                        <button class="view-btn" onclick="viewPatient('${patientId}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="edit-btn" onclick="editPatient('${patientId}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-btn" onclick="deletePatient('${patientId}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                patientsTableBody.appendChild(row);
            });
        } else {
            patientsTableBody.innerHTML = "<tr><td colspan='2'>No patients found.</td></tr>";
        }
    });
}

// Function to search patients by name
searchInput.addEventListener("input", function () {
    const searchText = searchInput.value.toLowerCase();
    const rows = patientsTableBody.getElementsByTagName("tr");

    for (let row of rows) {
        const nameCell = row.getElementsByTagName("td")[0];
        if (nameCell) {
            const nameText = nameCell.textContent.toLowerCase();
            row.style.display = nameText.includes(searchText) ? "" : "none";
        }
    }
});

// Function to view patient details (placeholder for now)
// Function to view patient details and redirect to view-page.html
window.viewPatient = function (patientId) {
    window.location.href = `view-page.html?recordId=${patientId}`; // Redirect with patient ID
};


// Function to edit patient (redirect to edit page)
window.editPatient = function (patientId) {
    window.location.href = `edit-page.html?id=${patientId}`; // Redirect with patient ID
};

// Function to delete patient
window.deletePatient = function (patientId) {
    if (confirm("Are you sure you want to delete this patient?")) {
        remove(ref(db, "patients/" + patientId))
            .then(() => alert("Patient deleted successfully!"))
            .catch((error) => alert("Error deleting patient: " + error));
    }
};

// Fetch patients when page loads
fetchPatients();
