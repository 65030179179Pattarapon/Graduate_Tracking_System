// /User_Page/js_user/profile.js (Complete Version)

// =================================================================
// ภาค 1: Helper Functions
// =================================================================

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
let signaturePad = null; // [เพิ่ม] Global variable for SignaturePad instance

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
        document.getElementById('profile-phone-display').textContent = currentUser.phone || '-';
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
 * จัดการการลบลายเซ็น และบังคับให้สร้างใหม่ทันที
 */
function deleteSignature() {
    if (confirm("การลบลายเซ็นจะทำให้คุณต้องตั้งค่าใหม่ทันที คุณต้องการลบลายเซ็นใช่หรือไม่?")) {
        const userEmail = localStorage.getItem("current_user");
        if(userEmail) {
            // 1. ลบข้อมูลลายเซ็นเก่า
            localStorage.removeItem(`${userEmail}_signature_data`);
            localStorage.removeItem(`${userEmail}_signed`);
            
            // 2. อัปเดตการแสดงผลในหน้าโปรไฟล์
            displaySignature(userEmail); 
            
            // 3. แจ้งเตือนและเปิด Modal ให้สร้างใหม่ทันที
            alert("ลบลายเซ็นเรียบร้อยแล้ว กรุณาตั้งค่าลายเซ็นใหม่เพื่อดำเนินการต่อ");
            openSignatureModal(); // เรียกใช้ฟังก์ชันเปิด Modal ที่มีอยู่แล้ว
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

/**
 * [ฟังก์ชันใหม่] รีเซ็ต Tab ใน Modal กลับไปที่ "วาดลายเซ็น" เสมอ
 */
function resetSignatureModalTabs() {
    const drawTabBtn = document.querySelector('.tab-btn[data-tab="draw"]');
    const uploadTabBtn = document.querySelector('.tab-btn[data-tab="upload"]');
    const drawPanel = document.getElementById('tab-draw');
    const uploadPanel = document.getElementById('tab-upload');

    if (drawTabBtn && uploadTabBtn && drawPanel && uploadPanel) {
        // ทำให้แท็บ "วาด" active
        drawTabBtn.classList.add('active');
        drawPanel.classList.add('active');

        // ทำให้แท็บ "อัปโหลด" inactive
        uploadTabBtn.classList.remove('active');
        uploadPanel.classList.remove('active');
    }
}

/**
 * จัดการการเปิด Modal แก้ไขลายเซ็น (เวอร์ชันสร้าง Canvas ใหม่เสมอ)
 */
function openSignatureModal() {
    const modal = document.getElementById('signature-edit-modal');
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('show'));

    // 1. หาตำแหน่งที่จะใส่ Canvas
    const canvasWrapper = document.querySelector('#tab-draw .canvas-wrapper');
    // 2. ล้าง Canvas เก่าทิ้ง
    canvasWrapper.innerHTML = ''; 
    // 3. สร้าง Element <canvas> ขึ้นมาใหม่
    const newCanvas = document.createElement('canvas');
    newCanvas.id = 'signature-canvas';
    // 4. นำ Canvas ใหม่ไปใส่ในตำแหน่ง
    canvasWrapper.appendChild(newCanvas);

    // 5. ปรับขนาด Canvas ใหม่ให้ถูกต้อง
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    newCanvas.width = newCanvas.offsetWidth * ratio;
    newCanvas.height = newCanvas.offsetHeight * ratio;
    newCanvas.getContext("2d").scale(ratio, ratio);

    // 6. สร้าง SignaturePad instance ใหม่บน Canvas ที่เพิ่งสร้าง
    signaturePad = new SignaturePad(newCanvas, {
        backgroundColor: 'rgb(255, 255, 255)'
    });
    
    // 7. รีเซ็ตให้กลับไปที่แท็บ "วาด" เสมอ
    resetSignatureModalTabs(); 
}

/**
 * ปิด Modal แก้ไขลายเซ็น และทำลาย instance ของ SignaturePad ทิ้ง
 */
function closeSignatureModal() {
    const modal = document.getElementById('signature-edit-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => { 
            modal.style.display = 'none'; 
            
            // --- [ส่วนที่สำคัญที่สุดที่เพิ่มเข้ามา] ---
            // ทำการปิดการใช้งานและล้างค่า "กระดานวาดภาพ" ทิ้งไปเลย
            if (signaturePad) {
                signaturePad.off(); // หยุดการดักจับ event ทั้งหมด
                signaturePad = null; // ล้างค่าในตัวแปร
            }
            // --- [จบส่วนที่เพิ่มเข้ามา] ---

        }, 300);
    }
}

function saveSignature() {
    const userEmail = localStorage.getItem("current_user");
    if (!userEmail) return;
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    let signatureData = null;
    if (activeTab === 'draw') {
        if (signaturePad.isEmpty()) {
            alert("กรุณาวาดลายเซ็นของคุณ");
            return;
        }
        signatureData = signaturePad.toDataURL('image/png');
        finalizeSave(userEmail, signatureData);
    } else {
        const fileInput = document.getElementById('signature-upload-input');
        const file = fileInput.files[0];
        if (!file) {
            alert("กรุณาเลือกไฟล์รูปภาพ");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            signatureData = reader.result;
            finalizeSave(userEmail, signatureData);
        };
        reader.readAsDataURL(file);
    }
}

