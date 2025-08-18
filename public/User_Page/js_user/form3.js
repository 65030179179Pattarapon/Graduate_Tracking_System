// /User_Page/js_user/form3.js (Corrected and Fully Modified Version)

// =================================================================
// ภาค 1: Form 3 Specific Logic (Logic หลักของฟอร์ม 3)
// =================================================================
async function populateForm3() {
    const userEmail = localStorage.getItem("current_user");
    if (!userEmail) {
        alert("ไม่พบข้อมูลผู้ใช้, กรุณาเข้าสู่ระบบใหม่");
        window.location.href = "/login/index.html";
        return;
    }

    try {
        // [แก้ไข] Fetch ข้อมูลเพิ่ม: advisors.json และข้อมูลเอกสารที่อนุมัติแล้ว
        const [students, programs, departments, advisors, allDocs] = await Promise.all([
            fetch("/data/student.json").then(res => res.json()),
            fetch("/data/structures/programs.json").then(res => res.json()),
            fetch("/data/structures/departments.json").then(res => res.json()),
            fetch("/data/advisor.json").then(res => res.json()), // <-- Fetch เพิ่ม
            JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]') // <-- Fetch เพิ่ม (จำลอง)
        ]);

        const currentUser = students.find(s => s.email === userEmail);
        if (!currentUser) {
            alert("ไม่พบข้อมูลนักศึกษา");
            return;
        }

        // --- Populate Form Fields ---
        // (ส่วนเติมข้อมูลนักศึกษาและหัวข้อวิทยานิพนธ์เหมือนเดิม)
        document.getElementById('nav-username').textContent = userEmail;
        document.getElementById('fullname').value = `${currentUser.prefix_th || ''} ${currentUser.first_name_th || ''} ${currentUser.last_name_th || ''}`.trim();
        document.getElementById('student-id').value = currentUser.student_id || '';
        document.getElementById('degree').value = currentUser.degree || 'N/A';
        const programName = programs.find(p => p.id === currentUser.program_id)?.name || `ID: ${currentUser.program_id}`;
        document.getElementById('program').value = programName;
        const departmentName = departments.find(d => d.id === currentUser.department_id)?.name || 'N/A';
        document.getElementById('department').value = departmentName;
        const formatThaiDate = (isoString) => {
             if (!isoString) return 'ยังไม่มีข้อมูลการอนุมัติหัวข้อ';
             const date = new Date(isoString);
             return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
        }
        document.getElementById('proposal-date').value = formatThaiDate(currentUser.proposal_approval_date);
        document.getElementById('thesis-title-th').value = currentUser.thesis_title_th || 'ยังไม่มีข้อมูลการอนุมัติหัวข้อ';
        document.getElementById('thesis-title-en').value = currentUser.thesis_title_en || 'ยังไม่มีข้อมูลการอนุมัติหัวข้อ';
        
        // --- [Logic ใหม่] สร้าง Dropdown และเติมข้อมูลอาจารย์ ---
        // 1. สร้าง Dropdown ประธานหลักสูตร
        const programChairSelect = document.getElementById('program-chair-select');
        const programChairs = advisors.filter(a => a.position === 'ประธานหลักสูตร');
        programChairs.forEach(chair => {
            const fullName = `${chair.prefix_th || ''}${chair.first_name_th || ''} ${chair.last_name_th || ''}`.trim();
            const option = new Option(fullName, chair.advisor_id);
            programChairSelect.appendChild(option);
        });

        // 2. แสดงชื่ออาจารย์ที่ปรึกษาหลัก (จาก Form 1)
        const mainAdvisor = advisors.find(a => a.advisor_id === currentUser.main_advisor_id);
        document.getElementById('main-advisor').value = mainAdvisor ? `${mainAdvisor.prefix_th || ''}${mainAdvisor.first_name_th || ''} ${mainAdvisor.last_name_th || ''}`.trim() : 'ไม่มีข้อมูล';

        // 3. แสดงชื่ออาจารย์ที่ปรึกษาร่วม 1 (จาก Form 1)
        const coAdvisor1 = advisors.find(a => a.advisor_id === currentUser.co_advisor1_id);
        document.getElementById('co-advisor-1').value = coAdvisor1 ? `${coAdvisor1.prefix_th || ''}${coAdvisor1.first_name_th || ''} ${coAdvisor1.last_name_th || ''}`.trim() : 'ไม่มี';

        // 4. แสดงชื่ออาจารย์ที่ปรึกษาร่วม 2 (จาก Form 2)
        const approvedForm2 = allDocs.find(doc => doc.student_email === userEmail && doc.type === 'ฟอร์ม 2' && doc.status !== 'รอตรวจ'); // สมมติว่าสถานะเปลี่ยนไปเมื่ออนุมัติ
        if (approvedForm2 && approvedForm2.selected_co_advisor2_id) {
            const coAdvisor2 = advisors.find(a => a.advisor_id === approvedForm2.selected_co_advisor2_id);
            document.getElementById('co-advisor-2').value = coAdvisor2 ? `${coAdvisor2.prefix_th || ''}${coAdvisor2.first_name_th || ''} ${coAdvisor2.last_name_th || ''}`.trim() : 'ไม่มี';
        } else {
            document.getElementById('co-advisor-2').value = 'ไม่มี';
        }
        
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสำหรับฟอร์ม 3:", error);
        alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
}

