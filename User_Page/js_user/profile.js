// /User_Page/js_user/profile.js (Complete Version)

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

function formatThaiDate(isoString) {
    if (!isoString) return '-';
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    } catch (error) {
        return 'Invalid Date';
    }
}

function getStatusClass(statusText) {
    if (!statusText || statusText.trim() === '-') return ''; // ถ้าค่าเป็น null หรือ '-' ให้ส่งค่าว่าง

    const approvedStates = ['สำเร็จการศึกษา', 'ผ่าน', 'ผ่านเกณฑ์', 'อนุมัติแล้ว'];
    const rejectedStates = ['ไม่ผ่าน', 'ไม่ผ่านเกณฑ์', 'ไม่อนุมัติ'];

    if (approvedStates.includes(statusText)) {
        return 'approved';
    }
    if (rejectedStates.includes(statusText)) {
        return 'rejected';
    }
    
    // สถานะอื่นๆ ที่เหลือ (เช่น รอตรวจ, รอตรวจสอบ) ให้เป็น pending
    return 'pending'; 
}

// =================================================================
// ภาค 2: Profile Page Logic
// =================================================================

let cropper = null; // Global variable for Cropper instance

async function loadProfileData() {
    const userEmail = localStorage.getItem("current_user");
    if (!userEmail) {
        window.location.href = "/login/index.html";
        return;
    }

    document.getElementById('nav-username').textContent = userEmail;

    try {
        const [students, programs, departments, advisors, dbApproved, localStorageApproved] = await Promise.all([
            fetch("/data/student.json").then(res => res.json()),
            fetch("/data/structures/programs.json").then(res => res.json()),
            fetch("/data/structures/departments.json").then(res => res.json()),
            fetch("/data/advisor.json").then(res => res.json()),
            fetch("/data/document_approved.json").then(res => res.json()),
            Promise.resolve(JSON.parse(localStorage.getItem('localStorage_approvedDocs') || '[]'))
        ]);

        const currentUser = students.find(s => s.email === userEmail);
        if (!currentUser) { alert("ไม่พบข้อมูลนักศึกษา"); return; }
        
        // 1. Populate Profile Info
        document.getElementById('profile-fullname').textContent = `${currentUser.prefix_th} ${currentUser.first_name_th} ${currentUser.last_name_th}`.trim();
        document.getElementById('profile-studentid').textContent = `รหัสนักศึกษา: ${currentUser.student_id}`;
        document.getElementById('profile-degree').textContent = currentUser.degree || '-';
        document.getElementById('profile-plan').textContent = currentUser.plan || '-';
        document.getElementById('profile-program').textContent = programs.find(p => p.id === currentUser.program_id)?.name || '-';
        document.getElementById('profile-department').textContent = departments.find(d => d.id === currentUser.department_id)?.name || '-';
        document.getElementById('profile-faculty').textContent = currentUser.faculty || '-';
        document.getElementById('profile-phone').textContent = currentUser.phone || '-';
        document.getElementById('profile-email').textContent = currentUser.email || '-';

        const statusSpan = document.getElementById('profile-status');
        statusSpan.textContent = currentUser.status || '-';
        statusSpan.className = `status-badge ${getStatusClass(currentUser.status)}`;
        
        // 2. Load and Display Signature & Profile Picture
        displaySignature(userEmail);
        displayProfilePicture(userEmail);

        // 3. Populate Academic Status (ส่วนที่แก้ไข)
        populateAcademicStatus(currentUser, advisors);

        // 4. Populate Uploaded Files
        const allApprovedDocs = [...dbApproved, ...localStorageApproved];
        const userApprovedDocs = allApprovedDocs.filter(doc => doc.student_id === currentUser.student_id || doc.student_email === userEmail);
        renderUploadedFiles(userApprovedDocs);

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลโปรไฟล์:", error);
        alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
}

/**
 * แสดงข้อมูลสรุปสถานะการศึกษาทั้งหมด
 */
function populateAcademicStatus(currentUser, advisors) {
    // Thesis Info
    document.getElementById('profile-thesis-th').textContent = currentUser.thesis_title_th || '-';
    document.getElementById('profile-thesis-en').textContent = currentUser.thesis_title_en || '-';
    
    // --- ส่วนที่แก้ไข: การแสดงผลอาจารย์ที่ปรึกษา ---
    const mainAdvisor = advisors.find(a => a.advisor_id === currentUser.main_advisor_id);
    const coAdvisor1 = advisors.find(a => a.advisor_id === currentUser.co_advisor1_id);
    const coAdvisor2 = advisors.find(a => a.advisor_id === currentUser.co_advisor2_id);

    document.getElementById('profile-main-advisor').textContent = mainAdvisor ? `${mainAdvisor.prefix_th}${mainAdvisor.first_name_th} ${mainAdvisor.last_name_th}`.trim() : '-';
    document.getElementById('profile-co-advisor1').textContent = coAdvisor1 ? `${coAdvisor1.prefix_th}${coAdvisor1.first_name_th} ${coAdvisor1.last_name_th}`.trim() : '-';
    document.getElementById('profile-co-advisor2').textContent = coAdvisor2 ? `${coAdvisor2.prefix_th}${coAdvisor2.first_name_th} ${coAdvisor2.last_name_th}`.trim() : '-';

    // Proposal Defense
    document.getElementById('proposal-exam-date').textContent = '-'; // หากมีข้อมูลวันที่สอบหัวข้อในอนาคต สามารถนำมาใส่ที่นี่
    const proposalStatusSpan = document.getElementById('proposal-status');
    proposalStatusSpan.textContent = currentUser.proposal_status || 'ยังไม่ยื่น';
    proposalStatusSpan.className = `status-badge ${getStatusClass(currentUser.proposal_status)}`;
    document.getElementById('proposal-approval-date').textContent = formatThaiDate(currentUser.proposal_approval_date);

    // Final Defense
    document.getElementById('final-exam-date').textContent = formatThaiDate(currentUser.final_defense_date);
    const finalDefenseStatusSpan = document.getElementById('final-defense-status');
    finalDefenseStatusSpan.textContent = currentUser.final_defense_status || '-';
    finalDefenseStatusSpan.className = `status-badge ${getStatusClass(currentUser.final_defense_status)}`;
    document.getElementById('graduation-date').textContent = formatThaiDate(currentUser.graduation_date);
    
    // English Test
    document.getElementById('eng-test-type').textContent = currentUser.english_test_type || '-';
    document.getElementById('eng-approval-date').textContent = '-'; // หากมีข้อมูลวันที่อนุมัติผลสอบ สามารถนำมาใส่ที่นี่
    const engStatusSpan = document.getElementById('eng-test-status-detailed');
    engStatusSpan.textContent = currentUser.english_test_status || 'ยังไม่ยื่น';
    engStatusSpan.className = `status-badge ${getStatusClass(currentUser.english_test_status)}`;
}

/**
 * แสดงรูปโปรไฟล์
 */
function displayProfilePicture(userEmail) {
    const savedImage = localStorage.getItem(`${userEmail}_profile_image`);
    if (savedImage) {
        document.getElementById('profile-picture-img').src = savedImage;
    }
}

/**
 * แสดงรูปภาพลายเซ็น
 */
function displaySignature(userEmail) {
    const signatureData = localStorage.getItem(`${userEmail}_signature_data`);
    const displayArea = document.getElementById('signature-display-area');
    if (signatureData) {
        displayArea.innerHTML = `<img src="${signatureData}" alt="ลายเซ็นดิจิทัล">`;
    } else {
        displayArea.innerHTML = `<p class="text-muted">ยังไม่มีลายเซ็นในระบบ</p>`;
    }
}

/**
 * จัดการการลบลายเซ็น
 */
function deleteSignature() {
    if (confirm("การลบลายเซ็นจะทำให้คุณต้องตั้งค่าใหม่ก่อนยื่นเอกสารครั้งถัดไป คุณต้องการลบลายเซ็นใช่หรือไม่?")) {
        const userEmail = localStorage.getItem("current_user");
        if(userEmail) {
            localStorage.removeItem(`${userEmail}_signature_data`);
            localStorage.removeItem(`${userEmail}_signed`);
            alert("ลบลายเซ็นเรียบร้อยแล้ว");
            displaySignature(userEmail);
        }
    }
}

/**
 * แสดงรายการไฟล์ที่อัปโหลด
 */
function renderUploadedFiles(approvedDocs) {
    const listElement = document.getElementById('uploaded-files-list');
    listElement.innerHTML = '';
    const allFiles = [];
    approvedDocs.forEach(doc => {
        if (doc.files && Array.isArray(doc.files)) {
            doc.files.forEach(file => {
                allFiles.push({ formTitle: doc.title, fileType: file.type, fileName: file.name, fileUrl: '#' });
            });
        }
    });

    if (allFiles.length === 0) {
        listElement.innerHTML = `<li class="loading-text">ยังไม่มีเอกสารแนบที่อนุมัติแล้ว</li>`;
        return;
    }
    allFiles.forEach(file => {
        const li = document.createElement('li');
        li.innerHTML = `
            <label>${file.fileType} <span class="text-muted">(จาก: ${file.formTitle})</span></label>
            <a href="${file.fileUrl}" target="_blank">${file.fileName} <i class="fas fa-external-link-alt"></i></a>
        `;
        listElement.appendChild(li);
    });
}

/**
 * จัดการเมื่อมีการเลือกไฟล์รูปโปรไฟล์
 */
function handleProfilePictureChange(event) {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const cropModal = document.getElementById('crop-image-modal');
        const imageToCrop = document.getElementById('image-to-crop');
        imageToCrop.src = e.target.result;
        cropModal.style.display = 'flex';
        requestAnimationFrame(() => cropModal.classList.add('show'));

        if (cropper) cropper.destroy();
        cropper = new Cropper(imageToCrop, { aspectRatio: 1 / 1, viewMode: 1, background: false });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

/**
 * ยืนยันการ Crop และอัปเดตโปรไฟล์
 */
function confirmCrop() {
    if (!cropper) return;
    const userEmail = localStorage.getItem("current_user");
    const croppedImageData = cropper.getCroppedCanvas({ width: 256, height: 256 }).toDataURL('image/png');
    
    document.getElementById('profile-picture-img').src = croppedImageData;
    if(userEmail) localStorage.setItem(`${userEmail}_profile_image`, croppedImageData);
    
    closeCropModal();
}

/**
 * ปิดหน้าต่าง Crop
 */
function closeCropModal() {
    const cropModal = document.getElementById('crop-image-modal');
    if(cropModal) {
        cropModal.classList.remove('show');
        setTimeout(() => {
            cropModal.style.display = 'none';
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
        }, 300);
    }
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

    // --- Profile Page Specific Event Listeners ---
    const deleteSignatureBtn = document.getElementById('delete-signature-btn');
    if (deleteSignatureBtn) deleteSignatureBtn.addEventListener('click', deleteSignature);
    
    const profilePictureInput = document.getElementById('profile-picture-input');
    const cropConfirmBtn = document.getElementById('crop-confirm-btn');
    const cropCancelBtn = document.getElementById('crop-cancel-btn');
    if (profilePictureInput) profilePictureInput.addEventListener('change', handleProfilePictureChange);
    if (cropConfirmBtn) cropConfirmBtn.addEventListener('click', confirmCrop);
    if (cropCancelBtn) cropCancelBtn.addEventListener('click', closeCropModal);
    
    // --- Load initial data ---
    loadProfileData();
});