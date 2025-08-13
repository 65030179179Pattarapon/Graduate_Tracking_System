// /User_Page/js_user/form4.js (Self-Contained Version)

// =================================================================
// ภาค 1: Helper Functions (ฟังก์ชันช่วยเหลือ)
// =================================================================

/**
 * แสดง Modal ยืนยันการออกจากระบบ
 */
function logout() {
    const modal = document.getElementById('logout-confirm-modal');
    if (modal) {
        // ทำให้ modal แสดงขึ้นมาและเพิ่ม animation
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
        // รอให้ animation จบก่อนค่อยซ่อน element
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
}

/**
 * แปลงวันที่จาก ISO format เป็นรูปแบบ "วัน เดือน พ.ศ."
 * @param {string} isoString - วันที่ในรูปแบบ ISO (e.g., "2025-03-18T...")
 * @returns {string} - วันที่ในรูปแบบไทย หรือ 'N/A' ถ้าข้อมูลผิดพลาด
 */
function formatThaiDate(isoString) {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
        
        const day = date.getDate();
        const month = thaiMonths[date.getMonth()];
        const year = date.getFullYear() + 543; // แปลง ค.ศ. เป็น พ.ศ.
        return `${day} ${month} ${year}`;
    } catch (error) {
        console.error("Invalid date format:", isoString);
        return 'Invalid Date';
    }
}


// =================================================================
// ภาค 2: Form 4 Specific Logic (Logic หลักของฟอร์ม 4)
// =================================================================

/**
 * ดึงข้อมูลมาแสดงผลในฟอร์ม
 */
async function populateForm4() {
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
            alert("ไม่พบข้อมูลนักศึกษาในระบบ");
            return;
        }

        // --- Populate Form Fields ---
        // 1. Navbar Username
        document.getElementById('nav-username').textContent = userEmail;
        
        // 2. ข้อมูลนักศึกษา
        document.getElementById('fullname').value = `${currentUser.prefix_th} ${currentUser.first_name_th} ${currentUser.last_name_th}`.trim();
        document.getElementById('student-id').value = currentUser.student_id;
        document.getElementById('degree').value = currentUser.degree || 'N/A';
        const programName = programs.find(p => p.id === currentUser.program_id)?.name || 'N/A';
        document.getElementById('program').value = programName;
        const departmentName = departments.find(d => d.id === currentUser.department_id)?.name || 'N/A';
        document.getElementById('department').value = departmentName;

        // 3. ข้อมูลวิทยานิพนธ์
        document.getElementById('proposal-approval-date').value = formatThaiDate(currentUser.proposal_approval_date);
        document.getElementById('thesis-title-th').value = currentUser.thesis_title_th || 'ยังไม่มีข้อมูล';
        document.getElementById('thesis-title-en').value = currentUser.thesis_title_en || 'ยังไม่มีข้อมูล';
        
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสำหรับฟอร์ม 4:", error);
        alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
}

// =================================================================
// ภาค 3: Main Event Listener (ตัวจัดการการทำงานทั้งหมด)
// =================================================================
document.addEventListener('DOMContentLoaded', function() {
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
    // Close dropdown when clicking outside
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
    if (logoutButton) logoutButton.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (confirmBtn) confirmBtn.addEventListener('click', () => { localStorage.clear(); window.location.href = "/login/index.html"; });
    if (modal) modal.addEventListener('click', function(e) { if (e.target === this) closeModal(); });

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
    const otherDocText = document.getElementById('other-doc-text');
    if (otherCheckbox && otherDocText) {
        otherCheckbox.addEventListener('change', function() {
            otherDocText.disabled = !this.checked;
            if (!this.checked) {
                otherDocText.value = '';
            }
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
            const studentComment = document.getElementById('student-comment')?.value.trim() || "";
            const selectedDocTypes = Array.from(document.querySelectorAll('input[name="document-type"]:checked'))
                .map(cb => {
                    if (cb.id === 'other-checkbox') {
                        const otherText = document.getElementById('other-doc-text').value.trim();
                        return otherText ? `อื่นๆ: ${otherText}` : null;
                    }
                    return cb.value;
                }).filter(Boolean); // กรองค่า null หรือ empty string ออกไป

            // --- Validation ---
            if (!numEvaluators || numEvaluators < 1) {
                alert("กรุณาระบุจำนวนผู้ทรงคุณวุฒิ");
                return;
            }
            if (selectedDocTypes.length === 0) {
                alert("กรุณาเลือกประเภทของเครื่องมือที่ต้องการประเมินอย่างน้อย 1 รายการ");
                return;
            }
            if (document.getElementById('other-checkbox').checked && !document.getElementById('other-doc-text').value.trim()) {
                alert("กรุณาระบุรายละเอียดในช่อง 'อื่นๆ'");
                return;
            }
            if (!numDocs || numDocs < 1) {
                alert("กรุณาระบุจำนวนหนังสือขอเชิญที่ต้องการ");
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
                student_comment: studentComment,
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