function finalizeSave(userEmail, signatureData) {
    localStorage.setItem(`${userEmail}_signature_data`, signatureData);
    localStorage.setItem(`${userEmail}_signed`, "true");
    alert("บันทึกลายเซ็นเรียบร้อยแล้ว");
    displaySignature(userEmail);
    closeSignatureModal();
}

// =================================================================
// ภาค 3: Main Event Listener
// =================================================================
document.addEventListener('DOMContentLoaded', function() {

    // --- Profile Page Specific Event Listeners ---
    const deleteSignatureBtn = document.getElementById('delete-signature-btn');
    if (deleteSignatureBtn) deleteSignatureBtn.addEventListener('click', deleteSignature);
    
    const profilePictureInput = document.getElementById('profile-picture-input');
    const cropConfirmBtn = document.getElementById('crop-confirm-btn');
    const cropCancelBtn = document.getElementById('crop-cancel-btn');
    if (profilePictureInput) profilePictureInput.addEventListener('change', handleProfilePictureChange);
    if (cropConfirmBtn) cropConfirmBtn.addEventListener('click', confirmCrop);
    if (cropCancelBtn) cropCancelBtn.addEventListener('click', closeCropModal);
    
// --- [Logic ใหม่] สำหรับแก้ไขเบอร์โทรศัพท์ (Hover Effect Version) ---
    const editableField = document.querySelector('.editable-field');
    const editPhoneBtn = document.getElementById('edit-phone-btn');
    const savePhoneBtn = document.getElementById('save-phone-btn');
    const cancelPhoneBtn = document.getElementById('cancel-phone-btn');
    const phoneDisplay = document.getElementById('profile-phone-display');
    const phoneInput = document.getElementById('profile-phone-input');

    if (editPhoneBtn) {
        editPhoneBtn.addEventListener('click', () => {
            // เข้าสู่โหมดแก้ไขโดยการเพิ่มคลาส
            editableField.classList.add('is-editing');
            phoneInput.value = phoneDisplay.textContent.trim();
            phoneInput.focus();
        });
    }

    if (cancelPhoneBtn) {
        cancelPhoneBtn.addEventListener('click', () => {
            // ออกจากโหมดแก้ไขโดยการลบคลาส
            editableField.classList.remove('is-editing');
        });
    }

    if (savePhoneBtn) {
        savePhoneBtn.addEventListener('click', async () => {
            const newPhone = phoneInput.value.trim();
            const userEmail = localStorage.getItem("current_user");
            
            // --- จำลองการบันทึกข้อมูล ---
            phoneDisplay.textContent = newPhone;
            // (ในอนาคตส่วนนี้จะยิง API ไปบันทึกที่ Server)
            
            // --- [แก้ไข] เปลี่ยนข้อความแจ้งเตือน ---
            alert("ได้ทำการเปลี่ยนเบอร์โทรศัพท์เรียบร้อยแล้ว");
            
            // สลับ UI กลับสู่โหมดแสดงผล
            editableField.classList.remove('is-editing');
        });
    }

    // --- [Logic ใหม่] สำหรับ Modal แก้ไขลายเซ็น ---
const editSignatureBtn = document.getElementById('edit-signature-btn');
const signatureCancelBtn = document.getElementById('signature-cancel-btn');
const signatureSaveBtn = document.getElementById('signature-save-btn');
const clearSignatureBtn = document.getElementById('clear-signature-btn');
const signatureUploadInput = document.getElementById('signature-upload-input');
const uploadFilename = document.getElementById('upload-filename');

if(editSignatureBtn) editSignatureBtn.addEventListener('click', openSignatureModal);
if(signatureCancelBtn) signatureCancelBtn.addEventListener('click', closeSignatureModal);
if(signatureSaveBtn) signatureSaveBtn.addEventListener('click', saveSignature);
if(clearSignatureBtn) clearSignatureBtn.addEventListener('click', () => { if(signaturePad) signaturePad.clear(); });

document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(`tab-${button.dataset.tab}`).classList.add('active');
    });
});

    if(signatureUploadInput) {
        signatureUploadInput.addEventListener('change', () => {
            uploadFilename.textContent = signatureUploadInput.files.length > 0 
                ? `ไฟล์ที่เลือก: ${signatureUploadInput.files[0].name}` 
                : '';
        });
    }

    if(clearSignatureBtn) {
        clearSignatureBtn.addEventListener('click', () => {
            // 1. ตรวจสอบว่าแท็บไหนกำลังถูกใช้งานอยู่
            const activeTab = document.querySelector('.tab-btn.active').dataset.tab;

            if (activeTab === 'draw') {
                // 2. ถ้าอยู่แท็บ "วาด" ให้ล้าง Canvas
                if (signaturePad) {
                    signaturePad.clear();
                }
            } else if (activeTab === 'upload') {
                // 3. ถ้าอยู่แท็บ "อัปโหลด" ให้ล้างข้อมูลไฟล์
                const fileInput = document.getElementById('signature-upload-input');
                const fileNameDisplay = document.getElementById('upload-filename');
                
                // ล้างค่าใน input file ที่ซ่อนอยู่
                fileInput.value = null; 
                // ล้างข้อความแสดงชื่อไฟล์
                fileNameDisplay.textContent = '';
            }
        });
    }

    // --- Load initial data ---
    loadProfileData();
});