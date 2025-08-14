// /User_Page/js_user/eng.js (Fully Self-Contained & Saves Data)

// =================================================================
// ภาค 1: Helper Functions
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
// ภาค 2: English Form Specific Logic
// =================================================================

// เก็บไฟล์ที่ผู้ใช้เลือกไว้ในตัวแปรนี้
let selectedFiles = []; 
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * ดึงข้อมูลนักศึกษามาแสดงในฟอร์ม
 */
async function populateStudentInfo() {
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
            fetch("/data/structures/departments.json").then(res => res.json()),
        ]);

        const currentUser = students.find(s => s.email === userEmail);
        if (!currentUser) { alert("ไม่พบข้อมูลนักศึกษา"); return; }

        document.getElementById('nav-username').textContent = userEmail;
        document.getElementById('fullname').value = `${currentUser.prefix_th} ${currentUser.first_name_th} ${currentUser.last_name_th}`.trim();
        document.getElementById('student-id').value = currentUser.student_id;
        document.getElementById('degree').value = currentUser.degree || 'N/A';
        const programName = programs.find(p => p.id === currentUser.program_id)?.name || 'N/A';
        document.getElementById('program').value = programName;
        const departmentName = departments.find(d => d.id === currentUser.department_id)?.name || 'N/A';
        document.getElementById('department').value = departmentName;
        document.getElementById('faculty').value = currentUser.faculty || 'N/A';
        document.getElementById('plan').value = currentUser.plan || 'N/A';
        document.getElementById('phone').value = currentUser.phone || 'N/A';
        document.getElementById('email').value = currentUser.email || 'N/A';

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลนักศึกษา:", error);
        alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
}

/**
 * สร้างช่องกรอกคะแนนตามประเภทการสอบที่เลือก
 * @param {string} examType - ประเภทการสอบที่เลือก
 */
function renderScoreInputs(examType) {
    const container = document.getElementById('score-input-container');
    container.innerHTML = ''; // ล้างของเก่าทิ้งก่อน

    if (!examType) {
        container.innerHTML = '<p class="placeholder-text">กรุณาเลือกประเภทการสอบเพื่อกรอกคะแนน</p>';
        return;
    }

    let html = '';
    switch (examType) {
        case 'TOEFL':
            html = `
                <label>คะแนน TOEFL iBT*</label>
                <div class="score-grid">
                    <div><label for="toefl-reading">Reading (0-30)</label><input type="number" id="toefl-reading" min="0" max="30" placeholder="0-30" required></div>
                    <div><label for="toefl-listening">Listening (0-30)</label><input type="number" id="toefl-listening" min="0" max="30" placeholder="0-30" required></div>
                    <div><label for="toefl-speaking">Speaking (0-30)</label><input type="number" id="toefl-speaking" min="0" max="30" placeholder="0-30" required></div>
                    <div><label for="toefl-writing">Writing (0-30)</label><input type="number" id="toefl-writing" min="0" max="30" placeholder="0-30" required></div>
                </div>`;
            break;
        case 'IELTS':
            html = `
                <label>คะแนน IELTS (Academic)*</label>
                <div class="score-grid score-grid-ielts">
                    <div><label for="ielts-reading">Reading (0-9)</label><input type="number" id="ielts-reading" step="0.5" min="0" max="9" placeholder="0.0-9.0" required></div>
                    <div><label for="ielts-listening">Listening (0-9)</label><input type="number" id="ielts-listening" step="0.5" min="0" max="9" placeholder="0.0-9.0" required></div>
                    <div><label for="ielts-speaking">Speaking (0-9)</label><input type="number" id="ielts-speaking" step="0.5" min="0" max="9" placeholder="0.0-9.0" required></div>
                    <div><label for="ielts-writing">Writing (0-9)</label><input type="number" id="ielts-writing" step="0.5" min="0" max="9" placeholder="0.0-9.0" required></div>
                    <div class="full-width"><label for="ielts-overall">Overall Band (0-9)</label><input type="number" id="ielts-overall" step="0.5" min="0" max="9" placeholder="ระบุคะแนนรวม" required></div>
                </div>`;
            break;
        default: // สำหรับ CU-TEP, TU-GET, KMITL-TEP, และอื่นๆ
            html = `
                <div class="form-group">
                    <label for="total-score">คะแนนรวม*</label>
                    <input type="number" id="total-score" placeholder="ระบุคะแนนที่ได้รับ" required>
                </div>`;
            break;
    }
    container.innerHTML = html;
}


