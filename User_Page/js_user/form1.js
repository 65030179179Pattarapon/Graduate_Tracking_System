// /User_Page/js_user/form1.js (Fully Modified Version for Committee Selection)

// =================================================================
// ภาค 1: Form 1 Specific Logic
// =================================================================

// --- Form 1 Specific Logic ---
async function populateForm1() {
    const userEmail = localStorage.getItem("current_user");
    if (!userEmail) {
        alert("ไม่พบข้อมูลผู้ใช้, กรุณาเข้าสู่ระบบใหม่");
        window.location.href = "/login/index.html";
        return;
    }

    try {
        const [students, advisors, departments, programs] = await Promise.all([
            fetch("/data/student.json").then(res => res.json()),
            fetch("/data/advisor.json").then(res => res.json()),
            fetch("/data/structures/departments.json").then(res => res.json()),
            fetch("/data/structures/programs.json").then(res => res.json())
        ]);

        const currentUser = students.find(s => s.email === userEmail);
        if (!currentUser) {
            alert("ไม่พบข้อมูลนักศึกษา");
            return;
        }

        // --- ค้นหาชื่อจาก ID ---
        const departmentName = departments.find(d => d.id === currentUser.department_id)?.name || `ID: ${currentUser.department_id}`;
        const programName = programs.find(p => p.id === currentUser.program_id)?.name || `ID: ${currentUser.program_id}`;

        // 1. Populate student information & Navbar
        document.getElementById('nav-username').textContent = userEmail;
        document.getElementById('fullname').value = `${currentUser.prefix_th || ''} ${currentUser.first_name_th || ''} ${currentUser.last_name_th || ''}`.trim();
        document.getElementById('student-id').value = currentUser.student_id || '';
        document.getElementById('degree').value = currentUser.degree || '';
        document.getElementById('program').value = programName; // แสดงเป็นชื่อ
        document.getElementById('department').value = departmentName; // แสดงเป็นชื่อ
        document.getElementById('faculty').value = currentUser.faculty || '';
        document.getElementById('plan').value = currentUser.plan || '';
        document.getElementById('phone').value = currentUser.phone || '';
        document.getElementById('email').value = currentUser.email || '';

        // 2. Populate advisor dropdowns
        const mainSelect = document.getElementById("main-advisor");
        const coSelect = document.getElementById("co-advisor");
        advisors.forEach(advisor => {
            if (advisor.advisor_id && advisor.first_name_th) { 
                const advisorFullName = `${advisor.prefix_th || ''}${advisor.first_name_th || ''} ${advisor.last_name_th || ''}`.trim();
                const opt1 = new Option(advisorFullName, advisor.advisor_id);
                const opt2 = new Option(advisorFullName, advisor.advisor_id);
                mainSelect.appendChild(opt1);
                coSelect.appendChild(opt2);
            }
        });

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสำหรับฟอร์ม:", error);
        alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
}

window.updateCoAdvisor = function() {
  const mainAdvisorId = document.getElementById("main-advisor").value;
  const coSelect = document.getElementById("co-advisor");
  for (let option of coSelect.options) {
    if(option.value) option.disabled = (option.value === mainAdvisorId);
  }
  if (coSelect.value === mainAdvisorId) coSelect.value = "";
}

// =================================================================
// ภาค 2: Main Event Listener
// =================================================================

document.addEventListener('DOMContentLoaded', function() {

    // Character Counter Logic for Comment Box
    const commentBox = document.getElementById('student-comment');
    const charCounter = document.getElementById('char-counter');
    if(commentBox && charCounter){
        commentBox.addEventListener('input', () => {
            const currentLength = commentBox.value.length;
            charCounter.textContent = `${currentLength} / 250`;
        });
    }

    // Form Submission Logic
    const advisorForm = document.getElementById("advisor-form");
    if(advisorForm){
        advisorForm.addEventListener("submit", (e) => {
          e.preventDefault();
        
          const userEmail = localStorage.getItem("current_user");
          const mainAdvisorId = document.getElementById("main-advisor").value;
        
          if (!mainAdvisorId) {
            alert("กรุณาเลือกอาจารย์ที่ปรึกษาหลัก");
            return;
          }
          const signatureData = localStorage.getItem(`${userEmail}_signature_data`);
          if (!signatureData) {
            alert("ไม่พบข้อมูลลายเซ็น กรุณาลงลายเซ็นก่อน");
            return;
          }
        
          const studentComment = document.getElementById('student-comment')?.value.trim() || "";

          const submissionData = {
            doc_id: `form1_${userEmail}_${Date.now()}`,
            type: "ฟอร์ม 1",
            title: "แบบฟอร์มขอรับรองการเป็นอาจารย์ที่ปรึกษาวิทยานิพนธ์ หลัก/ร่วม",
            student_email: userEmail,
            student_id: document.getElementById('student-id').value,
            student: document.getElementById('fullname').value,
            selected_main_advisor_id: mainAdvisorId,
            selected_co_advisor_id: document.getElementById("co-advisor").value || null,
            student_comment: studentComment,
            submitted_date: new Date().toISOString(),
            signature: signatureData,
            status: "รอตรวจ"
          };
        
          const existingPendingDocs = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
          existingPendingDocs.push(submissionData);
          localStorage.setItem('localStorage_pendingDocs', JSON.stringify(existingPendingDocs));
          
          console.log("Form 1 Submission Data Saved to localStorage:", submissionData);
          alert("✅ ยืนยันและส่งแบบฟอร์มเรียบร้อยแล้ว!");
          window.location.href = "/User_Page/html_user/status.html";
        });
    }

    // Populate form data on page load
    populateForm1();
});
