import { db } from './firebase-config.js';
import { ref, get, update, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Function to add a medicine item
window.addMedicineItem = function(medicineData = null, forceAdd = false) {
    const ul = document.getElementById('medicineList');
    if (!ul) {
        console.error("Error: 'medicineList' element not found!");
        return null;
    }
    
    if (!forceAdd && !medicineData && ul.querySelectorAll('li').length > 0) {
        const lastLi = ul.lastElementChild;
        const inputs = lastLi.querySelectorAll('input');
        const selects = lastLi.querySelectorAll('select');
        
        let isEmpty = true;
        inputs.forEach(input => { if (input.value) isEmpty = false; });
        selects.forEach(select => { if (select.value) isEmpty = false; });
        
        if (isEmpty) return null;
    }

    const li = document.createElement('li');
    li.classList.add('medicine-item');

    li.innerHTML = `
        <table class="medicine-table">
            <thead><tr><th>ឈ្មោះថ្នាំ</th><th>ប្រភេទថ្នាំ</th><th>រយះពេល (ថ្ងៃ)</th><th>ព្រឹក</th><th>ថ្ងៃ</th><th>ល្ងាច</th><th>ចំនួនថ្នាំ</th><th></th></tr></thead>
            <tbody><tr>
                <td><div class="dropdown-wrapper"><input type="text" class="medicine-input" placeholder="សូមជ្រើសរើសថ្នាំ..." autocomplete="off" value="${medicineData ? medicineData.name : ''}"><div class="medicine-dropdown dropdown"></div></div></td>
                <td><select class="dosage-select"><option value="" ${!medicineData?.dosage ? 'selected disabled' : ''}>...</option><option value="ថ្នាំគ្រាប់" ${medicineData?.dosage === 'ថ្នាំគ្រាប់' ? 'selected' : ''}>ថ្នាំគ្រាប់</option><option value="អំពូល" ${medicineData?.dosage === 'អំពូល' ? 'selected' : ''}>អំពូល</option><option value="កញ្ចប់" ${medicineData?.dosage === 'កញ្ចប់' ? 'selected' : ''}>កញ្ចប់</option><option value="បន្ទះ" ${medicineData?.dosage === 'បន្ទះ' ? 'selected' : ''}>បន្ទះ</option></select></td>
                <td><input type="number" class="time-input" placeholder="ថ្ងៃ" min="1" value="${medicineData?.days || ''}"></td>
                <td><select class="dosage-select morning-dose"><option value="" ${!medicineData?.morningDose ? 'selected' : ''}>...</option><option value="1/2" ${medicineData?.morningDose === '1/2' ? 'selected' : ''}>1/2</option><option value="1" ${medicineData?.morningDose === '1' ? 'selected' : ''}>1</option><option value="1+1/4" ${medicineData?.morningDose === '1+1/4' ? 'selected' : ''}>1+1/4</option><option value="1+1/2" ${medicineData?.morningDose === '1+1/2' ? 'selected' : ''}>1+1/2</option><option value="2" ${medicineData?.morningDose === '2' ? 'selected' : ''}>2</option><option value="2+1/2" ${medicineData?.morningDose === '2+1/2' ? 'selected' : ''}>2+1/2</option><option value="3" ${medicineData?.morningDose === '3' ? 'selected' : ''}>3</option><option value="1/4" ${medicineData?.morningDose === '1/4' ? 'selected' : ''}>1/4</option></select></td>
                <td><select class="dosage-select afternoon-dose"><option value="" ${!medicineData?.afternoonDose ? 'selected' : ''}>...</option><option value="1/2" ${medicineData?.afternoonDose === '1/2' ? 'selected' : ''}>1/2</option><option value="1" ${medicineData?.afternoonDose === '1' ? 'selected' : ''}>1</option><option value="1+1/4" ${medicineData?.afternoonDose === '1+1/4' ? 'selected' : ''}>1+1/4</option><option value="1+1/2" ${medicineData?.afternoonDose === '1+1/2' ? 'selected' : ''}>1+1/2</option><option value="2" ${medicineData?.afternoonDose === '2' ? 'selected' : ''}>2</option><option value="2+1/2" ${medicineData?.afternoonDose === '2+1/2' ? 'selected' : ''}>2+1/2</option><option value="3" ${medicineData?.afternoonDose === '3' ? 'selected' : ''}>3</option><option value="1/4" ${medicineData?.afternoonDose === '1/4' ? 'selected' : ''}>1/4</option></select></td>
                <td><select class="dosage-select evening-dose"><option value="" ${!medicineData?.eveningDose ? 'selected' : ''}>...</option><option value="1/2" ${medicineData?.eveningDose === '1/2' ? 'selected' : ''}>1/2</option><option value="1" ${medicineData?.eveningDose === '1' ? 'selected' : ''}>1</option><option value="1+1/4" ${medicineData?.eveningDose === '1+1/4' ? 'selected' : ''}>1+1/4</option><option value="1+1/2" ${medicineData?.eveningDose === '1+1/2' ? 'selected' : ''}>1+1/2</option><option value="2" ${medicineData?.eveningDose === '2' ? 'selected' : ''}>2</option><option value="2+1/2" ${medicineData?.eveningDose === '2+1/2' ? 'selected' : ''}>2+1/2</option><option value="3" ${medicineData?.eveningDose === '3' ? 'selected' : ''}>3</option><option value="1/4" ${medicineData?.eveningDose === '1/4' ? 'selected' : ''}>1/4</option></select></td>
                <td><input type="text" class="quantity-input" readonly value="${medicineData?.quantity || ''}"></td>
                <td><button class="btn-delete" onclick="this.closest('li').remove()">❌</button></td>
            </tr></tbody>
        </table>`;

    ul.appendChild(li);

    // Setup calculation listeners
    const daysInput = li.querySelector('.time-input');
    const morningSelect = li.querySelector('.morning-dose');
    const afternoonSelect = li.querySelector('.afternoon-dose');
    const eveningSelect = li.querySelector('.evening-dose');
    const quantityInput = li.querySelector('.quantity-input');

    function calculateQuantity() {
        const days = parseFloat(daysInput.value) || 0;
        const morningValue = parseDoseValue(morningSelect.value);
        const afternoonValue = parseDoseValue(afternoonSelect.value);
        const eveningValue = parseDoseValue(eveningSelect.value);
        const totalPerDay = morningValue + afternoonValue + eveningValue;
        const totalQuantity = days * totalPerDay;
        quantityInput.value = totalQuantity % 1 === 0 ? totalQuantity : totalQuantity.toFixed(1);
    }

    daysInput.addEventListener('input', calculateQuantity);
    morningSelect.addEventListener('change', calculateQuantity);
    afternoonSelect.addEventListener('change', calculateQuantity);
    eveningSelect.addEventListener('change', calculateQuantity);

    if (medicineData) {
        calculateQuantity();
    }

    return li;
};

// Function to save patient notes
async function savePatientNotes(recordId, visitId = null) {
    const medicines = Array.from(document.querySelectorAll('.medicine-item')).map(item => ({
        name: item.querySelector('.medicine-input').value.trim(),
        dosage: item.querySelector('.dosage-select').value,
        days: item.querySelector('.time-input').value || 0,
        morningDose: item.querySelector('.morning-dose').value,
        afternoonDose: item.querySelector('.afternoon-dose').value,
        eveningDose: item.querySelector('.evening-dose').value,
        quantity: item.querySelector('.quantity-input').value
    }));

    const patientInfo = {
        treatmentHistory: document.getElementById('patientNote2')?.value.trim() || "N/A",
        labTest: document.getElementById('patientNote3')?.value.trim() || "N/A",
        diagnosis: document.getElementById('patientNote4')?.value.trim() || '',
        medicines: medicines.length > 0 ? medicines : [],
        createdAt: new Date().toISOString()
    };

    console.log('PatientInfo to save:', patientInfo);

    try {
        console.log('Saving patientInfo for patient:', recordId);
        await set(ref(db, `patients/${recordId}/structuredNotes`), patientInfo);
        console.log('Successfully saved patientInfo to patients/', recordId);

        if (visitId) {
            console.log('Saving to visit path:', `patients/${recordId}/visits/${visitId}/information`);
            await set(ref(db, `patients/${recordId}/visits/${visitId}/information`), patientInfo);
            console.log('Successfully saved to visit path');
        }

        alert('Notes saved successfully!');
        window.history.back();
    } catch (err) {
        console.error('Error saving patient notes:', err);
        alert('Failed to save notes: ' + err.message);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    const visitId = urlParams.get('visitId');

    if (patientId) {
        // Populate patient details (placeholder logic)
        document.getElementById('patientFullName').textContent = 'John Doe'; // Replace with actual fetch logic
        document.getElementById('patientAge').textContent = '30';
        document.getElementById('patientGender').textContent = 'Male';
        document.getElementById('patientPhone').textContent = '0123456789';
        document.getElementById('patientAddress').textContent = 'Phnom Penh';
        document.getElementById('patientNotes').textContent = 'Initial notes...';

        // Add default medicine item
        addMedicineItem();
    }

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => savePatientNotes(patientId, visitId));
    } else {
        console.error('Element with id "saveBtn" not found');
    }
});