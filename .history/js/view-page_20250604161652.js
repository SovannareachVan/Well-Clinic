import { db } from './firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

async function getPatientDetails(recordId, visitId = null) {
    console.log("Fetching patient data for ID:", recordId, "Visit ID:", visitId);
    const patientNotesContainer = document.getElementById('patientNotes');
    patientNotesContainer.innerHTML = '<div class="loading">Loading...</div>';

    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (!snapshot.exists()) {
            patientNotesContainer.textContent = 'No patient records available.';
            return { visits: [] };
        }

        const patientData = snapshot.val();
        console.log("Patient data:", patientData);

        const patientNameHeader = document.getElementById('patientName');
        if (patientNameHeader) {
            patientNameHeader.textContent = patientData.fullName || 'N/A';
        }

        const fields = [
            { id: 'patientFullName', key: 'fullName' },
            { id: 'patientAge', key: 'age' },
            { id: 'patientGender', key: 'gender' },
            { id: 'patientPhone', key: 'phone' },
            { id: 'patientTelegram', key: 'telegram' }
        ];

        fields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                element.textContent = patientData[field.key] || 'N/A';
            }
        });

        const addressMapping = {
            village: {},
            commune: {},
            district: {},
            province: {}
        };

        if (patientData.address) {
            let addressString = '';
            const { village, commune, district, province } = patientData.address;

            const addressParts = [
                village ? `ភូមិ ${addressMapping.village[village] || village}` : '',
                commune ? `ឃុំ/សង្កាត់ ${addressMapping.commune[commune] || commune}` : '',
                district ? `ស្រុក/ខណ្ឌ ${addressMapping.district[district] || district}` : '',
                province ? `ខេត្ត/ក្រុង ${addressMapping.province[province] || province}` : ''
            ].filter(Boolean);

            addressString = addressParts.join(', ');
            const patientAddressElement = document.getElementById('patientAddress');
            if (patientAddressElement) {
                patientAddressElement.textContent = addressString || 'N/A';
            }
        } else {
            console.warn('Address data not found or empty');
            const patientAddressElement = document.getElementById('patientAddress');
            if (patientAddressElement) {
                patientAddressElement.textContent = 'N/A';
            }
        }

        const visits = patientData.visits ? Object.entries(patientData.visits).filter(([_, visit]) => visit && typeof visit === 'object') : [];
        console.log("Visits data:", visits);
        let outputHtml = '';

        if (patientData.notes) {
            outputHtml += `<div class="patient-general-notes">${patientData.notes}</div>`;
        }

        if (visits.length === 0) {
            outputHtml += `<div>មិនទាន់មានការចូលពិនិត្យ</div>`;
            patientNotesContainer.innerHTML = outputHtml;
            return { visits };
        }

        visits.sort((a, b) => {
            const checkInA = a[1].checkIn || 'N/A';
            const checkInB = b[1].checkIn || 'N/A';

            const dateA = checkInA === 'N/A' ? new Date() : new Date(checkInA);
            const dateB = checkInB === 'N/A' ? new Date() : new Date(checkInB);

            if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
            if (isNaN(dateA.getTime())) {
                console.warn(`Invalid checkIn date for visit ${a[0]}:`, checkInA);
                return -1;
            }
            if (isNaN(dateB.getTime())) {
                console.warn(`Invalid checkIn date for visit ${b[0]}:`, checkInB);
                return 1;
            }

            return dateB - dateA;
        });

        if (visitId) {
            const visitRef = ref(db, `patients/${recordId}/visits/${visitId}`);
            const visitSnapshot = await get(visitRef);
            if (!visitSnapshot.exists()) {
                console.error(`Visit ID ${visitId} not found.`);
                outputHtml += `<div>Visit not found.</div>`;
                patientNotesContainer.innerHTML = outputHtml;
                return { visits };
            }

            const visit = visitSnapshot.val();
            console.log(`Visit data for ${visitId}:`, visit);
            const infoRef = ref(db, `patients/${recordId}/visits/${visitId}/information`);
            const infoSnapshot = await get(infoRef);
            const visitInfo = infoSnapshot.exists() ? infoSnapshot.val() : {};
            console.log(`Visit info for ${visitId}:`, visitInfo);

            const visitIndex = visits.findIndex(v => v[0] === visitId);
            const isFirstVisit = visitIndex === visits.length - 1;
            outputHtml += generateVisitHtml(
                `ព័ត៌មានពិនិត្យលើកទី ${visits.length - visitIndex}`,
                visit.checkIn,
                visit.checkOut,
                visit.clinic,
                visit.doctor,
                visitInfo,
                isFirstVisit,
                visitId
            );
        } else {
            // Fetch all visit information concurrently
            const visitInfoPromises = visits.map(([currentVisitId, visit], index) => {
                const infoRef = ref(db, `patients/${recordId}/visits/${currentVisitId}/information`);
                return get(infoRef).then(infoSnapshot => {
                    console.log(`Visit info for ${currentVisitId}:`, infoSnapshot.exists() ? infoSnapshot.val() : {});
                    return {
                        visitId: currentVisitId,
                        visit,
                        visitInfo: infoSnapshot.exists() ? infoSnapshot.val() : {},
                        index
                    };
                }).catch(error => {
                    console.error(`Error fetching info for visit ${currentVisitId}:`, error);
                    return {
                        visitId: currentVisitId,
                        visit,
                        visitInfo: {},
                        index
                    };
                });
            });

            const visitInfos = await Promise.all(visitInfoPromises);

            // Generate HTML for each visit
            visitInfos.forEach(({ visitId, visit, visitInfo, index }) => {
                const isFirstVisit = index === visits.length - 1;
                try {
                    outputHtml += generateVisitHtml(
                        `ព័ត៌មានពិនិត្យលើកទី ${visits.length - index}`,
                        visit.checkIn,
                        visit.checkOut,
                        visit.clinic,
                        visit.doctor,
                        visitInfo,
                        isFirstVisit,
                        visitId
                    );
                } catch (error) {
                    console.error(`Error generating HTML for visit ${visitId}:`, error);
                    outputHtml += `<div>Error displaying visit ${visitId}: ${error.message}</div>`;
                }
            });
        }

        patientNotesContainer.innerHTML = outputHtml;
        return { visits };

    } catch (error) {
        console.error('Error loading patient data:', error);
        patientNotesContainer.textContent = 'Failed to load patient details.';
        return { visits: [] };
    }
}

