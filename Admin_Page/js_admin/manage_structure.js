function logout() {
  localStorage.clear();
  window.location.href = "/login/index.html";
}

// 🔁 เปลี่ยน Tab ตามหมวด
function showTab(tab) {
    document.querySelectorAll('.structure-section').forEach(sec => {
      sec.style.display = 'none';
    });
    document.getElementById(`tab-${tab}`).style.display = 'block';
  }
  
  // 🔧 แสดง modal สำหรับเพิ่ม/แก้ไขข้อมูล
  function openEditModal(type, data = null) {
    const modal = document.getElementById("editModal");
    modal.querySelector("#modal-title").textContent = data ? `แก้ไข${type}` : `เพิ่ม${type}`;
    modal.querySelector("#edit-type").value = type;
    modal.querySelector("#edit-id").value = data?.id || "";
    modal.querySelector("#edit-name").value = data?.name || "";
    modal.style.display = "block";
  }
  
  function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
  }
  
  function saveEdit() {
    const type = document.getElementById("edit-type").value;
    const id = document.getElementById("edit-id").value;
    const name = document.getElementById("edit-name").value;
    const adminId = "admin001";
    const today = new Date().toISOString().split("T")[0];
  
    const keyMap = {
      "ภาควิชา": "departments",
      "หลักสูตร": "programs",
      "แผนการเรียน": "plans"
    };
    const key = keyMap[type];
    const list = JSON.parse(localStorage.getItem(key)) || [];
  
    if (id) {
      const index = list.findIndex(item => item.id === id);
      if (index !== -1) {
        list[index].name = name;
        list[index].date = today;
      }
    } else {
      const newItem = {
        id: "id" + Date.now(),
        name,
        date: today,
        admin: adminId
      };
      list.push(newItem);
    }
    localStorage.setItem(key, JSON.stringify(list));
    closeEditModal();
    loadTables();
  }
  
  function deleteItem(type, id) {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?")) return;
    const keyMap = {
      "ภาควิชา": "departments",
      "หลักสูตร": "programs",
      "แผนการเรียน": "plans"
    };
    const key = keyMap[type];
    const list = JSON.parse(localStorage.getItem(key)) || [];
    const newList = list.filter(item => item.id !== id);
    localStorage.setItem(key, JSON.stringify(newList));
    loadTables();
  }
  
  function loadTables() {
    const keyMap = {
      departments: { tbodyId: "department-table", type: "ภาควิชา" },
      programs: { tbodyId: "program-table", type: "หลักสูตร" },
      plans: { tbodyId: "plan-table", type: "แผนการเรียน" }
    };
  
    for (const [key, info] of Object.entries(keyMap)) {
      const data = JSON.parse(localStorage.getItem(key)) || [];
      const tbody = document.getElementById(info.tbodyId);
      tbody.innerHTML = "";
  
      data.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${item.name}</td>
          <td>${item.date}</td>
          <td>${item.admin}</td>
          <td>
            <button class='edit-btn' onclick='openEditModal("${info.type}", ${JSON.stringify(item)})'>✏️</button>
            <button class='delete-btn' onclick='deleteItem("${info.type}", "${item.id}")'>🗑️</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".add-button").forEach(btn => {
      btn.addEventListener("click", () => {
        const type = btn.getAttribute("data-type");
        openEditModal(type);
      });
    });
  
    loadTables();

    // ✅ ฟังก์ชันกรองตารางข้อมูลในแต่ละหมวด
function setupFilter(sectionId) {
    const input = document.querySelector(`#filter-${sectionId}`);
    const select = document.querySelector(`#degree-filter-${sectionId}`);
    const table = document.querySelector(`#table-${sectionId}`);
    if (!table) return;
  
    function filterRows() {
      const keyword = input ? input.value.trim().toLowerCase() : "";
      const degree = select ? select.value : "all";
      const rows = table.querySelectorAll("tbody tr");
  
      rows.forEach(row => {
        const textCells = Array.from(row.cells).map(cell => cell.textContent.toLowerCase());
        const matchKeyword = keyword === "" || textCells.some(text => text.includes(keyword));
        const matchDegree = degree === "all" || row.dataset.degree === degree;
        row.style.display = matchKeyword && matchDegree ? "" : "none";
      });
    }
  
    if (input) input.addEventListener("input", filterRows);
    if (select) select.addEventListener("change", filterRows);
  }
  
  // ✅ เรียกใช้งานฟังก์ชันกรองสำหรับแต่ละ section
  ['department', 'program', 'plan'].forEach(id => setupFilter(id));
  
  });
  