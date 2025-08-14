// /User_Page/js_user/student_document_detail.js (Fully Self-Contained & Dynamic Version)

// =================================================================
// ภาค 1: Helper Functions
// =================================================================

/**
 * แสดง Modal ยืนยันการออกจากระบบ
 */
function logout() {
    const modal = document.getElementById('logout-confirm-modal');
    if (modal) {
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
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
}

/**
 * แปลงวันที่จาก ISO format เป็นรูปแบบ "วัน เดือน พ.ศ. เวลา"
 * @param {string} isoString - วันที่ในรูปแบบ ISO
 * @returns {string} - วันที่ในรูปแบบไทย หรือ '-' ถ้าข้อมูลผิดพลาด
 */
function formatThaiDateTime(isoString) {
    if (!isoString) return '-';
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Bangkok'
        }) + ' น.';
    } catch (error) {
        return 'Invalid Date';
    }
}

// =================================================================
// ภาค 2: Document Detail Page Logic
// =================================================================

/**
 * ดึงข้อมูลเอกสารและแสดงผลในหน้ารายละเอียด
 */
async function loadDocumentDetail() {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get('id');

    if (!docId) {
        document.querySelector('main.detail-container').innerHTML = '<h1>ไม่พบ ID ของเอกสาร</h1>';
        return;
    }

    try {
        // ดึงข้อมูลทั้งหมดที่จำเป็นในการแสดงผลรายละเอียดของทุกฟอร์ม
        const [
            students, dbPending, dbApproved, dbRejected, 
            advisors, externalProfessors, programs, departments
        ] = await Promise.all([
            fetch("/data/student.json").then(res => res.json()),
            fetch("/data/document_pending.json").then(res => res.json()),
            fetch("/data/document_approved.json").then(res => res.json()),
            fetch("/data/document_rejected.json").then(res => res.json()),
            fetch("/data/advisor.json").then(res => res.json()),
            fetch("/data/external_professor.json").then(res => res.json()),
            fetch("/data/structures/programs.json").then(res => res.json()),
            fetch("/data/structures/departments.json").then(res => res.json())
        ]);

        const localStoragePending = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
        const localStorageApproved = JSON.parse(localStorage.getItem('localStorage_approvedDocs') || '[]');
        const localStorageRejected = JSON.parse(localStorage.getItem('localStorage_rejectedDocs') || '[]');

        const allDocuments = [...dbPending, ...dbApproved, ...dbRejected, ...localStoragePending, ...localStorageApproved, ...localStorageRejected];
        const documentData = allDocuments.find(doc => doc.doc_id === docId);

        if (!documentData) {
            document.querySelector('main.detail-container').innerHTML = '<h1>ไม่พบข้อมูลเอกสาร</h1>';
            return;
        }
        
        const currentUser = students.find(s => s.email === documentData.student_email);
        
        const fullDataPayload = {
            doc: documentData,
            user: currentUser,
            advisors,
            externalProfessors,
            programs,
            departments
        };

        // แสดงผลข้อมูลในส่วนต่างๆ
        renderHeader(fullDataPayload);
        renderSidebar(fullDataPayload);
        renderMainContent(fullDataPayload);

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลเอกสาร:", error);
        document.querySelector('main.detail-container').innerHTML = '<h1>เกิดข้อผิดพลาดในการโหลดข้อมูล</h1>';
    }
}

/**
 * แสดงผลหัวข้อหลักของหน้าและ Navbar
 */
function renderHeader({ doc, user }) {
    document.getElementById('doc-title-heading').textContent = doc.title || 'รายละเอียดเอกสาร';
    if (user) {
        document.getElementById('nav-username').textContent = user.email;
    }
}

/**
 * แสดงผลข้อมูลใน Sidebar ด้านขวา
 */
