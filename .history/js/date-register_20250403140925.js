import { database, ref, onValue, update, get, remove } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get("id");

    if (!customerId) {
        console.error("❌ No customer ID found in URL.");
        return;
    }

    // Fetch customer info
    const customerRef = ref(database, `customers/${customerId}`);
    get(customerRef).then((snapshot) => {
        if (snapshot.exists()) {
            const customer = snapshot.val();
            document.getElementById("customer-name").textContent = customer.name;
            document.getElementById("customer-age").textContent = customer.age;
            document.getElementById("customer-sex").textContent = customer.sex;
            document.getElementById("customer-phone").textContent = customer.phone;
        }
    });

    // Check-In Table
    const checkinTableBody = document.getElementById("checkin-table-body");
    const checkinRecordsRef = ref(database, `customers/${customerId}/checkinRecords`);

    // Load existing check-in records
    onValue(checkinRecordsRef, (snapshot) => {
        if (snapshot.exists()) {
            const records = snapshot.val();
            checkinTableBody.innerHTML = "";
            
            Object.entries(records).forEach(([key, record], index) => {
                const checkInDate = new Date(record.checkInDate).toLocaleString();
                const checkOutDate = record.checkOutDate ? new Date(record.checkOutDate).toLocaleString() : "--";

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${checkInDate}</td>
                    <td>${checkOutDate}</td>
                    <td>${record.hospital || "--"}</td>
                    <td>${record.consultedBy || "--"}</td>
                    <td>
                        ${!record.checkOutDate ? 
                            `<button class="check-out-record" data-id="${key}">Check-Out</button>` : 
                            '<span class="completed-badge">✔ Completed</span>'}
                        <button class="delete-record" data-id="${key}">🗑 Delete</button>
                    </td>
                `;
                checkinTableBody.appendChild(row);
            });
        } else {
            checkinTableBody.innerHTML = "<tr><td colspan='6'>មិនមានទិន្នន័យ</td></tr>";
        }
    });

    // Check-In Button
    document.getElementById("check-in-btn").addEventListener("click", async () => {
        const now = new Date();
        const newRecord = {
            checkInDate: now.toISOString(),
            hospital: "hospital",
            consultedBy: "Doctor"
        };

        const snapshot = await get(checkinRecordsRef);
        let records = snapshot.exists() ? snapshot.val() : {};
        const newRecordId = `record_${Date.now()}`;
        records[newRecordId] = newRecord;

        await update(ref(database, `customers/${customerId}`), { checkinRecords: records });
        alert("✅ Checked in successfully!");
    });

    // Check-Out Button (for specific records)
    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("check-out-record")) {
            const recordId = e.target.getAttribute("data-id");
            const now = new Date();

            const snapshot = await get(checkinRecordsRef);
            if (snapshot.exists()) {
                let records = snapshot.val();
                if (records[recordId]) {
                    records[recordId].checkOutDate = now.toISOString();
                    await update(ref(database, `customers/${customerId}`), { checkinRecords: records });
                    alert("✅ Checked out successfully!");
                }
            }
        }

        // Delete Record
        if (e.target.classList.contains("delete-record")) {
            if (!confirm("Are you sure?")) return;

            const recordId = e.target.getAttribute("data-id");
            await remove(ref(database, `customers/${customerId}/checkinRecords/${recordId}`));
            alert("✅ Record deleted successfully!");
        }
    });
});
