// --- Global state for recent documents pagination ---
let recentDocsState = {
    currentPage: 1,
    rowsPerPage: 5, // แสดง 5 รายการต่อหน้า
    fullData: []
};

function determineNextStep(studentData, userApprovedDocs) {
    const nextStepContainer = document.getElementById('next-step-content');
    if (!nextStepContainer) return;

    const hasApproved = (formType) => userApprovedDocs.some(doc => doc.type === formType);
    const state = JSON.parse(localStorage.getItem('userDashboardState') || '{}');

    if (state.rejectedCount > 0) {
        nextStepContainer.className = 'next-step-body alert';
        nextStepContainer.innerHTML = `
            <span class="action-title">⚠️ มีเอกสารที่ต้องแก้ไข</span>
            <p>ระบบพบว่าคุณมีเอกสารที่ถูกส่งกลับหรือไม่อนุมัติ กรุณาตรวจสอบและดำเนินการแก้ไข</p>
            <a href="/User_Page/html_user/status.html" class="action-button">ไปที่หน้าสถานะเอกสาร</a>
        `;
        return;
    }

    if (!hasApproved('ฟอร์ม 1')) {
        nextStepContainer.innerHTML = `<span class="action-title">เลือกอาจารย์ที่ปรึกษา</span><p>ขั้นตอนแรกคือการยื่นแบบฟอร์มเพื่อขอรับรองการเป็นอาจารย์ที่ปรึกษาวิทยานิพนธ์ หลัก/ร่วม</p><a href="/User_Page/html_user/form1.html" class="action-button">ไปที่ฟอร์ม 1</a>`;
        return;
    }
    if (!hasApproved('ฟอร์ม 2')) {
        nextStepContainer.innerHTML = `<span class="action-title">เสนอหัวข้อวิทยานิพนธ์</span><p>ขั้นตอนต่อไปคือการเสนอหัวข้อและเค้าโครงวิทยานิพนธ์เพื่อขออนุมัติ</p><a href="/User_Page/html_user/form2.html" class="action-button">ไปที่ฟอร์ม 2</a>`;
        return;
    }
    if (!hasApproved('ฟอร์ม 3')) {
        nextStepContainer.innerHTML = `<span class="action-title">นำส่งเอกสารเค้าโครง</span><p>เมื่อหัวข้ออนุมัติแล้ว ขั้นตอนต่อไปคือนำส่งเอกสารเค้าโครงฉบับสมบูรณ์</p><a href="/User_Page/html_user/form3.html" class="action-button">ไปที่ฟอร์ม 3</a>`;
        return;
    }
    if (studentData.english_test_status !== 'ผ่านเกณฑ์') {
        const statusText = studentData.english_test_status ? `(สถานะปัจจุบัน: ${studentData.english_test_status})` : '';
        nextStepContainer.innerHTML = `<span class="action-title">ยื่นผลสอบภาษาอังกฤษ</span><p>คุณยังไม่ได้ยื่นผลสอบภาษาอังกฤษ หรือผลสอบยังไม่ผ่านเกณฑ์ ${statusText}</p><a href="/User_Page/html_user/eng.html" class="action-button">ไปที่หน้ายื่นผลสอบ</a>`;
        return;
    }
    if (!hasApproved('ฟอร์ม 4')) {
        nextStepContainer.innerHTML = `<span class="action-title">เชิญผู้ทรงคุณวุฒิ</span><p>ขั้นตอนต่อไปคือการยื่นเรื่องขอเชิญผู้ทรงคุณวุฒิเพื่อประเมินเครื่องมือวิจัย</p><a href="/User_Page/html_user/form4.html" class="action-button">ไปที่ฟอร์ม 4</a>`;
        return;
    }
    if (!hasApproved('ฟอร์ม 5')) {
        nextStepContainer.innerHTML = `<span class="action-title">ขออนุญาตเก็บข้อมูล</span><p>ขั้นตอนต่อไปคือการยื่นเรื่องขออนุญาตเก็บรวบรวมข้อมูลเพื่อการวิจัย</p><a href="/User_Page/html_user/form5.html" class="action-button">ไปที่ฟอร์ม 5</a>`;
        return;
    }

    nextStepContainer.className = 'next-step-body done';
    nextStepContainer.innerHTML = `
        <span class="action-title">👍 ยอดเยี่ยม!</span>
        <p>คุณได้ดำเนินการในขั้นตอนสำคัญๆ ของการศึกษาแล้ว กรุณาติดตามประกาศอื่นๆ ต่อไป</p>
        <a href="/User_Page/html_user/status.html" class="action-button">ดูสถานะเอกสารทั้งหมด</a>
    `;
}

