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
        "Phnom Penh": "រាជធានី ភ្នំពេញ",
        "Banteay Meanchey": "បន្ទាយមានជ័យ",
        "Battambang": "បាត់ដំបង",
        "Kampong Cham": "កំពង់ចាម",
        "Kampong Chhnang": "កំពង់ឆ្នាំង",
        "Kampong Speu": "កំពង់ស្ពឺ",
        "Kampong Thom": "កំពង់ធំ",
        "Kampot": "កំពត",
        "Kandal": "កណ្តាល",
        "Kep": "កែប",
        "Koh Kong": "កោះកុង",
        "Kratie": "ក្រចេះ",
        "Mondulkiri": "មណ្ឌលគិរី",
        "Oddar Meanchey": "អូរដែរមានជ័យ",
        "Pailin": "ប៉ៃលិន",
        "Preah Vihear": "ព្រះវិហារ",
        "Prey Veng": "ព្រៃវែង",
        "Pursat": "ពោធិ៍សាត់",
        "Ratanakiri": "រតនគិរី",
        "Siem Reap": "សៀមរាប",
        "Preah Sihanouk": "ព្រះសីហនុ",
        "Stung Treng": "ស្ទឹងត្រែង",
        "Svay Rieng": "ស្វាយរៀង",
        "Takeo": "តាកែវ",
        "Tbong Khmum": "ត្បូងឃ្មុំ"
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
