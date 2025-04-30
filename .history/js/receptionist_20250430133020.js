// Import Firebase functions
import { db } from './firebase-config.js';
import { ref, push, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Original select options converted to array
const addressOptions = {
    commune: [
        "ឃុំ គគីរ",
        "ឃុំ កាស", 
        "ឃុំ ក្អែក"
    ],
    district: [
        "ស្រុក កៀនស្វាយ",
        "ស្រុក ក្អែក",
        "ស្រុក កាស"
    ],
    province: [
        "ខេត្ត ព្រៃវែង",
        "ខេត្ត កណ្តាល",
        "ខេត្ត ភ្នំពេញ",
        "ខេត្ត បន្ទាយមានជ័យ",
        "ខេត្ត បាត់ដំបង",
        "ខេត្ត កំពង់ចាម",
        "ខេត្ត កំពង់ឆ្នាំង",
        "ខេត្ត កំពង់ស្ពឺ",
        "ខេត្ត កំពង់ធំ",
        "ខេត្ត កំពត",
        "ខេត្ត កោះកុង",
        "ខេត្ត ក្រចេះ",
        "ខេត្ត មណ្ឌលគីរី",
        "ខេត្ត ពោធិ៍សាត់",
        "ខេត្ត ព្រះវិហារ",
        "ខេត្ត ព្រះសីហនុ",
        "ខេត្ត រតនគីរី",
        "ខេត្ត សៀមរាប",
        "ខេត្ត ស្ទឹងត្រែង",
        "ខេត្ត តាកែវ",
        "ខេត្ត ស្វាយរៀង",
        "ខេត្ត ឧត្តរមានជ័យ",
        "ខេត្ត កែប",
        "ខេត្ត ប៉ៃលិន",
        "ខេត្ត ត្បូងឃ្មុំ"
    ]
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

    // Initialize autocomplete for all address fields
    function initAutocompleteFields() {
        // Initialize each field
        initAutocompleteField('commune', addressOptions.commune);
        initAutocompleteField('district', addressOptions.district);
        initAutocompleteField('province', addressOptions.province);
    }

    function initAutocompleteField(fieldId, options) {
        const input = document.getElementById(fieldId);
        const suggestions = document.getElementById(`${fieldId}-suggestions`);
        
        input.addEventListener('input', function() {
            const inputValue = this.value.toLowerCase();
            suggestions.innerHTML = '';
            
            if (inputValue.length > 0) {
                const filtered = options.filter(option => 
                    option.toLowerCase().includes(inputValue)
                );
                
                if (filtered.length > 0) {
                    filtered.forEach(option => {
                        const li = document.createElement('li');
                        li.textContent = option;
                        li.addEventListener('click', function() {
                            input.value = option;
                            suggestions.style.display = 'none';
                        });
                        suggestions.appendChild(li);
                    });
                    suggestions.style.display = 'block';
                } else {
                    suggestions.style.display = 'none';
                }
            } else {
                suggestions.style.display = 'none';
            }
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target !== input) {
                suggestions.style.display = 'none';
            }
        });
    }

    // Initialize autocomplete
    initAutocompleteFields();

    patientForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const fullName = document.getElementById('fullName').value.trim();
        const age = document.getElementById('age').value.trim();
        const gender = document.getElementById('gender').value;
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
        const notes = document.getElementById('notes').value.trim();

        // Address fields - now using direct values
        const village = document.getElementById('village').value.trim();
        const commune = document.getElementById('commune').value.trim();
        const district = document.getElementById('district').value.trim();
        const province = document.getElementById('province').value.trim();

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