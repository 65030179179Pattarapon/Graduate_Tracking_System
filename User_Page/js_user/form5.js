// /User_Page/js_user/form5.js

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

// ฟังก์ชันใหม่สำหรับแปลงวันที่เป็นรูปแบบไทย
function formatThaiDate(isoString) {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
        
        const day = date.getDate();
        const month = thaiMonths[date.getMonth()];
        const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.

        return `${day} ${month} ${year}`;
    } catch (error) {
        return 'Invalid Date';
    }
}

// =================================================================
// ภาค 2: Form 5 Specific Logic (Logic เฉพาะของหน้านี้)
// =================================================================
async function populateForm5() {
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
        if (currentUser.proposal_status !== 'ผ่าน') {
            blockForm("คุณต้องได้รับการอนุมัติหัวข้อวิทยานิพนธ์ (ฟอร์ม 2) ก่อน จึงจะดำเนินการในขั้นตอนนี้ได้");
            return;
        }

        // --- Populate Form Fields ---
        // 1. Navbar Username
        document.getElementById('nav-username').textContent = userEmail;
        
        // 2. ข้อมูลส่วนตัว (ตาม Requirement ใหม่)
        document.getElementById('fullname').value = `${currentUser.prefix_th} ${currentUser.first_name_th} ${currentUser.last_name_th}`.trim();
        document.getElementById('student-id').value = currentUser.student_id;
        document.getElementById('degree').value = currentUser.degree;
        const programName = programs.find(p => p.id === currentUser.program_id)?.name || 'N/A';
        document.getElementById('program').value = programName;
        document.getElementById('email').value = currentUser.email;
        document.getElementById('phone').value = currentUser.phone || 'N/A';

        // 3. ข้อมูลวิทยานิพนธ์ (ตาม Requirement ใหม่)
        document.getElementById('proposal-approval-date').value = formatThaiDate(currentUser.proposal_approval_date);
        document.getElementById('thesis-title-th').value = currentUser.thesis_title_th || 'N/A';
        document.getElementById('thesis-title-en').value = currentUser.thesis_title_en || 'N/A';
        
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสำหรับฟอร์ม 5:", error);
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
    if (commentBox && charCounter) {
        commentBox.addEventListener('input', () => {
            const currentLength = commentBox.value.length;
            const maxLength = commentBox.maxLength;
            charCounter.textContent = `${currentLength} / ${maxLength}`;
        });
    }

    // --- Interactive "Other" Checkbox Logic ---
    const otherCheckbox = document.getElementById('other-checkbox');
    const otherToolText = document.getElementById('other-tool-text');
    if (otherCheckbox && otherToolText) {
        otherCheckbox.addEventListener('change', function() {
            otherToolText.disabled = !this.checked;
            if (!this.checked) {
                otherToolText.value = '';
            }
        });
    }

    // --- Form 5 Submission Logic ---
    const form5 = document.getElementById("form5");
    if (form5) {
        form5.addEventListener("submit", (e) => {
            e.preventDefault();
            const userEmail = localStorage.getItem("current_user");
            
            // --- Collect form data ---
            const selectedTools = Array.from(document.querySelectorAll('input[name="research-tool"]:checked'))
                .map(cb => {
                    if (cb.id === 'other-checkbox') {
                        const otherText = document.getElementById('other-tool-text').value.trim();
                        return otherText ? `อื่นๆ: ${otherText}` : null;
                    }
                    return cb.value;
                }).filter(Boolean); // กรองค่า null ออก

            const numDocs = document.getElementById('num-docs').value;
            const studentComment = document.getElementById('student-comment')?.value.trim() || "";
            
            // --- Validation ---
            if (selectedTools.length === 0) {
                alert("กรุณาเลือกเครื่องมือที่ใช้ในการวิจัยอย่างน้อย 1 รายการ");
                return;
            }
            if (document.getElementById('other-checkbox').checked && !document.getElementById('other-tool-text').value.trim()) {
                alert("กรุณาระบุรายละเอียดในช่อง 'อื่นๆ'");
                return;
            }
            if (!numDocs || numDocs < 1) {
                alert("กรุณาระบุจำนวนหนังสือขออนุญาตที่ต้องการ");
                return;
            }

            // --- Construct submission object ---
            const submissionData = {
                doc_id: `form5_${userEmail}_${Date.now()}`,
                type: "ฟอร์ม 5",
                title: "แบบขอหนังสืออนุญาตเพื่อเก็บรวบรวมข้อมูลฯ",
                student_email: userEmail,
                student_id: document.getElementById('student-id').value,
                details: {
                    research_tools: selectedTools,
                    num_letters: parseInt(numDocs, 10)
                },
                student_comment: studentComment,
                submitted_date: new Date().toISOString(),
                status: "รอตรวจ"
            };
            
            // --- Simulate sending data ---
            const existingPendingDocs = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
            existingPendingDocs.push(submissionData);
            localStorage.setItem('localStorage_pendingDocs', JSON.stringify(existingPendingDocs));
            
            console.log("Form 5 Submission Data:", submissionData);
            alert("✅ ยืนยันและส่งแบบฟอร์มเรียบร้อยแล้ว!");
            window.location.href = "/User_Page/html_user/status.html";
        });
    }

    // --- Initial data population ---
    populateForm5();
});