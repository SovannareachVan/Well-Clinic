// Firebase config (replace with your actual credentials)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Get patient ID (from URL or fallback)
const patientId = new URLSearchParams(window.location.search).get("id") || "default_patient";

// Save notes to Firebase
document.getElementById("saveBtn").addEventListener("click", () => {
  const note1 = document.getElementById("patientNote1").value;
  const note3 = document.getElementById("patientNote3").value;
  const note4 = document.getElementById("patientNote4").value;

  const medicineItems = Array.from(document.querySelectorAll("#medicineList li")).map(li => li.textContent);

  const patientData = {
    history: note1,
    labTest: note3,
    diagnosis: note4,
    medicines: medicineItems,
  };

  set(ref(database, 'patients/' + patientId), patientData)
    .then(() => {
      alert("Data saved successfully!");
    })
    .catch((error) => {
      console.error("Error saving data:", error);
    });
});

// Add medicine item
window.addMedicineItem = function () {
  const medicineName = prompt("Enter medicine name:");
  if (medicineName) {
    const li = document.createElement("li");
    li.textContent = medicineName;
    document.getElementById("medicineList").appendChild(li);
  }
};

// Dropdown functionality
const options = [
  "ជំងឺផ្លូវដង្ហើម",
  "ជំងឺទឹកនោមផ្អែម",
  "ជំងឺបេះដូង",
  "ជំងឺសម្ពាធឈាមខ្ពស់",
  "ជំងឺកង្វះអាហារ",
  "ជំងឺផ្លូវអារម្មណ៍",
  // Add more terms as needed
];

const input = document.getElementById("patientNote4");
const dropdown = document.getElementById("note4-dropdown");

window.filterOptions = function () {
  const value = input.value.toLowerCase();
  dropdown.innerHTML = "";

  const filtered = options.filter(opt => opt.toLowerCase().includes(value));
  filtered.forEach(opt => {
    const div = document.createElement("div");
    div.className = "dropdown-item";
    div.textContent = opt;
    div.onclick = () => {
      input.value = opt;
      dropdown.innerHTML = "";
    };
    dropdown.appendChild(div);
  });

  dropdown.style.display = filtered.length > 0 ? "block" : "none";
};