function renderSidebar({ doc }) {
    const statusCard = document.getElementById('status-highlight-card');
    const statusIcon = document.getElementById('status-icon');
    const statusText = document.getElementById('doc-status-main');
    
    const statusClass = (doc.status === 'อนุมัติแล้ว') ? 'approved' : 
                        (doc.status === 'ไม่อนุมัติ' || doc.status === 'ตีกลับ') ? 'rejected' : 'pending';
    
    statusText.textContent = doc.status;
    statusCard.className = `status-card ${statusClass}`;
    
    if (statusClass === 'approved') statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
    else if (statusClass === 'rejected') statusIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
    else statusIcon.innerHTML = '<i class="fas fa-hourglass-half"></i>';

    document.getElementById('doc-type').textContent = doc.type || '-';
    document.getElementById('doc-submission-date').textContent = formatThaiDateTime(doc.submitted_date);
    document.getElementById('doc-action-date').textContent = formatThaiDateTime(doc.approved_date || doc.rejected_date);

    const commentCard = document.getElementById('comment-card');
    if (doc.comment) {
        document.getElementById('admin-comment-display').textContent = doc.comment;
        commentCard.style.display = 'block';
    }

    const actionCard = document.getElementById('action-card');
    if (doc.status === 'อนุมัติแล้ว') {
        actionCard.style.display = 'block';
    }
}

/**
 * แสดงผลเนื้อหาหลักในคอลัมน์ซ้าย (ส่วนที่แก้ไข)
 */