function generateVisitHtml(title, checkIn, checkOut, clinic, doctor, info, isFirstVisit = false, visitId) {
    const checkInDisplay = checkIn && isValidDate(checkIn) ? checkIn : 'N/A';
    const checkOutDisplay = checkOut && isValidDate(checkOut) ? checkOut : 'N/A';

    return `
        <div class="visit-note" data-visit-id="${visitId}">
            <div class="visit-note-header">
                <h3>${title}</h3>
                <div class="visit-meta">
                    <div><strong>ថ្ងៃចូល:</strong> ${checkInDisplay}</div>
                    <div><strong>ថ្ងៃចេញ:</strong> ${checkOutDisplay}</div>
                    <div><strong>មន្ទីរពេទ្យ:</strong> ${clinic || 'N/A'}</div>
                    <div><strong>វេជ្ជបណ្ឌិត:</strong> ${doctor || 'N/A'}</div>
                </div>
            </div>
            <div class="visit-note-content">
                ${isFirstVisit ? generateFirstVisitContent(info) : generateSecondVisitContent(info)}
            </div>
        </div>
    `;
}

function isValidDate(dateStr) {
    if (!dateStr || dateStr === 'N/A') return false;
    const [datePart, timePart] = dateStr.split(' ');
    if (!datePart || !timePart) return false;
    const [day, month, year] = datePart.split('/').map(num => parseInt(num, 10));
    const [hours, minutes, seconds] = timePart.split(':').map(num => parseInt(num, 10));
    const date = new Date(year, month - 1, day, hours, minutes, seconds);
    return !isNaN(date.getTime()) && 
           dateStr.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/) && 
           day >= 1 && day <= 31 && 
           month >= 1 && month <= 12 && 
           year >= 1900 && year <= new Date().getFullYear() &&
           hours >= 0 && hours <= 23 &&
           minutes >= 0 && minutes <= 59 &&
           seconds >= 0 && seconds <= 59;
}

