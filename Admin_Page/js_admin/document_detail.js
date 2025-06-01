// document_detail.js

// --- Helper function to get student details (simulated) ---
// In a real app, you might have a common way to fetch student details by ID
async function getStudentDetailsById(studentId) {
    if (!studentId) return null;
    try {
        const response = await fetch('/data/student.json');
        if (!response.ok) throw new Error('Failed to load student data');
        const students = await response.json();
        return students.find(s => s.student_id === studentId);
    } catch (error) {
        console.error("Error fetching student details:", error);
        return null;
    }
}


async function fetchDocumentDetails(docId, docType) {
    // This is a simplified fetch. In a real app, you'd ideally have an endpoint:
    // const response = await fetch(`/api/documents/${docId}?type=${docType}`);
    // For now, we'll try to find it in the existing JSONs based on type and ID.
    // This requires documents in JSONs to have a unique 'id' or 'request_id'.

    let docData = null;
    let studentDataAssociated = null; // To store student data associated with the document
    const dataFiles = {
        'pending': '/data/document_pending.json',
        'due': '/data/document_near_due.json', // Assuming 'due' is a type
        'approved': '/data/document_approved.json',
        'rejected': '/data/document_rejected.json',
        // For specific form types, we might need to know which general file they fall under
        // or if they have their own data source.
        // Let's assume forms 1-5 might be found within pending, approved, or rejected lists,
        // or they might be aggregated in the 'all-documents' logic.
        // For simplicity, if docType is formX, we might check common lists.
    };

    let filePath = dataFiles[docType]; // Try specific type first

    if (!filePath) { // If docType is like 'ฟอร์ม 1', it might be within pending, approved etc.
        // This is a very broad search, not efficient for production.
        // It assumes docId is unique across all these files.
        const allPossibleFiles = Object.values(dataFiles);
        for (const file of allPossibleFiles) {
            if (!file) continue;
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const docs = await response.json();
                    // Assuming docId is a property like 'id' or 'request_id' or a constructed one
                    docData = docs.find(d => (d.id === docId || d.request_id === docId || (d.title + d.student) === docId) );
                    if (docData) {
                        // Try to get student ID from the document data
                        const studentIdToFetch = docData.student_id || (docData.student && !isNaN(docData.student) ? docData.student : null);
                        if (studentIdToFetch) {
                             studentDataAssociated = await getStudentDetailsById(studentIdToFetch);
                        } else if (docData.student) { // If student name is there, try to find by name (less reliable)
                            const studentsResponse = await fetch('/data/student.json');
                            if (studentsResponse.ok) {
                                const allStudents = await studentsResponse.json();
                                studentDataAssociated = allStudents.find(s => (s.first_name_th + " " + s.last_name_th) === docData.student);
                                if (studentDataAssociated) docData.student_id = studentDataAssociated.student_id; // Enrich docData
                            }
                        }
                        break;
                    }
                }
            } catch (err) { console.warn(`Could not load/find in ${file}`, err); }
        }
    } else {
         try {
            const response = await fetch(filePath);
            if (response.ok) {
                const docs = await response.json();
                docData = docs.find(d => (d.id === docId || d.request_id === docId || (d.title + d.student) === docId));
                 if (docData) {
                    const studentIdToFetch = docData.student_id || (docData.student && !isNaN(docData.student) ? docData.student : null);
                    if (studentIdToFetch) {
                         studentDataAssociated = await getStudentDetailsById(studentIdToFetch);
                    } else if (docData.student) {
                        const studentsResponse = await fetch('/data/student.json');
                        if (studentsResponse.ok) {
                            const allStudents = await studentsResponse.json();
                            studentDataAssociated = allStudents.find(s => (s.first_name_th + " " + s.last_name_th) === docData.student);
                            if (studentDataAssociated) docData.student_id = studentDataAssociated.student_id;
                        }
                    }
                }
            }
        } catch (err) { console.error(`Error fetching from ${filePath}`, err); }
    }
    
    // If docData still not found, try looking in student.json for doc.id related to proposal or final date as a fallback
    // This part is highly speculative as document IDs might not be in student.json directly
    if (!docData) {
        try {
            const studentsResponse = await fetch('/data/student.json');
            if (studentsResponse.ok) {
                const allStudents = await studentsResponse.json();
                // This is a placeholder, needs specific logic if docId refers to a student's thesis related event
                // Example: studentDataAssociated = allStudents.find(s => s.proposal_id === docId); 
                // if (studentDataAssociated) { docData = { title: studentDataAssociated['thesis-title'], ...studentDataAssociated, type: docType }; }
            }
        } catch(err) { console.warn("Could not find document in student data either.", err); }
    }


    if (docData) {
        // Combine student details into docData if found separately
        if (studentDataAssociated) {
            docData.student_id = studentDataAssociated.student_id;
            docData.student_fullname = `${studentDataAssociated.prefix_th || ''}${studentDataAssociated.first_name_th || ''} ${studentDataAssociated.last_name_th || ''}`.trim();
            docData.student_degree = studentDataAssociated.degree;
            docData.student_program = studentDataAssociated.program;
            docData.student_department = studentDataAssociated.department;
            docData.student_faculty = studentDataAssociated.faculty;
        } else if (docData.student && !docData.student_fullname) {
            // If only student name string is available
             docData.student_fullname = docData.student;
        }
        return docData;
    } else {
        throw new Error(`Document with ID ${docId} (type: ${docType}) not found.`);
    }
}

