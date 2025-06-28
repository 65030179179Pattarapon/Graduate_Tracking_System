// /User_Page/js_user/form2.js

// =================================================================
// ภาค 1: Standard Reusable Logic (ส่วนที่ควรย้ายไป common.js)
// =================================================================
function logout() {
    const modal = document.getElementById('logout-confirm-modal');
    if (modal) {
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('show'));
    }
}

function closeModal() {
    const modal = document.getElementById('logout-confirm-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
}

// ฟังก์ชันใหม่สำหรับสร้างปีการศึกษา
function populateRegistrationYears() {
    const selectYear = document.getElementById('registration-year');
    if (!selectYear) return;

    // ทำให้ตัวเลือกปีว่างก่อน เผื่อมีการเรียกซ้ำ
    selectYear.innerHTML = '<option value="">เลือก</option>';

    const currentThaiYear = new Date().getFullYear() + 543;
    for (let i = 0; i < 5; i++) {
        const year = currentThaiYear - i;
        const option = new Option(year, year);
        selectYear.appendChild(option);
    }
}


// =================================================================
// ภาค 2: Form 2 Specific Logic (Logic เฉพาะของหน้านี้)
// =================================================================
async function populateForm2() {
    const userEmail = localStorage.getItem("current_user");
    if (!userEmail) {
        alert("ไม่พบข้อมูลผู้ใช้, กรุณาเข้าสู่ระบบใหม่");
        window.location.href = "/login/index.html";
        return;
    }

    try {
        const [students, advisors, programs, departments] = await Promise.all([
            fetch("/data/student.json").then(res => res.json()),
            fetch("/data/advisor.json").then(res => res.json()),
            fetch("/data/structures/programs.json").then(res => res.json()),
            fetch("/data/structures/departments.json").then(res => res.json())
        ]);

        const currentUser = students.find(s => s.email === userEmail);
        if (!currentUser) {
            alert("ไม่พบข้อมูลนักศึกษา");
            return;
        }

        // --- Populate Form Fields ---
        document.getElementById('nav-username').textContent = userEmail;
        
        // 1. ข้อมูลนักศึกษา (ตาม Requirement ใหม่)
        document.getElementById('fullname').value = `${currentUser.prefix_th} ${currentUser.first_name_th} ${currentUser.last_name_th}`.trim();
        document.getElementById('student-id').value = currentUser.student_id;
        document.getElementById('degree').value = currentUser.degree || 'N/A';
        const programName = programs.find(p => p.id === currentUser.program_id)?.name || 'N/A';
        document.getElementById('program').value = programName;
        const departmentName = departments.find(d => d.id === currentUser.department_id)?.name || 'N/A';
        document.getElementById('department').value = departmentName;
        document.getElementById('phone').value = currentUser.phone || 'N/A';

        // 2. ข้อมูลอาจารย์ที่ปรึกษา (แสดงผลตามข้อมูลที่มี)
        const mainAdvisor = advisors.find(a => a.advisor_id === currentUser.main_advisor_id);
        const coAdvisor1 = advisors.find(a => a.advisor_id === currentUser.co_advisor1_id);
        
        document.getElementById('main-advisor').value = mainAdvisor ? `${mainAdvisor.prefix_th || ''}${mainAdvisor.first_name_th || ''} ${mainAdvisor.last_name_th || ''}`.trim() : 'ยังไม่ได้เลือก';
        document.getElementById('co-advisor-1').value = coAdvisor1 ? `${coAdvisor1.prefix_th || ''}${coAdvisor1.first_name_th || ''} ${coAdvisor1.last_name_th || ''}`.trim() : 'ไม่มี';

        // 3. Populate Co-Advisor 2 Dropdown (กรองคนซ้ำออก)
        const coAdvisor2Select = document.getElementById("co-advisor-2");
        const usedAdvisorIds = [currentUser.main_advisor_id, currentUser.co_advisor1_id].filter(id => id);

        advisors.forEach(advisor => {
            if (advisor.advisor_id && !usedAdvisorIds.includes(advisor.advisor_id)) {
                const advisorFullName = `${advisor.prefix_th || ''}${advisor.first_name_th || ''} ${advisor.last_name_th || ''}`.trim();
                const opt = new Option(advisorFullName, advisor.advisor_id);
                coAdvisor2Select.appendChild(opt);
            }
        });

        // 4. สร้างตัวเลือกปีการศึกษาสำหรับ Checklist
        populateRegistrationYears();
        
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสำหรับฟอร์ม 2:", error);
        alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
}

// =================================================================
// ภาค 3: Main Event Listener (ตัวจัดการการทำงานทั้งหมดในหน้า)
// =================================================================
document.addEventListener('DOMContentLoaded', function() {
    // --- Standard Navbar Logic ---
    const dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(event) {
            event.preventDefault();
            const dropdownMenu = this.nextElementSibling;
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                if (menu !== dropdownMenu) menu.classList.remove('show');
            });
            if (dropdownMenu) dropdownMenu.classList.toggle('show');
        });
    });
    window.addEventListener('click', function(event) {
        if (!event.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });

    // --- Standard Logout Modal Logic ---
    const logoutButton = document.getElementById("logout-button");
    const modal = document.getElementById('logout-confirm-modal');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    if (logoutButton) logoutButton.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (confirmBtn) confirmBtn.addEventListener('click', () => { localStorage.clear(); window.location.href = "/login/index.html"; });
    if(modal) modal.addEventListener('click', function(e) { if (e.target === this) closeModal(); });

    // --- Character Counter Logic ---
    const commentBox = document.getElementById('student-comment');
    const charCounter = document.getElementById('char-counter');
    if(commentBox && charCounter){
        commentBox.addEventListener('input', () => {
            const currentLength = commentBox.value.length;
            charCounter.textContent = `${currentLength} / 250`;
        });
    }

    // --- File Input Display Logic ---
    const fileInput = document.getElementById('proposal-file');
    const fileNameDisplay = document.getElementById('file-name-display');
    if(fileInput && fileNameDisplay){
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                fileNameDisplay.textContent = `ไฟล์ที่เลือก: ${fileInput.files[0].name}`;
            } else {
                fileNameDisplay.textContent = 'ยังไม่ได้เลือกไฟล์';
            }
        });
    }

    // --- Form Submission Logic ---
    const thesisForm = document.getElementById("thesis-form");
    if(thesisForm){
        thesisForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const userEmail = localStorage.getItem("current_user");
            
            // --- Validation ---
            if (document.getElementById('thesis-title-th').value.trim() === '' || 
                document.getElementById('thesis-title-en').value.trim() === '' ||
                document.getElementById('proposal-file').files.length === 0) {
                alert("กรุณากรอกข้อมูลหัวข้อวิทยานิพนธ์และแนบไฟล์ที่จำเป็น (*) ให้ครบถ้วน");
                return;
            }

            const requiredCheckboxes = document.querySelectorAll('input[name="checklist"][required]');
            const allChecked = Array.from(requiredCheckboxes).every(cb => cb.checked);
            if (!allChecked) {
                alert("กรุณายืนยันการดำเนินการใน 'รายการตรวจสอบและยืนยัน' ให้ครบทุกข้อ");
                return;
            }

            // --- Construct submission object ---
            const submissionData = {
                doc_id: `form2_${userEmail}_${Date.now()}`,
                type: "ฟอร์ม 2",
                title: "แบบเสนอหัวข้อและเค้าโครงวิทยานิพนธ์",
                student_email: userEmail,
                student_id: document.getElementById('student-id').value,
                student: document.getElementById('fullname').value,
                thesis_title_th: document.getElementById('thesis-title-th').value,
                thesis_title_en: document.getElementById('thesis-title-en').value,
                proposal_file_name: document.getElementById('proposal-file').files[0]?.name,
                selected_co_advisor2_id: document.getElementById("co-advisor-2").value || null,
                details: {
                    registration_semester: document.getElementById('registration-semester').value,
                    registration_year: document.getElementById('registration-year').value,
                    checklist_confirmed: true
                },
                student_comment: document.getElementById('student-comment')?.value.trim() || "",
                submitted_date: new Date().toISOString(),
                status: "รอตรวจ"
            };
            
            // --- Simulate sending data ---
            const existingPendingDocs = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
            existingPendingDocs.push(submissionData);
            localStorage.setItem('localStorage_pendingDocs', JSON.stringify(existingPendingDocs));
            
            console.log("Form 2 Submission Data:", submissionData);
            alert("✅ ยืนยันและส่งแบบฟอร์มเสนอหัวข้อเรียบร้อยแล้ว!");
            window.location.href = "/User_Page/html_user/status.html";
        });
    }

    // --- Initial data population ---
    populateForm2();
});