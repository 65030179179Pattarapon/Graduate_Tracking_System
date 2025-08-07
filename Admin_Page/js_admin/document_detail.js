// /Admin_Page/js_admin/document_detail.js

// =================================================================
// ภาค 1: Helper Functions
// =================================================================

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

function formatDate(isoString) {
    if (!isoString) return '-';
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Bangkok'
        });
    } catch (error) {
        return 'Invalid Date';
    }
}

function goBack() {
    // ใช้ history.back() เพื่อกลับไปยังหน้าที่แล้วในประวัติการเข้าชม
    window.history.back();
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// =================================================================
// ภาค 2: Document Detail Page Logic
// =================================================================

async function loadDocumentDetail() {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get('id');

    if (!docId) {
        document.querySelector('main.detail-container').innerHTML = '<h1>ไม่พบ ID ของเอกสาร</h1>';
        return;
    }

    try {
        const [
            students, dbPending, dbApproved, dbRejected,
            // --- เพิ่มบรรทัดนี้ ---
            dbWaitingAdvisor, 
            advisors, externalProfessors, programs, departments, executives
        ] = await Promise.all([
            fetch("/data/student.json").then(res => res.json()),
            Promise.resolve(JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]')),
            Promise.resolve(JSON.parse(localStorage.getItem('localStorage_approvedDocs') || '[]')),
            Promise.resolve(JSON.parse(localStorage.getItem('localStorage_rejectedDocs') || '[]')),
            // --- และเพิ่มบรรทัดนี้ ---
            Promise.resolve(JSON.parse(localStorage.getItem('localStorage_waitingAdvisorDocs') || '[]')),
            fetch("/data/advisor.json").then(res => res.json()),
            fetch("/data/external_professor.json").then(res => res.json()),
            fetch("/data/structures/programs.json").then(res => res.json()),
            fetch("/data/structures/departments.json").then(res => res.json()),
            fetch("/data/executive.json").then(res => res.json())
        ]);

        // --- และแก้ไขบรรทัดนี้ ---
        const allDocuments = [...dbPending, ...dbApproved, ...dbRejected, ...dbWaitingAdvisor];
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
            departments,
            executives
        };

        renderHeader(fullDataPayload);
        renderSidebar(fullDataPayload);
        renderMainContent(fullDataPayload);
        renderActionPanelAndTimeline(fullDataPayload);
        renderHistory(fullDataPayload);

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลเอกสาร:", error);
        document.querySelector('main.detail-container').innerHTML = `<h1>เกิดข้อผิดพลาด: ${error.message}</h1>`;
    }
}

function renderHeader({ doc }) {
    document.getElementById('doc-title-heading').textContent = doc.title || 'รายละเอียดเอกสาร';
}

function renderSidebar({ doc, user }) {
    const statusCard = document.getElementById('status-highlight-card');
    const statusIcon = document.getElementById('status-icon');
    const statusText = document.getElementById('doc-status-main');
    
    let statusClass = 'pending';
    if (doc.status === 'อนุมัติแล้ว') statusClass = 'approved';
    else if (['ไม่อนุมัติ', 'ตีกลับ', 'ส่งกลับให้แก้ไข'].includes(doc.status)) statusClass = 'rejected';
    
    statusText.textContent = doc.status;
    statusCard.className = `status-card ${statusClass}`;
    
    if (statusClass === 'approved') statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
    else if (statusClass === 'rejected') statusIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
    else statusIcon.innerHTML = '<i class="fas fa-hourglass-half"></i>';

    if (user) {
        document.getElementById('sidebar-student-id').textContent = user.student_id;
        document.getElementById('sidebar-fullname').textContent = `${user.prefix_th}${user.first_name_th} ${user.last_name_th}`.trim();
        document.getElementById('sidebar-email').textContent = user.email;
    }

    document.getElementById('doc-type').textContent = doc.type || 'N/A';
    document.getElementById('doc-submission-date').textContent = formatThaiDateTime(doc.submitted_date);
    document.getElementById('doc-action-date').textContent = formatThaiDateTime(doc.last_action_date || doc.submitted_date);
}