function renderDocumentDetails(docData, docTypeFromURL) {
    document.getElementById('doc-main-title').textContent = `รายละเอียด: ${docData.title || docTypeFromURL || 'เอกสาร'}`;
    document.getElementById('doc-type').textContent = docData.type || docTypeFromURL || 'N/A';
    document.getElementById('doc-status').textContent = docData.status || 'N/A';
    document.getElementById('doc-submission-date').textContent = docData.submitted_date || docData.date || docData.proposal_date || 'N/A';
    document.getElementById('doc-title-detail').textContent = docData.title || '(ไม่มีชื่อเรื่อง)';

    // Student Info
    document.getElementById('student-fullname').textContent = docData.student_fullname || docData.student || 'N/A';
    document.getElementById('student-id-detail').textContent = docData.student_id || 'N/A';
    document.getElementById('student-degree').textContent = docData.student_degree || 'N/A';
    document.getElementById('student-program').textContent = docData.student_program || 'N/A';
    document.getElementById('student-department').textContent = docData.student_department || 'N/A';
    document.getElementById('student-faculty').textContent = docData.student_faculty || 'N/A';

    // Form-Specific Details
    const formSpecificContainer = document.getElementById('form-specific-details');
    formSpecificContainer.innerHTML = ''; // Clear previous
    
    let formSpecificHTML = `<h3>รายละเอียดเฉพาะของฟอร์ม (${docData.type || docTypeFromURL})</h3>`;

    // --- Example for Form 1: Advisor Certification ---
    if (docData.type === 'ฟอร์ม 1' || docTypeFromURL === 'ฟอร์ม 1' || (docData.main_advisor && docTypeFromURL.includes('advisor'))) { // Rough check
        formSpecificHTML += `<div class="form-field-group">
                                <label>อาจารย์ที่ปรึกษาหลัก:</label>
                                <span>${docData.main_advisor || docData.thesis_advisor_main || 'ยังไม่ได้ระบุ'}</span>
                             </div>`;
        formSpecificHTML += `<div class="form-field-group">
                                <label>อาจารย์ที่ปรึกษาร่วม (1):</label>
                                <span>${docData.co_advisor_1 || docData['advisor-co1'] || 'ไม่มี'}</span>
                             </div>`;
        formSpecificHTML += `<div class="form-field-group">
                                <label>อาจารย์ที่ปรึกษาร่วม (2):</label>
                                <span>${docData.co_advisor_2 || docData['advisor-co2'] || 'ไม่มี'}</span>
                             </div>`;
        // Add advisor approval status if available in docData
    }
    // --- Example for Form 2: Thesis Proposal (Info, no files yet from form) ---
    else if (docData.type === 'ฟอร์ม 2' || docTypeFromURL === 'ฟอร์ม 2' || docTypeFromURL.includes('proposal')) {
        // Assuming docData has 'thesis_title_proposed', 'checklist_items' (array)
        formSpecificHTML += `<div class="form-field-group">
                                <label>หัวข้อวิทยานิพนธ์ที่เสนอ:</label>
                                <p>${docData.thesis_title_proposed || docData['thesis-title'] || 'N/A'}</p>
                             </div>`;
        if (docData.checklist_items && docData.checklist_items.length > 0) {
            formSpecificHTML += `<p><strong>รายการตรวจสอบจากนักศึกษา:</strong></p><ul>`;
            docData.checklist_items.forEach(item => {
                formSpecificHTML += `<li>${item.text}: ${item.checked ? '✔️' : '❌'} (ภาค: ${item.semester||''}, ปี: ${item.year||''})</li>`;
            });
            formSpecificHTML += `</ul>`;
        }
    }
    // --- Example for Form 3: Topic Document Submission (with files) ---
    else if (docData.type === 'ฟอร์ม 3' || docTypeFromURL === 'ฟอร์ม 3' || docTypeFromURL.includes('submission')) {
        formSpecificHTML += `<div class="form-field-group">
                                <label>หัวข้อวิทยานิพนธ์ (ที่อนุมัติแล้ว):</label>
                                <p>${docData.thesis_title_approved || docData['thesis-title'] || 'N/A'}</p>
                             </div>`;
        formSpecificHTML += `<p><strong>ไฟล์เอกสารที่นำส่ง:</strong></p><div class="file-list">`;
        if (docData.files && docData.files.length > 0) {
            docData.files.forEach(file => { // Assuming docData.files = [{name: "เค้าโครง.pdf", url: "...", type: "เค้าโครงวิทยานิพนธ์"}]
                formSpecificHTML += `<div class="file-list-item">
                                        <strong>${file.type}:</strong> ${file.name || 'N/A'} 
                                        <a href="${file.url || '#'}" class="file-link" target="_blank">เปิด/ดาวน์โหลด</a>
                                     </div>`;
            });
        } else {
            formSpecificHTML += `<p><em>ยังไม่มีการแนบไฟล์สำหรับฟอร์มนี้ หรือรอการอัปเดตจากระบบ</em></p>`;
            formSpecificHTML += `<p><em>หากนี่คือการนำส่งเค้าโครงวิทยานิพนธ์ ควรมีลิงก์ไปยังไฟล์เค้าโครง, หน้าปก, และสำเนาลงทะเบียน</em></p>`;
        }
        formSpecificHTML += `</div>`;
    }
    // --- Example for Form 4: Invite Experts ---
     else if (docData.type === 'ฟอร์ม 4' || docTypeFromURL === 'ฟอร์ม 4' || docTypeFromURL.includes('expert')) {
        formSpecificHTML += `<div class="form-field-group"><label>จำนวนผู้ทรงคุณวุฒิที่ขอเชิญ:</label><span>${docData.num_evaluators || 'N/A'} ท่าน</span></div>`;
        formSpecificHTML += `<div class="form-field-group"><label>ประเภทเอกสารที่ให้ประเมิน:</label><span>${(docData.document_types_for_evaluation || []).join(', ') || 'N/A'} ${docData.other_doc_type ? `(อื่นๆ: ${docData.other_doc_type})` : ''}</span></div>`;
        formSpecificHTML += `<div class="form-field-group"><label>จำนวนหนังสือขออนุญาต:</label><span>${docData.num_docs || 'N/A'} ฉบับ</span></div>`;
        formSpecificHTML += `<p><strong>รายชื่อผู้ทรงคุณวุฒิ (Admin จัดการ):</strong></p><ul id="expert-list"><li>ยังไม่ได้เพิ่มข้อมูล</li></ul>`; // Admin can add to this list
    }
    // --- Example for Form 5: Data Collection Request ---
    else if (docData.type === 'ฟอร์ม 5' || docTypeFromURL === 'ฟอร์ม 5' || docTypeFromURL.includes('datacollect')) {
        formSpecificHTML += `<div class="form-field-group"><label>วันที่อนุมัติหัวข้อ:</label><span>${docData.proposal_approval_date || 'N/A'}</span></div>`;
        formSpecificHTML += `<div class="form-field-group"><label>ประเภทข้อมูล/เครื่องมือที่ใช้เก็บข้อมูล:</label><span>${(docData.data_collection_instruments || []).join(', ') || 'N/A'} ${docData.other_data_instrument ? `(อื่นๆ: ${docData.other_data_instrument})` : ''}</span></div>`;
        formSpecificHTML += `<div class="form-field-group"><label>จำนวนหนังสือขออนุญาต:</label><span>${docData.num_permission_letters || 'N/A'} ฉบับ</span></div>`;
        formSpecificHTML += `<p><strong>สถานที่/องค์กร ที่ขอเก็บข้อมูล (Admin จัดการ):</strong></p><ul id="org-list"><li>ยังไม่ได้เพิ่มข้อมูล</li></ul>`;
    }
    else {
        formSpecificHTML += `<p><em>(ไม่มีรายละเอียดเฉพาะสำหรับประเภทเอกสารนี้ หรือรอการพัฒนา)</em></p>`;
        if(docData.comment) formSpecificHTML += `<div class="form-field-group"><label>หมายเหตุ (ถ้ามี):</label><p>${docData.comment}</p></div>`;

    }
    formSpecificContainer.innerHTML = formSpecificHTML;


    // Admin Actions (Example)
    const actionContainer = document.getElementById('action-buttons-container');
    actionContainer.innerHTML = ''; // Clear previous buttons

    if (docData.status === 'รอตรวจ' || docData.status === 'แก้ไขแล้วส่งกลับ') {
        actionContainer.innerHTML += `<button class="approve-btn" onclick="handleAdminAction('${docData.id}', 'approve')">อนุมัติเอกสาร</button>`;
        actionContainer.innerHTML += `<button class="reject-btn" onclick="handleAdminAction('${docData.id}', 'reject')">ไม่อนุมัติ</button>`;
        actionContainer.innerHTML += `<button class="revise-btn" onclick="handleAdminAction('${docData.id}', 'revise')">ส่งกลับให้แก้ไข</button>`;
    } else if (docData.status === 'รอการรับรองจากอาจารย์ที่ปรึกษา') {
         actionContainer.innerHTML += `<p><em>รอการดำเนินการจากอาจารย์ที่ปรึกษา</em></p>`;
    }
    // Add more actions based on docData.type and docData.status

    // Action History (Placeholder)
    const historyLog = document.getElementById('history-log');
    // In real app, fetch and display actual history for docData.id
    if (docData.history && docData.history.length > 0) {
        historyLog.innerHTML = docData.history.map(entry => `<li><span class="log-date">[${entry.date}]</span> ${entry.action} โดย ${entry.actor}</li>`).join('');
    } else {
        historyLog.innerHTML = '<li>ยังไม่มีประวัติการดำเนินการ</li>';
    }
}

