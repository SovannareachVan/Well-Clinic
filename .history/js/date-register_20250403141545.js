import { database, ref, onValue, update, get, remove } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get("id");

    if (!customerId) {
        console.error("❌ No customer ID found in URL.");
        return;
    }

    // Fetch customer info from Firebase (Receptionist Page)
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

    // Check-In List
    const checkinList = document.getElementById("checkin-list");
    const checkinRecordsRef = ref(database, `customers/${customerId}/checkinRecords`);

    // Load existing check-in records
    onValue(checkinRecordsRef, (snapshot) => {
        if (snapshot.exists()) {
            const records = snapshot.val();
            checkinList.innerHTML = `
                <li>លេខរៀង</li>
                <li>ថ្ងៃចូលមន្ទីពេទ្យ</li>
                <li>ថ្ងៃចេញពីមន្ទីពេទ្យ</li>
                <li>មន្ទីរពេទ្យ</li>
                <li>ពិគ្រោះដោយ</li>
                <li>សកម្មភាព</li>
            `;

            Object.entries(records).forEach(([key, record], index) => {
                const checkInDate = new Date(record.checkInDate).toLocaleString();
                const checkOutDate = record.checkOutDate ? new Date(record.checkOutDate).toLocaleString() : "--";
                const hospital = record.hospital || "N/A";
                const consultedBy = record.consultedBy || "N/A";

                const li = document.createElement("li");
                li.innerHTML = `
                    <span>${index + 1}.</span>
                    <span>${checkInDate}</span>
                    <span>${checkOutDate}</span>
                    <span>${hospital}</span>
                    <span>${consultedBy}</span>
                    <div>
                        ${!record.checkOutDate ? 
                            `<button class="check-out-record" data-id="${key}">Check-Out</button>` : 
                            '<span class="completed-badge">✔ Completed</span>'}
                        <button class="delete-record" data-id="${key}">🗑 Delete</button>
                    </div>
                `;
                checkinList.appendChild(li);
            });
        }
    });

    // Check-In Button
    document.getElementById("check-in-btn").addEventListener("click", async () => {
        const now = new Date();
        const newRecord = {
            checkInDate: now.toISOString(),
            hospital: "Hospital Name",
            consultedBy: "Doctor Name"
        };

        const snapshot = await get(checkinRecordsRef);
        let records = snapshot.exists() ? snapshot.val() : {};
        const newRecordId = `record_${Date.now()}`;
        records[newRecordId] = newRecord;

        await update(ref(database, `customers/${customerId}`), { checkinRecords: records });
        alert("✅ Checked in successfully!");
    });

    // Check-Out Button
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
