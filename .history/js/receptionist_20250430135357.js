// Import Firebase functions
import { db } from './firebase-config.js';
import { ref, push, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Address Mapping
const addressMapping = {
    commune: {
        "Commune 1": "គគីរ",
        "Commune 2": "កាស",
        "Commune 3": "ក្អែក"
    },
    district: {
        "District 1": "កៀនស្វាយ",
        "District 2": "ក្អែក",
        "District 3": "កាស"
    },
    province: {
        "Province 1": "ព្រៃវែង",
        "Province 2": "កណ្តាល",
        "Province 3": "ភ្នំពេញ",
        "Province 4": "បន្ទាយមានជ័យ",
        "Province 5": "បាត់ដំបង",
        "Province 6": "កំពង់ចាម",
        "Province 7": "កំពង់ឆ្នាំង",
        "Province 8": "កំពង់ស្ពឺ",
        "Province 9": "កំពង់ធំ",
        "Province 10": "កំពត",
        "Province 11": "កោះកុង",
        "Province 12": "ក្រចេះ",
        "Province 13": "មណ្ឌលគីរី",
        "Province 14": "ពោធិ៍សាត់",
        "Province 15": "ព្រះវិហារ",
        "Province 16": "ព្រះសីហនុ",
        "Province 17": "រតនគីរី",
        "Province 18": "សៀមរាប",
        "Province 19": "ស្ទឹងត្រែង",
        "Province 20": "តាកែវ",
        "Province 21": "ស្វាយរៀង",
        "Province 22": "ឧត្តរមានជ័យ",
        "Province 23": "កែប",
        "Province 24": "ប៉ៃលិន",
        "Province 25": "ត្បូងឃ្មុំ"
    }    
};

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

    function filterOptions(input, type) {
        const filtered = Object.values(addressMapping[type]).filter(item =>
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

    // Autocomplete listeners
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

        const communeInput = document.getElementById('commune').value.trim();
        const commune = Object.values(addressMapping.commune).includes(communeInput) ? communeInput : communeInput;

        const districtInput = document.getElementById('district').value.trim();
        const district = Object.values(addressMapping.district).includes(districtInput) ? districtInput : districtInput;

        const provinceInput = document.getElementById('province').value.trim();
        const province = Object.values(addressMapping.province).includes(provinceInput) ? provinceInput : provinceInput;

        if (!fullName || !age || !gender || !phone || !village || !commune || !district || !province) {
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
                address: { village, commune, district, province },
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
