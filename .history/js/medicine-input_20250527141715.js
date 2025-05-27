import { db } from './firebase-config.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js ';

// Optional: Hardcoded fallback values
export const hardcodedMedicineOptions = [
    "",
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

/**
 * Initializes medicine input with dropdown autocomplete
 * @param {HTMLElement} parentElement - The container element with .medicine-input and .medicine-dropdown
 */
export function initMedicineDropdown(parentElement) {
    const input = parentElement.querySelector('.medicine-input');
    const dropdown = parentElement.querySelector('.medicine-dropdown');

    if (!input || !dropdown) {
        console.error('Medicine input or dropdown not found.');
        return;
    }

    let medicineOptions = [...hardcodedMedicineOptions]; // Start with hardcoded options

    // Fetch real-time medicine list from Firebase
    const medicinesRef = ref(db, 'medicines');
    onValue(medicinesRef, (snapshot) => {
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                const name = data?.name?.trim();

                if (name && !medicineOptions.includes(name)) {
                    medicineOptions.push(name);
                }
            });
        }

        // Sort alphabetically
        medicineOptions.sort((a, b) => a.localeCompare(b));

        // Re-render dropdown when input changes
        renderDropdown(input, dropdown, medicineOptions);
    }, {
        onlyOnce: false
    });

    // Trigger rendering on input
    input.addEventListener('input', () => {
        renderDropdown(input, dropdown, medicineOptions);
    });

    // Show dropdown on click/focus
    input.addEventListener('click', () => {
        if (dropdown.innerHTML === '') {
            renderDropdown(input, dropdown, medicineOptions);
        } else {
            dropdown.style.display = 'block';
        }
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!parentElement.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

/**
 * Renders filtered dropdown items based on input query
 */
function renderDropdown(input, dropdown, options) {
    const query = input.value.toLowerCase();
    const filtered = query
        ? options.filter(opt => opt.toLowerCase().includes(query))
        : options;

    dropdown.innerHTML = '';
    if (filtered.length === 0) {
        dropdown.style.display = 'none';
        return;
    }

    filtered.forEach(option => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        div.textContent = option;
        div.onclick = () => {
            input.value = option;
            dropdown.style.display = 'none';
        };
        dropdown.appendChild(div);
    });

    dropdown.style.display = 'block';
}