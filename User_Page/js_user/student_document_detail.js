// /User_Page/js_user/student_document_detail.js

function logout() {
  const modal = document.getElementById('logout-confirm-modal');
  if (modal) modal.style.display = 'flex';
}
// Include other shared functions like modal handling if needed

// --- Main Function to Fetch and Render Document Details ---
async function loadDocumentDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('id');
    const docType = urlParams.get('type');

    if (!docId) {
        document.querySelector('.detail-page-container').innerHTML = '<h1>ไม่พบ ID ของเอกสาร</h1><p>กรุณากลับไปที่หน้าสถานะและลองอีกครั้ง</p>';
        return;
    }

    try {
        // This is a simplified fetch logic, similar to admin detail page.
        // It fetches all potential data sources to find the document.
        // In a real application, you'd have a single endpoint: /api/documents/:id
        const allDocsResponse = await Promise.all([
            fetch("/data/document_pending.json").then(res => res.json()),
            fetch("/data/document_approved.json").then(res => res.json()),
            fetch("/data/document_rejected.json").then(res => res.json()),
            // Add other document sources if any, e.g., english test submissions
        ]);
        
        const allDocs = [].concat(...allDocsResponse);
        const docData = allDocs.find(d => (d.id || d.request_id || (d.title + d.student)) === docId);

        if (!docData) {
            throw new Error('ไม่พบข้อมูลเอกสารสำหรับ ID นี้');
        }

        renderDetails(docData);

    } catch (error) {
        console.error("Failed to load document details:", error);
        document.querySelector('.detail-page-container').innerHTML = `<h1>เกิดข้อผิดพลาด</h1><p>${error.message}</p>`;
    }
}

function renderDetails(docData) {
    // ---- 1. Render Main Info ----
    document.getElementById('doc-title-heading').textContent = docData.title || 'รายละเอียดเอกสาร';
    
    // ---- 2. Render Status Card ----
    const statusCard = document.getElementById('status-highlight-card');
    const statusIcon = statusCard.querySelector('.status-icon i');
    const statusText = document.getElementById('doc-status-main');
    
    statusText.textContent = docData.status || 'ไม่ระบุสถานะ';
    statusCard.classList.remove('approved', 'pending', 'rejected');
    statusIcon.classList.remove('fa-spinner', 'fa-spin', 'fa-check-circle', 'fa-times-circle', 'fa-exclamation-triangle');

    if (docData.status && (docData.status.includes('อนุมัติ') || docData.status.includes('ผ่าน'))) {
        statusCard.classList.add('approved');
        statusIcon.classList.add('fa-check-circle');
    } else if (docData.status && (docData.status.includes('ไม่อนุมัติ') || docData.status.includes('แก้ไข'))) {
        statusCard.classList.add('rejected');
        statusIcon.classList.add('fa-times-circle');
    } else { // Pending or other statuses
        statusCard.classList.add('pending');
        statusIcon.classList.add('fa-exclamation-triangle');
    }

    // ---- 3. Render Comment Card (if any) ----
    if (docData.comment) {
        const commentCard = document.getElementById('comment-card');
        document.getElementById('doc-comment').textContent = docData.comment;
        commentCard.style.display = 'block';
    }

    // ---- 4. Render General Details ----
    document.getElementById('doc-type').textContent = docData.type || 'N/A';
    document.getElementById('doc-submission-date').textContent = docData.submitted_date || docData.rejected_date || 'N/A';
    document.getElementById('doc-action-date').textContent = docData.approved_date || docData.rejected_date || 'N/A';

    // ---- 5. Render Form-Specific Content (placeholder) ----
    const formSpecificContainer = document.getElementById('form-specific-content');
    // You can add more specific details here based on docData.type
    // For example, for an English Test submission:
    if (docData.type === 'ยื่นผลสอบภาษาอังกฤษ') {
        formSpecificContainer.innerHTML = `
            <div class="info-grid">
                <div><label>ประเภทข้อสอบ:</label> <span>${docData.exam_type || 'N/A'}</span></div>
                <div><label>คะแนนที่ได้:</label> <span>${docData.exam_score || 'N/A'}</span></div>
            </div>`;
    }
    
    // ---- 6. Render Student Actions (if needed) ----
    const studentActionContainer = document.getElementById('student-action-section');
    if (docData.status && (docData.status.includes('ไม่อนุมัติ') || docData.status.includes('แก้ไข'))) {
        // Construct the link to the appropriate edit page.
        // This is a simplified example.
        let editLink = '#'; // Default fallback
        const formNumMatch = docData.type ? docData.type.match(/\d+/) : null;
        if (docData.type && docData.type.includes('อังกฤษ')) {
            editLink = '/User_Page/html_user/edit_rejected_eng.html';
        } else if (formNumMatch) {
            editLink = `/User_Page/html_user/form${formNumMatch[0]}.html?edit=true&id=${docData.id}`;
        }

        document.getElementById('student-action-content').innerHTML = `
            <p>เอกสารของคุณต้องการการแก้ไข กรุณาคลิกที่ปุ่มด้านล่างเพื่อไปยังหน้าแก้ไข</p>
            <a href="${editLink}" class="action-button">แก้ไขและส่งใหม</a>
        `;
        studentActionContainer.style.display = 'block';
    } else if (docData.status && docData.status.includes('อนุมัติ')) {
        // If there's a file to download for approved docs
        if (docData.download_link) {
             document.getElementById('student-action-content').innerHTML = `
                <p>เอกสารของคุณได้รับการอนุมัติเรียบร้อยแล้ว</p>
                <a href="${docData.download_link}" class="action-button" target="_blank">ดาวน์โหลดเอกสารที่อนุมัติแล้ว</a>
            `;
            studentActionContainer.style.display = 'block';
        }
    }
}


// --- Main Event Listener ---
document.addEventListener('DOMContentLoaded', function() {
    // Navbar Dropdown & Logout Modal Logic (copy from home.js)
    // ... (ใส่โค้ดส่วน Dropdown และ Modal จาก home.js ที่แก้ไขแล้วที่นี่) ...

    // Load document details
    loadDocumentDetails();
});