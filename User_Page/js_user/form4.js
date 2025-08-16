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

/**
 * [ฟังก์ชันใหม่] สร้างฟอร์มกรอกข้อมูลผู้ทรงคุณวุฒิแบบไดนามิก
 * @param {number} count - จำนวนฟอร์มที่ต้องการสร้าง
 */
function generateEvaluatorForms(count) {
    const container = document.getElementById('evaluators-container');
    if (!container) return;

    container.innerHTML = ''; // ล้างข้อมูลเก่าทิ้งทุกครั้ง

    if (count > 0 && count <= 10) {
        let formsHtml = '';
        for (let i = 1; i <= count; i++) {
            formsHtml += `
                <div class="evaluator-card">
                    <h4>ข้อมูลผู้ทรงคุณวุฒิ คนที่ ${i}</h4>
                    <div class="form-group">
                        <label for="evaluator-prefix-${i}">คำนำหน้า/ยศ/ตำแหน่ง*</label>
                        <input type="text" id="evaluator-prefix-${i}" placeholder="เช่น ศาสตราจารย์ ดร., รองศาสตราจารย์, นาย" required>
                    </div>
                    <div class="info-grid">
                        <div>
                            <label for="evaluator-firstname-${i}">ชื่อ*</label>
                            <input type="text" id="evaluator-firstname-${i}" placeholder="ชื่อจริง" required>
                        </div>
                        <div>
                            <label for="evaluator-lastname-${i}">นามสกุล*</label>
                            <input type="text" id="evaluator-lastname-${i}" placeholder="นามสกุล" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="evaluator-affiliation-${i}">สถาบัน/หน่วยงาน*</label>
                        <input type="text" id="evaluator-affiliation-${i}" placeholder="เช่น สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง" required>
                    </div>
                    <div class="info-grid">
                        <div>
                            <label for="evaluator-phone-${i}">เบอร์โทรศัพท์*</label>
                            <input type="tel" id="evaluator-phone-${i}" placeholder="08XXXXXXXX" required>
                        </div>
                        <div>
                            <label for="evaluator-email-${i}">อีเมล*</label>
                            <input type="email" id="evaluator-email-${i}" placeholder="example@email.com" required>
                        </div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = formsHtml;
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

 // --- [แก้ไข] Interactive Checkbox Logic (สำหรับช่องจำนวน) ---
    const docTypeCheckboxes = document.querySelectorAll('input[name="document-type"]');
    docTypeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            let quantityInput;
            if (this.id === 'other-checkbox') {
                const otherText = document.getElementById('other-doc-text');
                otherText.disabled = !this.checked;
                 if (!this.checked) otherText.value = '';
                quantityInput = this.closest('.checkbox-item').querySelector('.quantity-input');
            } else {
                quantityInput = this.closest('.checkbox-item').querySelector('.quantity-input');
            }

            if(quantityInput) {
                quantityInput.disabled = !this.checked;
                if (!this.checked) {
                    quantityInput.value = '1';
                }
            }
        });
    });


     // --- [Logic ใหม่] Event Listener สำหรับสร้างฟอร์มไดนามิก ---
    const numEvaluatorsInput = document.getElementById('num-evaluators');
    if (numEvaluatorsInput) {
        numEvaluatorsInput.addEventListener('input', () => {
            const count = parseInt(numEvaluatorsInput.value, 10);
            generateEvaluatorForms(count);
        });
    }

 // --- [แก้ไข] Form 4 Submission Logic ---
    const form4 = document.getElementById("form4");
    if (form4) {
        form4.addEventListener("submit", (e) => {
            e.preventDefault();
            const userEmail = localStorage.getItem("current_user");
            
            // --- Collect form data ---
            const numEvaluators = document.getElementById('num-evaluators').value;
            const studentComment = document.getElementById('student-comment')?.value.trim() || "";
            
            // --- [Logic ใหม่] Collect data from checkboxes and quantity inputs ---
            const documentTypesData = [];
            const checkedBoxes = document.querySelectorAll('input[name="document-type"]:checked');
            checkedBoxes.forEach(cb => {
                const itemWrapper = cb.closest('.checkbox-item');
                const quantityInput = itemWrapper.querySelector('.quantity-input');
                const quantity = parseInt(quantityInput.value, 10) || 1;

                let type = cb.value;
                if (cb.id === 'other-checkbox') {
                    const otherText = document.getElementById('other-doc-text').value.trim();
                    if (otherText) {
                        type = `อื่นๆ: ${otherText}`;
                    } else {
                        type = null; // ตั้งค่าเป็น null ถ้า "อื่นๆ" ถูกติ๊กแต่ไม่มีข้อความ
                    }
                }
                
                if (type) { // เพิ่ม object ต่อเมื่อมี type ที่ถูกต้องเท่านั้น
                    documentTypesData.push({ type, quantity });
                }
            });

            // --- Validation (ปรับปรุงใหม่) ---
            if (documentTypesData.length === 0) {
                alert("กรุณาเลือกประเภทของเครื่องมือที่ต้องการประเมินอย่างน้อย 1 รายการ");
                return;
            }
            if (document.getElementById('other-checkbox').checked && !document.getElementById('other-doc-text').value.trim()) {
                alert("กรุณาระบุรายละเอียดในช่อง 'อื่นๆ'");
                return;
            }
            if (!numEvaluators || numEvaluators < 1) {
                alert("กรุณาระบุจำนวนผู้ทรงคุณวุฒิ");
                return;
            }

            // --- Collect data from dynamic forms and validate ---
            const evaluatorsData = [];
            for (let i = 1; i <= numEvaluators; i++) {
                const prefix = document.getElementById(`evaluator-prefix-${i}`).value.trim();
                const firstname = document.getElementById(`evaluator-firstname-${i}`).value.trim();
                const lastname = document.getElementById(`evaluator-lastname-${i}`).value.trim();
                const affiliation = document.getElementById(`evaluator-affiliation-${i}`).value.trim();
                const phone = document.getElementById(`evaluator-phone-${i}`).value.trim();
                const email = document.getElementById(`evaluator-email-${i}`).value.trim();
                if (!prefix || !firstname || !lastname || !affiliation || !phone || !email) {
                    alert(`กรุณากรอกข้อมูลผู้ทรงคุณวุฒิคนที่ ${i} ให้ครบถ้วน`);
                    return;
                }
                evaluatorsData.push({ prefix, firstName: firstname, lastName: lastname, affiliation, phone, email });
            }

            // --- Construct submission object (ปรับปรุงใหม่) ---
            const submissionData = {
                doc_id: `form4_${userEmail}_${Date.now()}`,
                type: "ฟอร์ม 4",
                title: "แบบขอหนังสือเชิญเป็นผู้ทรงคุณวุฒิตรวจและประเมิน...เพื่อการวิจัย",
                student_email: userEmail,
                student_id: document.getElementById('student-id').value,
                details: {
                    document_types: documentTypesData, // **ส่งข้อมูลใหม่**
                    evaluators: evaluatorsData
                },
                student_comment: studentComment,
                submitted_date: new Date().toISOString(),
                status: "รอตรวจ"
            };
            
            // --- Simulate sending data ---
            const existingPendingDocs = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
            existingPendingDocs.push(submissionData);
            localStorage.setItem('localStorage_pendingDocs', JSON.stringify(existingPendingDocs));
            
            console.log("Form 4 Submission Data (Latest):", submissionData);
            alert("✅ ยืนยันและส่งแบบฟอร์มเรียบร้อยแล้ว!");
            window.location.href = "/User_Page/html_user/status.html";
        });
    }

    // --- Initial data population ---
    populateForm4();
});