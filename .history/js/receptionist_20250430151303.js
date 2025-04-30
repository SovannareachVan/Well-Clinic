import { db } from './firebase-config.js';
import { ref, push, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { commune } from './commune-data.js';
import { district } from './district-data.js'; 
import { province } from './province-data.js';

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

    // Initialize autocomplete for all address fields
    ['commune', 'district', 'province'].forEach(type => {
        const inputField = document.getElementById(type);
        const suggestionList = document.getElementById(`${type}-suggestions`);
        
        // Show all options when clicked
        inputField.addEventListener('focus', () => {
            let data;
            if (type === 'commune') data = commune;
            if (type === 'district') data = district;
            if (type === 'province') data = province;
            
            suggestionList.innerHTML = '';
            data.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                li.addEventListener('click', () => {
                    inputField.value = item;
                    suggestionList.style.display = 'none';
                
                    // Autofill related district and province
                    const related = addressRelationships.communes[item];
                    if (related) {
                        document.getElementById('district').value = related.district;
                        document.getElementById('province').value = related.province;
                    }
                }                   
                suggestionList.appendChild(li);
            });
            suggestionList.style.display = 'block';
        });

        // Filter as you type
        inputField.addEventListener('input', e => {
            const value = e.target.value.trim();
            let data;
            if (type === 'commune') data = commune;
            if (type === 'district') data = district;
            if (type === 'province') data = province;
            
            const filtered = data.filter(item => item.includes(value));
            suggestionList.innerHTML = '';
            
            filtered.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                li.addEventListener('click', () => {
                    inputField.value = item;
                    suggestionList.style.display = 'none';
                });
                suggestionList.appendChild(li);
            });
        });

        // Hide when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target !== inputField) {
                suggestionList.style.display = 'none';
            }
        });
    });

    patientForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const fullName = document.getElementById('fullName').value.trim();
        const age = document.getElementById('age').value.trim();
        const gender = document.getElementById('gender').value;
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email')?.value.trim() || '';
        const notes = document.getElementById('notes').value.trim();
        const village = document.getElementById('village').value.trim();
        const communeValue = document.getElementById('commune').value.trim();
        const districtValue = document.getElementById('district').value.trim();
        const provinceValue = document.getElementById('province').value.trim();

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
                address: {
                    village,
                    commune: communeValue,
                    district: districtValue,
                    province: provinceValue
                },
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