function renderMainContent(payload) {
    const { doc } = payload;

    const specificContentContainer = document.getElementById('form-specific-content');
    specificContentContainer.innerHTML = generateFormSpecificHTML(payload);

    const filesList = document.getElementById('attached-files-list');
    filesList.innerHTML = '';
    const filesToRender = doc.files || [];

    if (filesToRender.length > 0 && doc.type === 'ฟอร์ม 6') {
        const fileMap = {};
        
        // --- ส่วนที่แก้ไข: เปลี่ยนจาก if/else if เป็น if แยกกัน ---
        filesToRender.forEach(f => {
            if (f.type.includes('วิทยานิพนธ์ฉบับสมบูรณ์')) fileMap['thesisDraft'] = f;
            if (f.type.includes('บทคัดย่อ (ไทย)')) fileMap['abstractTh'] = f;
            if (f.type.includes('บทคัดย่อ (อังกฤษ)')) fileMap['abstractEn'] = f;
            if (f.type.includes('สารบัญ (ไทย)')) fileMap['tocTh'] = f;
            if (f.type.includes('สารบัญ (อังกฤษ)')) fileMap['tocEn'] = f;
            if (f.type.includes('หลักฐานการตอบรับการตีพิมพ์')) fileMap['publicationProof'] = f;
            if (f.type.includes('หลักฐานการตรวจสอบผลการเรียน')) fileMap['gradeCheckProof'] = f;
        });

        const createFileHTML = (file) => file ? `<a href="#" class="file-link" onclick="alert('Open ${file.name}')">${file.name}</a>` : '<span>-</span>';

        filesList.innerHTML = `
            <li>
                <label>วิทยานิพนธ์ฉบับสมบูรณ์:</label>
                ${createFileHTML(fileMap.thesisDraft)}
            </li>
            <li>
                <label>บทคัดย่อ (Abstract):</label>
                <div class="file-sub-group">
                    <span class="sub-label"><b>ไฟล์ภาษาไทย:</b> ${createFileHTML(fileMap.abstractTh)}</span>
                    <span class="sub-label"><b>ไฟล์ภาษาอังกฤษ:</b> ${createFileHTML(fileMap.abstractEn)}</span>
                </div>
            </li>
            <li>
                <label>สารบัญทั้งหมด:</label>
                <div class="file-sub-group">
                    <span class="sub-label"><b>ไฟล์ภาษาไทย:</b> ${createFileHTML(fileMap.tocTh)}</span>
                    <span class="sub-label"><b>ไฟล์ภาษาอังกฤษ:</b> ${createFileHTML(fileMap.tocEn)}</span>
                </div>
            </li>
            <li>
                <label>หลักฐานการตอบรับการตีพิมพ์:</label>
                ${createFileHTML(fileMap.publicationProof)}
            </li>
            <li>
                <label>หลักฐานการตรวจสอบผลการเรียน:</label>
                ${createFileHTML(fileMap.gradeCheckProof)}
            </li>
        `;
    } else if (filesToRender.length > 0) {
        // Logic เดิมสำหรับฟอร์มอื่นๆ
        filesToRender.forEach(file => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="file-label">${file.type || 'ไฟล์แนบ'}:</span>
                <a href="#" class="file-link">${file.name || 'ไม่พบชื่อไฟล์'}</a>
            `;
            filesList.appendChild(li);
        });
    } else {
        filesList.innerHTML = `<li class="loading-text">ไม่มีไฟล์แนบ</li>`;
    }

    const studentCommentDisplay = document.getElementById('student-comment-display');
    studentCommentDisplay.textContent = doc.student_comment || 'ไม่มีความคิดเห็นเพิ่มเติม';
}

/**
 * สร้าง HTML สำหรับแสดงรายละเอียดตามประเภทฟอร์ม (ฉบับสมบูรณ์)
 */
function generateFormSpecificHTML({ doc, user, advisors, externalProfessors, programs, departments }) {
    let html = '';
    const details = doc.details || {};

    // ข้อมูลพื้นฐานจะถูกสร้างใหม่ในแต่ละ case เพื่อความยืดหยุ่น
    const programName = user ? programs.find(p => p.id === user.program_id)?.name || '-' : '-';
    const departmentName = user ? departments.find(d => d.id === user.department_id)?.name || '-' : '-';

    switch(doc.type) {
        case 'ฟอร์ม 1':
            const mainAdvisorForm1 = advisors.find(a => a.advisor_id === doc.selected_main_advisor_id);
            const coAdvisorForm1 = advisors.find(a => a.advisor_id === doc.selected_co_advisor_id);
            html = `
                <h4>ข้อมูลผู้ยื่นคำร้อง</h4>
                <ul class="info-list">
                    <li><label>ชื่อ-นามสกุล:</label> <span>${user.prefix_th} ${user.first_name_th} ${user.last_name_th}</span></li>
                    <li><label>รหัสนักศึกษา:</label> <span>${user.student_id}</span></li>
                    <li><label>ระดับการศึกษา:</label> <span>${user.degree || '-'}</span></li>
                    <li><label>หลักสูตร:</label> <span>${programName}</span></li>
                    <li><label>ภาควิชา:</label> <span>${departmentName}</span></li>
                    <li><label>คณะ:</label> <span>${user.faculty || '-'}</span></li>
                    <li><label>แผนการเรียน:</label> <span>${user.plan || '-'}</span></li>
                    <li><label>เบอร์โทรศัพท์:</label> <span>${user.phone || '-'}</span></li>
                    <li><label>อีเมล:</label> <span>${user.email || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4>อาจารย์ที่ปรึกษาที่เลือก</h4>
                <ul class="info-list">
                    <li><label>ที่ปรึกษาหลัก:</label> <span>${mainAdvisorForm1 ? `${mainAdvisorForm1.prefix_th}${mainAdvisorForm1.first_name_th} ${mainAdvisorForm1.last_name_th}`.trim() : '-'}</span></li>
                    <li><label>ที่ปรึกษาร่วม:</label> <span>${coAdvisorForm1 ? `${coAdvisorForm1.prefix_th}${coAdvisorForm1.first_name_th} ${coAdvisorForm1.last_name_th}`.trim() : '-'}</span></li>
                </ul>`;
            break;

        case 'ฟอร์ม 2':
            const mainAdvisorForm2 = advisors.find(a => a.advisor_id === user.main_advisor_id);
            const coAdvisor1Form2 = advisors.find(a => a.advisor_id === user.co_advisor1_id);
            const coAdvisor2Form2 = advisors.find(a => a.advisor_id === doc.selected_co_advisor2_id);
            
            html = `
                <h4>ข้อมูลผู้ยื่นคำร้อง</h4>
                <ul class="info-list">
                    <li><label>ชื่อ-นามสกุล:</label> <span>${user.prefix_th} ${user.first_name_th} ${user.last_name_th}</span></li>
                    <li><label>รหัสนักศึกษา:</label> <span>${user.student_id}</span></li>
                    <li><label>ระดับการศึกษา:</label> <span>${user.degree || '-'}</span></li>
                    <li><label>หลักสูตร:</label> <span>${programName}</span></li>
                    <li><label>ภาควิชา:</label> <span>${departmentName}</span></li>
                    <li><label>เบอร์โทรศัพท์:</label> <span>${user.phone || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4>รายละเอียดหัวข้อวิทยานิพนธ์</h4>
                <ul class="info-list">
                    <li><label>ภาษาไทย:</label> <span>${doc.thesis_title_th || '-'}</span></li>
                    <li><label>ภาษาอังกฤษ:</label> <span>${doc.thesis_title_en || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4>อาจารย์ที่ปรึกษา</h4>
                <ul class="info-list">
                    <li><label>ที่ปรึกษาหลัก:</label> <span>${mainAdvisorForm2 ? `${mainAdvisorForm2.prefix_th}${mainAdvisorForm2.first_name_th} ${mainAdvisorForm2.last_name_th}`.trim() : '-'}</span></li>
                    <li><label>ที่ปรึกษาร่วม 1:</label> <span>${coAdvisor1Form2 ? `${coAdvisor1Form2.prefix_th}${coAdvisor1Form2.first_name_th} ${coAdvisor1Form2.last_name_th}`.trim() : '-'}</span></li>
                    <li><label>ที่ปรึกษาร่วม 2 (ที่เลือกเพิ่ม):</label> <span>${coAdvisor2Form2 ? `${coAdvisor2Form2.prefix_th}${coAdvisor2Form2.first_name_th} ${coAdvisor2Form2.last_name_th}`.trim() : '-'}</span></li>
                </ul>
                 <hr class="subtle-divider">
                <h4>ข้อมูลการลงทะเบียน</h4>
                <ul class="info-list">
                    <li><label>ภาคการศึกษา:</label> <span>${details.registration_semester || '-'}</span></li>
                    <li><label>ปีการศึกษา:</label> <span>${details.registration_year || '-'}</span></li>
                </ul>`;
            break;

        case 'ฟอร์ม 3':
            html = `
                <h4>ข้อมูลผู้ยื่นคำร้อง</h4>
                <ul class="info-list">
                    <li><label>ชื่อ-นามสกุล:</label> <span>${user.prefix_th} ${user.first_name_th} ${user.last_name_th}</span></li>
                    <li><label>รหัสนักศึกษา:</label> <span>${user.student_id}</span></li>
                    <li><label>ระดับการศึกษา:</label> <span>${user.degree || '-'}</span></li>
                    <li><label>หลักสูตร:</label> <span>${programName}</span></li>
                    <li><label>ภาควิชา:</label> <span>${departmentName}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4>ข้อมูลหัวข้อวิทยานิพนธ์ (ที่ได้รับอนุมัติ)</h4>
                <ul class="info-list">
                    <li><label>วันที่อนุมัติ:</label> <span>${formatThaiDateTime(user.proposal_approval_date)}</span></li>
                    <li><label>ภาษาไทย:</label> <span>${user.thesis_title_th || '-'}</span></li>
                    <li><label>ภาษาอังกฤษ:</label> <span>${user.thesis_title_en || '-'}</span></li>
                </ul>`;
            break;

        case 'ฟอร์ม 4':
             html = `
                <h4>ข้อมูลผู้ยื่นคำร้อง</h4>
                <ul class="info-list">
                    <li><label>ชื่อ-นามสกุล:</label> <span>${user.prefix_th} ${user.first_name_th} ${user.last_name_th}</span></li>
                    <li><label>รหัสนักศึกษา:</label> <span>${user.student_id}</span></li>
                    <li><label>ระดับการศึกษา:</label> <span>${user.degree || '-'}</span></li>
                    <li><label>หลักสูตร:</label> <span>${programName}</span></li>
                    <li><label>ภาควิชา:</label> <span>${departmentName}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4>ข้อมูลหัวข้อวิทยานิพนธ์ (ที่ได้รับอนุมัติ)</h4>
                <ul class="info-list">
                    <li><label>วันที่อนุมัติ:</label> <span>${formatThaiDateTime(user.proposal_approval_date)}</span></li>
                    <li><label>ภาษาไทย:</label> <span>${user.thesis_title_th || '-'}</span></li>
                    <li><label>ภาษาอังกฤษ:</label> <span>${user.thesis_title_en || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4>รายละเอียดการขอเชิญ</h4>
                <ul class="info-list">
                    <li><label>จำนวนผู้ทรงคุณวุฒิ:</label> <span>${details.num_evaluators || '-'} คน</span></li>
                    <li><label>จำนวนหนังสือขอเชิญ:</label> <span>${details.num_letters || '-'} ฉบับ</span></li>
                    <li><label>ประเภทเครื่องมือ:</label> <span>${details.document_types?.join(', ') || '-'}</span></li>
                </ul>`;
            break;
            
        case 'ฟอร์ม 5':
            html = `
                <h4>ข้อมูลผู้ยื่นคำร้อง</h4>
                <ul class="info-list">
                    <li><label>ชื่อ-นามสกุล:</label> <span>${user.prefix_th} ${user.first_name_th} ${user.last_name_th}</span></li>
                    <li><label>รหัสนักศึกษา:</label> <span>${user.student_id}</span></li>
                    <li><label>ระดับการศึกษา:</label> <span>${user.degree || '-'}</span></li>
                    <li><label>หลักสูตร:</label> <span>${programName}</span></li>
                    <li><label>อีเมล:</label> <span>${user.email || '-'}</span></li>
                    <li><label>เบอร์โทรศัพท์:</label> <span>${user.phone || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4>ข้อมูลหัวข้อวิทยานิพนธ์ (ที่ได้รับอนุมัติ)</h4>
                <ul class="info-list">
                    <li><label>วันที่อนุมัติ:</label> <span>${formatThaiDateTime(user.proposal_approval_date)}</span></li>
                    <li><label>ภาษาไทย:</label> <span>${user.thesis_title_th || '-'}</span></li>
                    <li><label>ภาษาอังกฤษ:</label> <span>${user.thesis_title_en || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4>รายละเอียดการขออนุญาต</h4>
                <ul class="info-list">
                    <li><label>เครื่องมือที่ใช้ในการวิจัย:</label> <span>${details.research_tools?.join(', ') || '-'}</span></li>
                    <li><label>จำนวนหนังสือขออนุญาต:</label> <span>${details.num_letters || '-'} ฉบับ</span></li>
                </ul>`;
            break;

        case 'ฟอร์ม 6':
            const chair = externalProfessors.find(p => p.email === details.committee?.chair_email);
            const member1 = advisors.find(a => a.advisor_id === details.committee?.member1_id);
            const member2 = advisors.find(a => a.advisor_id === details.committee?.member2_id);
            const mainAdvisorForm6 = advisors.find(a => a.advisor_id === user.main_advisor_id);
            const coAdvisor1Form6 = advisors.find(a => a.advisor_id === user.co_advisor1_id);

            html = `
                <h4><i class="fas fa-user-graduate"></i> ข้อมูลผู้ยื่นคำร้อง</h4>
                <ul class="info-list">
                    <li><label>ชื่อ-นามสกุล:</label> <span>${user.prefix_th} ${user.first_name_th} ${user.last_name_th}</span></li>
                    <li><label>รหัสนักศึกษา:</label> <span>${user.student_id}</span></li>
                    <li><label>ระดับการศึกษา:</label> <span>${user.degree || '-'}</span></li>
                    <li><label>หลักสูตร/สาขาวิชา:</label> <span>${programName}</span></li>
                    <li><label>ภาควิชา:</label> <span>${departmentName}</span></li>
                    <li><label>เริ่มภาคเรียนที่:</label> <span>${user.admit_semester || '-'} / ${user.admit_year || '-'}</span></li>
                    <li><label>เบอร์โทร:</label> <span>${user.phone || '-'}</span></li>
                    <li><label>ที่อยู่ปัจจุบัน:</label> <span>${user.address ? `${user.address.street}, ${user.address.city}, ${user.address.province} ${user.address.postal_code}` : '-'}</span></li>
                    <li><label>สถานที่ทำงาน:</label> <span>${user.workplace || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4><i class="fas fa-book-open"></i> ข้อมูลวิทยานิพนธ์</h4>
                <ul class="info-list">
                    <li><label>ชื่อเรื่อง (ไทย):</label> <span>${user.thesis_title_th || '-'}</span></li>
                    <li><label>ชื่อเรื่อง (อังกฤษ):</label> <span>${user.thesis_title_en || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4><i class="fas fa-users"></i> คณะกรรมการที่เสนอชื่อ</h4>
                <ul class="info-list">
                    <li><label>ประธานกรรมการสอบ:</label> <span>${chair ? chair.fullname : '-'}</span></li>
                    <li><label>กรรมการ (ที่ปรึกษาหลัก):</label> <span>${mainAdvisorForm6 ? `${mainAdvisorForm6.prefix_th}${mainAdvisorForm6.first_name_th} ${mainAdvisorForm6.last_name_th}`.trim() : '-'}</span></li>
                    <li><label>กรรมการ (ที่ปรึกษาร่วม):</label> <span>${coAdvisor1Form6 ? `${coAdvisor1Form6.prefix_th}${coAdvisor1Form6.first_name_th} ${coAdvisor1Form6.last_name_th}`.trim() : '-'}</span></li>
                    <li><label>กรรมการ 1 (ภายในคณะ):</label> <span>${member1 ? `${member1.prefix_th}${member1.first_name_th} ${member1.last_name_th}`.trim() : '-'}</span></li>
                    <li><label>กรรมการ 2 (ภายในคณะ):</label> <span>${member2 ? `${member2.prefix_th}${member2.first_name_th} ${member2.last_name_th}`.trim() : '-'}</span></li>
                </ul>
                <h4>รายชื่อกรรมการสำรอง</h4>
                <ul class="info-list">
                    <li><label>กรรมการสำรอง (ภายนอก):</label> <span>${details.committee?.reserve_external || '-'}</span></li>
                    <li><label>กรรมการสำรอง (ภายใน):</label> <span>${details.committee?.reserve_internal || '-'}</span></li>
                </ul>
            `;
            break;
            
        case 'ผลสอบภาษาอังกฤษ':
            html = `
                <h4>ข้อมูลผู้ยื่นคำร้อง</h4>
                <ul class="info-list">
                    <li><label>ชื่อ-นามสกุล:</label> <span>${user.prefix_th} ${user.first_name_th} ${user.last_name_th}</span></li>
                    <li><label>รหัสนักศึกษา:</label> <span>${user.student_id}</span></li>
                    <li><label>ระดับการศึกษา:</label> <span>${user.degree || '-'}</span></li>
                    <li><label>หลักสูตร:</label> <span>${programName}</span></li>
                    <li><label>ภาควิชา:</label> <span>${departmentName}</span></li>
                    <li><label>คณะ:</label> <span>${user.faculty || '-'}</span></li>
                    <li><label>แผนการเรียน:</label> <span>${user.plan || '-'}</span></li>
                    <li><label>เบอร์โทรศัพท์:</label> <span>${user.phone || '-'}</span></li>
                    <li><label>อีเมล:</label> <span>${user.email || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4>ข้อมูลผลสอบ</h4>
                <ul class="info-list">
                    <li><label>ประเภทการสอบ:</label> <span>${details.exam_type === 'OTHER' ? details.other_exam_type : details.exam_type}</span></li>
                    <li><label>วันที่สอบ:</label> <span>${new Date(details.exam_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</span></li>
                </ul>
                <h4>คะแนน</h4>
                <ul class="info-list">
                    ${Object.entries(details.scores).map(([key, value]) => `<li><label>${key.replace(/-/g, ' ')}:</label> <span>${value}</span></li>`).join('')}
                </ul>
            `;
            break;
        default:
            html = `<p class="loading-text">ไม่มีรายละเอียดเพิ่มเติมสำหรับเอกสารประเภทนี้</p>`;
    }
    
    return html;
}


// =================================================================
// ภาค 3: Main Event Listener
// =================================================================
document.addEventListener('DOMContentLoaded', function() {
    
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
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = "/login/index.html";
        });
    }
    if(modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
    
    loadDocumentDetail();
});