function renderMainContent(payload) {
    const { doc } = payload;
    const specificContentContainer = document.getElementById('form-specific-content');
    specificContentContainer.innerHTML = generateFormSpecificHTML(payload);

    const filesList = document.getElementById('attached-files-list');
    filesList.innerHTML = '';
    if (doc.files && doc.files.length > 0) {
        doc.files.forEach(file => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="file-label">${file.type || 'ไฟล์แนบ'}:</span> <a href="#" class="file-link">${file.name || 'ไม่พบชื่อไฟล์'}</a>`;
            filesList.appendChild(li);
        });
    } else {
        filesList.innerHTML = `<li class="loading-text">ไม่มีไฟล์แนบ</li>`;
    }
    
    const studentCommentDisplay = document.getElementById('student-comment-display');
    studentCommentDisplay.textContent = doc.student_comment || 'ไม่มีความคิดเห็นเพิ่มเติม';
}

function generateFormSpecificHTML({ doc, user, advisors, programs, departments }) {
    let html = '';
    const details = doc.details || {};
    const programName = user ? programs.find(p => p.id === user.program_id)?.name || '-' : '-';
    const departmentName = user ? departments.find(d => d.id === user.department_id)?.name || '-' : '-';

    switch(doc.type) {
        case 'ฟอร์ม 1':
            // แก้ไข: อ้างอิงจาก doc.selected_... แทน doc.details
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
                    <li><label>ระดับปริญญา:</label> <span>${user.degree || '-'}</span></li>
                    <li><label>หลักสูตรและสาขาวิชา:</label> <span>${programName}</span></li>
                    <li><label>ภาควิชา:</label> <span>${departmentName}</span></li>
                    <li><label>เบอร์โทรศัพท์:</label> <span>${user.phone || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4>หัวข้อวิทยานิพนธ์</h4>
                <ul class="info-list">
                    <li><label>ชื่อเรื่อง (ภาษาไทย):</label> <span>${doc.thesis_title_th || '-'}</span></li>
                    <li><label>ชื่อเรื่อง (ภาษาอังกฤษ):</label> <span>${doc.thesis_title_en || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4>ข้อมูลการลงทะเบียน</h4>
                <ul class="info-list">
                    <li><label>ภาคการศึกษาที่:</label> <span>${details.registration_semester || '-'}</span></li>
                    <li><label>ปีการศึกษา:</label> <span>${details.registration_year || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4>อาจารย์ที่ปรึกษา</h4>
                <ul class="info-list">
                    <li><label>อาจารย์ที่ปรึกษาหลัก:</label> <span>${mainAdvisorForm2 ? `${mainAdvisorForm2.prefix_th}${mainAdvisorForm2.first_name_th} ${mainAdvisorForm2.last_name_th}`.trim() : '-'}</span></li>
                    <li><label>อาจารย์ที่ปรึกษาร่วม 1:</label> <span>${coAdvisor1Form2 ? `${coAdvisor1Form2.prefix_th}${coAdvisor1Form2.first_name_th} ${coAdvisor1Form2.last_name_th}`.trim() : '-'}</span></li>
                    <li><label>อาจารย์ที่ปรึกษาร่วม 2:</label> <span>${coAdvisor2Form2 ? `${coAdvisor2Form2.prefix_th}${coAdvisor2Form2.first_name_th} ${coAdvisor2Form2.last_name_th}`.trim() : '-'}</span></li>
                </ul>
            `;
            break;
        
        case 'ฟอร์ม 3':
            const mainAdvisorForm3 = advisors.find(a => a.advisor_id === user.main_advisor_id);
            const coAdvisor1Form3 = advisors.find(a => a.advisor_id === user.co_advisor1_id);
            const coAdvisor2Form3 = advisors.find(a => a.advisor_id === doc.selected_co_advisor2_id);
            
            html = `
                <h4>ข้อมูลผู้ยื่นคำร้อง</h4>
                <ul class="info-list">
                    <li><label>ชื่อ-นามสกุล:</label> <span>${user.prefix_th} ${user.first_name_th} ${user.last_name_th}</span></li>
                    <li><label>รหัสนักศึกษา:</label> <span>${user.student_id}</span></li>
                    <li><label>ระดับปริญญา:</label> <span>${user.degree || '-'}</span></li>
                    <li><label>หลักสูตรและสาขาวิชา:</label> <span>${programName}</span></li>
                    <li><label>ภาควิชา:</label> <span>${departmentName}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4>ข้อมูลหัวข้อวิทยานิพนธ์ (ที่ได้รับอนุมัติ)</h4>
                <ul class="info-list">
                    <li><label>วันที่อนุมัติหัวข้อ:</label> <span>${formatDate(user.proposal_approval_date)}</span></li>
                    <li><label>ชื่อเรื่อง (ภาษาไทย):</label> <span>${user.thesis_title_th || '-'}</span></li>
                    <li><label>ชื่อเรื่อง (ภาษาอังกฤษ):</label> <span>${user.thesis_title_en || '-'}</span></li>
                </ul>
                <hr class="subtle-divider">
                <h4>อาจารย์ที่ปรึกษา</h4>
                <ul class="info-list">
                    <li><label>อาจารย์ที่ปรึกษาหลัก:</label> <span>${mainAdvisorForm3 ? `${mainAdvisorForm3.prefix_th}${mainAdvisorForm3.first_name_th} ${mainAdvisorForm3.last_name_th}`.trim() : '-'}</span></li>
                    <li><label>อาจารย์ที่ปรึกษาร่วม 1:</label> <span>${coAdvisor1Form3 ? `${coAdvisor1Form3.prefix_th}${coAdvisor1Form3.first_name_th} ${coAdvisor1Form3.last_name_th}`.trim() : '-'}</span></li>
                    <li><label>อาจารย์ที่ปรึกษาร่วม 2:</label> <span>${coAdvisor2Form3 ? `${coAdvisor2Form3.prefix_th}${coAdvisor2Form3.first_name_th} ${coAdvisor2Form3.last_name_th}`.trim() : '-'}</span></li>
                </ul>
            `;
            break;
        default:
            html = `<p class="loading-text">ไม่มีรายละเอียดสำหรับเอกสารประเภทนี้</p>`;
    }
    return html;
}

function renderHistory({ doc }) {
    const historyLog = document.getElementById('history-log');
    historyLog.innerHTML = '';
    const history = doc.history || [{ date: doc.submitted_date, action: "นักศึกษายื่นเอกสาร", actor: "นักศึกษา" }];

    if (history.length === 0) {
        historyLog.innerHTML = '<li>ยังไม่มีประวัติ</li>';
        return;
    }

    history.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(log => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="log-action">${log.action}</span>
            <span class="log-actor">โดย: ${log.actor}</span>
            <span class="log-date">${formatThaiDateTime(log.date)}</span>
            ${log.comment ? `<p class="log-comment"><b>เหตุผล:</b> ${log.comment}</p>` : ''}
        `;
        historyLog.appendChild(li);
    });
}

// =================================================================
// ภาค 3: Action Panel & Workflow Logic
// =================================================================

function renderActionPanelAndTimeline({ doc, user, advisors, executives }) {
    const actionContainer = document.getElementById('action-panel');
    const timelineContainer = document.getElementById('workflow-timeline');
    actionContainer.innerHTML = '';
    timelineContainer.innerHTML = '';

    let currentWorkflow = [];
    let actionHTML = '';

    if (doc.type === 'ฟอร์ม 1') {
        const mainAdvisor = advisors.find(a => a.advisor_id === doc.selected_main_advisor_id);
        const coAdvisor = advisors.find(a => a.advisor_id === doc.selected_co_advisor_id);
        const executive = executives.find(e => e.role === 'ผู้ช่วยคณบดีฝ่ายวิชาการ');

        let advisorNames = [
            mainAdvisor ? `${mainAdvisor.prefix_th}${mainAdvisor.first_name_th}` : null,
            coAdvisor ? `${coAdvisor.prefix_th}${coAdvisor.first_name_th}` : null
        ].filter(Boolean).join(', ');

        currentWorkflow = [
            { name: 'ยื่นเอกสาร', actor: `${user.prefix_th}${user.first_name_th} ${user.last_name_th}` },
            { name: 'อ.ที่ปรึกษาอนุมัติ', status: 'รออาจารย์ที่ปรึกษาอนุมัติ', actor: advisorNames || 'N/A' },
            { name: 'ผู้บริหารอนุมัติ', status: 'รอผู้บริหารอนุมัติ', actor: executive?.name || 'N/A' },
            { name: 'เสร็จสิ้น', status: 'อนุมัติแล้ว', actor: 'เจ้าหน้าที่' }
        ];

        if (doc.status === 'รอตรวจ') {
            actionHTML = `
                <p class="next-step-info"><b>ขั้นตอนต่อไป:</b> ส่งต่อให้ อ.ที่ปรึกษา</p>
                <ul class="actor-list">
                    ${mainAdvisor ? `<li><b>ที่ปรึกษาหลัก:</b> ${mainAdvisor.prefix_th}${mainAdvisor.first_name_th} ${mainAdvisor.last_name_th} (${mainAdvisor.email})</li>` : ''}
                    ${coAdvisor ? `<li><b>ที่ปรึกษาร่วม:</b> ${coAdvisor.prefix_th}${coAdvisor.first_name_th} ${coAdvisor.last_name_th} (${coAdvisor.email})</li>` : ''}
                </ul>
                <div class="action-buttons">
                    <button class="btn-primary" onclick="handleAdminAction('${doc.doc_id}', 'forward_to_advisor', 'รออาจารย์ที่ปรึกษาอนุมัติ')">ส่งต่อ</button>
                    <button class="btn-danger" onclick="openModal('rejection-modal')">ส่งกลับให้แก้ไข</button>
                </div>`;
        } else if (doc.status === 'รออาจารย์ที่ปรึกษาอนุมัติ') {
            actionHTML = `<p class="waiting-info">กำลังรอการอนุมัติจากอาจารย์ที่ปรึกษา...</p>`;
        } else if (doc.status === 'รอผู้บริหารอนุมัติ') {
            actionHTML = `
                <p class="next-step-info"><b>ขั้นตอนต่อไป:</b> ส่งต่อให้ ผู้บริหาร</p>
                <ul class="actor-list">
                    ${executive ? `<li><b>ผู้รับผิดชอบ:</b> ${executive.name} (${executive.role})</li>` : ''}
                </ul>
                <div class="action-buttons">
                    <button class="btn-primary" onclick="handleAdminAction('${doc.doc_id}', 'forward_to_executive', 'อนุมัติแล้ว')">อนุมัติขั้นสุดท้าย</button>
                    <button class="btn-danger" onclick="openModal('rejection-modal')">ส่งกลับให้แก้ไข</button>
                </div>`;
        }
    } else if (doc.type === 'ฟอร์ม 2') {
        const mainAdvisor = advisors.find(a => a.advisor_id === user.main_advisor_id);
        const coAdvisor1 = advisors.find(a => a.advisor_id === user.co_advisor1_id);
        const coAdvisor2 = advisors.find(a => a.advisor_id === doc.selected_co_advisor2_id);
        
        const programChair = executives.find(e => e.role === 'ประธานหลักสูตร');
        const deptHead = executives.find(e => e.role === 'หัวหน้าภาควิชา');
        const asstDean = executives.find(e => e.role === 'ผู้ช่วยคณบดีงานบัณฑิตศึกษาและวิจัย');
        const dean = executives.find(e => e.role === 'คณบดี');

        let advisorNames = [
            mainAdvisor ? `${mainAdvisor.prefix_th}${mainAdvisor.first_name_th}` : null,
            coAdvisor1 ? `${coAdvisor1.prefix_th}${coAdvisor1.first_name_th}` : null,
            coAdvisor2 ? `${coAdvisor2.prefix_th}${coAdvisor2.first_name_th}` : null
        ].filter(Boolean).join(', ');

        currentWorkflow = [
            { name: 'ยื่นเอกสาร', status: 'รอตรวจ', actor: `${user.first_name_th} ${user.last_name_th}` },
            { name: 'อ.ที่ปรึกษาอนุมัติ', status: 'รออาจารย์ที่ปรึกษาอนุมัติ', actor: advisorNames || 'N/A' },
            { name: 'ประธานหลักสูตรอนุมัติ', status: 'รอประธานหลักสูตรอนุมัติ', actor: programChair?.name },
            { name: 'หัวหน้าภาควิชาอนุมัติ', status: 'รอหัวหน้าภาควิชาอนุมัติ', actor: deptHead?.name },
            { name: 'ผู้ช่วยคณบดีฯ อนุมัติ', status: 'รอผู้ช่วยคณบดีฯ อนุมัติ', actor: asstDean?.name },
            { name: 'คณบดีอนุมัติ', status: 'รอคณบดีอนุมัติ', actor: dean?.name },
            { name: 'เสร็จสิ้น', status: 'อนุมัติแล้ว', actor: 'เจ้าหน้าที่' }
        ];

        if (doc.status === 'รอตรวจ') {
            actionHTML = `
                <p class="next-step-info"><b>ขั้นตอนต่อไป:</b> ส่งต่อให้ อ.ที่ปรึกษา</p>
                <ul class="actor-list">
                    ${mainAdvisor ? `<li><b>ที่ปรึกษาหลัก:</b> ${mainAdvisor.prefix_th}${mainAdvisor.first_name_th} ${mainAdvisor.last_name_th} (${mainAdvisor.email})</li>` : ''}
                    ${coAdvisor1 ? `<li><b>ที่ปรึกษาร่วม 1:</b> ${coAdvisor1.prefix_th}${coAdvisor1.first_name_th} ${coAdvisor1.last_name_th} (${coAdvisor1.email})</li>` : ''}
                    ${coAdvisor2 ? `<li><b>ที่ปรึกษาร่วม 2:</b> ${coAdvisor2.prefix_th}${coAdvisor2.first_name_th} ${coAdvisor2.last_name_th} (${coAdvisor2.email})</li>` : ''}
                </ul>
                <div class="action-buttons">
                    <button class="btn-primary" onclick="handleAdminAction('${doc.doc_id}', 'forward_to_advisor', 'รออาจารย์ที่ปรึกษาอนุมัติ')">ส่งต่อ</button>
                    <button class="btn-danger" onclick="openModal('rejection-modal')">ส่งกลับให้แก้ไข</button>
                </div>`;
        } else if (doc.status === 'รออาจารย์ที่ปรึกษาอนุมัติ') {
            actionHTML = `<p class="waiting-info">กำลังรอการอนุมัติจากอาจารย์ที่ปรึกษา...</p>`;
        }
    } 
    // --- วางโค้ดส่วนนี้ต่อจากปีกกาของฟอร์ม 2 ---
    else if (doc.type === 'ฟอร์ม 3') {
        const mainAdvisor = advisors.find(a => a.advisor_id === user.main_advisor_id);
        const coAdvisor1 = advisors.find(a => a.advisor_id === user.co_advisor1_id);
        const coAdvisor2 = advisors.find(a => a.advisor_id === doc.selected_co_advisor2_id);
        const committeeChair = executives.find(e => e.role === 'ประธานกรรมการพิจารณาหัวข้อและเค้าโครงวิทยานิพนธ์');

        let advisorNames = [
            mainAdvisor ? `${mainAdvisor.prefix_th}${mainAdvisor.first_name_th}` : null,
            coAdvisor1 ? `${coAdvisor1.prefix_th}${coAdvisor1.first_name_th}` : null,
            coAdvisor2 ? `${coAdvisor2.prefix_th}${coAdvisor2.first_name_th}` : null,
        ].filter(Boolean).join(', ');

        currentWorkflow = [
            { name: 'ยื่นเอกสาร', status: 'รอตรวจ', actor: `${user.first_name_th}` },
            { name: 'อ.ที่ปรึกษาอนุมัติ', status: 'รออาจารย์ที่ปรึกษาอนุมัติ', actor: advisorNames || 'N/A' },
            { name: 'ประธานกรรมการฯ อนุมัติ', status: 'รอประธานกรรมการฯ อนุมัติ', actor: committeeChair?.name || 'N/A' },
            { name: 'เสร็จสิ้น', status: 'อนุมัติแล้ว', actor: 'เจ้าหน้าที่' }
        ];

        if (doc.status === 'รอตรวจ') {
            actionHTML = `
                <p class="next-step-info"><b>ขั้นตอนต่อไป:</b> ส่งต่อให้ อ.ที่ปรึกษาทั้งหมด</p>
                <ul class="actor-list">
                    ${mainAdvisor ? `<li><b>หลัก:</b> ${mainAdvisor.prefix_th}${mainAdvisor.first_name_th} ${mainAdvisor.last_name_th}</li>` : ''}
                    ${coAdvisor1 ? `<li><b>ร่วม 1:</b> ${coAdvisor1.prefix_th}${coAdvisor1.first_name_th} ${coAdvisor1.last_name_th}</li>` : ''}
                    ${coAdvisor2 ? `<li><b>ร่วม 2:</b> ${coAdvisor2.prefix_th}${coAdvisor2.first_name_th} ${coAdvisor2.last_name_th}</li>` : ''}
                </ul>
                <div class="action-buttons">
                    <button class="btn-primary" onclick="handleAdminAction('${doc.doc_id}', 'forward_to_advisor', 'รออาจารย์ที่ปรึกษาอนุมัติ')">ส่งต่อ</button>
                    <button class="btn-danger" onclick="openModal('rejection-modal')">ส่งกลับให้แก้ไข</button>
                </div>`;
        } else if (doc.status === 'รออาจารย์ที่ปรึกษาอนุมัติ') {
            actionHTML = `
                <p class="next-step-info"><b>ขั้นตอนต่อไป:</b> ส่งต่อให้ ประธานกรรมการฯ</p>
                <ul class="actor-list">
                    ${committeeChair ? `<li><b>ผู้รับผิดชอบ:</b> ${committeeChair.name}</li>` : '<li>ไม่พบข้อมูลประธานกรรมการฯ</li>'}
                </ul>
                <div class="action-buttons">
                    <button class="btn-primary" onclick="handleAdminAction('${doc.doc_id}', 'forward_to_committee_chair', 'รอประธานกรรมการฯ อนุมัติ')">ส่งต่อ</button>
                    <button class="btn-danger" onclick="openModal('rejection-modal')">ส่งกลับให้แก้ไข</button>
                </div>`;
        } else if (doc.status === 'รอประธานกรรมการฯ อนุมัติ') {
            actionHTML = `
                <p class="next-step-info"><b>ขั้นตอนต่อไป:</b> ยืนยันการอนุมัติขั้นสุดท้าย</p>
                <div class="action-buttons">
                    <button class="btn-approve" onclick="handleAdminAction('${doc.doc_id}', 'final_approve', 'อนุมัติแล้ว')">อนุมัติขั้นสุดท้าย</button>
                    <button class="btn-danger" onclick="openModal('rejection-modal')">ส่งกลับให้แก้ไข</button>
                </div>`;
        }
    }
    
    const currentStepIndex = currentWorkflow.findIndex(step => step.status === doc.status);

    currentWorkflow.forEach((step, index) => {
        const stepElement = document.createElement('div');
        stepElement.className = 'timeline-step';
        if (index < currentStepIndex) {
            stepElement.classList.add('completed');
        } else if (index === currentStepIndex) {
            stepElement.classList.add('active');
        }
        stepElement.innerHTML = `
            <div class="timeline-icon"></div>
            <div class="timeline-label">
                <span>${step.name}</span>
                <small>โดย: ${step.actor || 'N/A'}</small>
            </div>
        `;
        timelineContainer.appendChild(stepElement);
    });
    
    if (!actionHTML) {
        if (['อนุมัติแล้ว', 'ไม่อนุมัติ', 'ส่งกลับให้แก้ไข'].includes(doc.status)) {
            actionHTML = `<p class="waiting-info">เอกสารนี้ดำเนินการเสร็จสิ้นแล้ว</p>`;
        } else {
            actionHTML = `<p class="waiting-info">กำลังรอการดำเนินการจากฝ่ายอื่น...</p>`;
        }
    }
    actionContainer.innerHTML = actionHTML;
    
    document.getElementById('confirm-rejection-btn').onclick = () => handleAdminAction(doc.doc_id, 'reject', 'ส่งกลับให้แก้ไข');
}

function handleAdminAction(docId, action, nextStatus) {
    const comment = document.getElementById('rejection-comment')?.value || 
                    document.getElementById('admin-comment-input')?.value || '';

    if (action === 'reject' && !comment) {
        alert('กรุณาใส่เหตุผล/ความคิดเห็นในการส่งกลับ');
        return;
    }

    const confirmationMessage = action === 'reject' 
        ? 'คุณแน่ใจหรือไม่ว่าต้องการส่งเอกสารกลับไปแก้ไข?'
        : `คุณแน่ใจหรือไม่ว่าต้องการส่งต่อเอกสาร?`;

    if (confirm(confirmationMessage)) {
        // 1. ดึงข้อมูลเอกสารทั้งหมดจาก localStorage
        let pendingDocs = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
        let waitingAdvisorDocs = JSON.parse(localStorage.getItem('localStorage_waitingAdvisorDocs') || '[]');
        let rejectedDocs = JSON.parse(localStorage.getItem('localStorage_rejectedDocs') || '[]');

        // 2. ค้นหาเอกสารที่ต้องการดำเนินการ
        let docIndex = pendingDocs.findIndex(d => d.doc_id === docId);
        if (docIndex === -1) {
            alert('ไม่พบเอกสารที่ต้องการดำเนินการ หรือเอกสารถูกดำเนินการไปแล้ว');
            return;
        }

        const docToUpdate = pendingDocs[docIndex];

        // 3. เพิ่มประวัติการดำเนินการ
        if (!docToUpdate.history) {
            docToUpdate.history = [{ date: docToUpdate.submitted_date, action: "นักศึกษายื่นเอกสาร", actor: docToUpdate.student_email }];
        }
        docToUpdate.history.push({
            date: new Date().toISOString(),
            action: action === 'reject' ? 'ส่งกลับให้แก้ไข' : `ส่งต่อไปยัง ${nextStatus}`,
            actor: 'เจ้าหน้าที่',
            comment: comment || ''
        });

        // 4. อัปเดตสถานะและย้ายข้อมูล
        docToUpdate.status = nextStatus;
        docToUpdate.last_action_date = new Date().toISOString();

        if (action === 'reject') {
            docToUpdate.status = 'ส่งกลับให้แก้ไข'; // อัปเดตสถานะให้ถูกต้อง
            docToUpdate.comment = comment; // เพิ่มความคิดเห็นเข้าไปในเอกสาร
            rejectedDocs.push(docToUpdate); // ย้ายไป Rejected
        } else {
            waitingAdvisorDocs.push(docToUpdate); // ย้ายไป Waiting for Advisor
        }
        
        // ลบออกจาก Pending
        pendingDocs.splice(docIndex, 1);

        // 5. บันทึกข้อมูลกลับลง localStorage
        localStorage.setItem('localStorage_pendingDocs', JSON.stringify(pendingDocs));
        localStorage.setItem('localStorage_waitingAdvisorDocs', JSON.stringify(waitingAdvisorDocs));
        localStorage.setItem('localStorage_rejectedDocs', JSON.stringify(rejectedDocs));
        
        closeModal('rejection-modal'); // ปิด modal (ถ้ามี)
        alert('ดำเนินการสำเร็จ!');
        window.location.href = '/Admin_Page/html_admin/home.html'; // กลับไปหน้าหลักเพื่อดูผลลัพธ์
    }
}

// =================================================================
// ภาค 4: Main Execution
// =================================================================
document.addEventListener('DOMContentLoaded', loadDocumentDetail);