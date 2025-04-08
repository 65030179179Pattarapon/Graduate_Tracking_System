// 📌 Initialization on DOM ready
document.addEventListener("DOMContentLoaded", function () {
  loadAdvisors();
  setupEventHandlers();
  console.log("Student Detail Page Ready");
});

function loadAdvisors() {
  fetch('/data/advisor.json')
    .then(res => res.json())
    .then(data => {
      const selects = document.querySelectorAll(".advisor-select");
      selects.forEach(select => {
        // Clear old options
        while (select.options.length > 1) {
          select.remove(1);
        }

        // Add new options
        data.forEach(advisor => {
          const opt = document.createElement("option");
          opt.value = advisor.id;
          opt.textContent = advisor.name;
          select.appendChild(opt);
        });
      });
    })
    .catch(err => console.error("Error loading advisor data", err));
}

function addAdvisorRow() {
  const table = document.getElementById("advisor-container");
  const index = table.querySelectorAll("tr").length;

  const tr = document.createElement("tr");
  tr.className = "advisor-row";
  tr.innerHTML = `
    <td>
      <select class="advisor-select">
        <option value="">-- เลือกอาจารย์ --</option>
      </select>
    </td>
    <td>
      <div class="radio-group">
        <label><input type="radio" name="advisor-role-${index}" value="main"> หลัก</label>
        <label><input type="radio" name="advisor-role-${index}" value="co"> ร่วม</label>
      </div>
    </td>
    <td><button class="delete-advisor-btn" onclick="removeAdvisorRow(this)">🗑️</button></td>
  `;

  table.appendChild(tr);
  loadAdvisors(); // รีโหลดรายการอาจารย์ใน select ใหม่
}

function removeAdvisorRow(button) {
  const confirmDelete = confirm("คุณแน่ใจหรือไม่ว่าต้องการลบอาจารย์ที่ปรึกษาคนนี้?");
  if (confirmDelete) {
    const row = button.closest("tr");
    row.remove();
  }
}

function addExaminerRow() {
  const tbody = document.getElementById("examiner-body");
  const rowCount = tbody.querySelectorAll("tr").length + 1;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${rowCount}</td>
    <td>
      <select class="examiner-select">
        <option value="">-- เลือกกรรมการ --</option>
        <option value="1">รศ.ดร. สมชาย ทดสอบ</option>
        <option value="2">ผศ.ดร. สมหญิง ตัวอย่าง</option>
        <option value="3">อ. ตัวแทน พิจารณา</option>
      </select>
    </td>
    <td><button class="delete-btn" onclick="removeExaminerRow(this)">🗑️</button></td>
  `;

  tbody.appendChild(tr);
}

function removeExaminerRow(button) {
  const confirmDelete = confirm("คุณแน่ใจหรือไม่ว่าต้องการลบกรรมการสอบคนนี้?");
  if (confirmDelete) {
    const row = button.closest("tr");
    row.remove();
  }
}

function addPublicationRow() {
  const tbody = document.getElementById("publication-body");

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" placeholder="ชื่อผลงาน"></td>
    <td><input type="text" placeholder="ลักษณะการตีพิมพ์เผยแพร่"></td>
    <td><input type="file" accept=".pdf,.doc,.docx" /></td>
    <td><button class="delete-btn" onclick="removePublicationRow(this)">🗑️</button></td>
  `;

  tbody.appendChild(tr);
}

function removePublicationRow(button) {
  const confirmDelete = confirm("คุณแน่ใจหรือไม่ว่าต้องการลบผลงานตีพิมพ์นี้?");
  if (confirmDelete) {
    const row = button.closest("tr");
    row.remove();
  }
}

function addAttachmentRow() {
  const tbody = document.getElementById("attachment-body");

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" placeholder="ชื่อเรื่อง"></td>
    <td><input type="file" accept=".pdf,.doc,.docx" /></td>
    <td><button class="delete-btn" onclick="removeAttachmentRow(this)">🗑️</button></td>
  `;

  tbody.appendChild(tr);
}

function removeAttachmentRow(button) {
  const confirmDelete = confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเอกสารนี้?");
  if (confirmDelete) {
    const row = button.closest("tr");
    row.remove();
  }
}

function confirmSave() {
  const confirmSave = confirm("คุณต้องการบันทึกข้อมูลนี้หรือไม่?");
  if (confirmSave) {
    // TODO: ใส่โค้ดบันทึกข้อมูลจริง ๆ ตรงนี้ หรือเรียกฟังก์ชันอื่น
    alert("ระบบได้บันทึกข้อมูลเรียบร้อยแล้ว");
  }
}
