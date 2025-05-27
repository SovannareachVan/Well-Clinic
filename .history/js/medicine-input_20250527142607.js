import { db } from './firebase-config.js';
import { ref, onValue, push, remove } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js ';

// Import hardcoded medicine options
import { medicineOptions } from '../js/medicine-data.js'; // Adjust path if needed

const medicinesTableBody = document.getElementById("medicinesTableBody");
const addMedicineBtn = document.getElementById("addMedicineBtn");
const medicineModal = document.getElementById("medicineModal");
const closeModal = document.getElementsByClassName("close")[0];
const medicineForm = document.getElementById("medicineForm");

let firebaseMedicineNames = new Set();

function fetchMedicines() {
  const medicinesRef = ref(db, 'medicines');

  onValue(medicinesRef, (snapshot) => {
    medicinesTableBody.innerHTML = "";
    firebaseMedicineNames.clear();
    const firebaseList = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data.name && data.name.trim()) {
          firebaseMedicineNames.add(data.name);
          firebaseList.push(data.name);
        }
      });
    }

    const combined = [...new Set([...medicineOptions, ...firebaseList])].filter(Boolean);
    combined.sort();

    let index = 1;
    combined.forEach(name => {
      const row = document.createElement("tr");
      const source = firebaseMedicineNames.has(name) ? "ថ្មី" : "មានស្រាប់";
      row.innerHTML = `
        <td>${index++}. ${name}</td>
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

    if (!combined.length) {
      medicinesTableBody.innerHTML = "<tr><td colspan='3'>គ្មានថ្នាំណាមួយត្រូវបានរកឃើញ។</td></tr>";
    }
  });
}

window.deleteMedicine = function (name) {
  const password = prompt("សូមបញ្ចូលលេខសម្ងាត់ 12345 ដើម្បីលុប:");
  if (password !== "12345") {
    if (password !== null) alert("លេខសម្ងាត់មិនត្រឹមត្រូវ។");
    return;
  }

  if (!confirm(`តើអ្នកប្រាកដជាចង់លុប "${name}"?`)) return;

  const medicinesRef = ref(db, 'medicines');
  onValue(medicinesRef, (snapshot) => {
    snapshot.forEach(childSnapshot => {
      const data = childSnapshot.val();
      if (data.name === name) {
        remove(ref(db, `medicines/${childSnapshot.key}`))
          .then(() => alert(`"${name}" ត្រូវបានលុបដោយជោគជ័យ!`))
          .catch(err => alert("Error deleting: " + err));
      }
    });
  }, { onlyOnce: true });
};

addMedicineBtn.addEventListener("click", () => {
  medicineModal.style.display = "block";
});

closeModal.addEventListener("click", () => {
  medicineModal.style.display = "none";
  medicineForm.reset();
});

window.addEventListener("click", (event) => {
  if (event.target === medicineModal) {
    medicineModal.style.display = "none";
    medicineForm.reset();
  }
});

medicineForm.addEventListener("submit",