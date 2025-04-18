import { database, ref, onValue, update, get, remove } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get("id");

    if (!customerId) {
        console.error("❌ No customer ID found in URL.");
        return;
    }

    // Load customer basic info
// Function to fetch patient data and populate the details
async function getPatientDetails(recordId) {
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();
            
            // Populate the details
            document.getElementById('patientFullName').textContent = patientData.fullName;
            document.getElementById('patientAge').textContent = patientData.age;
            document.getElementById('patientGender').textContent = patientData.gender;
            document.getElementById('patientPhone').textContent = patientData.phone;
            document.getElementById('patientEmail').textContent = patientData.email || 'N/A';
            document.getElementById('patientName').textContent = patientData.fullName;

            // Pre-fill existing notes (if any)
            document.getElementById('patientNote1').value = patientData.notes?.note1 || '';
            document.getElementById('patientNote2').value = patientData.notes?.note2 || '';
            document.getElementById('patientNote3').value = patientData.notes?.note3 || '';
            document.getElementById('patientNote4').value = patientData.notes?.note4 || '';
            document.getElementById('patientNote5').value = patientData.notes?.note5 || '';

            // Populate medicines if they exist
            if (patientData.notes?.medicines) {
                const ul = document.getElementById('medicineList');
                patientData.notes.medicines.forEach(med => {
                    addMedicineItem();
                    const lastItem = ul.lastChild;
                    const medicineInput = lastItem.querySelector('.medicine-input');
                    medicineInput.value = med.name;
                    lastItem.querySelector('.dosage-select').value = med.dosage;
                    lastItem.querySelector('.time-input').value = med.days || '';
                    lastItem.querySelectorAll('.dosage-select')[1].value = med.morningDose || '';
                    lastItem.querySelectorAll('.dosage-select')[2].value = med.afternoonDose || '';
                    lastItem.querySelectorAll('.dosage-select')[3].value = med.eveningDose || '';
                    
                    // Trigger calculation for existing items
                    calculateMedicationQuantity(lastItem);
                });
            }
        } else {
            console.log('No data available for this patient.');
        }
    } catch (error) {
        console.error('Error fetching patient details:', error);
    }
}
    // Create check-in table structure
    const checkinTableContainer = document.querySelector(".checkin-table-container");
    checkinTableContainer.innerHTML = `
        <h3>កំណត់ត្រាចូល</h3>
        <table id="checkin-table">
            <thead>
                <tr>
                    <th>លេខរៀង</th>
                    <th>ថ្ងៃចូលមន្ទីពេទ្យ</th>
                    <th>ថ្ងៃចេញពីមន្ទីពេទ្យ</th>
                    <th>មន្ទីពេទ្យ</th>
                    <th>ពិគ្រោះដោយ</th>
                    <th>សកម្មភាព</th>
                </tr>
            </thead>
            <tbody id="checkin-table-body"></tbody>
        </table>
    `;

    const checkinTableBody = document.getElementById("checkin-table-body");

    // Helper function to format date and time
    function formatDateTime(dateString) {
        if (!dateString) return { date: "--", time: "" };
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return { date: dateString, time: "" };
            }
            return {
                date: date.toLocaleDateString('km-KH'),
                time: date.toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })
            };
        } catch (e) {
            console.error("Error formatting date:", e);
            return { date: dateString, time: "" };
        }
    }

    // Load existing check-in records
    const checkinRecordsRef = ref(database, `customers/${customerId}/checkinRecords`);
    onValue(checkinRecordsRef, (snapshot) => {
        if (snapshot.exists()) {
            const records = snapshot.val();
            checkinTableBody.innerHTML = "";
            
            Object.entries(records).forEach(([key, record], index) => {
                const checkInDateTime = formatDateTime(record.checkInDate);
                const checkOutDateTime = formatDateTime(record.checkOutDate);
                
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>
                        ${checkInDateTime.date}<br>
                        <small>${checkInDateTime.time}</small>
                    </td>
                    <td>
                        ${checkOutDateTime.date}<br>
                        <small>${checkOutDateTime.time}</small>
                    </td>
                    <td>${record.hospital || "--"}</td>
                    <td>${record.consultedBy || "Dr. Minh Hong"}</td>
                    <td class="action-buttons">
                        ${!record.checkOutDate ? 
                            `<button class="check-out-record" data-record-id="${key}">Check-Out</button>` : 
                            '<span class="completed-badge">Completed</span>'}
                        <button class="delete-record" data-record-id="${key}">🗑️ Delete</button>
                    </td>
                `;
                checkinTableBody.appendChild(row);
            });
        } else {
            checkinTableBody.innerHTML = "<tr><td colspan='6'>មិនមានកំណត់ត្រាចូល</td></tr>";
        }
    });

    // Check-In button click handler
    document.getElementById("check-in-btn").addEventListener("click", async () => {
        const now = new Date();
        const newRecord = {
            checkInDate: now.toISOString(),
            hospital: "វែលគ្លីនិក I", // Default clinic
            consultedBy: "Dr. Minh Hong"
        };
        
        // Get current records
        const snapshot = await get(checkinRecordsRef);
        let records = {};
        if (snapshot.exists()) {
            records = snapshot.val();
        }
        
        // Add new record
        const newRecordId = `record_${Date.now()}`;
        records[newRecordId] = newRecord;
        
        // Update Firebase
        await update(ref(database, `customers/${customerId}`), {
            checkinRecords: records
        });
        
        alert("✅ បានចុះឈ្មោះចូលដោយជោគជ័យ!");
    });

    // Handle Check-Out and Delete buttons
    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("check-out-record")) {
            const recordId = e.target.getAttribute("data-record-id");
            const now = new Date();
            
            // Get current records
            const snapshot = await get(checkinRecordsRef);
            if (snapshot.exists()) {
                const records = snapshot.val();
                
                // Update the specific record
                if (records[recordId]) {
                    records[recordId].checkOutDate = now.toISOString();
                    
                    // Update Firebase
                    await update(ref(database, `customers/${customerId}`), {
                        checkinRecords: records
                    });
                    
                    alert("✅ បានចុះឈ្មោះចេញដោយជោគជ័យ!");
                }
            }
        }
        
        if (e.target.classList.contains("delete-record")) {
            if (!confirm("តើអ្នកពិតជាចង់លុបកំណត់ត្រានេះមែនទេ?")) {
                return;
            }
            
            const recordId = e.target.getAttribute("data-record-id");
            const recordRef = ref(database, `customers/${customerId}/checkinRecords/${recordId}`);
            
            try {
                await remove(recordRef);
                alert("✅ បានលុបកំណត់ត្រាដោយជោគជ័យ!");
            } catch (error) {
                console.error("Error deleting record:", error);
                alert("❌ មានបញ្ហាក្នុងការលុបកំណត់ត្រា");
            }
        }
    });

    // Go Back button
    document.getElementById("go-back").addEventListener("click", () => {
        window.history.back();
    });
});