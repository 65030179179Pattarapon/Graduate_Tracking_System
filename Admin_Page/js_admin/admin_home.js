function logout() {
  localStorage.clear();
  window.location.href = "/login/index.html";
}

function showSection(section) {
  const sections = ["pending", "due", "students", "approved", "rejected"];
  sections.forEach(id => {
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.style.display = id === section ? "block" : "none";
    }
  });
}

// ✅ ฟังก์ชันกรองด้วย input + select
function filterTable(section) {
  const input = document.getElementById(`filter-${section}`).value.trim().toLowerCase();
  const categorySelect = document.getElementById(`filter-category-${section}`);
  const category = categorySelect ? categorySelect.value : "all";
  const table = document.getElementById(`table-${section}`);
  const rows = Array.from(table.querySelector("tbody").rows);

  const colMap = {
    pending: { title: 0, student: 1, status: 2, type: 3, date: 4 },
    due: { title: 0, student: 1, status: 2, type: 3, days: 4 },
    students: { name: 0, program: 1, degree: 2, department: 3, plan: 4, status: 5 },
    approved: { title: 0, student: 1, type: 2, date: 3 },
    rejected: { title: 0, student: 1, date: 2, comment: 3 }
  };

  const validCol = colMap[section];

  rows.forEach(row => {
    const cells = row.cells;
    let show = false;
    if (category === "all") {
      show = Array.from(cells).some(cell => cell.textContent.toLowerCase().includes(input));
    } else if (validCol[category] !== undefined) {
      const index = validCol[category];
      const value = cells[index]?.textContent.toLowerCase();
      show = value.includes(input);
    }
    row.style.display = show ? "" : "none";
  });
}

