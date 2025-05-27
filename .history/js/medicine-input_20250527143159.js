import { db } from './firebase-config.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { medicineOptions as hardcodedMedicineOptions } from './medicine-dropdown.js'; // Import hardcoded list

function initMedicineDropdown(parentElement) {
    const input = parentElement.querySelector('.medicine-input');
    const dropdown = parentElement.querySelector('.medicine-dropdown');
    if (!input || !dropdown) {
        console.error('Medicine input or dropdown not found');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    let medicineOptions = [];

    // Fetch global medicines from Firebase
    const medicinesRef = ref(db, 'medicines');
    onValue(medicinesRef, (snapshot) => {
        medicineOptions = [...hardcodedMedicineOptions]; // Start with hardcoded options
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const medicineData = childSnapshot.val();
                // Only include medicines with a valid name
                if (medicineData.name && medicineData.name.trim() !== "" && medicineData.name !== "undefined") {
                    medicineOptions.push(medicineData.name);
                }
            });
        }

        // Optionally include patient-specific medicines
        const patientMedicinesRef = ref(db, `patients/${patientId}/medicines`);
        onValue(patientMedicinesRef, (patientSnapshot) => {
            if (patientSnapshot.exists()) {
                patientSnapshot.forEach((childSnapshot) => {
                    const medicineData = childSnapshot.val();
                    if (medicineData.name && medicineData.name.trim() !== "" && medicineData.name !== "undefined") {
                        medicineOptions.push(medicineData.name);
                    }
                });
            }

            // Remove duplicates and sort
            medicineOptions = [...new Set(medicineOptions)].sort();

            // Update dropdown content
            dropdown.innerHTML = '';
            medicineOptions.forEach(option => {
                const div = document.createElement("div");
                div.classList.add("dropdown-item");
                div.textContent = option;
                div.onclick = () => {
                    input.value = option;
                    dropdown.innerHTML = '';
                    dropdown.style.display = 'none';
                };
                dropdown.appendChild(div);
            });
        }, { onlyOnce: false }); // Keep listening for patient-specific updates
    }, { onlyOnce: false }); // Keep listening for global updates

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
            div.onclick = () => {
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
                div.onclick = () => {
                    input.value = option;
                    dropdown.innerHTML = '';
                    dropdown.style.display = 'none';
                };
                dropdown.appendChild(div);
            });
        }
    });
}

export { initMedicineDropdown };