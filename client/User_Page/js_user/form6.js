// /User_Page/js_user/form6.js (Fully Self-Contained Version with Corrected File Handling)

// =================================================================
// ภาค 1: Helper Functions
// =================================================================

/**
 * แสดง Modal ยืนยันการออกจากระบบ
 */
function logout() {
    const modal = document.getElementById('logout-confirm-modal');
    if (modal) {
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('show'));
    }
}

/**
 * ปิด Modal
 */
function closeModal() {
    const modal = document.getElementById('logout-confirm-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
}

/**
 * ฟังก์ชันสำหรับสร้าง Option ใน Select Dropdown
 */
function populateSelectWithOptions(selectElement, dataArray, valueField, textField, prefixField = '', lastNameField = '') {
    if (!selectElement || !Array.isArray(dataArray)) return;
    
    dataArray.forEach(item => {
        const displayText = `${item[prefixField] || ''}${item[textField] || ''} ${item[lastNameField] || ''}`.trim();
        const option = new Option(displayText, item[valueField]);
        selectElement.appendChild(option);
    });
}

// =================================================================
// ภาค 2: Form 6 Specific Logic
// =================================================================

// --- State Management for Files ---
const fileStore = {};

/**
 * ดึงข้อมูลทั้งหมดที่จำเป็นมาแสดงผลในฟอร์ม 6
 */
async function populateForm6() {
    const userEmail = localStorage.getItem("current_user");
    if (!userEmail) {
        alert("ไม่พบข้อมูลผู้ใช้, กรุณาเข้าสู่ระบบใหม่");
        window.location.href = "/login/index.html";
        return;
    }

    try {
        const [students, programs, departments, advisors, externalProfessors] = await Promise.all([
            fetch("/data/student.json").then(res => res.json()),
            fetch("/data/structures/programs.json").then(res => res.json()),
            fetch("/data/structures/departments.json").then(res => res.json()),
            fetch("/data/advisor.json").then(res => res.json()),
            fetch("/data/external_professor.json").then(res => res.json())
        ]);

        const currentUser = students.find(s => s.email === userEmail);
        if (!currentUser) {
            alert("ไม่พบข้อมูลนักศึกษาในระบบ"); return;
        }

        // --- แสดงผลข้อมูลในฟอร์ม ---
        document.getElementById('nav-username').textContent = userEmail;
        
        document.getElementById('fullname').value = `${currentUser.prefix_th} ${currentUser.first_name_th} ${currentUser.last_name_th}`.trim();
        document.getElementById('student-id').value = currentUser.student_id;
        document.getElementById('degree').value = currentUser.degree || 'N/A';
        const programName = programs.find(p => p.id === currentUser.program_id)?.name || 'N/A';
        document.getElementById('program').value = programName;
        const departmentName = departments.find(d => d.id === currentUser.department_id)?.name || 'N/A';
        document.getElementById('department').value = departmentName;
        document.getElementById('admit-semester').value = currentUser.admit_semester || 'N/A';
        document.getElementById('admit-year').value = currentUser.admit_year || 'N/A';
        document.getElementById('phone').value = currentUser.phone || 'N/A';
        document.getElementById('workplace').value = currentUser.workplace || 'ไม่มีข้อมูล';
        const studentAddress = currentUser.address ? `${currentUser.address.street}, ${currentUser.address.city}, ${currentUser.address.province} ${currentUser.address.postal_code}` : 'N/A';
        document.getElementById('address').value = studentAddress;
        document.getElementById('thesis-title-th').value = currentUser.thesis_title_th || 'N/A';
        document.getElementById('thesis-title-en').value = currentUser.thesis_title_en || 'N/A';

        const mainAdvisor = advisors.find(a => a.advisor_id === currentUser.main_advisor_id);
        const coAdvisor1 = advisors.find(a => a.advisor_id === currentUser.co_advisor1_id);
        if (mainAdvisor) document.getElementById('main-advisor').value = `${mainAdvisor.prefix_th}${mainAdvisor.first_name_th} ${mainAdvisor.last_name_th}`.trim();
        if (coAdvisor1) document.getElementById('co-advisor-1').value = `${coAdvisor1.prefix_th}${coAdvisor1.first_name_th} ${coAdvisor1.last_name_th}`.trim();
        else document.getElementById('co-advisor-1').value = 'ไม่มี';

        const committeeChairSelect = document.getElementById('committee-chair');
        const committeeMember1Select = document.getElementById('committee-member-1');
        const committeeMember2Select = document.getElementById('committee-member-2');
        
        populateSelectWithOptions(committeeChairSelect, externalProfessors, 'email', 'fullname');
        const usedAdvisorIds = [currentUser.main_advisor_id, currentUser.co_advisor1_id].filter(Boolean);
        const availableAdvisors = advisors.filter(a => !usedAdvisorIds.includes(a.advisor_id));
        populateSelectWithOptions(committeeMember1Select, availableAdvisors, 'advisor_id', 'first_name_th', 'prefix_th', 'last_name_th');
        populateSelectWithOptions(committeeMember2Select, availableAdvisors, 'advisor_id', 'first_name_th', 'prefix_th', 'last_name_th');

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสำหรับฟอร์ม 6:", error);
        alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
}

/**
 * จัดการเมื่อมีการเลือกไฟล์
 * @param {Event} event - The file input change event.
 */
function handleFileSelection(event) {
    const inputId = event.target.id;
    const file = event.target.files[0];
    const displayElement = event.target.nextElementSibling;
    
    const MAX_FILE_SIZE_MB = 10;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

    if (file) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
            alert(`ไฟล์ ${file.name} มีขนาดใหญ่เกิน ${MAX_FILE_SIZE_MB}MB`);
            event.target.value = ''; // ล้างค่าที่เลือก
            if(displayElement) displayElement.textContent = 'ยังไม่ได้เลือกไฟล์';
            delete fileStore[inputId];
            return;
        }
        fileStore[inputId] = file;
        if(displayElement) displayElement.textContent = `ไฟล์ที่เลือก: ${file.name}`;
    } else {
        delete fileStore[inputId];
        if(displayElement) displayElement.textContent = 'ยังไม่ได้เลือกไฟล์';
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

    // --- Interactive Committee Selection Logic ---
    const committeeMember1Select = document.getElementById('committee-member-1');
    const committeeMember2Select = document.getElementById('committee-member-2');
    
    function updateCommitteeOptions(changedSelect) {
        const selects = [committeeMember1Select, committeeMember2Select];
        const selectedValues = selects.map(s => s.value).filter(Boolean);

        selects.forEach(currentSelect => {
            if (currentSelect === changedSelect) return; 

            for (const option of currentSelect.options) {
                if (option.value) {
                    option.disabled = selectedValues.includes(option.value) && option.value !== currentSelect.value;
                }
            }
        });
    }
    if (committeeMember1Select) committeeMember1Select.addEventListener('change', () => updateCommitteeOptions(committeeMember1Select));
    if (committeeMember2Select) committeeMember2Select.addEventListener('change', () => updateCommitteeOptions(committeeMember2Select));

    // --- Character Counter Logic ---
    const commentBox = document.getElementById('student-comment');
    if (commentBox) {
        const charCounter = document.getElementById('char-counter');
        if (charCounter) {
            commentBox.addEventListener('input', () => {
                const currentLength = commentBox.value.length;
                const maxLength = commentBox.maxLength;
                charCounter.textContent = `${currentLength} / ${maxLength}`;
            });
        }
    }
    
    // --- File Input Listeners ---
    document.querySelectorAll('.file-input').forEach(input => {
        input.addEventListener('change', handleFileSelection);
    });

    // --- Form 6 Submission Logic ---
    const form6 = document.getElementById("form6");
    if (form6) {
        form6.addEventListener("submit", (e) => {
            e.preventDefault();
            const userEmail = localStorage.getItem("current_user");

            // --- Validation ---
            if (!document.getElementById('committee-chair').value || 
                !document.getElementById('committee-member-1').value ||
                !document.getElementById('committee-member-2').value) {
                alert("กรุณาเลือกประธานกรรมการสอบและกรรมการที่จำเป็น (*) ให้ครบถ้วน");
                return;
            }

            const requiredFileInputs = document.querySelectorAll('input[type="file"][required]');
            let allFilesAttached = true;
            for (const input of requiredFileInputs) {
                if (!fileStore[input.id]) {
                    allFilesAttached = false;
                    break;
                }
            }

            if (!allFilesAttached) {
                alert("กรุณาแนบไฟล์ประกอบคำร้องขอสอบให้ครบถ้วนทุกหัวข้อ");
                return;
            }

            // --- Construct submission object ---
            const filesForSubmission = [
                { type: 'วิทยานิพนธ์ฉบับสมบูรณ์', name: fileStore['thesis-draft-file'].name },
                { type: 'บทคัดย่อ (ไทย)', name: fileStore['abstract-th-file'].name },
                { type: 'บทคัดย่อ (อังกฤษ)', name: fileStore['abstract-en-file'].name },
                { type: 'สารบัญ (ไทย)', name: fileStore['toc-th-file'].name },
                { type: 'สารบัญ (อังกฤษ)', name: fileStore['toc-en-file'].name },
                { type: 'หลักฐานการตอบรับการตีพิมพ์', name: fileStore['publication-proof-file'].name },
                { type: 'หลักฐานการตรวจสอบผลการเรียน', name: fileStore['grade-check-proof-file'].name }
            ];

            const submissionData = {
                doc_id: `form6_${userEmail}_${Date.now()}`,
                type: "ฟอร์ม 6",
                title: "ขอแต่งตั้งคณะกรรมการการสอบวิทยานิพนธ์ขั้นสุดท้าย",
                student_email: userEmail,
                student_id: document.getElementById('student-id').value,
                files: filesForSubmission, // ใช้ข้อมูลไฟล์ชุดใหม่
                details: {
                    committee: {
                        chair_email: document.getElementById('committee-chair').value,
                        member1_id: document.getElementById('committee-member-1').value,
                        member2_id: document.getElementById('committee-member-2').value,
                        reserve_external: document.getElementById('reserve-member-external').value.trim() || null,
                        reserve_internal: document.getElementById('reserve-member-internal').value.trim() || null,
                    }
                },
                student_comment: document.getElementById('student-comment')?.value.trim() || "",
                submitted_date: new Date().toISOString(),
                status: "รอตรวจ"
            };
            
            // --- Simulate sending data ---
            const existingPendingDocs = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
            existingPendingDocs.push(submissionData);
            localStorage.setItem('localStorage_pendingDocs', JSON.stringify(existingPendingDocs));
            
            console.log("Form 6 Submission Data:", submissionData);
            alert("✅ ยืนยันและส่งคำร้องขอสอบเรียบร้อยแล้ว!");
            window.location.href = "/User_Page/html_user/status.html";
        });
    }

    // --- Initial data population ---
    populateForm6();
});