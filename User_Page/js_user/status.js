// /User_Page/js_user/status.js

// --- Main Function to Load and Render Status Page ---
async function loadStatusData() {
    const userEmail = localStorage.getItem("current_user");
    if (!userEmail) {
        window.location.href = "/login/index.html";
        return;
    }

    try {
        const [students, pendingDocs, approvedDocs, rejectedDocs] = await Promise.all([
            fetch("/data/student.json").then(res => res.json()),
            fetch("/data/document_pending.json").then(res => res.json()),
            fetch("/data/document_approved.json").then(res => res.json()),
            fetch("/data/document_rejected.json").then(res => res.json())
        ]);

        const localStoragePending = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
        const localStorageApproved = JSON.parse(localStorage.getItem('localStorage_approvedDocs') || '[]');
        const localStorageRejected = JSON.parse(localStorage.getItem('localStorage_rejectedDocs') || '[]');

        const combinedPending = [...pendingDocs, ...localStoragePending];
        const combinedApproved = [...approvedDocs, ...localStorageApproved];
        const combinedRejected = [...rejectedDocs, ...localStorageRejected];

        const currentUser = students.find(s => s.email === userEmail);
        if (!currentUser) {
            alert("ไม่พบข้อมูลนักศึกษา, กำลังออกจากระบบ");
            localStorage.clear();
            window.location.href = "/login/index.html";
            return;
        }

        const navUsername = document.getElementById('nav-username');
        if (navUsername) navUsername.textContent = currentUser.email;

        const userFullname = `${currentUser.prefix_th}${currentUser.first_name_th} ${currentUser.last_name_th}`;
        const studentId = currentUser.student_id;
        
        const userPending = combinedPending.filter(doc => doc.student_id === studentId || doc.student === userFullname);
        const userApproved = combinedApproved.filter(doc => doc.student_id === studentId || doc.student === userFullname);
        const userRejected = combinedRejected.filter(doc => doc.student_id === studentId || doc.student === userFullname);
        
        renderDocumentList('approved-list', userApproved, 'อนุมัติ');
        renderDocumentList('pending-list', userPending, 'ดำเนินการ');
        renderDocumentList('rejected-list', userRejected, 'ไม่อนุมัติ/แก้ไข');

    } catch (error) {
        console.error("Failed to load status data:", error);
        document.querySelector('.status-grid').innerHTML = `<p style="color: red; text-align: center;">เกิดข้อผิดพลาดในการโหลดข้อมูลสถานะ</p>`;
    }
}

function formatDate(isoString) {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (error) {
        return 'Invalid Date';
    }
}

function renderDocumentList(listId, documents, statusType) {
    const listElement = document.getElementById(listId);
    if (!listElement) return;

    listElement.innerHTML = '';
    if (documents.length === 0) {
        listElement.innerHTML = `<li class="empty-message">ยังไม่มีเอกสารในสถานะนี้</li>`;
        return;
    }
    
    documents.sort((a, b) => {
        const dateA = new Date(a.submitted_date || a.rejected_date || a.approved_date || 0).getTime();
        const dateB = new Date(b.submitted_date || b.rejected_date || b.approved_date || 0).getTime();
        return dateB - dateA;
    });

    documents.forEach(doc => {
        const li = document.createElement('li');
        const docId = doc.id || doc.doc_id || `${doc.type}_${doc.student_email || localStorage.getItem("current_user")}`;
        const detailPageUrl = `/User_Page/html_user/student_document_detail.html?id=${encodeURIComponent(docId)}&type=${encodeURIComponent(doc.type)}`;
        
        let dateToShow = '';
        let dateValue = null;

        if (statusType === 'อนุมัติ') {
            dateValue = doc.approved_date || doc.submitted_date;
            dateToShow = `วันที่อนุมัติ: ${formatDate(dateValue)}`;
        } else if (statusType === 'ไม่อนุมัติ/แก้ไข') {
            dateValue = doc.rejected_date;
            dateToShow = `วันที่ส่งกลับ: ${formatDate(dateValue)}`;
        } else {
            dateValue = doc.submitted_date;
            dateToShow = `วันที่ส่ง: ${formatDate(dateValue)}`;
        }

        li.innerHTML = `
            <a href="${detailPageUrl}">
                <span class="doc-title">${doc.title} (${doc.type || ''})</span>
                <span class="doc-details">${dateToShow}</span>
            </a>
        `;
        listElement.appendChild(li);
    });
}

// --- Main Event Listener for all page interactions ---
document.addEventListener('DOMContentLoaded', function() {
    
    // --- Standard Navbar & Logout Logic ---
    function showLogoutModal() {
        const modal = document.getElementById('logout-confirm-modal');
        if (modal) {
            modal.style.display = 'flex';
            requestAnimationFrame(() => modal.classList.add('show'));
        } else {
            // Fallback if modal is not in HTML
            if (confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
                localStorage.clear();
                window.location.href = "/login/index.html";
            }
        }
    }

    function closeModal() {
        const modal = document.getElementById('logout-confirm-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
        }
    }

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
    // --- End Navbar Logic ---
    
    
    // Load data for the status page
    loadStatusData();
});