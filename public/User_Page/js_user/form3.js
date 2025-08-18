// /User_Page/js_user/form3.js (Corrected and Self-Contained Version)

// =================================================================
// ภาค 1: Helper Functions (ฟังก์ชันช่วยเหลือ)
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

// =================================================================
// ภาค 2: Form 3 Specific Logic (Logic หลักของฟอร์ม 3)
// =================================================================
async function populateForm3() {
    const userEmail = localStorage.getItem("current_user");
    if (!userEmail) {
        alert("ไม่พบข้อมูลผู้ใช้, กรุณาเข้าสู่ระบบใหม่");
        window.location.href = "/login/index.html";
        return;
    }

    try {
        const [students, programs, departments] = await Promise.all([
            fetch("/data/student.json").then(res => res.json()),
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
        document.getElementById('fullname').value = `${currentUser.prefix_th || ''} ${currentUser.first_name_th || ''} ${currentUser.last_name_th || ''}`.trim();
        document.getElementById('student-id').value = currentUser.student_id || '';
        document.getElementById('degree').value = currentUser.degree || 'N/A';
        const programName = programs.find(p => p.id === currentUser.program_id)?.name || `ID: ${currentUser.program_id}`;
        document.getElementById('program').value = programName;
        const departmentName = departments.find(d => d.id === currentUser.department_id)?.name || 'N/A';
        document.getElementById('department').value = departmentName;

        // ฟังก์ชันแปลงวันที่ (ควรย้ายไปไฟล์กลาง)
        const formatThaiDate = (isoString) => {
             if (!isoString) return 'ยังไม่มีข้อมูลการอนุมัติหัวข้อ';
             const date = new Date(isoString);
             return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
        }

        document.getElementById('proposal-date').value = formatThaiDate(currentUser.proposal_approval_date);
        document.getElementById('thesis-title-th').value = currentUser.thesis_title_th || 'ยังไม่มีข้อมูลการอนุมัติหัวข้อ';
        document.getElementById('thesis-title-en').value = currentUser.thesis_title_en || 'ยังไม่มีข้อมูลการอนุมัติหัวข้อ';
        
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสำหรับฟอร์ม 3:", error);
        alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
}

// =================================================================
// ภาค 3: Main Event Listener (ตัวจัดการการทำงานทั้งหมด)
// =================================================================
document.addEventListener('DOMContentLoaded', function() {
    
    // --- ส่วนที่ขาดไปและได้เติมให้สมบูรณ์แล้ว ---
    // --- Navbar Dropdown Logic ---
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

    // --- Logout Modal Logic ---
    const logoutButton = document.getElementById("logout-button");
    const modal = document.getElementById('logout-confirm-modal');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');

    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = "/login/index.html";
        });
    }
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
    // --- จบส่วนที่เติมเข้ามา ---


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

    // --- Form Submission Logic ---
    const form3 = document.getElementById("form3");
    if (form3) {
        form3.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const userEmail = localStorage.getItem("current_user");
            const signatureData = localStorage.getItem(`${userEmail}_signature_data`);
            if (!signatureData) {
                alert("ไม่พบข้อมูลลายเซ็น กรุณาลงลายเซ็นก่อน");
                return;
            }
            
            const outlineFile = document.getElementById('outline-file').files[0];
            if (!outlineFile) {
                alert("กรุณาแนบไฟล์เค้าโครงวิทยานิพนธ์");
                return;
            }

            const studentComment = document.getElementById('student-comment')?.value.trim() || "";

            const submissionData = {
                doc_id: `form3_${userEmail}_${Date.now()}`,
                type: "ฟอร์ม 3",
                title: "แบบนำส่งเอกสารหัวข้อและเค้าโครงวิทยานิพนธ์ 1 เล่ม",
                student_email: userEmail,
                student_id: document.getElementById('student-id').value,
                student: document.getElementById('fullname').value,
                files: [{ type: 'เค้าโครงวิทยานิพนธ์', name: outlineFile.name }],
                student_comment: studentComment,
                submitted_date: new Date().toISOString(),
                signature: signatureData,
                status: "รอตรวจ"
            };
            
            const existingPendingDocs = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
            existingPendingDocs.push(submissionData);
            localStorage.setItem('localStorage_pendingDocs', JSON.stringify(existingPendingDocs));
            
            console.log("Form 3 Submission Data:", submissionData);
            alert("✅ ยืนยันและนำส่งเอกสารเรียบร้อยแล้ว!");
            window.location.href = "/User_Page/html_user/status.html";
        });
    }

    // --- Initial data population ---
    populateForm3();
});