// =================================================================
// ภาค 2: Main Event Listener (ตัวจัดการการทำงานทั้งหมด)
// =================================================================
document.addEventListener('DOMContentLoaded', function() {

    // --- File Input Display Logic ---
    const fileInput = document.getElementById('outline-file');
    if(fileInput) {
        fileInput.addEventListener('change', () => {
            const fileNameDisplay = fileInput.nextElementSibling;
            if (fileInput.files.length > 0) {
                fileNameDisplay.textContent = `ไฟล์ที่เลือก: ${fileInput.files[0].name}`;
            } else {
                fileNameDisplay.textContent = 'ยังไม่ได้เลือกไฟล์';
            }
        });
    }

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

// --- [แก้ไข] Form Submission Logic ---
    const form3 = document.getElementById("form3");
    if (form3) {
        form3.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const userEmail = localStorage.getItem("current_user");
            const signatureData = localStorage.getItem(`${userEmail}_signature_data`);
            
            // --- Validation (ปรับปรุงใหม่) ---
            if (!signatureData) {
                alert("ไม่พบข้อมูลลายเซ็น กรุณาลงลายเซ็นก่อน");
                return;
            }
            const outlineFile = document.getElementById('outline-file').files[0];
            if (!outlineFile) {
                alert("กรุณาแนบไฟล์เค้าโครงวิทยานิพนธ์");
                return;
            }
            const programChairId = document.getElementById('program-chair-select').value;
            if (!programChairId) {
                alert("กรุณาเลือกประธานหลักสูตรเพื่อส่งเรื่องอนุมัติ");
                return;
            }

            const studentComment = document.getElementById('student-comment')?.value.trim() || "";

            // --- Construct submission object (ปรับปรุงใหม่) ---
            const submissionData = {
                doc_id: `form3_${userEmail}_${Date.now()}`,
                type: "ฟอร์ม 3",
                title: "แบบนำส่งเอกสารหัวข้อและเค้าโครงวิทยานิพนธ์ 1 เล่ม",
                student_email: userEmail,
                student_id: document.getElementById('student-id').value,
                student: document.getElementById('fullname').value,
                files: [{ type: 'เค้าโครงวิทยานิพนธ์ฉบับแก้ไข', name: outlineFile.name }],
                student_comment: studentComment,
                submitted_date: new Date().toISOString(),
                signature: signatureData,
                status: "รอตรวจ", // สถานะเริ่มต้น
                approvers: { // **ข้อมูลใหม่สำหรับ Workflow**
                    program_chair_id: programChairId 
                }
            };
            
            const existingPendingDocs = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
            existingPendingDocs.push(submissionData);
            localStorage.setItem('localStorage_pendingDocs', JSON.stringify(existingPendingDocs));
            
            console.log("Form 3 Submission Data (New):", submissionData);
            alert("✅ ยืนยันและนำส่งเอกสารเรียบร้อยแล้ว!");
            window.location.href = "/User_Page/html_user/status.html";
        });
    }

    // --- Initial data population ---
    populateForm3();
});