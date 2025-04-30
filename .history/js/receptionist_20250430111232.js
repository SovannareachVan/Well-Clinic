// Import Firebase functions
import { db } from './firebase-config.js';
import { ref, push, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Address Mapping (same as in your patient detail page)
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
        "Province 1": "ខេត្ត ព្រៃវែង",
        "Province 2": "ខេត្ត កណ្តាល",
        "Province 3": "ខេត្ត ក្អាត់",
        "Province 4": "រាជធានី ភ្នំពេញ",
        "Province 5": "ខេត្ត បន្ទាយមានជ័យ",
        "Province 6": "ខេត្ត បាត់ដំបង",
        "Province 7": "ខេត្ត កំពង់ចាម",
        "Province 8": "ខេត្ត កំពង់ឆ្នាំង",
        "Province 9": "ខេត្ត កំពង់ស្ពឺ",
        "Province 10": "ខេត្ត កំពង់ធំ",
        "Province 11": "ខេត្ត កំពត",
        "Province 12": "ខេត្ត កែប",
        "Province 13": "ខេត្ត កោះកុង",
        "Province 14": "ខេត្ត ក្រចេះ",
        "Province 15": "ខេត្ត មណ្ឌលគិរី",
        "Province 16": "ខេត្ត អូរដែរមានជ័យ",
        "Province 17": "ខេត្ត ប៉ៃលិន",
        "Province 18": "ខេត្ត ព្រះវិហារ",
        "Province 19": "ខេត្ត ពោធិ៍សាត់",
        "Province 20": "ខេត្ត រតនគិរី",
        "Province 21": "ខេត្ត សៀមរាប",
        "Province 22": "ខេត្ត ព្រះសីហនុ",
        "Province 23": "ខេត្ត ស្ទឹងត្រែង",
        "Province 24": "ខេត្ត ស្វាយរៀង",
        "Province 25": "ខេត្ត តាកែវ",
        "Province 26": "ខេត្ត ត្បូងឃ្មុំ"
    }
    
    
};

// Wait until DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const patientForm = document.getElementById('patientForm');
    const popupContainer = document.getElementById('popup-container');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const closePopupBtn = document.querySelector('.close-popup');

    if (!patientForm) {
        console.error('patientForm not found!');
        return;
    }

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

    patientForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const fullName = document.getElementById('fullName').value.trim();
        const age = document.getElementById('age').value.trim();
        const gender = document.getElementById('gender').value;
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
        const notes = document.getElementById('notes').value.trim();

        // Village is free text input
        const village = document.getElementById('village').value.trim();

        // Commune, District, Province use mapping if possible
        const communeInput = document.getElementById('commune').value.trim();
        const commune = addressMapping.commune[communeInput] || communeInput;

        const districtInput = document.getElementById('district').value.trim();
        const district = addressMapping.district[districtInput] || districtInput;

        const provinceInput = document.getElementById('province').value.trim();
        const province = addressMapping.province[provinceInput] || provinceInput;

        const address = {
            village,
            commune,
            district,
            province
        };

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
                address,
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
