// Import Firebase functions
import { db } from './firebase-config.js';
import { ref, push, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

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

    // Convert select options to autocomplete data
    function getSelectOptions(selectId) {
        const select = document.getElementById(selectId);
        return Array.from(select.options)
            .filter(option => option.value)
            .map(option => option.text);
    }

    // Initialize autocomplete for a field
    function initAutocomplete(fieldId, suggestionsId) {
        const input = document.getElementById(fieldId);
        const suggestions = document.getElementById(suggestionsId);
        
        input.addEventListener('input', () => {
            const inputValue = input.value.toLowerCase();
            const options = getSelectOptions(fieldId);
            
            suggestions.innerHTML = '';
            
            if (inputValue.length > 0) {
                const filtered = options.filter(option => 
                    option.toLowerCase().includes(inputValue)
                );
                
                filtered.forEach(option => {
                    const li = document.createElement('li');
                    li.textContent = option;
                    li.addEventListener('click', () => {
                        input.value = option;
                        suggestions.innerHTML = '';
                    });
                    suggestions.appendChild(li);
                });
                
                if (filtered.length > 0) {
                    suggestions.style.display = 'block';
                } else {
                    suggestions.style.display = 'none';
                }
            } else {
                suggestions.style.display = 'none';
            }
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target !== input) {
                suggestions.style.display = 'none';
            }
        });
    }

    // Initialize all autocomplete fields
    initAutocomplete('commune', 'commune-suggestions');
    initAutocomplete('district', 'district-suggestions');
    initAutocomplete('province', 'province-suggestions');

    patientForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const fullName = document.getElementById('fullName').value.trim();
        const age = document.getElementById('age').value.trim();
        const gender = document.getElementById('gender').value;
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
        const notes = document.getElementById('notes').value.trim();

        // Address fields
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