// ✅ ฟังก์ชันกรองจากการคลิก "⏳ รอตรวจ", "📝 ส่งกลับ"
function filterByStatus(status) {
  const rows = document.querySelectorAll("#table-pending tbody tr");
  rows.forEach(row => {
    const cell = row.cells[2]; // status column
    if (status === "all" || cell.textContent.trim() === status) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // 📄 เอกสารรอตรวจ
  const pendingData = await fetch('/data/document_pending.json').then(res => res.json());
  const tbodyPending = document.querySelector("#table-pending tbody");
  let pendingCount = 0, revisedCount = 0;

  pendingData.sort((a, b) => new Date(b.submitted_date) - new Date(a.submitted_date));

  pendingData.forEach(doc => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${doc.title}</td>
      <td>${doc.student}</td>
      <td>${doc.status}</td>
      <td>${doc.type}</td>
      <td>${doc.submitted_date}</td>
      <td><a href="${doc.link}" target="_blank">🔗 เปิด</a></td>
    `;
    tbodyPending.appendChild(tr);

    if (doc.status === "รอตรวจ") pendingCount++;
    else if (doc.status === "แก้ไขแล้วส่งกลับ") revisedCount++;
  });

  document.getElementById("total-docs").textContent = `📄 ทั้งหมด: ${pendingData.length}`;
  document.getElementById("status-pending").textContent = `⏳ รอตรวจ: ${pendingCount}`;
  document.getElementById("status-revised").textContent = `📝 แก้ไขแล้วส่งกลับ: ${revisedCount}`;

  // ⏰ เอกสารใกล้กำหนด
  const dueData = await fetch('/data/document_near_due.json').then(res => res.json());
  const tbodyDue = document.querySelector("#table-due tbody");
  let count3 = 0, count7 = 0;

  dueData.sort((a, b) => a.days_left - b.days_left);
  dueData.forEach(doc => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${doc.title}</td>
      <td>${doc.student}</td>
      <td>${doc.status}</td>
      <td>${doc.type}</td>
      <td>${doc.days_left} วัน</td>
      <td><a href="${doc.link}" target="_blank">🔗 เปิด</a></td>
    `;
    tbodyDue.appendChild(tr);

    if (doc.days_left <= 3) count3++;
    if (doc.days_left <= 7) count7++;
  });

  document.getElementById("due-total").textContent = `📄 ทั้งหมด: ${dueData.length}`;
  document.getElementById("due-3days").textContent = `⚠️ น้อยกว่า 3 วัน: ${count3}`;
  document.getElementById("due-7days").textContent = `⏳ น้อยกว่า 7 วัน: ${count7}`;

  // 👨‍🎓 นักศึกษา
  const studentData = await fetch('/data/student_data.json').then(res => res.json());
  const tbodyStudents = document.querySelector("#table-students tbody");
  let countMaster = 0, countPhd = 0, studying = 0, drop = 0;

  studentData.forEach(st => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${st.name}</td>
      <td>${st.program}</td>
      <td>${st.degree}</td>
      <td>${st.department}</td>
      <td>${st.plan}</td>
      <td>${st.status}</td>
    `;
    tbodyStudents.appendChild(tr);

    if (st.degree === "ป.โท") countMaster++;
    if (st.degree === "ป.เอก") countPhd++;
    if (st.status === "กำลังศึกษา") studying++;
    if (st.status === "ดรอปเรียน") drop++;
  });

  document.getElementById("students-total").textContent = `👥 ทั้งหมด: ${studentData.length}`;
  document.getElementById("students-master").textContent = `🎓 ป.โท: ${countMaster}`;
  document.getElementById("students-phd").textContent = `🎓 ป.เอก: ${countPhd}`;
  document.getElementById("students-status-studying").textContent = `✅ เรียนอยู่: ${studying}`;
  document.getElementById("students-status-drop").textContent = `⛔ ดรอป: ${drop}`;

  // ✅ เอกสารอนุมัติแล้ว
  const approvedData = await fetch('/data/document_approved.json').then(res => res.json());
  const tbodyApproved = document.querySelector("#table-approved tbody");
  const formCount = [0, 0, 0, 0, 0];

  approvedData.forEach(doc => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${doc.title}</td>
      <td>${doc.student}</td>
      <td>${doc.type}</td>
      <td>${doc.submitted_date}</td>
      <td><a href="${doc.link}" target="_blank">🔗 เปิด</a></td>
    `;
    tbodyApproved.appendChild(tr);

    const formNo = parseInt(doc.type.replace("ฟอร์ม ", ""));
    if (!isNaN(formNo)) formCount[formNo - 1]++;
  });

  document.querySelector("#section-approved .stats span:nth-child(1)").textContent = `📄 ทั้งหมด: ${approvedData.length}`;
  formCount.forEach((count, i) => {
    document.querySelector(`#section-approved #approved-form${i + 1}`).textContent = `📝 ฟอร์ม ${i + 1}: ${count}`;
  });

  // ❌ เอกสารไม่อนุมัติ
  const rejectedData = await fetch('/data/document_rejected.json').then(res => res.json());
  const tbodyRejected = document.querySelector("#table-rejected tbody");
  const rejectFormCount = [0, 0, 0, 0, 0];

  rejectedData.forEach(doc => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${doc.title}</td>
      <td>${doc.student}</td>
      <td>${doc.rejected_date}</td>
      <td>${doc.comment}</td>
      <td><a href="${doc.link}" target="_blank">🔗 เปิด</a></td>
    `;
    tbodyRejected.appendChild(tr);

    const formNo = parseInt(doc.type.replace("ฟอร์ม ", ""));
    if (!isNaN(formNo)) rejectFormCount[formNo - 1]++;
  });

  document.querySelector("#section-rejected .stats span:nth-child(1)").textContent = `📄 ทั้งหมด: ${rejectedData.length}`;
  rejectFormCount.forEach((count, i) => {
    document.querySelector(`#section-rejected #rejected-form${i + 1}`).textContent = `📝 ฟอร์ม ${i + 1}: ${count}`;
  });
});
