// 🔒 ออกจากระบบ
function logout() {
  localStorage.clear();
  window.location.href = "/login/index.html";
}

// 🔄 แสดง Section ที่เลือกจาก Sidebar
function showSection(section) {
  const sections = ["pending", "due", "students", "approved", "rejected"];
  sections.forEach(id => {
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.style.display = id === section ? "block" : "none";
    }
  });
}

// 🔍 ฟิลเตอร์ตาราง
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
  rows.forEach(row => row.style.display = "none");

  if (input === "") {
    rows.forEach(row => row.style.display = "");
    return;
  }

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
    if (show) row.style.display = "";
  });
}

// 📦 โหลดข้อมูลทั้งหมดเมื่อโหลดหน้า
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const pendingData = await fetch("/data/document_pending.json").then(res => res.json());
    const dueData = await fetch("/data/document_near_due.json").then(res => res.json());
    const studentData = await fetch("/data/student_data.json").then(res => res.json());
    const approvedData = await fetch("/data/document_approved.json").then(res => res.json());
    const rejectedData = await fetch("/data/document_rejected.json").then(res => res.json());


    const fillTable = (id, rows) => {
      const tbody = document.querySelector(`#table-${id} tbody`);
      tbody.innerHTML = "";
      rows.forEach(row => tbody.appendChild(row));
    };

    // ✅ Pending
    const rowsPending = pendingData.map(d => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.title}</td>
        <td>${d.student}</td>
        <td>${d.status}</td>
        <td>${d.type}</td>
        <td>${d.submitted_date}</td>
        <td><a href="${d.link}" target="_blank">🔗 เปิด</a></td>`;
      return tr;
    });
    fillTable("pending", rowsPending);
    document.getElementById("total-docs").textContent = `📄 ทั้งหมด: ${pendingData.length}`;
    document.getElementById("status-pending").textContent = `⏳ รอตรวจ: ${pendingData.filter(d => d.status === "รอตรวจ").length}`;
    document.getElementById("status-revised").textContent = `📝 แก้ไขแล้วส่งกลับ: ${pendingData.filter(d => d.status.includes("แก้ไข")).length}`;

    // ⏰ Due
    const rowsDue = dueData.map(d => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.title}</td>
        <td>${d.student}</td>
        <td>${d.status}</td>
        <td>${d.type}</td>
        <td>${d.days_left} วัน</td>
        <td><a href="${d.link}" target="_blank">🔗 เปิด</a></td>`;
      return tr;
    });
    fillTable("due", rowsDue);
    document.getElementById("due-total").textContent = `📄 ทั้งหมด: ${dueData.length}`;
    document.getElementById("due-3days").textContent = `⚠️ น้อยกว่า 3 วัน: ${dueData.filter(d => d.days_left <= 3).length}`;
    document.getElementById("due-7days").textContent = `⏳ น้อยกว่า 7 วัน: ${dueData.filter(d => d.days_left <= 7).length}`;

    // 👨‍🎓 Students
    const rowsStudents = studentData.map(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.name}</td>
        <td>${s.program}</td>
        <td>${s.degree}</td>
        <td>${s.department}</td>
        <td>${s.plan}</td>
        <td>${s.status}</td>`;
      return tr;
    });
    fillTable("students", rowsStudents);
    document.getElementById("students-total").textContent = `👥 ทั้งหมด: ${studentData.length}`;
    document.getElementById("students-master").textContent = `🎓 ป.โท: ${studentData.filter(s => s.degree === "ป.โท").length}`;
    document.getElementById("students-phd").textContent = `🎓 ป.เอก: ${studentData.filter(s => s.degree === "ป.เอก").length}`;
    document.getElementById("students-status-studying").textContent = `✅ เรียนอยู่: ${studentData.filter(s => s.status === "กำลังศึกษา").length}`;
    document.getElementById("students-status-drop").textContent = `⛔ ดรอป: ${studentData.filter(s => s.status === "ดรอปเรียน").length}`;
    document.getElementById("students-program").textContent = `📘 หลักสูตร: ${new Set(studentData.map(s => s.program)).size}`;
    document.getElementById("students-department").textContent = `🏫 ภาควิชา: ${new Set(studentData.map(s => s.department)).size}`;
    document.getElementById("students-plan").textContent = `🧾 แผน: ${new Set(studentData.map(s => s.plan)).size}`;

    // ✅ Approved
    const rowsApproved = approvedData.map(d => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.title}</td>
        <td>${d.student}</td>
        <td>${d.type}</td>
        <td>${d.submit_date}</td>
        <td><a href="${d.link}" target="_blank">🔗 เปิด</a></td>`;
      return tr;
    });
    fillTable("approved", rowsApproved);
    document.getElementById("approved-total").textContent = `📄 ทั้งหมด: ${approvedData.length}`;
    document.getElementById("approved-type-count").textContent = `📁 ประเภท: ${new Set(approvedData.map(d => d.type)).size}`;

    // ❌ Rejected
    const rowsRejected = rejectedData.map(d => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.title}</td>
        <td>${d.student}</td>
        <td>${d.rejected_date}</td>
        <td>${d.comment}</td>
        <td><a href="${d.link}" target="_blank">🔗 เปิด</a></td>`;
      return tr;
    });
    fillTable("rejected", rowsRejected);
    document.getElementById("rejected-total").textContent = `📄 ทั้งหมด: ${rejectedData.length}`;
    document.getElementById("rejected-form1").textContent = `📝 ฟอร์ม 1: ${rejectedData.filter(d => d.title.includes("ฟอร์ม 1")).length}`;
    document.getElementById("rejected-form2").textContent = `📝 ฟอร์ม 2: ${rejectedData.filter(d => d.title.includes("ฟอร์ม 2")).length}`;
    document.getElementById("rejected-form3").textContent = `📝 ฟอร์ม 3: ${rejectedData.filter(d => d.title.includes("ฟอร์ม 3")).length}`;
    document.getElementById("rejected-form4").textContent = `📝 ฟอร์ม 4: ${rejectedData.filter(d => d.title.includes("ฟอร์ม 4")).length}`;
    document.getElementById("rejected-form5").textContent = `📝 ฟอร์ม 5: ${rejectedData.filter(d => d.title.includes("ฟอร์ม 5")).length}`;

  } catch (err) {
    console.error("🚨 โหลด mock data ไม่สำเร็จ:", err);
  }
});