function handleAdminAction(docId, action) {
  const feedbackEl = document.getElementById('action-feedback');
  feedbackEl.textContent = '';
  feedbackEl.className = '';

  // Prompt for comments if rejecting or requesting revision
  let comments = '';
  if (action === 'reject' || action === 'revise') {
    comments = prompt(`กรุณาใส่เหตุผล/ความคิดเห็นสำหรับการ "${action}":`);
    if (comments === null) return; // User cancelled
  }

  console.log(`Admin action: ${action} on document ID: ${docId}. Comments: ${comments}`);
  // TODO: Implement actual API call to backend to process this action
  // For now, simulate success and update UI (this is temporary)
  feedbackEl.textContent = `ดำเนินการ "${action}" สำหรับเอกสาร ID ${docId} แล้ว (จำลอง).`;
  feedbackEl.classList.add('success'); // Assuming success class for styling

  // Potentially update document status on the page (would require re-fetching or updating docData)
  // For example:
  // const statusEl = document.getElementById('doc-status');
  // if (action === 'approve' && statusEl) statusEl.textContent = 'อนุมัติแล้ว';
  // if (action === 'reject' && statusEl) statusEl.textContent = 'ไม่อนุมัติ';
  // if (action === 'revise' && statusEl) statusEl.textContent = 'รอการแก้ไข';
  alert(`(จำลอง) ดำเนินการ: ${action} สำหรับเอกสาร ID: ${docId}\nความคิดเห็น: ${comments}`);
}


