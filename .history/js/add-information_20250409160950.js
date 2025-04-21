import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { note4Options } from './dropdown.js';
import { medicineOptions } from './medicine-dropdown.js';

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Elements
const saveBtn = document.getElementById("saveBtn");
const patientName = document.getElementById("patientName");
const patientNote1 = document.getElementById("patientNote1");
const patientNote3 = document.getElementById("patientNote3");
const patientNote4 = document.getElementById("patientNote4");
const medicineList = document.getElementById("medicineList");

// Save Notes to Firebase
saveBtn.addEventListener("click", () => {
    const patientID = "unique_patient_id"; // You can dynamically set this based on the patient you're editing.

    const patientDetails = {
        name: patientName.textContent,
        note1: patientNote1.value,
        note3: patientNote3.value,
        note4: patientNote4.value,
        medicines: getMedicines()
    };

    // Write data to Firebase
    set(ref(db, 'patients/' + patientID), patientDetails)
        .then(() => {
            alert("Patient notes saved successfully!");
        })
        .catch((error) => {
            console.error("Error writing to database", error);
            alert("Failed to save notes.");
        });
});

// Function to get all medicines added
function getMedicines() {
    const medicineItems = [];
    const listItems = medicineList.querySelectorAll("li");
    listItems.forEach((item) => {
        medicineItems.push(item.textContent);
    });
    return medicineItems;
}

// Add medicine item to list
function addMedicineItem() {
    const medicineItem = prompt("Enter medicine name:");

    if (medicineItem) {
        const li = document.createElement("li");
        li.textContent = medicineItem;
        medicineList.appendChild(li);
    }
}

// Dropdown filter functionality (for diagnosis)
function filterOptions() {
    const query = patientNote4.value.toLowerCase();
    const dropdown = document.getElementById("note4-dropdown");
    dropdown.innerHTML = ""; // Clear the current list

    const options = ["Diagnosis 1", "Diagnosis 2", "Diagnosis 3"]; // List of possible diagnoses

    options.filter(option => option.toLowerCase().includes(query)).forEach(option => {
        const div = document.createElement("div");
        div.classList.add("dropdown-item");
        div.textContent = option;
        div.addEventListener("click", () => {
            patientNote4.value = option;
            dropdown.innerHTML = "";
        });
        dropdown.appendChild(div);
    });
}

// Optional: Show patient name dynamically (if applicable)
function setPatientName(name) {
    patientName.textContent = name;
}

// Set patient data dynamically (For example, if you're editing a patient record)
function loadPatientData(patientID) {
    const patientRef = ref(db, 'patients/' + patientID);
    get(patientRef).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            patientName.textContent = data.name;
            patientNote1.value = data.note1;
            patientNote3.value = data.note3;
            patientNote4.value = data.note4;
            // You can populate the medicines list similarly
        } else {
            console.log("No data available");
        }
    }).catch((error) => {
        console.error(error);
    });
}
