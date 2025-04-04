import { database, ref, get, update, remove } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get("id");

    if (!customerId) {
        console.error("❌ No customer ID found in URL.");
        alert("មិនមាន ID អតិថិជននៅក្នុង URL");
        return;
    }

    // ================== PATIENT INFO DISPLAY ==================
    const customerRef = ref(database, `patients/${customerId}`);
    get(customerRef).then((snapshot) => {
        if (snapshot.exists()) {
            const patientData = snapshot.val();
            
            // Create patient info card
            const patientInfoHTML = `
                <div class="patient-info-card">
                    <h3>ព័ត៌មានអ្នកជំងឺ</h3>
                    <div class="patient-details">
                        <div class="detail-row">
                            <span class="detail-label">ឈ្មោះ:</span>
                            <span class="detail-value">${patientData.fullName || "--"}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">អាយុ:</span>
                            <span class="detail-value">${patientData.age || "--"}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">ភេទ:</span>
                            <span class="detail-value">${patientData.gender || "--"}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">ទូរស័ព្ទ:</span>
                            <span class="detail-value">${patientData.phone || "--"}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">អ៊ីមែល:</span>
                            <span class="detail-value">${patientData.email || "N/A"}</span>
                        </div>
                    </div>
                </div>
            `;
            
            document.querySelector(".container").insertAdjacentHTML('afterbegin', patientInfoHTML);
        }
    }).catch(error => {
        console.error("Error loading patient:", error);
    });

    // ================== CHECK-IN/CHECK-OUT SYSTEM ==================
    let currentCheckInId = null;
    const checkInBtn = document.getElementById('checkInBtn');
    const checkOutBtn = document.getElementById('checkOutBtn');
    const checkInTable = document.getElementById('checkInTable').getElementsByTagName('tbody')[0];

    // Format date/time in Khmer style
    function formatDateTime(dateString) {
        if (!dateString) return { date: "--", time: "" };
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return { date: dateString, time: "" };
            
            const options = { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            };
            
            const dateTimeParts = date.toLocaleString('km-KH', options).split(' ');
            return {
                date: dateTimeParts[0],
                time: dateTimeParts[1] + ' ' + (dateTimeParts[2] || '')
            };
        } catch (e) {
            console.error("Error formatting date:", e);
            return { date: dateString, time: "" };
        }
    }

    // Load existing check-in records
    const checkinRecordsRef = ref(database, `patients/${customerId}/checkinRecords`);
    onValue(checkinRecordsRef, (snapshot) => {
        checkInTable.innerHTML = ""; // Clear existing rows
        
        if (snapshot.exists()) {
            const records = snapshot.val();
            let rowCount = 1;
            
            // Convert to array and sort by check-in date (newest first)
            const sortedRecords = Object.entries(records)
                .map(([id, record]) => ({ id, ...record }))
                .sort((a, b) => new Date(b.checkInDate) - new Date(a.checkInDate));
            
            sortedRecords.forEach(record => {
                const checkIn = formatDateTime(record.checkInDate);
                const checkOut = formatDateTime(record.checkOutDate);
                
                const row = checkInTable.insertRow();
                row.innerHTML = `
                    <td>${rowCount}</td>
                    <td>
                        ${checkIn.date}<br>
                        <small>${checkIn.time}</small>
                    </td>
                    <td>
                        ${checkOut.date}<br>
                        <small>${checkOut.time}</small>
                    </td>
                    <td>${record.hospital || "វែលគ្លីនិក I"}</td>
                    <td>${record.consultedBy || "វេជ្ជបណ្ឌិត ម៉ិញ ហុង"}</td>
                    <td class="action-buttons">
                        ${!record.checkOutDate ? 
                            `<button class="btn check-out-record" data-record-id="${record.id}">ចេញ</button>` : 
                            '<span class="badge completed">បានចេញ</span>'}
                        <button class="btn delete-record" data-record-id="${record.id}">លុប</button>
                    </td>
                `;
                rowCount++;
            });
            
            // Enable check-out button if there's an active check-in
            const hasActiveCheckIn = sortedRecords.some(r => !r.checkOutDate);
            checkOutBtn.disabled = !hasActiveCheckIn;
        }
    });

    // Check-In button handler
    checkInBtn.addEventListener("click", async () => {
        try {
            const now = new Date();
            const newRecord = {
                checkInDate: now.toISOString(),
                hospital: "វែលគ្លីនិក I",
                consultedBy: "វេជ្ជបណ្ឌិត ម៉ិញ ហុង"
            };
            
            // Get current records
            const snapshot = await get(checkinRecordsRef);
            let records = snapshot.exists() ? snapshot.val() : {};
            
            // Add new record
            const newRecordId = `record_${Date.now()}`;
            records[newRecordId] = newRecord;
            
            // Update Firebase
            await update(ref(database, `patients/${customerId}`), {
                checkinRecords: records
            });
            
            alert("✅ បានចុះឈ្មោះចូលដោយជោគជ័យ!");
            checkOutBtn.disabled = false;
        } catch (error) {
            console.error("Check-in error:", error);
            alert("❌ មានបញ្ហាក្នុងការចុះឈ្មោះចូល");
        }
    });

    // Check-Out button handler
    checkOutBtn.addEventListener("click", async () => {
        try {
            // Get current records
            const snapshot = await get(checkinRecordsRef);
            if (snapshot.exists()) {
                const records = snapshot.val();
                const now = new Date();
                
                // Find the most recent record without check-out
                let recordToUpdate = null;
                let recordId = null;
                
                for (const [key, record] of Object.entries(records)) {
                    if (!record.checkOutDate) {
                        recordToUpdate = record;
                        recordId = key;
                        break;
                    }
                }
                
                if (recordToUpdate) {
                    recordToUpdate.checkOutDate = now.toISOString();
                    
                    await update(ref(database, `patients/${customerId}/checkinRecords/${recordId}`), recordToUpdate);
                    alert("✅ បានចុះឈ្មោះចេញដោយជោគជ័យ!");
                    checkOutBtn.disabled = true;
                } else {
                    alert("⚠️ មិនមានកំណត់ត្រាចូលដែលអាចចេញ");
                }
            }
        } catch (error) {
            console.error("Check-out error:", error);
            alert("❌ មានបញ្ហាក្នុងការចុះឈ្មោះចេញ");
        }
    });

    // Handle delete buttons
    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("delete-record")) {
            if (!confirm("តើអ្នកពិតជាចង់លុបកំណត់ត្រានេះមែនទេ?")) return;
            
            try {
                const recordId = e.target.getAttribute("data-record-id");
                await remove(ref(database, `patients/${customerId}/checkinRecords/${recordId}`));
                alert("✅ បានលុបកំណត់ត្រាដោយជោគជ័យ!");
            } catch (error) {
                console.error("Delete error:", error);
                alert("❌ មានបញ្ហាក្នុងការលុបកំណត់ត្រា");
            }
        }
    });
});