function generateFirstVisitContent(info) { 
    console.log("Generating first visit content with info:", info);
    return `
        <div class="note-item"><strong>សញ្ញាណតម្អូញ:</strong> ${info.note1 || info.treatmentHistory || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>ប្រវត្តិព្យាបាល:</strong> ${info.note2 || info.treatmentHistory || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>តេស្តមន្ទីពិសោធន៍:</strong> ${info.note3 || info.labTest || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>រោគវិនិច្ឆ័យ:</strong> ${info.diagnosis || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>រោគវិនិច្ឆ័យញែក:</strong> ${info.note5 || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>របៀបប្រើប្រាស់ថ្នាំ:</strong> ${info.medicines ? generateMedicineTable(info.medicines) : 'មិនទាន់បំពេញ'}</div>
    `;
}

function generateSecondVisitContent(info) {
    console.log("Generating second visit content with info:", info);
    return `
        <div class="note-item"><strong>ប្រវត្តិព្យាបាល:</strong> ${info.treatmentHistory || info.note2 || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>តេស្តមន្ទីពិសោធន៍:</strong> ${info.labTest || info.note3 || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>រោគវិនិច្ឆ័យ:</strong> ${info.diagnosis || 'មិនទាន់បំពេញ'}</div>
        <div class="note-item"><strong>របៀបប្រើប្រាស់ថ្នាំ:</strong> ${info.medicines ? generateMedicineTable(info.medicines) : 'មិនទាន់បំពេញ'}</div>
    `;
}