// --- ฟังก์ชันใหม่สำหรับแสดงผลรายการล่าสุดตามหน้า ---
function renderRecentDocsPage(page) {
    recentDocsState.currentPage = page;
    const listElement = document.getElementById('recent-docs-list');
    const paginationControls = document.getElementById('recent-docs-pagination');
    
    if (!listElement || !paginationControls) return;

    listElement.innerHTML = '';
    
    const totalPages = Math.ceil(recentDocsState.fullData.length / recentDocsState.rowsPerPage) || 1;

    if (recentDocsState.fullData.length === 0) {
        listElement.innerHTML = '<li class="no-docs">ยังไม่มีประวัติการยื่นเอกสาร</li>';
        paginationControls.innerHTML = ''; // ซ่อน pagination ถ้าไม่มีข้อมูล
        return;
    }

    const start = (page - 1) * recentDocsState.rowsPerPage;
    const end = start + recentDocsState.rowsPerPage;
    const paginatedItems = recentDocsState.fullData.slice(start, end);

    paginatedItems.forEach(doc => {
        const li = document.createElement('li');
        const docId = doc.id || doc.doc_id || `${doc.type}_${doc.student_email || localStorage.getItem("current_user")}`;
        const detailLink = `/User_Page/html_user/student_document_detail.html?id=${encodeURIComponent(docId)}&type=${encodeURIComponent(doc.type)}`;
        const statusClass = `status-${(doc.status || 'default').replace(/\s+/g, '-')}`;
        li.innerHTML = `<a href="${detailLink}" class="doc-title">${doc.title} (${doc.type || ''})</a><span class="doc-status ${statusClass}">${doc.status}</span>`;
        listElement.appendChild(li);
    });

    // --- Render Pagination Controls ---
    paginationControls.innerHTML = `
        <span class="page-info">หน้า ${recentDocsState.currentPage} / ${totalPages}</span>
        <button id="recent-docs-prev" ${recentDocsState.currentPage === 1 ? 'disabled' : ''}>ᐸ</button>
        <button id="recent-docs-next" ${recentDocsState.currentPage >= totalPages ? 'disabled' : ''}>ᐳ</button>
    `;

    document.getElementById('recent-docs-prev').addEventListener('click', () => {
        if (recentDocsState.currentPage > 1) {
            renderRecentDocsPage(recentDocsState.currentPage - 1);
        }
    });
    document.getElementById('recent-docs-next').addEventListener('click', () => {
        if (recentDocsState.currentPage < totalPages) {
            renderRecentDocsPage(recentDocsState.currentPage + 1);
        }
    });
}

// --- Main function to load all data and render the dashboard (ปรับปรุง) ---
async function loadDashboard() {
    const userEmail = localStorage.getItem("current_user");
    if (!userEmail) { window.location.href = "/login/index.html"; return; }

    try {
        const [students, pendingDocs, approvedDocs, rejectedDocs] = await Promise.all([
            fetch("/data/student.json").then(res => res.json()),
            fetch("/data/document_pending.json").then(res => res.json()),
            fetch("/data/document_approved.json").then(res => res.json()),
            fetch("/data/document_rejected.json").then(res => res.json())
        ]);
        
        const currentUser = students.find(s => s.email === userEmail);
        if (!currentUser) { alert("ไม่พบข้อมูลนักศึกษา, กำลังออกจากระบบ"); logout(); return; }
        
        const userFullname = `${currentUser.prefix_th}${currentUser.first_name_th} ${currentUser.last_name_th}`;
        const studentId = currentUser.student_id;
        
        document.getElementById('nav-username').textContent = currentUser.email;
        document.getElementById('welcome-name').textContent = `${currentUser.first_name_th} ${currentUser.last_name_th}`;
        
        const localStoragePending = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
        const localStorageApproved = JSON.parse(localStorage.getItem('localStorage_approvedDocs') || '[]');
        const localStorageRejected = JSON.parse(localStorage.getItem('localStorage_rejectedDocs') || '[]');
        
        const userPendingDocs = getUserDocuments([pendingDocs, localStoragePending], studentId, userFullname);
        const userApprovedDocs = getUserDocuments([approvedDocs, localStorageApproved], studentId, userFullname);
        const userRejectedDocs = getUserDocuments([rejectedDocs, localStorageRejected], studentId, userFullname);
        const userAllDocuments = [...userPendingDocs, ...userApprovedDocs, ...userRejectedDocs];
        
        localStorage.setItem('userDashboardState', JSON.stringify({ rejectedCount: userRejectedDocs.length }));

        document.getElementById("submitted-count").textContent = userAllDocuments.length;
        document.getElementById("approved-count").textContent = userApprovedDocs.length;
        document.getElementById("rejected-count").textContent = userRejectedDocs.length;
        
        // --- ส่วนที่แก้ไข: จัดการข้อมูลสำหรับ Pagination ---
        userAllDocuments.sort((a, b) => new Date(b.submitted_date || b.rejected_date || 0) - new Date(a.submitted_date || a.rejected_date || 0));
        recentDocsState.fullData = userAllDocuments; // เก็บข้อมูลทั้งหมดที่จัดเรียงแล้ว
        renderRecentDocsPage(1); // แสดงหน้าแรก

        // --- 3. Determine and Render Next Step ---
        determineNextStep(currentUser, userApprovedDocs);

    } catch (error) {
        console.error("Failed to load dashboard data:", error);
        document.querySelector('main.dashboard-container').innerHTML = `<p style="color: red; text-align: center;">เกิดข้อผิดพลาดในการโหลดข้อมูลแดชบอร์ด</p>`;
    }
}

// --- Main Event Listener (คงเดิม) ---
document.addEventListener('DOMContentLoaded', function() {
    
    // Dashboard Logic
    if (document.querySelector('main.dashboard-container')) {
        loadDashboard();
    }
});