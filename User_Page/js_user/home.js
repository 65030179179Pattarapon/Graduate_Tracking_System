// /User_Page/js_user/home.js

function logout() {
  const modal = document.getElementById('logout-confirm-modal');
  if (modal) {
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
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

function getUserDocuments(docArrays, studentId, studentFullName) {
    if (!studentId && !studentFullName) return [];
    
    const allUserDocs = [];
    docArrays.forEach(docArray => {
        const filtered = docArray.filter(doc => {
            if (doc.student_id) {
                return doc.student_id === studentId;
            }
            if (doc.student && studentFullName) {
                return doc.student.trim() === studentFullName.trim();
            }
            return false;
        });
        allUserDocs.push(...filtered);
    });
    return allUserDocs;
}

function formatDateTime(isoString) {
     if (!isoString) return 'N/A';
     
     // สร้าง Date object จาก ISO string โดยตรง
     // JavaScript จะจัดการแปลงจาก UTC มาเป็นเวลาท้องถิ่นของเบราว์เซอร์ให้โดยอัตโนมัติ
     const date = new Date(isoString);

     // ตรวจสอบว่าเป็นวันที่ถูกต้องหรือไม่
     if (isNaN(date.getTime())) {
         return 'Invalid Date';
     }

     // ใช้ toLocaleString เพื่อแสดงผลตามภาษาและ Time Zone ของผู้ใช้
     return date.toLocaleString('th-TH', {
         year: 'numeric',
         month: 'short',
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit',
         second: '2-digit',
         hour12: false // แสดงผลแบบ 24 ชั่วโมง
     }) + ' น.';
 }
 
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
        nextStepContainer.innerHTML = `<span class="action-title">เลือกอาจารย์ที่ปรึกษา</span><p>ขั้นตอนแรกคือการยื่นแบบฟอร์มขอรับรองการเป็นอาจารย์ที่ปรึกษาวิทยานิพนธ์ หลัก/ร่วม</p><a href="/User_Page/html_user/form1.html" class="action-button">ไปที่ฟอร์ม 1</a>`;
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

async function loadDashboard() {
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
        
        const currentUser = students.find(s => s.email === userEmail);
        if (!currentUser) {
            alert("ไม่พบข้อมูลนักศึกษา, กำลังออกจากระบบ");
            logout(); // Original logout without confirm for critical errors
            return;
        }
        
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

        const recentDocsList = document.getElementById('recent-docs-list');
        recentDocsList.innerHTML = '';
        if (userAllDocuments.length > 0) {
            userAllDocuments.sort((a, b) => new Date(b.submitted_date || b.rejected_date || 0) - new Date(a.submitted_date || a.rejected_date || 0));
            const recentThree = userAllDocuments.slice(0, 3);
            
            recentThree.forEach(doc => {
                const li = document.createElement('li');
                const docId = doc.id || doc.doc_id || `${doc.type}_${doc.student_email || userEmail}`;
                const detailLink = `/User_Page/html_user/student_document_detail.html?id=${encodeURIComponent(docId)}&type=${encodeURIComponent(doc.type)}`;
                
                const statusClass = `status-${(doc.status || 'default').replace(/\s+/g, '-')}`;
                li.innerHTML = `<a href="${detailLink}" class="doc-title">${doc.title} (${doc.type || ''})</a><span class="doc-status ${statusClass}">${doc.status}</span>`;
                recentDocsList.appendChild(li);
            });
        } else {
            recentDocsList.innerHTML = '<li class="no-docs">ยังไม่มีประวัติการยื่นเอกสาร</li>';
        }

        determineNextStep(currentUser, userApprovedDocs);

    } catch (error) {
        console.error("Failed to load dashboard data:", error);
        const mainContainer = document.querySelector('main.dashboard-container');
        if (mainContainer) mainContainer.innerHTML = `<p style="color: red; text-align: center;">เกิดข้อผิดพลาดในการโหลดข้อมูลแดชบอร์ด</p>`;
    }
}

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

    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
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
    
    if (document.querySelector('main.dashboard-container')) {
        loadDashboard();
    }
});