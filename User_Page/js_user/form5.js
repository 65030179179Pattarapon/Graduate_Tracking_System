// /User_Page/js_user/form5.js (Corrected with Full Navbar Logic)

// =================================================================
// ภาค 1: Standard Reusable Logic
// =================================================================

function formatThaiDate(isoString) {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
        const day = date.getDate();
        const month = thaiMonths[date.getMonth()];
        const year = date.getFullYear() + 543;
        return `${day} ${month} ${year}`;
    } catch (error) {
        return 'Invalid Date';
    }
}

function blockForm(message) {
    const formContainer = document.querySelector('.form-container');
    if (formContainer) {
        formContainer.innerHTML = `<div class="form-blocked-message">⚠️ ${message}</div>`;
    }
}

// =================================================================
// ภาค 2: Form 5 Specific Logic
// =================================================================
async function populateForm5() {
    // ... (ส่วนนี้ของคุณถูกต้องอยู่แล้ว ไม่มีการเปลี่ยนแปลง) ...
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
        if (currentUser.proposal_status !== 'ผ่าน') {
            blockForm("คุณต้องได้รับการอนุมัติหัวข้อวิทยานิพนธ์ (ฟอร์ม 2) ก่อน จึงจะดำเนินการในขั้นตอนนี้ได้");
            return;
        }
        document.getElementById('nav-username').textContent = userEmail;
        document.getElementById('fullname').value = `${currentUser.prefix_th} ${currentUser.first_name_th} ${currentUser.last_name_th}`.trim();
        document.getElementById('student-id').value = currentUser.student_id;
        document.getElementById('degree').value = currentUser.degree;
        const programName = programs.find(p => p.id === currentUser.program_id)?.name || 'N/A';
        document.getElementById('program').value = programName;
        document.getElementById('email').value = currentUser.email;
        document.getElementById('phone').value = currentUser.phone || 'N/A';
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

    // --- [แก้ไข] Interactive Checkbox and Quantity Logic ---
    const toolCheckboxes = document.querySelectorAll('input[name="research-tool"]');
    toolCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const itemWrapper = this.closest('.checkbox-item');
            const quantityInput = itemWrapper.querySelector('.quantity-input');
            
            if (quantityInput) {
                quantityInput.disabled = !this.checked;
                if (!this.checked) {
                    quantityInput.value = '1';
                }
            }
            
            // Logic พิเศษสำหรับช่อง "อื่นๆ"
            if (this.id === 'other-checkbox') {
                const otherToolText = document.getElementById('other-tool-text');
                if (otherToolText) {
                    otherToolText.disabled = !this.checked;
                    if (!this.checked) {
                        otherToolText.value = '';
                    }
                }
            }
        });
    });

    // --- [แก้ไข] Form 5 Submission Logic ---
    const form5 = document.getElementById("form5");
    if (form5) {
        form5.addEventListener("submit", (e) => {
            e.preventDefault();
            const userEmail = localStorage.getItem("current_user");
            
            // --- [Logic ใหม่] รวบรวมข้อมูลจาก Checkbox และช่องจำนวน ---
            const researchToolsData = [];
            const checkedBoxes = document.querySelectorAll('input[name="research-tool"]:checked');
            
            checkedBoxes.forEach(cb => {
                const itemWrapper = cb.closest('.checkbox-item');
                const quantityInput = itemWrapper.querySelector('.quantity-input');
                const quantity = parseInt(quantityInput.value, 10) || 1;
                
                let type = cb.value;
                if (cb.id === 'other-checkbox') {
                    const otherText = document.getElementById('other-tool-text').value.trim();
                    // ถ้าช่อง "อื่นๆ" ถูกติ๊ก แต่ไม่ได้กรอกข้อความ ให้ถือว่า type เป็น null
                    type = otherText ? `อื่นๆ: ${otherText}` : null;
                }
                
                // เพิ่มข้อมูลลง Array ต่อเมื่อมี Type ที่ถูกต้องเท่านั้น
                if (type) {
                    researchToolsData.push({ type, quantity });
                }
            });

            const studentComment = document.getElementById('student-comment')?.value.trim() || "";
            
            // --- [Validation ใหม่] ---
            if (researchToolsData.length === 0) {
                alert("กรุณาเลือกเครื่องมือที่ใช้ในการวิจัยอย่างน้อย 1 รายการ");
                return;
            }
            if (document.getElementById('other-checkbox').checked && !document.getElementById('other-tool-text').value.trim()) {
                alert("กรุณาระบุรายละเอียดในช่อง 'อื่นๆ'");
                return;
            }

            // --- [Construct submission object ใหม่] ---
            const submissionData = {
                doc_id: `form5_${userEmail}_${Date.now()}`,
                type: "ฟอร์ม 5",
                title: "แบบขอหนังสือขออนุญาตเก็บรวบรวมข้อมูล (วิทยานิพนธ์)",
                student_email: userEmail,
                student_id: document.getElementById('student-id').value,
                details: {
                    research_tools: researchToolsData, // ส่งข้อมูลเป็น Array of Objects
                },
                student_comment: studentComment,
                submitted_date: new Date().toISOString(),
                status: "รอตรวจ"
            };
            
            // --- Simulate sending data ---
            const existingPendingDocs = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
            existingPendingDocs.push(submissionData);
            localStorage.setItem('localStorage_pendingDocs', JSON.stringify(existingPendingDocs));
            
            console.log("Form 5 Submission Data (New):", submissionData);
            alert("✅ ยืนยันและส่งแบบฟอร์มเรียบร้อยแล้ว!");
            window.location.href = "/User_Page/html_user/status.html";
        });
    }

    // --- Initial data population ---
    populateForm5();
});