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

function goBack() {
    window.location.href = '/Admin_Page/html_admin/home.html';
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
            advisors, externalProfessors, programs, departments, executives
        ] = await Promise.all([
            fetch("/data/student.json").then(res => res.json()),
            Promise.resolve(JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]')),
            Promise.resolve(JSON.parse(localStorage.getItem('localStorage_approvedDocs') || '[]')),
            Promise.resolve(JSON.parse(localStorage.getItem('localStorage_rejectedDocs') || '[]')),
            fetch("/data/advisor.json").then(res => res.json()),
            fetch("/data/external_professor.json").then(res => res.json()),
            fetch("/data/structures/programs.json").then(res => res.json()),
            fetch("/data/structures/departments.json").then(res => res.json()),
            fetch("/data/executive.json").then(res => res.json())
        ]);

        const allDocuments = [...dbPending, ...dbApproved, ...dbRejected];
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
        renderActionPanel(fullDataPayload);
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

function renderActionPanel(payload) {
    const { doc, advisors, executives } = payload;
    const actionContainer = document.getElementById('action-panel');
    const timelineContainer = document.getElementById('workflow-timeline');
    actionContainer.innerHTML = '';
    timelineContainer.innerHTML = '';

    const workflows = {
        'ฟอร์ม 1': [
            { name: 'ยื่นเอกสาร', status: 'รอตรวจ' },
            { name: 'อ.ที่ปรึกษาอนุมัติ', status: 'รออาจารย์ที่ปรึกษาอนุมัติ' },
            { name: 'ผู้บริหารอนุมัติ', status: 'รอผู้บริหารอนุมัติ' },
            { name: 'เสร็จสิ้น', status: 'อนุมัติแล้ว' }
        ]
    };

    const currentWorkflow = workflows[doc.type] || [];
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

    let actionHTML = '';

    if (doc.status === 'รอตรวจ') {
        const mainAdvisor = advisors.find(a => a.advisor_id === doc.selected_main_advisor_id);
        const coAdvisor = advisors.find(a => a.advisor_id === doc.selected_co_advisor_id);
        actionHTML = `
            <p class="next-step-info"><b>ขั้นตอนต่อไป:</b> ส่งต่อให้ อ.ที่ปรึกษา</p>
            <ul class="actor-list">
                ${mainAdvisor ? `<li><b>หลัก:</b> ${mainAdvisor.prefix_th}${mainAdvisor.first_name_th} ${mainAdvisor.last_name_th}</li>` : ''}
                ${coAdvisor ? `<li><b>ร่วม:</b> ${coAdvisor.prefix_th}${coAdvisor.first_name_th} ${coAdvisor.last_name_th}</li>` : ''}
            </ul>
            <div class="action-buttons">
                <button class="btn-primary" onclick="handleAdminAction('${doc.doc_id}', 'forward_to_advisor', 'รออาจารย์ที่ปรึกษาอนุมัติ')">ส่งต่อ</button>
                <button class="btn-danger" onclick="openModal('rejection-modal')">ส่งกลับให้แก้ไข</button>
            </div>`;
    } else if (doc.status === 'รออาจารย์ที่ปรึกษาอนุมัติ') {
        actionHTML = `<p class="waiting-info">กำลังรอการอนุมัติจากอาจารย์ที่ปรึกษา...</p>`;
    } else if (doc.status === 'รอผู้บริหารอนุมัติ') {
        const executive = executives.find(e => e.role === 'คณบดี');
        actionHTML = `
            <p class="next-step-info"><b>ขั้นตอนต่อไป:</b> ส่งต่อให้ ผู้บริหาร</p>
            <ul class="actor-list">
                ${executive ? `<li><b>ผู้รับผิดชอบ:</b> ${executive.name} (${executive.role})</li>` : ''}
            </ul>
            <div class="action-buttons">
                <button class="btn-primary" onclick="handleAdminAction('${doc.doc_id}', 'forward_to_executive', 'รอผู้บริหารอนุมัติ')">ส่งต่อ</button>
                <button class="btn-danger" onclick="openModal('rejection-modal')">ส่งกลับให้แก้ไข</button>
            </div>`;
    } else if (doc.status === 'อนุมัติแล้ว' || doc.status === 'ไม่อนุมัติ') {
        actionHTML = `<p class="waiting-info">เอกสารนี้ดำเนินการเสร็จสิ้นแล้ว</p>`;
    }

    actionContainer.innerHTML = actionHTML;
    
    // ผูก Event ให้กับปุ่มใน Modal
    document.getElementById('confirm-rejection-btn').onclick = () => handleAdminAction(doc.doc_id, 'reject', 'ส่งกลับให้แก้ไข');
}

function handleAdminAction(docId, action, nextStatus) {
    const comment = document.getElementById('rejection-comment').value;

    if (action === 'reject' && !comment) {
        alert('กรุณาใส่เหตุผลในการส่งกลับ');
        return;
    }

    const confirmationMessage = action === 'reject' 
        ? 'คุณแน่ใจหรือไม่ว่าต้องการส่งเอกสารกลับไปแก้ไข?'
        : `คุณแน่ใจหรือไม่ว่าต้องการส่งต่อเอกสาร?`;

    if (confirm(confirmationMessage)) {
        // --- ส่วนจำลองการอัปเดตข้อมูลใน localStorage ---
        const pendingDocs = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
        const docIndex = pendingDocs.findIndex(d => d.doc_id === docId);

        if (docIndex !== -1) {
            const docToUpdate = pendingDocs[docIndex];
            
            // เพิ่มประวัติการดำเนินการ
            if (!docToUpdate.history) {
                docToUpdate.history = [{ date: docToUpdate.submitted_date, action: "นักศึกษายื่นเอกสาร", actor: "นักศึกษา" }];
            }
            docToUpdate.history.push({
                date: new Date().toISOString(),
                action: action === 'reject' ? 'ส่งกลับให้แก้ไข' : `ส่งต่อไปยัง ${nextStatus}`,
                actor: 'เจ้าหน้าที่',
                comment: comment || ''
            });

            // อัปเดตสถานะ
            docToUpdate.status = nextStatus;
            docToUpdate.last_action_date = new Date().toISOString();

            localStorage.setItem('localStorage_pendingDocs', JSON.stringify(pendingDocs));
        }
        
        closeModal('rejection-modal');
        alert('ดำเนินการสำเร็จ!');
        window.location.reload();
    }
}

// =================================================================
// ภาค 4: Main Execution
// =================================================================
document.addEventListener('DOMContentLoaded', loadDocumentDetail);