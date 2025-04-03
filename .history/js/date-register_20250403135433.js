import { database, ref, onValue, update, get, remove } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get("id");

    if (!customerId) {
        console.error("❌ No customer ID found in URL.");
        return;
    }

    // Load customer basic info
    const customerRef = ref(database, `customers/${customerId}`);
    get(customerRef).then((snapshot) => {
        if (snapshot.exists()) {
            const customer = snapshot.val();
            document.getElementById("customer-name").textContent = customer.name;
            document.getElementById("customer-age").textContent = customer.age;
            document.getElementById("customer-sex").textContent = customer.sex;
            document.getElementById("customer-email").textContent = customer.email;
            document.getElementById("customer-phone").textContent = customer.phone;
        }
    });

    // Load medicine usage data
    const dateDetailsRef = ref(database, `customers/${customerId}/productNotes/note6`);
    onValue(dateDetailsRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            console.log("📅 Note 6 Data:", data);

            const usageTableBody = document.getElementById("usage-table-body");
            usageTableBody.innerHTML = ""; // Clear previous content

            if (Array.isArray(data) && data.length > 0) {
                data.forEach(item => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${item.productType || "--"}</td>
                        <td>${item.howToUse || "--"}</td>
                        <td>${item.days || "--"}</td>
                        <td>${item.morning || "--"}</td>
                        <td>${item.day || "--"}</td>
                        <td>${item.night || "--"}</td>
                        <td>${item.quantity || "--"}</td>
                    `;
                    usageTableBody.appendChild(row);
                });
            } else {
                const emptyRow = document.createElement("tr");
                emptyRow.innerHTML = `<td colspan="7">មិនមានទិន្នន័យ</td>`;
                usageTableBody.appendChild(emptyRow);
            }
        } else {
            console.warn("⚠️ No note6 data found.");
            document.getElementById("usage-table-body").innerHTML = "<tr><td colspan='7'>មិនមានទិន្នន័យ</td></tr>";
        }
    }, (error) => {
        console.error("❌ Firebase error:", error);
    });

    // Check-In/Check-Out functionality
    const checkInBtn = document.getElementById("check-in-btn");
    const checkOutBtn = document.getElementById("check-out-btn");
    const checkinTableContainer = document.querySelector(".checkin-table-container");
    const checkinTableBody = document.getElementById("checkin-table-body");

    // Helper function to format date and time
    function formatDateTime(dateString) {
        if (!dateString || dateString === "--") return { date: "--", time: "" };
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                // If already formatted date without time
                return {
                    date: dateString,
                    time: ""
                };
            }
            return {
                date: date.toLocaleDateString('en-GB'),
                time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            };
        } catch (e) {
            console.error("Error formatting date:", e);
            return {
                date: dateString,
                time: ""
            };
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
                    <td>${record.consultedBy || "--"}</td>
                    <td class="action-buttons">
                        ${!record.checkOutDate ? 
                            `<button class="check-out-record" data-record-id="${key}">Check-Out</button>` : 
                            '<span class="completed-badge">Completed</span>'}
                        <button class="delete-record" data-record-id="${key}">🗑️ Delete</button>
                    </td>
                `;
                checkinTableBody.appendChild(row);
            });
            
            // Show the table if there are records
            checkinTableContainer.style.display = "block";
        } else {
            checkinTableBody.innerHTML = "<tr><td colspan='6'>មិនមានកំណត់ត្រាចូល</td></tr>";
            checkinTableContainer.style.display = "none";
        }
    });

    // Check-In button click handler
    checkInBtn.addEventListener("click", async () => {
        const now = new Date();
        const newRecord = {
            checkInDate: now.toISOString(), // Store full datetime
            hospital: "hospital",
            consultedBy: "Doctor"
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
        
        alert("✅ Checked in successfully!");
    });

    // Check-Out button click handler (for individual records)
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
                    
                    alert("✅ Checked out successfully!");
                }
            }
        }
        
        // Delete record button handler
        if (e.target.classList.contains("delete-record")) {
            if (!confirm("Are you sure you want to delete this record?")) {
                return;
            }
            
            const recordId = e.target.getAttribute("data-record-id");
            const recordRef = ref(database, `customers/${customerId}/checkinRecords/${recordId}`);
            
            try {
                await remove(recordRef);
                alert("✅ Record deleted successfully!");
            } catch (error) {
                console.error("Error deleting record:", error);
                alert("❌ Failed to delete record");
            }
        }
    });

    // Global Check-Out button (alternative approach)
    checkOutBtn.addEventListener("click", async () => {
        // Get current records
        const snapshot = await get(checkinRecordsRef);
        if (snapshot.exists()) {
            const records = snapshot.val();
            const now = new Date();
            
            // Find the most recent record without check-out date
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
                
                // Update Firebase
                await update(ref(database, `customers/${customerId}`), {
                    checkinRecords: {
                        ...records,
                        [recordId]: recordToUpdate
                    }
                });
                
                alert("✅ Checked out successfully!");
            } else {
                alert("⚠️ No active check-in record found to check out.");
            }
        } else {
            alert("⚠️ No check-in records found.");
        }
    });
});