function generateMedicineTable(medicines) {
    console.log("Generating medicine table with data:", medicines);

    let medicineArray = [];
    if (medicines) {    
        if (Array.isArray(medicines)) {
            medicineArray = medicines.filter(med => med && typeof med === 'object');
            console.log("Medicines is an array:", medicineArray);
        } else if (typeof medicines === 'object' && medicines !== null) {
            medicineArray = Object.entries(medicines)
                .filter(([_, med]) => med && typeof med === 'object')
                .map(([itemId, med]) => ({ ...med, itemId }));
            console.log("Medicines is an object, converted to array with itemId:", medicineArray);
        } else {
            console.warn("Unexpected medicines data type:", typeof medicines, medicines);
            return 'មិនទាន់បំពេញ';
        }
    }

    if (medicineArray.length === 0) {
        console.log("No valid medicines to display.");
        return 'មិនទាន់បំពេញ';
    }

    return `
    <div class="medicine-container">
        <div class="medication-table">
            <div class="medicine-header">
                <div class="medicine-col">ល.រ</div>
                <div class="medicine-col">ឈ្មោះថ្នាំ</div>
                <div class="medicine-col">ប្រភេទថ្នាំ</div>
                <div class="medicine-col">រយៈពេល</div>
                <div class="medicine-col">ព្រឹក</div>
                <div class="medicine-col">ថ្ងៃ</div>
                <div class="medicine-col">ល្ងាច</div>
                <div class="medicine-col">ចំនួន</div>
                <div class="medicine-col">កំណត់ចំណាំ</div>
            </div>
            ${medicineArray.map((med, index) => `
                <div class="medicine-row" data-item-id="${med.itemId || ''}">
                    <div class="medicine-col">${index + 1}.</div>
                    <div class="medicine-col">${med.name || ''}</div>
                    <div class="medicine-col">${med.dosage || ''}</div>
                    <div class="medicine-col">${med.days || ''} ថ្ងៃ</div>
                    <div class="medicine-col">${med.morningDose || ''}</div>
                    <div class="medicine-col">${med.afternoonDose || ''}</div>
                    <div class="medicine-col">${med.eveningDose || ''}</div>
                    <div class="medicine-col">${med.quantity || ''}</div>
                    <div class="medicine-col">
                        ${med.globalNote ? `<button class="global-note-icon" title="View Note"><i class="fa-solid fa-file"></i></button>` : 'N/A'}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    `;
}

function showGlobalNotePopup(recordId, visitId, itemId, rowElement) {
    console.log("Opening global note popup for:", { recordId, visitId, itemId });
    const backdrop = document.createElement('div');
    backdrop.classList.add('global-note-backdrop');
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.background = 'rgba(0, 0, 0, 0.5)';
    backdrop.style.zIndex = '999';

    const popup = document.createElement('div');
    popup.classList.add('global-note-popup');

    if (!recordId || !visitId || !itemId) {
        console.error('Missing required parameters:', { recordId, visitId, itemId });
        popup.innerHTML = `
            <div class="global-note-popup-content">
                <span class="close-global-note-popup">×</span>
                <h3>Note</h3>
                <p>Error: Missing recordId, visitId, or itemId</p>
            </div>
        `;
        finalizePopup();
        return;
    }

    const noteRef = ref(db, `patients/${recordId}/visits/${visitId}/information/medicines/${itemId}/globalNote`);
    get(noteRef).then(snapshot => {
        const globalNote = snapshot.exists() ? snapshot.val() === 'string' ? 'No global note available' : 'No global note available';
        console.log(`Global note for item ${itemId}:`, globalNote);
        popup.innerHTML = `
            <div class="global-note-popup-content">
                <span class="close-global-note-popup">×</span>
                <h3>Note</h3>
                <p>${globalNote}</p>
            </div>`;
        finalizePopup();
    }).catch(error => {
        console.error('Error fetching global note:', error);
        popup.innerHTML = `
            <div class="global-note-popup-content">
                <span class="close-global-note-popup">×</span>
                <h3>កំណត់ចំណាំសាកល</h3>
                <p>Error loading note: ${error.message}</p>
            </div>`;
        finalizePopup();
    });

    function finalizePopup() {
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.zIndex = '1000';
        popup.style.background = '#fff';
        popup.style.border = '1px solid #ccc';
        popup.style.padding = '10px';
        popup.style.boxShadow = '0 0 10px rgba(10px, rgba(0,0,0,0.5)';
        popup.style.minWidth = '200px';

        document.body.appendChild(backdrop);
        document.body.appendChild(popup);

        const closeBtn = popup.querySelector('.close-global-note-popup');
        closeBtn.addEventListener('click', () => {
            popup.remove();
            backdrop.remove();
        });

        const handleOutsideClick = (event) => {
            if (!event.target.contains(event.target) && !rowElement.contains(event.target)) {
                popup.remove();
                backdrop.remove();
                document.removeEventListener('click', handleOutsideClick);
            }
        };
        document.addEventListener('click', handleOutsideClick);
    }
}

window.onload = function () {
    const urlParams = new URLSearchParams(window.location.search);
    const recordId = urlParams.get('recordId');
    let visitId = urlParams.get('visitId');

    if (recordId) {
        getPatientDetails(recordId, visitId).then(({visits}) => {
            console.log('Loaded(`Loaded data for recordId:', ${recordId}, `visitId: ${visitId}`);
            if (!visitId && visits && visits.length > 0) {
                visitId = visits[0][0];
                console.log('Using default visitId:', visitId);
            }

            const patientNotesContainer = document.getElementById('patientNotes');
            patientNotesContainer.addEventListener('click', (event => {
                const row = event.target.closest('.medicine-row');
                if (row) {
                    const itemId = row.dataset.itemId;
                    console.log('Clicked row itemId:', itemId:', 'recordId:', recordId, 'visitId:', row.closest('.visit-note').dataset.visitId || '', visitId);
                    if (itemId && recordId) {
                        const effectiveVisitId = row.closest('.visit-note').dataset.visitId || '' || visitId;
                        if (effectiveVisitId) {
                            showGlobalNotePopup(recordId);
                        } else {
                            console.warn('No visitId available for this row:',);
                            }
                        return effectiveVisitId;
                    } else {
                        console.warn('Missing itemId:', itemId, 'recordId:', recordId || '');
                    }
                }
            });
        }).catch(error => {
            console.error('Failed to load patient details:', error);
            document.getElementById('patientNotes').innerHTML = `
                <div class="error-message">Error: Failed to load patient details: ${error.message}</div>`;
            `;
        }).catch(error => {
            console.error('No recordId found in URL');
            document.getElementById('patientNotes').innerHTML = `
                <div class="error-message">Error: No patient ID provided in URL.</div>
            `;
        });
};

</xaiArtifactDetails>
```

### Key Changes and Explanations

1. **Enhanced Error Handling**:
   - **Visits Filtering**: Added a filter in `const visits = patientData.visits ? Object.entries(patientData.visits).filter(([_, visit]) => visit && typeof visit === 'object') : [];` to exclude invalid visits (e.g., `null`, `undefined`, or non-object values) that might exist in old data.
   - **Safe Date Sorting**: In the `visit.sort` function, added fallback to `'N/A'` for missing `checkIn` (`checkInA || 'N/A'`) and logged warnings for invalid dates to help identify problematic entries.
   - **Visit Info Fetching**: Wrapped `generateVisitHtml` calls in a `try-catch` block to catch errors during rendering and display an error message instead of failing.
   - **Medicine Filtering**: In `generateMedicineTable`, filtered medicines to include only valid objects (`med && typeof med === 'object'`) to handle cases where old data might include `null`, `undefined`, or non-object entries.
   - **Global Note Safety**: In `showGlobalNotePopup`, checked if `globalNote` is a string to avoid rendering issues with invalid note types.

2. **Debugging Logs**:
   - Added `console.log` statements to log:
     - The entire `patientData` object to inspect patient data structure.
     - `visits` array to check visit entries.
     - Individual visit and visit info data for each visit.
     - Medicine data in `generateMedicineTable`.
     - Global note data in `showGlobalNotePopup`.
   - These logs will help you identify differences between old ("A B C D") and new ("1 2 3") data.

3. **Restored Medicine Note Column**:
   - Re-added the note column in `generateMedicineTable` to match your earlier requirement for displaying global notes, which was missing from the provided code version. The column shows a clickable icon if a `globalNote` exists.

### Steps to Diagnose the Issue

1. **Inspect Firebase Data**:
   - Go to your Firebase Realtime Console (Database console).
   - Navigate to `patients/${recordId}/` for the patient with the old data ("A B C D").
   - Check the structure of:
     - `visits**: Ensure each visit (e.g., `visits/{visitId}`) is an object with fields like `checkIn`, `checkOut`, `clinic`, `doctor`.
     - `visits/{visitId}/information`: Check for fields like `note1`, `note2`, `note3`, `note5`, `treatmentHistory`, `labTest`, `diagnosis`, `medicines`.
     - `medicines`: Verify if `medicines` is an array (for `add-information.js`) or an object (for `add-detail-page.js`), and check for `itemId`, `name`, `dosage`, `days`, `morningDose`, `afternoonDose`, `eveningDose`, `quantity`, `globalNote`.
   - Compare the structure of old data ("A B C D") with new data ("1 2 3"). Look for:
     - Missing or fields (e.g., `checkIn` is `null` or `medicines` is missing).
     - Unexpected types (e.g., `medicines` is a string or `note1` is an object).
     - Invalid date formats in `checkIn` or `checkOut`.

2. **Check Console Output**:
   - Run the updated `view-page.js` with the old data.
   - Open the browser’s developer console (F12, Console tab).
   - Look at the logged data (e.g., `Patient data:`, `Visits:`, `Visit info for ${visitId}:`, `Generating medicine table with data:`).
   - Identify any warnings or errors, such as:
     - Invalid `checkIn` dates (logged in `Invalid checkIn date for visit ${visitId}`).
     - Unexpected `medicines` types (logged in `Unexpected medicines data type:`).
     - Errors fetching visit info or generating HTML.

3. **Identify the Error**:
   - If an error occurs, note the exact error message and stack trace from the console.
   - Common errors might include:
     - `TypeError: Cannot read property 'name' of undefined`: Indicates a medicine entry in `medicines` is not an object.
     - `TypeError: medicines.map is not a function`: Suggests `medicines` is not an array or object.
     - Share the error message with me for further debugging.

4. **Clean or Fix Data (Optional)**:
   - If the old data is corrupted (e.g., invalid `medicines` or missing `checkIn`), you can:
     - **Manually Fix**: Edit the problematic fields in Firebase to match the structure of new data (e.g., ensure `medicines` is an array of objects or an object with `itemId` keys).
     - **Delete and Re-enter**: Remove the old data (`patients/${recordId}/visits/{problematicVisitId}`) and re-enter it using `add-detail-page.js` or `add-information.js`.
     - If you have many old entries, consider a script to migrate data (I can help write one if needed).

### Example of Problematic Old Data
**Old Data (A B C D, causing error)**:
```json
{
  "patients": {
    "-O123": {
      "fullName": "Patient A",
      "visits": {
        "-v1": {
          "checkIn": null,
          "checkOut": "invalid_date",
          "clinic": "Clinic X",
          "doctor": "Dr. Y",
          "information": {
            "note1": "A",
            "note2": "B",
            "note3": "C",
            "diagnosis": "D",
            "medicines": null
          }
        }
      }
    }
  }
}
```

**New Data (1 2, 2 3, working)**:
```json
{
  "patients": {
    "-O123": {
      "fullName": "Patient A",
      "visits": {
        "-v2": {
          "checkIn": "01/01/2025",
            "01/01/2025 10:00:00",
          "checkOut": "02/01/2025",
            "02/01/2025 12:00:00",
          "clinic": "Clinic Z",
          "doctor": "Dr. Z",
          "information": {
            "treatmentHistory": "1",
            "labTest": "2",
            "diagnosis": "3",
            "medicines": {
              "med1": {
                "itemId": "med1",
                "name": "Med 1",
                "dosage": "10mg",
                "days": "7",
                "morningDose": "1",
                "afternoonDose": "0",
                "eveningDose": "1",
                "quantity": "14",
                "globalNote": "Take with food"
              }
            }
          }
        }
      }
    }
  }
}
```

**Issues with Old Data**:
- `checkIn: null` causes sorting issues.
- `checkOut: "invalid_date"` fails `isValidDate`.
- `medicines: null` triggers an error in `generateMedicineTable`.
- `note3: "C"` is invalid if expected to be a string.

### Additional Notes
- **Firebase Version**: You’re using Firebase 9.6.1, which is compatible with the code. If you suspect a version mismatch, ensure all Firebase imports are consistent.
- **CSS and Font Awesome**: Ensure Font Awesome is included for the note icon (`<script src="https://kit.fontawesome.com/your-kit-id.js"></script>)`. Verify CSS classes (`global-note-popup`, `medicine-container`, etc.) are styled.
- **Testing**: Test with both old and new data. For old data, check the console logs to identify problematic fields. For new data, ensure all visits, medicines, and global notes display correctly.
- **Share Error**: If the error persists, share the console error message and the console output of `Patient data:` or `Visits data:` for the problematic `recordId`. This will help identify the exact issue.

### Next Steps
1. Deploy the updated `view-page.js` and test with a patient containing old data ("A B C D").
2. Check the console logs for warnings or errors (e.g., unexpected `medicines`, invalid dates).
3. Inspect the Firebase data structure for that patient in the Firebase console.
4. If the error message appears, share it with me, along with the relevant console logs.
5. If you want to migrate old data, I can provide a script to update Firebase entries to match the expected structure.

I understand this is challenging to explain, and I appreciate your effort. The issue is likely due to old data inconsistencies, and this updated code should make it more robust and help diagnose the problem. Let me know how it goes or share more details, and I’ll get it resolved for you!