// /User_Page/js_user/form2.js (Fully Modified Version for Committee Selection)

// =================================================================
// ภาค 1: Helper Functions
// =================================================================

function populateRegistrationYears() {
    const selectYear = document.getElementById('registration-year');
    if (!selectYear) return;
    selectYear.innerHTML = '<option value="">เลือกปี</option>';
    const currentThaiYear = new Date().getFullYear() + 543;
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
        // [แก้ไข] ดึงข้อมูลอาจารย์ภายนอก (external_professor.json) เพิ่มเข้ามา
        const [students, advisors, programs, departments, externalProfessors] = await Promise.all([
            fetch("/data/student.json").then(res => res.json()),
            fetch("/data/advisor.json").then(res => res.json()),
            fetch("/data/structures/programs.json").then(res => res.json()),
            fetch("/data/structures/departments.json").then(res => res.json()),
            fetch("/data/external_professor.json").then(res => res.json())
        ]);

        const currentUser = students.find(s => s.email === userEmail);
        if (!currentUser) {
            alert("ไม่พบข้อมูลนักศึกษา");
            return;
        }

        // --- เติมข้อมูลนักศึกษา (เหมือนเดิม) ---
        document.getElementById('nav-username').textContent = userEmail;
        document.getElementById('fullname').value = `${currentUser.prefix_th} ${currentUser.first_name_th} ${currentUser.last_name_th}`.trim();
        document.getElementById('student-id').value = currentUser.student_id;
        document.getElementById('degree').value = currentUser.degree || 'N/A';
        const programName = programs.find(p => p.id === currentUser.program_id)?.name || 'N/A';
        document.getElementById('program').value = programName;
        const departmentName = departments.find(d => d.id === currentUser.department_id)?.name || 'N/A';
        document.getElementById('department').value = departmentName;
        document.getElementById('phone').value = currentUser.phone || 'N/A';

        // --- [Logic ใหม่] สร้าง Dropdown และเติมข้อมูลอาจารย์ ---
        
        // 1. แสดงชื่ออาจารย์ที่ปรึกษาหลัก และ ร่วม 1 (จากโปรไฟล์)
        const mainAdvisor = advisors.find(a => a.advisor_id === currentUser.main_advisor_id);
        const coAdvisor1 = advisors.find(a => a.advisor_id === currentUser.co_advisor1_id);
        document.getElementById('main-advisor').value = mainAdvisor ? `${mainAdvisor.prefix_th || ''}${mainAdvisor.first_name_th || ''} ${mainAdvisor.last_name_th || ''}`.trim() : 'ไม่มีข้อมูล';
        document.getElementById('co-advisor-1').value = coAdvisor1 ? `${coAdvisor1.prefix_th || ''}${coAdvisor1.first_name_th || ''} ${coAdvisor1.last_name_th || ''}`.trim() : 'ไม่มีข้อมูล';

        const usedAdvisorIds = [currentUser.main_advisor_id, currentUser.co_advisor1_id].filter(id => id);

        // 2. สร้าง Dropdown ประธานกรรมการสอบ
        const committeeChairSelect = document.getElementById("committee-chair");
        const potentialChairs = advisors.filter(a => a.roles?.includes("COMMITTEE_CHAIR") && !usedAdvisorIds.includes(a.advisor_id));
        potentialChairs.forEach(advisor => {
            const fullName = `${advisor.prefix_th || ''}${advisor.first_name_th || ''} ${advisor.last_name_th || ''}`.trim();
            committeeChairSelect.appendChild(new Option(fullName, advisor.advisor_id));
        });

        // 3. สร้าง Dropdown ที่ปรึกษาร่วม 2
        const coAdvisor2Select = document.getElementById("co-advisor-2");
        const potentialCoAdvisors = advisors.filter(a => a.roles?.includes("CO_ADVISOR") && !usedAdvisorIds.includes(a.advisor_id));
        potentialCoAdvisors.forEach(advisor => {
            const fullName = `${advisor.prefix_th || ''}${advisor.first_name_th || ''} ${advisor.last_name_th || ''}`.trim();
            coAdvisor2Select.appendChild(new Option(fullName, advisor.advisor_id));
        });

        // 4. สร้าง Dropdown กรรมการคนที่ 5 (อาจารย์ภายในทั้งหมดที่ไม่ถูกเลือกไปแล้ว)
        const member5Select = document.getElementById("committee-member-5");
        const internalMembers = advisors.filter(a => !usedAdvisorIds.includes(a.advisor_id));
        internalMembers.forEach(advisor => {
            const fullName = `${advisor.prefix_th || ''}${advisor.first_name_th || ''} ${advisor.last_name_th || ''}`.trim();
            member5Select.appendChild(new Option(fullName, advisor.advisor_id));
        });
        
        // 5. สร้าง Dropdown กรรมการสำรอง (ภายนอก)
        const reserveExternalSelect = document.getElementById("reserve-external");
        const externalMembers = externalProfessors.filter(p => p.roles?.includes("RESERVE_EXTERNAL_COMMITTEE"));
        externalMembers.forEach(prof => {
            const fullName = `${prof.prefix_th || ''}${prof.first_name_th || ''} ${prof.last_name_th || ''}`.trim();
            reserveExternalSelect.appendChild(new Option(fullName, prof.ext_prof_id));
        });

        // 6. สร้าง Dropdown กรรมการสำรอง (ภายใน)
        const reserveInternalSelect = document.getElementById("reserve-internal");
        internalMembers.forEach(advisor => { // ใช้ list เดียวกับกรรมการคนที่ 5
            const fullName = `${advisor.prefix_th || ''}${advisor.first_name_th || ''} ${advisor.last_name_th || ''}`.trim();
            reserveInternalSelect.appendChild(new Option(fullName, advisor.advisor_id));
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

    // --- [แก้ไข] Form Submission Logic ---
    const thesisForm = document.getElementById("thesis-form");
    if (thesisForm) {
        thesisForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const userEmail = localStorage.getItem("current_user");
            
            // --- รวบรวมข้อมูลจาก Dropdown ที่เพิ่มเข้ามา ---
            const committee = {
                chair_id: document.getElementById('committee-chair').value,
                co_advisor2_id: document.getElementById('co-advisor-2').value,
                member5_id: document.getElementById('committee-member-5').value,
                reserve_external_id: document.getElementById('reserve-external').value,
                reserve_internal_id: document.getElementById('reserve-internal').value,
            };

            // --- Validation ที่ครอบคลุมขึ้น ---
            if (!committee.chair_id || !committee.co_advisor2_id || !committee.member5_id || !committee.reserve_external_id || !committee.reserve_internal_id) {
                alert("กรุณาเลือกข้อมูลคณะกรรมการสอบและกรรมการสำรองให้ครบถ้วน");
                return;
            }
            // (Validation อื่นๆ เหมือนเดิม)

            const proposalFile = document.getElementById('proposal-file').files[0];
            const coverPageFile = document.getElementById('cover-page-file').files[0];
            const registrationProofFile = document.getElementById('registration-proof-file').files[0];
            const semester = document.getElementById('registration-semester').value;
            const year = document.getElementById('registration-year').value;

            // --- Construct submission object (โครงสร้างใหม่) ---
            const submissionData = {
                doc_id: `form2_${userEmail}_${Date.now()}`,
                type: "ฟอร์ม 2",
                title: "แบบเสนอหัวข้อและเค้าโครงวิทยานิพนธ์",
                student_email: userEmail,
                student_id: document.getElementById('student-id').value,
                thesis_title_th: document.getElementById('thesis-title-th').value.trim(),
                thesis_title_en: document.getElementById('thesis-title-en').value.trim(),
                
                committee: committee, // **ส่งข้อมูลคณะกรรมการเป็น Object**

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
            
            console.log("Form 2 New Submission Data:", submissionData);
            alert("✅ ยืนยันและส่งแบบฟอร์มเสนอหัวข้อเรียบร้อยแล้ว!");
            window.location.href = "/User_Page/html_user/status.html";
        });
    }

    // --- Initial data population ---
    populateForm2();
});