// public/Admin_Page/js_admin/manage_structure.js (อัปเดตให้แก้ไขและลบได้)

let currentModalData = { type: null, mode: 'create', id: null };
const token = localStorage.getItem('token');
let departmentsCache = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!token || localStorage.getItem('role') !== 'admin') {
        window.location.href = '/login/index.html';
        return;
    }
    loadAllData();
});

async function loadAllData() {
    await loadDepartments();
    await loadPrograms(); 
}

function showTab(tabName) {
    document.querySelectorAll('.structure-section').forEach(el => el.style.display = 'none');
    document.getElementById(tabName).style.display = 'block';

    document.querySelectorAll('.structure-tabs button').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelector(`.structure-tabs button[onclick="showTab('${tabName}')"]`).classList.add('active');
}

function openModal(type, mode = 'create', data = null) {
    currentModalData = { type, mode, id: data ? data.department_id : null };
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    
    if (type === 'department') {
        title.textContent = mode === 'create' ? '➕ เพิ่มภาควิชา' : '✏️ แก้ไขภาควิชา';
        document.getElementById('input-name').value = data ? data.name : '';
        document.getElementById('input-id').style.display = 'none';
        document.getElementById('input-name').style.display = 'block';
        document.getElementById('select-degree').style.display = 'none';
        document.getElementById('select-department').style.display = 'none';
    }
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

async function loadDepartments() {
    try {
        const response = await fetch('/api/structures/departments', { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await response.json();
        if (result.success) {
            departmentsCache = result.data;
            renderTable('departments-table', result.data);
        }
    } catch (error) { console.error('Error loading departments:', error); }
}

function renderTable(tableId, data) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">ไม่พบข้อมูล</td></tr>`;
        return;
    }
    data.forEach(item => {
        const row = document.createElement('tr');
        // ❗️ เพิ่มปุ่มลบกลับเข้ามา
        row.innerHTML = `
            <td>${item.department_id}</td>
            <td>${item.name}</td>
            <td>
                <button onclick='openModal("department", "edit", ${JSON.stringify(item)})'>✏️ แก้ไข</button>
                <button onclick='deleteDepartment(${item.department_id})' class='delete-btn'>🗑️ ลบ</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function saveData() {
    const { type, mode, id } = currentModalData;
    const name = document.getElementById('input-name').value;
    if (!name) { alert('กรุณากรอกชื่อ'); return; }

    let url, method, body;

    if (type === 'department') {
        if (mode === 'create') {
            url = '/api/structures/departments';
            method = 'POST';
        } else { // edit mode
            url = `/api/structures/departments/${id}`;
            method = 'PUT';
        }
        body = { name };
    }
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            closeModal();
            loadAllData();
        } else {
            alert(`เกิดข้อผิดพลาด: ${result.message}`);
        }
    } catch (error) { console.error('Error saving data:', error); }
}

// --- เพิ่มฟังก์ชันนี้เข้ามา ---
async function deleteDepartment(id) {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
        return;
    }

    try {
        const response = await fetch(`/api/structures/departments/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            loadAllData(); // โหลดข้อมูลใหม่
        } else {
            alert(`เกิดข้อผิดพลาด: ${result.message}`);
        }
    } catch (error) {
        console.error('Error deleting department:', error);
    }
}

// เพิ่มฟังก์ชันนี้เข้าไปในไฟล์ manage_structure.js
async function loadPrograms() {
    try {
        const response = await fetch('/api/structures/programs', { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        const result = await response.json();
        if (result.success) {
            // แยกข้อมูลตามระดับปริญญา
            const mastersPrograms = result.data.filter(p => p.degree_level === 'ปริญญาโท');
            const doctoralPrograms = result.data.filter(p => p.degree_level === 'ปริญญาเอก');

            // แสดงผลในตารางที่ถูกต้อง
            renderProgramsTable('masters-programs-table', mastersPrograms);
            renderProgramsTable('doctoral-programs-table', doctoralPrograms);
        }
    } catch (error) { 
        console.error('Error loading programs:', error); 
    }
}

// เพิ่มฟังก์ชันนี้เข้าไปในไฟล์ manage_structure.js
function renderProgramsTable(tableId, data) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">ไม่พบข้อมูลหลักสูตร</td></tr>`;
        return;
    }

    // ไม่ต้องมี console.log ตรงนี้

    data.forEach(program => {
        // 🔽 ย้าย console.log มาไว้ตรงนี้ 🔽
        console.log(`Program ID: ${program.program_id}, Dept ID: ${program.department_id}, Type: ${typeof program.department_id}`);

        // หาชื่อภาควิชาจาก cache
        const department = departmentsCache.find(d => 
            parseInt(d.department_id) === parseInt(program.department_id)
        );
        const departmentName = department ? department.name : 'N/A';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${program.program_id}</td>
            <td>${program.name}</td>
            <td>${departmentName}</td>
            <td>
                <button>✏️ แก้ไข</button>
                <button class='delete-btn'>🗑️ ลบ</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Make functions globally accessible
window.showTab = showTab;
window.openModal = openModal;
window.closeModal = closeModal;
window.saveData = saveData;
window.deleteDepartment = deleteDepartment; // ❗️ ทำให้ HTML เรียกใช้ได้