document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const docId = urlParams.get('id');
  const docType = urlParams.get('type'); // This is the type passed from admin_home.js (e.g., 'pending', 'form1')

  if (docId) {
    try {
      const documentData = await fetchDocumentDetails(docId, docType);
      if (documentData) {
        renderDocumentDetails(documentData, docType); // Pass docTypeFromURL for context
      } else {
        document.querySelector('.detail-container').innerHTML = '<h2>ไม่พบข้อมูลเอกสาร</h2><button onclick="goBack()" class="back-button">ย้อนกลับ</button>';
      }
    } catch (error) {
      console.error("Error displaying document details:", error);
      document.querySelector('.detail-container').innerHTML = `<h2>เกิดข้อผิดพลาดในการโหลดรายละเอียดเอกสาร</h2><p>${error.message}</p><button onclick="goBack()" class="back-button">ย้อนกลับ</button>`;
    }
  } else {
    document.querySelector('.detail-container').innerHTML = '<h2>ไม่ได้ระบุ ID ของเอกสาร</h2><button onclick="goBack()" class="back-button">ย้อนกลับ</button>';
  }

  const saveNoteBtn = document.getElementById('save-admin-note-btn');
  if(saveNoteBtn) {
    saveNoteBtn.addEventListener('click', () => {
        const note = document.getElementById('admin-internal-notes').value;
        console.log("Admin note to save:", note, "for doc ID:", docId);
        // TODO: API call to save note
        alert("บันทึกโน้ตแล้ว (จำลอง)");
    });
  }
});

function goBack() {
  // Assuming admin_home.html is in the same directory or a known relative path
  window.location.href = 'admin_home.html';
}
function logoutFromDetail() { // Simple logout, assuming logout() function might be in a global scope or needs re-definition
    localStorage.clear();
    window.location.href = "/login/index.html";
}