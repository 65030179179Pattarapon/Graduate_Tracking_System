// /User_Page/js_user/status.js (Corrected Version)

// =================================================================
// ภาค 1: Helper Functions
// =================================================================

function showLogoutModal() {
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

function formatDate(isoString) {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC'
        });
    } catch (error) {
        return 'Invalid Date';
    }
}

// =================================================================
// ภาค 2: Status Page Logic
// =================================================================

const paginationState = {
    approved: { currentPage: 1, data: [] },
    pending: { currentPage: 1, data: [] },
    rejected: { currentPage: 1, data: [] }
};
const ROWS_PER_PAGE = 5;

async function loadStatusData() {
    const userEmail = localStorage.getItem("current_user");
    if (!userEmail) {
        window.location.href = "/login/index.html";
        return;
    }

    try {
        const [students, dbPending, dbApproved, dbRejected] = await Promise.all([
            fetch("/data/student.json").then(res => res.json()),
            fetch("/data/document_pending.json").then(res => res.json()),
            fetch("/data/document_approved.json").then(res => res.json()),
            fetch("/data/document_rejected.json").then(res => res.json())
        ]);

        // ดึงข้อมูลจาก Local Storage
        const localStoragePending = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
        const localStorageApproved = JSON.parse(localStorage.getItem('localStorage_approvedDocs') || '[]');
        const localStorageRejected = JSON.parse(localStorage.getItem('localStorage_rejectedDocs') || '[]');

        // รวมข้อมูลจากสองแหล่ง
        const combinedPending = [...dbPending, ...localStoragePending];
        const combinedApproved = [...dbApproved, ...localStorageApproved];
        const combinedRejected = [...dbRejected, ...localStorageRejected];

        const currentUser = students.find(s => s.email === userEmail);
        if (!currentUser) {
            alert("ไม่พบข้อมูลนักศึกษา");
            return;
        }

        // อัปเดตชื่อผู้ใช้ใน Navbar
        const navUsername = document.getElementById('nav-username');
        if (navUsername) navUsername.textContent = currentUser.email;

        const userFullname = `${currentUser.prefix_th}${currentUser.first_name_th} ${currentUser.last_name_th}`;
        const studentId = currentUser.student_id;
        
        // กรองข้อมูลเฉพาะของนักศึกษาที่ล็อคอินอยู่
        paginationState.approved.data = combinedApproved.filter(doc => doc.student_id === studentId || doc.student_email === userEmail);
        paginationState.pending.data = combinedPending.filter(doc => doc.student_id === studentId || doc.student_email === userEmail);
        paginationState.rejected.data = combinedRejected.filter(doc => doc.student_id === studentId || doc.student_email === userEmail);

        // แสดงผลหน้าแรกของแต่ละสถานะ
        displayPageForStatus('approved', 1);
        displayPageForStatus('pending', 1);
        displayPageForStatus('rejected', 1);

    } catch (error) {
        console.error("Failed to load status data:", error);
        document.querySelector('.status-grid').innerHTML = `<p style="color: red; text-align: center;">เกิดข้อผิดพลาดในการโหลดข้อมูลสถานะ</p>`;
    }
}

function displayPageForStatus(statusKey, page) {
    const state = paginationState[statusKey];
    if (!state) return;

    state.currentPage = page;
    const listElement = document.getElementById(`${statusKey}-list`);
    
    const start = (page - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    const paginatedItems = state.data.slice(start, end);

    renderDocumentList(listElement, paginatedItems, statusKey);
    updatePaginationControlsForStatus(statusKey);
}

function updatePaginationControlsForStatus(statusKey) {
    const state = paginationState[statusKey];
    const controlsContainer = document.getElementById(`pagination-${statusKey}`);
    if (!state || !controlsContainer) return;

    const totalPages = Math.ceil(state.data.length / ROWS_PER_PAGE) || 1;
    
    if (state.data.length <= ROWS_PER_PAGE) {
        controlsContainer.innerHTML = '';
        return;
    }

    controlsContainer.innerHTML = `
        <button class="prev-btn" ${state.currentPage === 1 ? 'disabled' : ''}>ᐸ ก่อนหน้า</button>
        <span class="page-info">หน้า ${state.currentPage} / ${totalPages}</span>
        <button class="next-btn" ${state.currentPage >= totalPages ? 'disabled' : ''}>ถัดไป ᐳ</button>
    `;

    controlsContainer.querySelector('.prev-btn').addEventListener('click', () => {
        if (state.currentPage > 1) displayPageForStatus(statusKey, state.currentPage - 1);
    });
    controlsContainer.querySelector('.next-btn').addEventListener('click', () => {
        if (state.currentPage < totalPages) displayPageForStatus(statusKey, state.currentPage + 1);
    });
}

function renderDocumentList(listElement, documents, statusType) {
    if (!listElement) return;

    listElement.innerHTML = '';
    if (documents.length === 0) {
        listElement.innerHTML = `<li class="empty-message">ยังไม่มีเอกสารในสถานะนี้</li>`;
        return;
    }
    
    documents.sort((a, b) => new Date(b.submitted_date || 0) - new Date(a.submitted_date || 0));

    documents.forEach(doc => {
        const li = document.createElement('li');
        const docId = doc.doc_id || `${doc.type}_${doc.student_email}`;
        const detailPageUrl = `/User_Page/html_user/student_document_detail.html?id=${encodeURIComponent(docId)}&type=${encodeURIComponent(doc.type)}`;
        
        let dateToShow = '';
        let dateLabel = 'วันที่ส่ง';
        let dateKey = 'submitted_date';

        if (statusType === 'approved') {
            dateLabel = 'วันที่อนุมัติ';
            dateKey = 'approved_date';
        } else if (statusType === 'rejected') {
            dateLabel = 'วันที่ส่งกลับ';
            dateKey = 'rejected_date';
        }

        dateToShow = `${dateLabel}: ${formatDate(doc[dateKey] || doc.submitted_date)}`;

        li.innerHTML = `
            <a href="${detailPageUrl}">
                <span class="doc-title">${doc.title}</span>
                <span class="doc-details">${dateToShow}</span>
            </a>
        `;
        listElement.appendChild(li);
    });
}

// =================================================================
// ภาค 3: Main Event Listener
// =================================================================
document.addEventListener('DOMContentLoaded', function() {
    // --- Navbar & Logout Logic ---
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

    if (logoutButton) logoutButton.addEventListener('click', (e) => { e.preventDefault(); showLogoutModal(); });
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
    
    // --- Load data for the status page ---
    loadStatusData();
});