// public/Admin_Page/js_admin/manage_students.js (ฉบับสมบูรณ์)

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token || localStorage.getItem('role') !== 'admin') {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        window.location.href = '/login/index.html';
        return;
    }

    // --- ดึงข้อมูลอาจารย์มาใส่ใน Dropdown ---
    populateAdvisorDropdown(token);

    const params = new URLSearchParams(window.location.search);
    const studentId = params.get('id');

    const studentIdField = document.getElementById('student-id');
    const emailField = document.querySelector('input[type="email"]');

    if (studentId) {
        document.querySelector('main h2').textContent = '👨‍🎓 แก้ไขข้อมูลนักศึกษา';
        fetchStudentDetails(studentId, token);
        if (studentIdField) studentIdField.readOnly = true;
        if (emailField) emailField.readOnly = true;
    } else {
        document.querySelector('main h2').textContent = '➕ เพิ่มข้อมูลนักศึกษาใหม่';
        if (studentIdField) studentIdField.readOnly = false;
        if (emailField) emailField.readOnly = false;
    }

    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (studentId) {
                updateStudentData(studentId, token);
            } else {
                createNewStudent(token);
            }
        });
    }
    
    const degreeSelect = document.getElementById('degree-level');
    if(degreeSelect){
        degreeSelect.addEventListener('change', updateProgramsDropdown);
    }
});

