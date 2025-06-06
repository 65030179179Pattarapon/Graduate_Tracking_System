// /User_Page/js_user/status.js

function logout() {
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
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
  }
}

// --- Main Function to Load and Render Status Page ---
async function loadStatusData() {
    const userEmail = localStorage.getItem("current_user");
    if (!userEmail) {
        window.location.href = "/login/index.html";
        return;
    }

    try {
        // Fetch all necessary data concurrently
        const [students, pendingDocs, approvedDocs, rejectedDocs] = await Promise.all([
            fetch("/data/student.json").then(res => res.json()),
            fetch("/data/document_pending.json").then(res => res.json()),
            fetch("/data/document_approved.json").then(res => res.json()),
            fetch("/data/document_rejected.json").then(res => res.json())
        ]);

        const currentUser = students.find(s => s.email === userEmail);
        if (!currentUser) {
            alert("ไม่พบข้อมูลนักศึกษา, กำลังออกจากระบบ");
            logout(); // Original logout without confirm for critical errors
            return;
        }

        // Populate navbar username
        document.getElementById('nav-username').textContent = userEmail;

        // Filter documents for the current user
        // This assumes 'student' field is a full name. A more robust system would use student_id.
        const userFullname = `${currentUser.prefix_th}${currentUser.first_name_th} ${currentUser.last_name_th}`;
        
        const userPending = pendingDocs.filter(doc => doc.student === userFullname);
        const userApproved = approvedDocs.filter(doc => doc.student === userFullname);
        const userRejected = rejectedDocs.filter(doc => doc.student === userFullname);
        
        // Render each list
        renderDocumentList('approved-list', userApproved, 'อนุมัติ');
        renderDocumentList('pending-list', userPending, 'ดำเนินการ');
        renderDocumentList('rejected-list', userRejected, 'ไม่อนุมัติ/แก้ไข');

    } catch (error) {
        console.error("Failed to load status data:", error);
        document.querySelector('.status-grid').innerHTML = `<p style="color: red; text-align: center;">เกิดข้อผิดพลาดในการโหลดข้อมูลสถานะ</p>`;
    }
}

// Function to render a list of documents into a specific <ul>
function renderDocumentList(listId, documents, statusType) {
    const listElement = document.getElementById(listId);
    if (!listElement) return;

    listElement.innerHTML = ''; // Clear loading/previous content

    if (documents.length === 0) {
        listElement.innerHTML = `<li class="empty-message">ยังไม่มีเอกสารในสถานะนี้</li>`;
        return;
    }
    
    // Sort documents by date, most recent first
    documents.sort((a, b) => {
        const dateA = new Date(a.submitted_date || a.rejected_date || 0);
        const dateB = new Date(b.submitted_date || b.rejected_date || 0);
        return dateB - dateA;
    });

    documents.forEach(doc => {
        const li = document.createElement('li');
        // Construct detail link using a unique ID if available, otherwise fallback.
        const docId = doc.id || doc.request_id || `${doc.type}_${doc.student}`; // A unique ID from JSON is best
        const docType = doc.type || statusType;
        const detailPageUrl = `/Admin_Page/html_admin/document_detail.html?id=${encodeURIComponent(docId)}&type=${encodeURIComponent(docType)}`;

        // Date logic
        let dateToShow = '';
        if (statusType === 'อนุมัติ') {
            dateToShow = `วันที่อนุมัติ: ${doc.submitted_date || 'N/A'}`; // Assuming submitted_date is approval date for this list
        } else if (statusType === 'ไม่อนุมัติ/แก้ไข') {
            dateToShow = `วันที่ส่งกลับ: ${doc.rejected_date || 'N/A'}`;
        } else {
            dateToShow = `วันที่ส่ง: ${doc.submitted_date || 'N/A'}`;
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
    // Dropdown Menu Logic
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

    // Logout Confirmation Modal Logic
    const logoutButton = document.getElementById("logout-button");
    const modal = document.getElementById('logout-confirm-modal');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');

    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (modal) {
                modal.style.display = 'flex';
                requestAnimationFrame(() => modal.classList.add('show'));
            }
        });
    }
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
    
    // Load data for the status page
    loadStatusData();
});