/**
 * แสดงรายการไฟล์ที่เลือก และจัดการการลบไฟล์
 */
function renderFileList() {
    const fileListElement = document.getElementById('file-list');
    fileListElement.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const li = document.createElement('li');
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        
        li.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file-alt file-icon"></i>
                <span class="file-name">${file.name}</span>
                <span class="file-size">(${fileSize} MB)</span>
            </div>
            <button type="button" class="delete-file-btn" data-index="${index}">&times;</button>
        `;
        
        li.querySelector('.delete-file-btn').addEventListener('click', (e) => {
            const indexToRemove = parseInt(e.target.dataset.index, 10);
            selectedFiles.splice(indexToRemove, 1);
            renderFileList();
        });

        fileListElement.appendChild(li);
    });
}


// =================================================================
// ภาค 3: Main Event Listener
// =================================================================
document.addEventListener('DOMContentLoaded', function() {
    // --- Standard Navbar & Modal Logic ---
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

    // --- Form Interactivity ---
    const examTypeSelect = document.getElementById('exam-type');
    const otherExamTypeContainer = document.getElementById('other-exam-type-container');
    const fileInput = document.getElementById('exam-file-input');

    if (examTypeSelect) {
        examTypeSelect.addEventListener('change', (e) => {
            const selectedType = e.target.value;
            renderScoreInputs(selectedType);
            otherExamTypeContainer.style.display = (selectedType === 'OTHER') ? 'block' : 'none';
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const newFiles = Array.from(e.target.files);
            newFiles.forEach(file => {
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    alert(`ไฟล์ ${file.name} มีขนาดใหญ่เกิน ${MAX_FILE_SIZE_MB}MB`);
                    return;
                }
                if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                    selectedFiles.push(file);
                }
            });
            renderFileList();
            fileInput.value = '';
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

    // --- Form Submission ---
    const engForm = document.getElementById('eng-form');
    if (engForm) {
        engForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const userEmail = localStorage.getItem("current_user");

            // --- Validation ---
            const examType = document.getElementById('exam-type').value;
            if (!examType) {
                alert("กรุณาเลือกประเภทการสอบ");
                return;
            }
            if (examType === 'OTHER' && document.getElementById('other-exam-type-text').value.trim() === '') {
                alert("กรุณาระบุชื่อการสอบอื่นๆ");
                return;
            }
            if (selectedFiles.length === 0) {
                alert("กรุณาแนบไฟล์หลักฐานผลสอบอย่างน้อย 1 ไฟล์");
                return;
            }

            // --- Construct submission object ---
            const submissionData = {
                doc_id: `eng_test_${userEmail}_${Date.now()}`,
                type: "ผลสอบภาษาอังกฤษ", // เปลี่ยน type ให้ตรงกับ case
                title: `ยื่นผลสอบ ${examType === 'OTHER' ? document.getElementById('other-exam-type-text').value.trim() : examType}`,
                student_email: userEmail,
                student_id: document.getElementById('student-id').value,
                details: {
                    exam_type: examType,
                    other_exam_type: document.getElementById('other-exam-type-text').value.trim() || null,
                    exam_date: document.getElementById('exam-date').value,
                    scores: {},
                },
                files: selectedFiles.map(f => ({ type: 'หลักฐานผลการสอบ', name: f.name, size: f.size })),
                student_comment: document.getElementById('student-comment')?.value.trim() || "",
                submitted_date: new Date().toISOString(),
                status: "รอตรวจ"
            };

            const scoreContainer = document.getElementById('score-input-container');
            scoreContainer.querySelectorAll('input[type="number"]').forEach(input => {
                submissionData.details.scores[input.id] = input.value;
            });
            
            // --- Simulate sending data ---
            const existingPendingDocs = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
            existingPendingDocs.push(submissionData);
            localStorage.setItem('localStorage_pendingDocs', JSON.stringify(existingPendingDocs));
            
            console.log("English Test Submission Data:", submissionData);
            alert("✅ ยื่นผลสอบภาษาอังกฤษเรียบร้อยแล้ว! สามารถติดตามสถานะได้ที่หน้าสถานะเอกสาร");
            window.location.href = "/User_Page/html_user/status.html";
        });
    }

    populateStudentInfo();
});