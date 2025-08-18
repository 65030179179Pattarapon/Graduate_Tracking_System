// /User_Page/js_user/student_document_detail.js (Fully Self-Contained & Dynamic Version)

// =================================================================
// ภาค 1: Helper Functions
// =================================================================

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
function generateFormSpecificHTML({ doc, user, programs, departments, advisors, allDocs, externalProfessors }) {
    if (!user) {
        return '<h4><i class="fas fa-exclamation-triangle"></i> ไม่สามารถแสดงข้อมูลได้</h4><p>ไม่พบข้อมูลผู้ใช้งานที่เชื่อมโยงกับเอกสารนี้</p>';
    }

    let html = '';
    const details = doc.details || {};
    const programName = programs.find(p => p.id === user.program_id)?.name || '-';
    const departmentName = departments.find(d => d.id === user.department_id)?.name || '-';

    switch(doc.type) {
        case 'ฟอร์ม 1': {
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
        }

        case 'ฟอร์ม 2': {
            // --- ขั้นตอนที่ 1: ค้นหาชื่ออาจารย์และกรรมการทั้งหมดจาก ID ---
            const committeeIds = doc.committee || {};

            // อาจารย์ที่ปรึกษา (จากข้อมูลโปรไฟล์นักศึกษา)
            const mainAdvisor = advisors.find(a => a.advisor_id === user.main_advisor_id);
            const mainAdvisorName = mainAdvisor ? `${mainAdvisor.prefix_th}${mainAdvisor.first_name_th} ${mainAdvisor.last_name_th}`.trim() : '-';
            
            const coAdvisor1 = advisors.find(a => a.advisor_id === user.co_advisor1_id);
            const coAdvisor1Name = coAdvisor1 ? `${coAdvisor1.prefix_th}${coAdvisor1.first_name_th} ${coAdvisor1.last_name_th}`.trim() : '-';

            // คณะกรรมการที่เสนอชื่อ (จากข้อมูลที่ยื่นในฟอร์ม 2)
            const committeeChair = advisors.find(a => a.advisor_id === committeeIds.chair_id);
            const committeeChairName = committeeChair ? `${committeeChair.prefix_th}${committeeChair.first_name_th} ${committeeChair.last_name_th}`.trim() : '-';

            const coAdvisor2 = advisors.find(a => a.advisor_id === committeeIds.co_advisor2_id);
            const coAdvisor2Name = coAdvisor2 ? `${coAdvisor2.prefix_th}${coAdvisor2.first_name_th} ${coAdvisor2.last_name_th}`.trim() : '-';

            const member5 = advisors.find(a => a.advisor_id === committeeIds.member5_id);
            const member5Name = member5 ? `${member5.prefix_th}${member5.first_name_th} ${member5.last_name_th}`.trim() : '-';

            // กรรมการสำรองที่เสนอชื่อ
            const reserveExternal = externalProfessors.find(p => p.ext_prof_id === committeeIds.reserve_external_id);
            const reserveExternalName = reserveExternal ? `${reserveExternal.prefix_th}${reserveExternal.first_name_th} ${reserveExternal.last_name_th}`.trim() : '-';

            const reserveInternal = advisors.find(a => a.advisor_id === committeeIds.reserve_internal_id);
            const reserveInternalName = reserveInternal ? `${reserveInternal.prefix_th}${reserveInternal.first_name_th} ${reserveInternal.last_name_th}`.trim() : '-';

            // --- ขั้นตอนที่ 2: สร้าง HTML ทั้งหมด ---
            html = `
                <h4><i class="fas fa-user icon-prefix"></i>ข้อมูลผู้ยื่นคำร้อง</h4>
                <ul class="info-list">
                    <li><label>ชื่อ-นามสกุล:</label> <span>${user.prefix_th} ${user.first_name_th} ${user.last_name_th}</span></li>
                    <li><label>รหัสนักศึกษา:</label> <span>${user.student_id}</span></li>
                    <li><label>ระดับการศึกษา:</label> <span>${user.degree || '-'}</span></li>
                    <li><label>หลักสูตร:</label> <span>${programName}</span></li>
                    <li><label>ภาควิชา:</label> <span>${departmentName}</span></li>
                    <li><label>เบอร์โทรศัพท์:</label> <span>${user.phone || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4><i class="fas fa-book icon-prefix"></i>รายละเอียดหัวข้อวิทยานิพนธ์</h4>
                <ul class="info-list">
                    <li><label>ภาษาไทย:</label> <span class="thesis-title">${doc.thesis_title_th || '-'}</span></li>
                    <li><label>ภาษาอังกฤษ:</label> <span class="thesis-title">${doc.thesis_title_en || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">

                <h4><i class="fas fa-users icon-prefix"></i>คณะกรรมการสอบและอาจารย์ที่ปรึกษา</h4>
                <div class="subsection">
                    <h5>อาจารย์ที่ปรึกษา (จากระบบ)</h5>
                    <ul class="info-list compact">
                        <li><label>ที่ปรึกษาหลัก:</label> <span>${mainAdvisorName}</span></li>
                        <li><label>ที่ปรึกษาร่วม 1:</label> <span>${coAdvisor1Name}</span></li>
                    </ul>
                </div>
                <div class="subsection">
                    <h5>คณะกรรมการสอบที่เสนอชื่อ</h5>
                    <ul class="info-list compact">
                        <li><label>ประธานกรรมการสอบ:</label> <span>${committeeChairName}</span></li>
                        <li><label>กรรมการ (ที่ปรึกษาร่วม 2):</label> <span>${coAdvisor2Name}</span></li>
                        <li><label>กรรมการสอบ (คนที่ 5):</label> <span>${member5Name}</span></li>
                    </ul>
                </div>
                <div class="subsection">
                    <h5>กรรมการสำรองที่เสนอชื่อ</h5>
                    <ul class="info-list compact">
                        <li><label>กรรมการสำรอง (จากภายนอก):</label> <span>${reserveExternalName}</span></li>
                        <li><label>กรรมการสำรอง (จากภายใน):</label> <span>${reserveInternalName}</span></li>
                    </ul>
                </div>
                
                <hr class="subtle-divider">
                <h4><i class="fas fa-calendar-alt icon-prefix"></i>ข้อมูลการลงทะเบียน</h4>
                <ul class="info-list">
                    <li><label>ภาคการศึกษา:</label> <span>${details.registration_semester || '-'}</span></li>
                    <li><label>ปีการศึกษา:</label> <span>${details.registration_year || '-'}</span></li>
                </ul>`;
            break;
        }

        case 'ฟอร์ม 3': {
            try {
                // ค้นหาข้อมูลโดยมีการป้องกันค่า null/undefined ในทุกขั้นตอน
                const chairId = doc.approvers?.program_chair_id;
                const chair = (advisors || []).find(a => a?.advisor_id === chairId);
                const chairName = chair ? `${chair.prefix_th || ''} ${chair.first_name_th || ''} ${chair.last_name_th || ''}`.trim() : 'ยังไม่ได้ระบุ';

                const mainAdvisor = (advisors || []).find(a => a?.advisor_id === user.main_advisor_id);
                const mainAdvisorName = mainAdvisor ? `${mainAdvisor.prefix_th || ''} ${mainAdvisor.first_name_th || ''} ${mainAdvisor.last_name_th || ''}`.trim() : 'ไม่มีข้อมูล';

                const coAdvisor1 = (advisors || []).find(a => a?.advisor_id === user.co_advisor1_id);
                const coAdvisor1Name = coAdvisor1 ? `${coAdvisor1.prefix_th || ''} ${coAdvisor1.first_name_th || ''} ${coAdvisor1.last_name_th || ''}`.trim() : 'ไม่มี';

                const approvedForm2 = (allDocs || []).find(d => d?.student_email === user.email && d?.type === 'ฟอร์ม 2' && d?.status !== 'รอตรวจ');
                let coAdvisor2Name = 'ไม่มี';
                if (approvedForm2 && approvedForm2.selected_co_advisor2_id) {
                    const coAdvisor2 = (advisors || []).find(a => a?.advisor_id === approvedForm2.selected_co_advisor2_id);
                    if (coAdvisor2) {
                        coAdvisor2Name = `${coAdvisor2.prefix_th || ''} ${coAdvisor2.first_name_th || ''} ${coAdvisor2.last_name_th || ''}`.trim();
                    }
                }

                html = `
                    <h4><i class="fas fa-user icon-prefix"></i>ข้อมูลผู้ยื่นคำร้อง</h4>
                    <ul class="info-list">
                        <li><label>ชื่อ-นามสกุล:</label> <span>${user.prefix_th || ''} ${user.first_name_th || ''} ${user.last_name_th || ''}</span></li>
                        <li><label>รหัสนักศึกษา:</label> <span>${user.student_id || '-'}</span></li>
                        <li><label>ระดับการศึกษา:</label> <span>${user.degree || '-'}</span></li>
                        <li><label>หลักสูตร:</label> <span>${programName}</span></li>
                        <li><label>ภาควิชา:</label> <span>${departmentName}</span></li>
                    </ul>
                    <hr class="subtle-divider">
                    <h4><i class="fas fa-book icon-prefix"></i>ข้อมูลหัวข้อวิทยานิพนธ์ (ที่ได้รับอนุมัติ)</h4>
                    <ul class="info-list">
                        <li><label>วันที่อนุมัติ:</label> <span>${formatThaiDateTime(user.proposal_approval_date)}</span></li>
                        <li><label>ภาษาไทย:</label> <span class="thesis-title">${user.thesis_title_th || '-'}</span></li>
                        <li><label>ภาษาอังกฤษ:</label> <span class="thesis-title">${user.thesis_title_en || '-'}</span></li>
                    </ul>
                    <hr class="subtle-divider">
                    <h4><i class="fas fa-users icon-prefix"></i>อาจารย์ผู้รับผิดชอบ</h4>
                    <ul class="info-list">
                        <li><label>ประธานหลักสูตร:</label> <span>${chairName}</span></li>
                        <li><label>อาจารย์ที่ปรึกษาหลัก:</label> <span>${mainAdvisorName}</span></li>
                        <li><label>อาจารย์ที่ปรึกษาร่วม 1:</label> <span>${coAdvisor1Name}</span></li>
                        <li><label>อาจารย์ที่ปรึกษาร่วม 2:</label> <span>${coAdvisor2Name}</span></li>
                    </ul>
                `;
            } catch (e) {
                console.error("CRITICAL ERROR inside 'case ฟอร์ม 3':", e);
                html = `<h4>เกิดข้อผิดพลาดร้ายแรงในการแสดงผลฟอร์ม 3</h4><p>กรุณาตรวจสอบ Console (F12) เพื่อดูรายละเอียดปัญหา</p>`;
            }
            break;
        }

        case 'ฟอร์ม 4': {
            let docTypesHtml = '<p>ไม่มีข้อมูล</p>';
            if (details.document_types && Array.isArray(details.document_types) && details.document_types.length > 0) {
                docTypesHtml = details.document_types.map(item => `<li><label>${item.type}:</label> <span>${item.quantity} ฉบับ</span></li>`).join('');
            }
            let evaluatorsHtml = '';
            if (details.evaluators && Array.isArray(details.evaluators) && details.evaluators.length > 0) {
                evaluatorsHtml = details.evaluators.map((evaluator, index) => `
                    <div class="evaluator-detail-card">
                        <h5>ผู้ทรงคุณวุฒิคนที่ ${index + 1}</h5>
                        <ul class="info-list compact">
                            <li><label>คำนำหน้า/ยศ/ตำแหน่ง:</label> <span>${evaluator.prefix}</span></li>
                            <li><label>ชื่อ-สกุล:</label> <span>${evaluator.firstName} ${evaluator.lastName}</span></li>
                            <li><label>สถาบัน/หน่วยงาน:</label> <span>${evaluator.affiliation}</span></li>
                            <li><label>เบอร์โทรศัพท์:</label> <span>${evaluator.phone}</span></li>
                            <li><label>อีเมล:</label> <span>${evaluator.email}</span></li>
                        </ul>
                    </div>
                `).join('');
            }
            html = `
                <h4><i class="fas fa-user icon-prefix"></i>ข้อมูลผู้ยื่นคำร้อง</h4>
                <ul class="info-list">
                    <li><label>ชื่อ-นามสกุล:</label> <span>${user.prefix_th} ${user.first_name_th} ${user.last_name_th}</span></li>
                    <li><label>รหัสนักศึกษา:</label> <span>${user.student_id}</span></li>
                    <li><label>ระดับการศึกษา:</label> <span>${user.degree || '-'}</span></li>
                    <li><label>หลักสูตร:</label> <span>${programName}</span></li>
                    <li><label>ภาควิชา:</label> <span>${departmentName}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4><i class="fas fa-book icon-prefix"></i>ข้อมูลหัวข้อวิทยานิพนธ์ (ที่ได้รับอนุมัติ)</h4>
                <ul class="info-list">
                    <li><label>วันที่อนุมัติ:</label> <span>${formatThaiDateTime(user.proposal_approval_date)}</span></li>
                    <li><label>ภาษาไทย:</label> <span class="thesis-title">${user.thesis_title_th || '-'}</span></li>
                    <li><label>ภาษาอังกฤษ:</label> <span class="thesis-title">${user.thesis_title_en || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4><i class="fas fa-tasks icon-prefix"></i>รายละเอียดการขอเชิญ</h4>
                <div class="subsection">
                    <h5>ประเภทเครื่องมือที่ต้องการประเมิน</h5>
                    <ul class="info-list compact">${docTypesHtml}</ul>
                </div>
                <div class="subsection">
                    <h5>รายชื่อผู้ทรงคุณวุฒิที่เสนอเชิญ</h5>
                    ${evaluatorsHtml || '<p>ยังไม่มีข้อมูลผู้ทรงคุณวุฒิ</p>'}
                </div>
            `;
            break;
        }
            
        case 'ฟอร์ม 5': {
            // --- [Logic ใหม่] สร้าง HTML สำหรับแสดงรายการเครื่องมือวิจัยพร้อมจำนวน ---
            let researchToolsHtml = '<li>ไม่มีข้อมูล</li>'; // ค่าเริ่มต้น

            // ตรวจสอบว่ามีข้อมูล research_tools และเป็น array ที่ไม่ว่าง
            if (details.research_tools && Array.isArray(details.research_tools) && details.research_tools.length > 0) {
                
                // ใช้ .map() เพื่อสร้าง <li> สำหรับแต่ละรายการ
                researchToolsHtml = details.research_tools.map(tool => 
                    `<li><label>${tool.type}:</label> <span>${tool.quantity} ฉบับ</span></li>`
                ).join('');
            }

            // --- ประกอบร่าง HTML ทั้งหมดสำหรับฟอร์ม 5 ---
            html = `
                <h4><i class="fas fa-user icon-prefix"></i>ข้อมูลผู้ยื่นคำร้อง</h4>
                <ul class="info-list">
                    <li><label>ชื่อ-นามสกุล:</label> <span>${user.prefix_th} ${user.first_name_th} ${user.last_name_th}</span></li>
                    <li><label>รหัสนักศึกษา:</label> <span>${user.student_id}</span></li>
                    <li><label>ระดับการศึกษา:</label> <span>${user.degree || '-'}</span></li>
                    <li><label>หลักสูตร:</label> <span>${programName}</span></li>
                    <li><label>อีเมล:</label> <span>${user.email || '-'}</span></li>
                    <li><label>เบอร์โทรศัพท์:</label> <span>${user.phone || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4><i class="fas fa-book icon-prefix"></i>ข้อมูลหัวข้อวิทยานิพนธ์ (ที่ได้รับอนุมัติ)</h4>
                <ul class="info-list">
                    <li><label>วันที่อนุมัติ:</label> <span>${formatThaiDateTime(user.proposal_approval_date)}</span></li>
                    <li><label>ภาษาไทย:</label> <span class="thesis-title">${user.thesis_title_th || '-'}</span></li>
                    <li><label>ภาษาอังกฤษ:</label> <span class="thesis-title">${user.thesis_title_en || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4><i class="fas fa-microscope icon-prefix"></i>รายละเอียดการขออนุญาต</h4>
                <div class="subsection">
                    <h5>เครื่องมือที่ใช้ในการวิจัย และจำนวนหนังสือที่ต้องการ</h5>
                    <ul class="info-list compact">
                        ${researchToolsHtml}
                    </ul>
                </div>
            `;
            break;
        }

        case 'ฟอร์ม 6': {
            // --- ขั้นตอนที่ 1: ค้นหาชื่ออาจารย์และกรรมการทั้งหมดจาก ID ที่บันทึกไว้ ---
            const committeeIds = doc.committee || {};

            // อาจารย์ที่ปรึกษา (กรรมการโดยตำแหน่ง)
            const mainAdvisor = advisors.find(a => a.advisor_id === user.main_advisor_id);
            const mainAdvisorName = mainAdvisor ? `${mainAdvisor.prefix_th}${mainAdvisor.first_name_th} ${mainAdvisor.last_name_th}`.trim() : '-';
            
            const coAdvisor1 = advisors.find(a => a.advisor_id === user.co_advisor1_id);
            const coAdvisor1Name = coAdvisor1 ? `${coAdvisor1.prefix_th}${coAdvisor1.first_name_th} ${coAdvisor1.last_name_th}`.trim() : '-';

            // คณะกรรมการสอบที่เสนอชื่อ
            const committeeChair = advisors.find(a => a.advisor_id === committeeIds.chair_id);
            const committeeChairName = committeeChair ? `${committeeChair.prefix_th}${committeeChair.first_name_th} ${committeeChair.last_name_th}`.trim() : '-';

            const coAdvisor2 = advisors.find(a => a.advisor_id === committeeIds.co_advisor2_id);
            const coAdvisor2Name = coAdvisor2 ? `${coAdvisor2.prefix_th}${coAdvisor2.first_name_th} ${coAdvisor2.last_name_th}`.trim() : '-';

            const member5 = advisors.find(a => a.advisor_id === committeeIds.member5_id);
            const member5Name = member5 ? `${member5.prefix_th}${member5.first_name_th} ${member5.last_name_th}`.trim() : '-';

            // กรรมการสำรองที่เสนอชื่อ
            const reserveExternal = externalProfessors.find(p => p.ext_prof_id === committeeIds.reserve_external_id);
            const reserveExternalName = reserveExternal ? `${reserveExternal.prefix_th}${reserveExternal.first_name_th} ${reserveExternal.last_name_th}`.trim() : '-';

            const reserveInternal = advisors.find(a => a.advisor_id === committeeIds.reserve_internal_id);
            const reserveInternalName = reserveInternal ? `${reserveInternal.prefix_th}${reserveInternal.first_name_th} ${reserveInternal.last_name_th}`.trim() : '-';


            // --- ขั้นตอนที่ 2: สร้าง HTML ทั้งหมด ---
            html = `
                <h4><i class="fas fa-user-graduate icon-prefix"></i> ข้อมูลผู้ยื่นคำร้อง</h4>
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
                <h4><i class="fas fa-book-open icon-prefix"></i> ข้อมูลวิทยานิพนธ์</h4>
                <ul class="info-list">
                    <li><label>ชื่อเรื่อง (ไทย):</label> <span class="thesis-title">${user.thesis_title_th || '-'}</span></li>
                    <li><label>ชื่อเรื่อง (อังกฤษ):</label> <span class="thesis-title">${user.thesis_title_en || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">

                <h4><i class="fas fa-users icon-prefix"></i> คณะกรรมการสอบและอาจารย์ที่ปรึกษา</h4>
                <div class="subsection">
                    <h5>อาจารย์ที่ปรึกษา (กรรมการโดยตำแหน่ง)</h5>
                    <ul class="info-list compact">
                        <li><label>ที่ปรึกษาหลัก:</label> <span>${mainAdvisorName}</span></li>
                        <li><label>ที่ปรึกษาร่วม 1:</label> <span>${coAdvisor1Name}</span></li>
                    </ul>
                </div>
                <div class="subsection">
                    <h5>คณะกรรมการสอบที่เสนอชื่อ</h5>
                    <ul class="info-list compact">
                        <li><label>ประธานกรรมการสอบ:</label> <span>${committeeChairName}</span></li>
                        <li><label>กรรมการ (ที่ปรึกษาร่วม 2):</label> <span>${coAdvisor2Name}</span></li>
                        <li><label>กรรมการสอบ (คนที่ 5):</label> <span>${member5Name}</span></li>
                    </ul>
                </div>
                <div class="subsection">
                    <h5>กรรมการสำรองที่เสนอชื่อ</h5>
                    <ul class="info-list compact">
                        <li><label>กรรมการสำรอง (จากภายนอก):</label> <span>${reserveExternalName}</span></li>
                        <li><label>กรรมการสำรอง (จากภายใน):</label> <span>${reserveInternalName}</span></li>
                    </ul>
                </div>
            `;
            break;
        }
            
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
    
    loadDocumentDetail();
});