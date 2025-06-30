// /User_Page/js_user/form2.js (Self-Contained Version)

// =================================================================
// ภาค 1: Helper Functions
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
    selectYear.innerHTML = '<option value="">เลือกปี</option>';

    const currentThaiYear = new Date().getFullYear() + 543;
    
    // แก้ไขตัวเลข 5 ให้เป็นจำนวนปีที่ต้องการย้อนหลัง เช่น 20 ปี
    for (let i = 0; i < 20; i++) { 
        const year = currentThaiYear - i;
        const option = new Option(year, year);
        selectYear.appendChild(option);
    }
}

// =================================================================
// ภาค 2: Form 2 Specific Logic
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
        
        document.getElementById('fullname').value = `${currentUser.prefix_th} ${currentUser.first_name_th} ${currentUser.last_name_th}`.trim();
        document.getElementById('student-id').value = currentUser.student_id;
        document.getElementById('degree').value = currentUser.degree || 'N/A';
        const programName = programs.find(p => p.id === currentUser.program_id)?.name || 'N/A';
        document.getElementById('program').value = programName;
        const departmentName = departments.find(d => d.id === currentUser.department_id)?.name || 'N/A';
        document.getElementById('department').value = departmentName;
        document.getElementById('phone').value = currentUser.phone || 'N/A';

        const mainAdvisor = advisors.find(a => a.advisor_id === currentUser.main_advisor_id);
        const coAdvisor1 = advisors.find(a => a.advisor_id === currentUser.co_advisor1_id);
        
        document.getElementById('main-advisor').value = mainAdvisor ? `${mainAdvisor.prefix_th || ''}${mainAdvisor.first_name_th || ''} ${mainAdvisor.last_name_th || ''}`.trim() : 'ยังไม่ได้เลือก';
        document.getElementById('co-advisor-1').value = coAdvisor1 ? `${coAdvisor1.prefix_th || ''}${coAdvisor1.first_name_th || ''} ${coAdvisor1.last_name_th || ''}`.trim() : 'ไม่มี';

        const coAdvisor2Select = document.getElementById("co-advisor-2");
        const usedAdvisorIds = [currentUser.main_advisor_id, currentUser.co_advisor1_id].filter(id => id);
        const availableAdvisors = advisors.filter(a => !usedAdvisorIds.includes(a.advisor_id));
        
        availableAdvisors.forEach(advisor => {
            const advisorFullName = `${advisor.prefix_th || ''}${advisor.first_name_th || ''} ${advisor.last_name_th || ''}`.trim();
            const opt = new Option(advisorFullName, advisor.advisor_id);
            coAdvisor2Select.appendChild(opt);
        });
        
        populateRegistrationYears();
        
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสำหรับฟอร์ม 2:", error);
        alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
}

// =================================================================
// ภาค 3: Main Event Listener
// =================================================================
document.addEventListener('DOMContentLoaded', function() {
    // --- Navbar & Modal Logic ---
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
    if (commentBox) {
        const charCounter = document.getElementById('char-counter');
        if(charCounter){
            commentBox.addEventListener('input', () => {
                const currentLength = commentBox.value.length;
                const maxLength = commentBox.maxLength;
                charCounter.textContent = `${currentLength} / ${maxLength}`;
            });
        }
    }

    // --- File Input Display Logic ---
    const fileInputs = document.querySelectorAll('.file-input');
    fileInputs.forEach(input => {
        input.addEventListener('change', () => {
            const fileNameDisplay = input.nextElementSibling;
            if (input.files.length > 0) {
                fileNameDisplay.textContent = `ไฟล์ที่เลือก: ${input.files[0].name}`;
            } else {
                fileNameDisplay.textContent = 'ยังไม่ได้เลือกไฟล์';
            }
        });
    });

    // --- Form Submission Logic ---
    const thesisForm = document.getElementById("thesis-form");
    if (thesisForm) {
        thesisForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const userEmail = localStorage.getItem("current_user");
            
            // --- Validation ---
            const proposalFile = document.getElementById('proposal-file').files[0];
            const coverPageFile = document.getElementById('cover-page-file').files[0];
            const registrationProofFile = document.getElementById('registration-proof-file').files[0];
            const semester = document.getElementById('registration-semester').value;
            const year = document.getElementById('registration-year').value;

            if (document.getElementById('thesis-title-th').value.trim() === '' || 
                document.getElementById('thesis-title-en').value.trim() === '') {
                alert("กรุณากรอกข้อมูลหัวข้อวิทยานิพนธ์ให้ครบถ้วน");
                return;
            }
            if (!proposalFile || !coverPageFile || !registrationProofFile) {
                alert("กรุณาแนบไฟล์ที่จำเป็น (*) ให้ครบถ้วนทุกช่อง");
                return;
            }
            if (!semester || !year) {
                alert("กรุณาเลือกภาคการศึกษาและปีการศึกษาสำหรับสำเนาการลงทะเบียน");
                return;
            }

            // --- Construct submission object ---
            const submissionData = {
                doc_id: `form2_${userEmail}_${Date.now()}`,
                type: "ฟอร์ม 2",
                title: "แบบเสนอหัวข้อและเค้าโครงวิทยานิพนธ์",
                student_email: userEmail,
                student_id: document.getElementById('student-id').value,
                thesis_title_th: document.getElementById('thesis-title-th').value.trim(),
                thesis_title_en: document.getElementById('thesis-title-en').value.trim(),
                selected_co_advisor2_id: document.getElementById("co-advisor-2").value || null,
                files: [
                    { type: 'เค้าโครงวิทยานิพนธ์', name: proposalFile.name },
                    { type: 'หน้าปก', name: coverPageFile.name },
                    { type: 'สำเนาลงทะเบียน', name: registrationProofFile.name }
                ],
                details: {
                    registration_semester: semester,
                    registration_year: year,
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