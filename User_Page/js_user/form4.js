// /User_Page/js_user/form4.js

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

function blockForm(message) {
    alert(message);
    const form = document.querySelector('form');
    if (form) {
        Array.from(form.elements).forEach(element => element.disabled = true);
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'ไม่สามารถใช้งานได้';
            submitButton.style.backgroundColor = '#ccc';
            submitButton.style.cursor = 'not-allowed';
        }
    }
}

// =================================================================
// ภาค 2: Form 4 Specific Logic (Logic เฉพาะของหน้านี้)
// =================================================================
async function populateForm4() {
    const userEmail = localStorage.getItem("current_user");
    if (!userEmail) {
        alert("ไม่พบข้อมูลผู้ใช้, กรุณาเข้าสู่ระบบใหม่");
        window.location.href = "/login/index.html";
        return;
    }

    try {
        const [students, programs] = await Promise.all([
            fetch("/data/student.json").then(res => res.json()),
            fetch("/data/structures/programs.json").then(res => res.json())
        ]);

        const currentUser = students.find(s => s.email === userEmail);
        if (!currentUser) {
            alert("ไม่พบข้อมูลนักศึกษา");
            blockForm("เกิดข้อผิดพลาด: ไม่พบข้อมูลนักศึกษาของคุณ");
            return;
        }
        
        // --- Workflow Condition Check ---
        // ตรวจสอบว่าหัวข้อวิทยานิพนธ์ได้รับการอนุมัติแล้วหรือยัง
        if (currentUser.proposal_status !== 'ผ่าน') {
            blockForm("คุณต้องได้รับการอนุมัติหัวข้อวิทยานิพนธ์ (ฟอร์ม 2) ก่อน จึงจะดำเนินการในขั้นตอนนี้ได้");
            return;
        }

        // --- Populate Form Fields ---
        // 1. Navbar Username
        document.getElementById('nav-username').textContent = userEmail;
        
        // 2. Student Info
        document.getElementById('fullname').value = `${currentUser.prefix_th} ${currentUser.first_name_th} ${currentUser.last_name_th}`.trim();
        document.getElementById('student-id').value = currentUser.student_id;
        const programName = programs.find(p => p.id === currentUser.program_id)?.name || 'N/A';
        document.getElementById('program').value = programName;

        // 3. Approved Thesis Info
        document.getElementById('thesis-title-th').value = currentUser.thesis_title_th || 'N/A';
        
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสำหรับฟอร์ม 4:", error);
        blockForm("เกิดข้อผิดพลาดในการโหลดข้อมูล โปรดลองอีกครั้ง");
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
            // Close other open dropdowns
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                if (menu !== dropdownMenu) menu.classList.remove('show');
            });
            if (dropdownMenu) dropdownMenu.classList.toggle('show');
        });
    });
    // Close dropdown when clicking outside
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

    // --- Form 4 Specific Interactivity ---
    // Logic for "Other" checkbox
    const otherCheckbox = document.getElementById('other-checkbox');
    const otherDocText = document.getElementById('other-doc-text');
    if (otherCheckbox && otherDocText) {
        otherCheckbox.addEventListener('change', function() {
            otherDocText.disabled = !this.checked;
            if (!this.checked) {
                otherDocText.value = '';
            }
        });
    }

        // Character Counter Logic for Comment Box
    const commentBox = document.getElementById('student-comment');
    const charCounter = document.getElementById('char-counter');
    if(commentBox && charCounter){
        commentBox.addEventListener('input', () => {
            const currentLength = commentBox.value.length;
            charCounter.textContent = `${currentLength} / 250`;
        });
    }
    
    // --- Form 4 Submission Logic ---
    const form4 = document.getElementById("form4");
    if (form4) {
        form4.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const userEmail = localStorage.getItem("current_user");
            
            // --- Collect form data ---
            const numEvaluators = document.getElementById('num-evaluators').value;
            const numDocs = document.getElementById('num-docs').value;
            const selectedDocTypes = Array.from(document.querySelectorAll('input[name="document-type"]:checked'))
                .map(cb => {
                    if (cb.id === 'other-checkbox') {
                        const otherText = document.getElementById('other-doc-text').value.trim();
                        return otherText ? `อื่นๆ: ${otherText}` : null;
                    }
                    return cb.value;
                }).filter(Boolean); // Filter out null/empty values

            // --- Validation ---
            if (selectedDocTypes.length === 0) {
                alert("กรุณาเลือกประเภทของเครื่องมือที่ต้องการประเมินอย่างน้อย 1 รายการ");
                return;
            }
            if (document.getElementById('other-checkbox').checked && !document.getElementById('other-doc-text').value.trim()) {
                alert("กรุณาระบุรายละเอียดในช่อง 'อื่นๆ'");
                return;
            }

            // --- Construct submission object ---
            const submissionData = {
                doc_id: `form4_${userEmail}_${Date.now()}`,
                type: "ฟอร์ม 4",
                title: "แบบขอหนังสือเชิญเป็นผู้ทรงคุณวุฒิฯ",
                student_email: userEmail,
                student_id: document.getElementById('student-id').value,
                details: {
                    num_evaluators: parseInt(numEvaluators, 10),
                    num_letters: parseInt(numDocs, 10),
                    document_types: selectedDocTypes
                },
                submitted_date: new Date().toISOString(),
                status: "รอตรวจ"
            };
            
            // --- Simulate sending data ---
            const existingPendingDocs = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
            existingPendingDocs.push(submissionData);
            localStorage.setItem('localStorage_pendingDocs', JSON.stringify(existingPendingDocs));
            
            console.log("Form 4 Submission Data:", submissionData);
            alert("✅ ยืนยันและส่งแบบฟอร์มเรียบร้อยแล้ว!");
            window.location.href = "/User_Page/html_user/status.html";
        });
    }

    // --- Initial data population ---
    populateForm4();
});