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
        const [
            students, programs, departments, advisors, externalProfessors, 
            approvedDocs
        ] = await Promise.all([
            fetch("/data/student.json").then(res => res.json()),
            fetch("/data/structures/programs.json").then(res => res.json()),
            fetch("/data/structures/departments.json").then(res => res.json()),
            fetch("/data/advisor.json").then(res => res.json()),
            fetch("/data/external_professor.json").then(res => res.json()),
            Promise.resolve(JSON.parse(localStorage.getItem('localStorage_approvedDocs') || '[]'))
        ]);

        const currentUser = students.find(s => s.email === userEmail);
        if (!currentUser) {
            alert("ไม่พบข้อมูลนักศึกษาในระบบ"); return;
        }

        // --- [ส่วนที่แก้ไข] ---
        // ค้นหาฟอร์ม 2 ที่อนุมัติแล้ว แต่จะไม่บล็อกการทำงานถ้าหาไม่เจอ
        const approvedForm2 = approvedDocs.find(doc => doc.student_email === userEmail && doc.type === 'ฟอร์ม 2');
        const prevCommittee = approvedForm2 ? approvedForm2.committee || {} : {};
        // --- จบส่วนที่แก้ไข ---
        

        // --- แสดงผลข้อมูลนักศึกษา (เหมือนเดิม) ---
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


        // --- แสดงผลและตั้งค่าคณะกรรมการ (เหมือนเดิม) ---
        const mainAdvisor = advisors.find(a => a.advisor_id === currentUser.main_advisor_id);
        const coAdvisor1 = advisors.find(a => a.advisor_id === currentUser.co_advisor1_id);
        if (mainAdvisor) document.getElementById('main-advisor').value = `${mainAdvisor.prefix_th}${mainAdvisor.first_name_th} ${mainAdvisor.last_name_th}`.trim();
        if (coAdvisor1) document.getElementById('co-advisor-1').value = `${coAdvisor1.prefix_th}${coAdvisor1.first_name_th} ${coAdvisor1.last_name_th}`.trim();
        else document.getElementById('co-advisor-1').value = 'ไม่มี';

        const committeeChairSelect = document.getElementById('committee-chair');
        const coAdvisor2Select = document.getElementById('co-advisor-2');
        const member5Select = document.getElementById('committee-member-5');
        const reserveExternalSelect = document.getElementById('reserve-external');
        const reserveInternalSelect = document.getElementById('reserve-internal');

        const potentialChairs = advisors.filter(a => a.roles?.includes("COMMITTEE_CHAIR"));
        const potentialCoAdvisors = advisors.filter(a => a.roles?.includes("CO_ADVISOR"));
        const potentialExternalReserve = externalProfessors.filter(p => p.roles?.includes("RESERVE_EXTERNAL_COMMITTEE"));
        const allInternalAdvisors = advisors;

        potentialChairs.forEach(adv => committeeChairSelect.appendChild(new Option(`${adv.prefix_th}${adv.first_name_th} ${adv.last_name_th}`.trim(), adv.advisor_id)));
        potentialCoAdvisors.forEach(adv => coAdvisor2Select.appendChild(new Option(`${adv.prefix_th}${adv.first_name_th} ${adv.last_name_th}`.trim(), adv.advisor_id)));
        allInternalAdvisors.forEach(adv => member5Select.appendChild(new Option(`${adv.prefix_th}${adv.first_name_th} ${adv.last_name_th}`.trim(), adv.advisor_id)));
        potentialExternalReserve.forEach(prof => reserveExternalSelect.appendChild(new Option(`${prof.prefix_th}${prof.first_name_th} ${prof.last_name_th}`.trim(), prof.ext_prof_id)));
        allInternalAdvisors.forEach(adv => reserveInternalSelect.appendChild(new Option(`${adv.prefix_th}${adv.first_name_th} ${adv.last_name_th}`.trim(), adv.advisor_id)));

        // ตั้งค่าเริ่มต้นจากฟอร์ม 2 ที่อนุมัติแล้ว (ถ้ามี)
        if (prevCommittee.chair_id) committeeChairSelect.value = prevCommittee.chair_id;
        if (prevCommittee.co_advisor2_id) coAdvisor2Select.value = prevCommittee.co_advisor2_id;
        if (prevCommittee.member5_id) member5Select.value = prevCommittee.member5_id;
        if (prevCommittee.reserve_external_id) reserveExternalSelect.value = prevCommittee.reserve_external_id;
        if (prevCommittee.reserve_internal_id) reserveInternalSelect.value = prevCommittee.reserve_internal_id;

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

    // --- [แก้ไข] Form 6 Submission Logic (ฉบับสมบูรณ์) ---
    const form6 = document.getElementById("form6");
    if (form6) {
        form6.addEventListener("submit", (e) => {
            e.preventDefault();
            const userEmail = localStorage.getItem("current_user");

            // --- 1. รวบรวมข้อมูลคณะกรรมการ ---
            const committeeData = {
                chair_id: document.getElementById('committee-chair').value,
                co_advisor2_id: document.getElementById('co-advisor-2').value,
                member5_id: document.getElementById('committee-member-5').value,
                reserve_external_id: document.getElementById('reserve-external').value,
                reserve_internal_id: document.getElementById('reserve-internal').value
            };

            // --- 2. Validation ตรวจสอบข้อมูล ---
            if (Object.values(committeeData).some(id => !id)) {
                alert("กรุณาเลือกคณะกรรมการและกรรมการสำรองให้ครบทุกตำแหน่ง");
                return;
            }

            // [ส่วนที่เพิ่มเข้ามา] ตรวจสอบว่าแนบไฟล์ครบทุกช่องหรือไม่
            const requiredFileInputs = document.querySelectorAll('input[type="file"][required]');
            let allFilesAttached = true;
            for (const input of requiredFileInputs) {
                if (!input.files || input.files.length === 0) {
                    allFilesAttached = false;
                    break;
                }
            }
            if (!allFilesAttached) {
                alert("กรุณาแนบไฟล์ประกอบคำร้องขอสอบให้ครบถ้วนทุกหัวข้อ (*)");
                return;
            }

            // --- [ส่วนที่เพิ่มเข้ามา] รวบรวมข้อมูลไฟล์แนบทั้งหมด ---
            const filesForSubmission = [
                { type: 'วิทยานิพนธ์ฉบับสมบูรณ์', name: document.getElementById('thesis-draft-file').files[0].name },
                { type: 'บทคัดย่อ (ไทย)', name: document.getElementById('abstract-th-file').files[0].name },
                { type: 'บทคัดย่อ (อังกฤษ)', name: document.getElementById('abstract-en-file').files[0].name },
                { type: 'สารบัญ (ไทย)', name: document.getElementById('toc-th-file').files[0].name },
                { type: 'สารบัญ (อังกฤษ)', name: document.getElementById('toc-en-file').files[0].name },
                { type: 'หลักฐานการตอบรับการตีพิมพ์', name: document.getElementById('publication-proof-file').files[0].name },
                { type: 'หลักฐานการตรวจสอบผลการเรียน', name: document.getElementById('grade-check-proof-file').files[0].name }
            ];

            // --- 3. สร้าง Object ข้อมูลทั้งหมดที่จะบันทึก ---
            const submissionData = {
                doc_id: `form6_${userEmail}_${Date.now()}`,
                type: "ฟอร์ม 6",
                title: "ขอแต่งตั้งคณะกรรมการการสอบวิทยานิพนธ์ขั้นสุดท้าย",
                student_email: userEmail,
                student_id: document.getElementById('student-id').value,
                committee: committeeData,
                files: filesForSubmission, // **เพิ่มข้อมูลไฟล์เข้าไป**
                student_comment: document.getElementById('student-comment')?.value.trim() || "",
                submitted_date: new Date().toISOString(),
                status: "รอตรวจ"
            };
            
            // --- 4. จำลองการส่งและบันทึกข้อมูล ---
            const existingPendingDocs = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
            existingPendingDocs.push(submissionData);
            localStorage.setItem('localStorage_pendingDocs', JSON.stringify(existingPendingDocs));
            
            console.log("Form 6 Submission Data (with files):", submissionData);
            alert("✅ ยืนยันและส่งคำร้องขอสอบเรียบร้อยแล้ว!");
            window.location.href = "/User_Page/html_user/status.html";
        });
    }

    // --- Initial data population ---
    populateForm6();
});