// --- ดึงข้อมูลอาจารย์มาใส่ใน Dropdown ---
async function populateAdvisorDropdown(token) {
    try {
        const response = await fetch('/api/admin/advisors-list', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
            window.allAdvisors = result.data; // เก็บข้อมูลอาจารย์ไว้ใน global scope เพื่อใช้สร้างแถวใหม่
            const firstAdvisorSelect = document.querySelector('.advisor-select');
            if(firstAdvisorSelect){
                firstAdvisorSelect.innerHTML = '<option value="">-- เลือกอาจารย์ --</option>';
                result.data.forEach(advisor => {
                    const option = document.createElement('option');
                    option.value = advisor.advisor_id;
                    option.textContent = `${advisor.prefix_th}${advisor.first_name_th} ${advisor.last_name_th}`;
                    firstAdvisorSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error populating advisor dropdown:', error);
    }
}


// --- ดึงข้อมูลนักศึกษา (กรณีแก้ไข) ---
async function fetchStudentDetails(studentId, token) {
    try {
        const response = await fetch(`/api/admin/students/${studentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
            populateStudentForm(result.data);
        } else {
            alert(`เกิดข้อผิดพลาด: ${result.message}`);
        }
    } catch (error) {
        console.error('Fetch student details error:', error);
    }
}

// --- แสดงข้อมูลในฟอร์ม (กรณีแก้ไข) ---
function populateStudentForm(student) {
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
    };

    // Section 1
    document.getElementById('student-id').value = student.student_id || '';
    document.getElementById('prefix-th').value = student.prefix_th || '';
    document.getElementById('first-name-th').value = student.first_name_th || '';
    document.getElementById('last-name-th').value = student.last_name_th || '';
    document.getElementById('prefix-en').value = student.prefix_en || '';
    document.getElementById('first-name-en').value = student.first_name_en || '';
    document.getElementById('last-name-en').value = student.last_name_en || '';
    document.querySelector('input[type="email"]').value = student.email || '';
    document.querySelector('input[type="tel"]').value = student.phone || '';
        if (student.gender) {
            document.querySelector(`input[name="gender"][value="${student.gender}"]`).checked = true;
        }

        // Section 2
        if (student.degree) {
        // แปลงค่าจาก "ปริญญาโท" -> "ป.โท" เพื่อให้ Dropdown แสดงผลถูก
        const shortDegreeName = student.degree === 'ปริญญาโท' ? 'ป.โท' : 'ป.เอก';
        document.getElementById('degree-level').value = shortDegreeName;
        // สั่งให้ Dropdown หลักสูตรทำงานทันที
        updateProgramsDropdown().then(() => {
            document.getElementById('program-list').value = student.program_id || '';
        });
    }
    document.getElementById('program-list').value = student.program_id || '';
    document.getElementById('major').value = student.faculty || '';
    document.getElementById('admit-year').value = student.admit_year || '';
    document.getElementById('admit-semester').value = student.admit_semester || '';
    document.getElementById('study-plan').value = student.plan || '';
    document.getElementById('study-status').value = student.status || '';
    document.getElementById('status-date').value = formatDateForInput(student.status_update_date);

    // Section 3
    document.getElementById('thesis-title-th').value = student.thesis_title_th || '';
    document.getElementById('thesis-title-en').value = student.thesis_title_en || '';
    document.getElementById('thesis-approval-date').value = formatDateForInput(student.proposal_approval_date);
    document.getElementById('final-defense-date').value = formatDateForInput(student.final_defense_date);
    
    // Section 4: Advisors
    // (ส่วนนี้จะซับซ้อนขึ้นหากต้องการแสดงอาจารย์ที่มีอยู่แล้ว ต้องเขียนเพิ่ม)
}

// --- รวบรวมข้อมูลทั้งหมดจากฟอร์ม ---
function gatherFormData() {
    const getCheckedRadioValue = (name) => {
        const checkedRadio = document.querySelector(`input[name="${name}"]:checked`);
        return checkedRadio ? checkedRadio.value : null;
    };

    const studentData = {
        student_id: document.getElementById('student-id').value,
        prefix_th: document.getElementById('prefix-th').value,
        first_name_th: document.getElementById('first-name-th').value,
        last_name_th: document.getElementById('last-name-th').value,
        prefix_en: document.getElementById('prefix-en').value,
        first_name_en: document.getElementById('first-name-en').value,
        last_name_en: document.getElementById('last-name-en').value,
        email: document.querySelector('input[type="email"]').value,
        phone: document.querySelector('input[type="tel"]').value,
        gender: getCheckedRadioValue('gender'),
        degree: document.getElementById('degree-level').value,
        program_id: document.getElementById('program-list').value || null,
        faculty: document.getElementById('major').value,
        plan: document.getElementById('study-plan').value,
        admit_year: document.getElementById('admit-year').value || null,
        admit_semester: document.getElementById('admit-semester').value || null,
        status: document.getElementById('study-status').value,
        status_update_date: document.getElementById('status-date').value || null,
        thesis_title_th: document.getElementById('thesis-title-th').value,
        thesis_title_en: document.getElementById('thesis-title-en').value,
        proposal_approval_date: document.getElementById('thesis-approval-date').value || null,
        final_defense_date: document.getElementById('final-defense-date').value || null
    };

    const advisors = [];
    const advisorRows = document.querySelectorAll('#advisor-container .advisor-row');
    advisorRows.forEach(row => {
        const advisorId = row.querySelector('.advisor-select').value;
        const advisorRole = row.querySelector('input[type="radio"]:checked')?.value;
        if (advisorId && advisorRole) {
            advisors.push({ advisor_id: advisorId, role: advisorRole });
        }
    });

    return { ...studentData, advisors };
}

// --- สร้างนักศึกษาใหม่ ---
async function createNewStudent(token) {
    const formData = gatherFormData();

    if (!formData.student_id || !formData.email || !formData.first_name_th) {
        alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบ (รหัสนักศึกษา, ชื่อ, อีเมล)');
        return;
    }

    if (!confirm('คุณต้องการเพิ่มนักศึกษาใหม่ใช่หรือไม่?')) return;

    try {
        const response = await fetch('/api/admin/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData)
        });
        const result = await response.json();
        if (result.success) {
            alert('✅ เพิ่มนักศึกษาใหม่สำเร็จ!');
            window.location.href = 'students.html';
        } else {
            alert(`เกิดข้อผิดพลาด: ${result.message}`);
        }
    } catch (error) {
        console.error('Create student error:', error);
    }
}

// --- อัปเดตข้อมูลนักศึกษา ---
async function updateStudentData(studentId, token) {
    const formData = gatherFormData();
    
    if (!confirm('คุณต้องการบันทึกการเปลี่ยนแปลงใช่หรือไม่?')) return;

    try {
        const response = await fetch(`/api/admin/students/${studentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData)
        });
        const result = await response.json();
        if (result.success) {
            alert('✅ บันทึกข้อมูลสำเร็จ!');
            window.location.href = 'students.html';
        } else {
            alert(`เกิดข้อผิดพลาด: ${result.message}`);
        }
    } catch (error) {
        console.error('Update student error:', error);
    }
}

// --- ฟังก์ชันจัดการแถวอาจารย์ที่ปรึกษา (เพิ่ม/ลบ) ---
function addAdvisorRow() {
    const container = document.getElementById('advisor-container');
    const newRow = document.createElement('tr');
    newRow.classList.add('advisor-row');
    
    const advisorCount = container.querySelectorAll('.advisor-row').length;

    // สร้าง Dropdown
    const selectTd = document.createElement('td');
    const select = document.createElement('select');
    select.classList.add('advisor-select');
    select.innerHTML = '<option value="">-- เลือกอาจารย์ --</option>';
    if (window.allAdvisors) {
        window.allAdvisors.forEach(advisor => {
            const option = document.createElement('option');
            option.value = advisor.advisor_id;
            option.textContent = `${advisor.prefix_th}${advisor.first_name_th} ${advisor.last_name_th}`;
            select.appendChild(option);
        });
    }
    selectTd.appendChild(select);

    // สร้าง Radio buttons
    const radioTd = document.createElement('td');
    radioTd.innerHTML = `
        <div class="radio-group">
            <label><input type="radio" name="advisor-role-${advisorCount}" value="main"> หลัก</label>
            <label><input type="radio" name="advisor-role-${advisorCount}" value="co"> ร่วม</label>
        </div>
    `;

    // สร้างปุ่มลบ
    const deleteTd = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-advisor-btn');
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.onclick = function() { removeAdvisorRow(this); };
    deleteTd.appendChild(deleteBtn);

    newRow.appendChild(selectTd);
    newRow.appendChild(radioTd);
    newRow.appendChild(deleteTd);
    container.appendChild(newRow);
}

function removeAdvisorRow(button) {
    const row = button.closest('tr');
    if (document.querySelectorAll('#advisor-container .advisor-row').length > 1) {
        row.remove();
    } else {
        alert('ต้องมีอาจารย์ที่ปรึกษาอย่างน้อย 1 คน');
    }
}

async function updateProgramsDropdown() {
    const degreeLevel = document.getElementById('degree-level').value;
    const programSelect = document.getElementById('program-list');
    const token = localStorage.getItem('token');

    // ถ้ายังไม่ได้เลือกระดับปริญญา ให้ล้างค่าและซ่อน Dropdown หลักสูตร
    if (!degreeLevel) {
        programSelect.innerHTML = '<option value="">-- กรุณาเลือกระดับปริญญาก่อน --</option>';
        return;
    }

    try {
        // สร้าง URL พร้อม query parameter
        const response = await fetch(`/api/admin/programs-list?degree=${degreeLevel}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            programSelect.innerHTML = '<option value="">-- เลือกหลักสูตร --</option>'; // ล้างค่าเก่า
            result.data.forEach(program => {
                const option = document.createElement('option');
                option.value = program.program_id;
                option.textContent = program.name;
                programSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error fetching programs:', error);
    }
}


// เพิ่มโค้ดส่วนนี้ไปที่ท้ายไฟล์ manage_students.js

function addExaminerRow() {
    alert('ฟังก์ชันเพิ่มกรรมการสอบยังไม่ถูกสร้าง');
}

function addPublicationRow() {
    alert('ฟังก์ชันเพิ่มผลงานตีพิมพ์ยังไม่ถูกสร้าง');
}

function addAttachmentRow() {
    alert('ฟังก์ชันเพิ่มเอกสารยังไม่ถูกสร้าง');
}

// เพิ่มฟังก์ชันอื่นๆ ที่อาจมีใน HTML ของคุณ...