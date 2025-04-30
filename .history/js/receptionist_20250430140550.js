// Import Firebase functions
import { db } from './firebase-config.js';
import { ref, push, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Import commune, district, and province data
import { commune } from './commune-data.js'; // Your commune array
import { district } from './district-data.js'; // Your district array
import { province } from './province-data.js'; // Your province array

document.addEventListener('DOMContentLoaded', () => {
    const patientForm = document.getElementById('patientForm');
    const popupContainer = document.getElementById('popup-container');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const closePopupBtn = document.querySelector('.close-popup');

    function showPopup(title, message) {
        popupTitle.textContent = title;
        popupMessage.textContent = message;
        popupContainer.style.display = 'flex';
    }

    closePopupBtn.addEventListener('click', () => {
        popupContainer.style.display = 'none';
    });

    popupContainer.addEventListener('click', (event) => {
        if (event.target === popupContainer) {
            popupContainer.style.display = 'none';
        }
    });

    // New function to filter options based on the input
    function filterOptions(input, type) {
        let data;
        if (type === 'commune') data = commune;
        if (type === 'district') data = district;
        if (type === 'province') data = province;

        const filtered = data.filter(item =>
            item.startsWith(input)
        );

        const suggestionList = document.getElementById(`${type}-suggestions`);
        suggestionList.innerHTML = '';
        suggestionList.style.display = filtered.length ? 'block' : 'none';

        filtered.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            li.className = 'autocomplete-item';
            li.addEventListener('click', () => {
                document.getElementById(type).value = item;
                suggestionList.innerHTML = '';
                suggestionList.style.display = 'none';
            });
            suggestionList.appendChild(li);
        });
    }

    // Autocomplete listeners for commune, district, and province
    ['commune', 'district', 'province'].forEach(type => {
        const inputField = document.getElementById(type);
        inputField.addEventListener('input', e => {
            const value = e.target.value.trim();
            if (value) filterOptions(value, type);
        });

        // Hide suggestions on blur
        inputField.addEventListener('blur', () => {
            setTimeout(() => {
                const suggestionList = document.getElementById(`${type}-suggestions`);
                suggestionList.style.display = 'none';
            }, 200);
        });
    });

    // Submit handler
    patientForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const fullName = document.getElementById('fullName').value.trim();
        const age = document.getElementById('age').value.trim();
        const gender = document.getElementById('gender').value;
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
        const notes = document.getElementById('notes').value.trim();
        const village = document.getElementById('village').value.trim();

        // Handle commune, district, and province
        const communeInput = document.getElementById('commune').value.trim();
        const communeValue = commune.includes(communeInput) ? communeInput : communeInput;

        const districtInput = document.getElementById('district').value.trim();
        const districtValue = district.includes(districtInput) ? districtInput : districtInput;

        const provinceInput = document.getElementById('province').value.trim();
        const provinceValue = province.includes(provinceInput) ? provinceInput : provinceInput;

        // Validate input fields
        if (!fullName || !age || !gender || !phone || !village || !communeValue || !districtValue || !provinceValue) {
            showPopup("កំហុស", "សូមបំពេញព័ត៌មានទាំងអស់។");
            return;
        }

        try {
            const patientRef = push(ref(db, 'patients'));
            await set(patientRef, {
                fullName,
                age,
                gender,
                phone,
                email,
                address: { village, commune: communeValue, district: districtValue, province: provinceValue },
                notes,
                timestamp: new Date().toISOString()
            });

            showPopup("ជោគជ័យ", "ការចុះឈ្មោះបានជោគជ័យ!");
            patientForm.reset();
        } catch (error) {
            console.error("Error saving patient:", error);
            showPopup("កំហុស", "ការចុះឈ្មោះមានបញ្ហា សូមព្យាយាមម្ដងទៀត។");
        }
    });
});
