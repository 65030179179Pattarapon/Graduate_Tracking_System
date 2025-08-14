// /User_Page/js_user/templates.js

// =================================================================
// ภาค 1: Helper Functions
// =================================================================

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
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
}

function formatThaiDate(isoString) {
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
// ภาค 2: Templates Page Logic
// =================================================================

/**
 * ดึงข้อมูลและแสดงผลในหน้าดาวน์โหลดเอกสาร
 */
async function loadTemplateData() {
    const userEmail = localStorage.getItem("current_user");
    if (!userEmail) {
        window.location.href = "/login/index.html";
        return;
    }
    
    // อัปเดตชื่อผู้ใช้ใน Navbar
    const navUsername = document.getElementById('nav-username');
    if (navUsername) navUsername.textContent = userEmail;

    try {
        // --- 1. โหลดและแสดงผล Template ฟอร์มเปล่า ---
        const templateListBody = document.getElementById('template-list-body');
        const templatesResponse = await fetch("/data/templates.json");
        const templatesData = await templatesResponse.json();

        templateListBody.innerHTML = ''; // เคลียร์ "กำลังโหลดข้อมูล..."
        if (templatesData.length === 0) {
            templateListBody.innerHTML = `<tr><td colspan="2" class="loading-text">ไม่พบข้อมูลเทมเพลต</td></tr>`;
        } else {
            templatesData.forEach(template => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${template.name}</td>
                    <td class="download-links">
                        <a href="${template.docx}" title="ดาวน์โหลด .docx" download><i class="fas fa-file-word"></i></a>
                        <a href="${template.pdf}" title="ดาวน์โหลด .pdf" download><i class="fas fa-file-pdf"></i></a>
                    </td>
                `;
                templateListBody.appendChild(row);
            });
        }


        // --- 2. โหลดและแสดงผลเอกสารฉบับสมบูรณ์ของผู้ใช้ ---
        const completedDocsBody = document.getElementById('completed-docs-body');
        const [students, dbApproved, localStorageApproved] = await Promise.all([
            fetch("/data/student.json").then(res => res.json()),
            fetch("/data/document_approved.json").then(res => res.json()),
            Promise.resolve(JSON.parse(localStorage.getItem('localStorage_approvedDocs') || '[]'))
        ]);
        
        const currentUser = students.find(s => s.email === userEmail);
        if (!currentUser) return; // ออกถ้าไม่เจอข้อมูลนักศึกษา
        
        const combinedApproved = [...dbApproved, ...localStorageApproved];
        const userCompletedDocs = combinedApproved.filter(doc => doc.student_id === currentUser.student_id || doc.student_email === userEmail);

        completedDocsBody.innerHTML = ''; // เคลียร์ "กำลังโหลดข้อมูล..."
        if (userCompletedDocs.length === 0) {
            completedDocsBody.innerHTML = `<tr><td colspan="3" class="loading-text">ยังไม่มีเอกสารฉบับสมบูรณ์ที่ผ่านการอนุมัติ</td></tr>`;
        } else {
            // เรียงตามวันที่อนุมัติล่าสุด
            userCompletedDocs.sort((a, b) => new Date(b.approved_date || b.submitted_date) - new Date(a.approved_date || a.submitted_date));

            userCompletedDocs.forEach(doc => {
                // สมมติว่ามีลิงก์ไปยังไฟล์ PDF ที่สมบูรณ์แล้ว
                // ในระบบจริง ลิงก์นี้จะถูกสร้างขึ้นตอนที่ Admin กดอนุมัติขั้นตอนสุดท้าย
                const completedPdfLink = doc.link || '#'; // ใช้ลิงก์เดิมหรือ # ถ้าไม่มี

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${doc.title}</td>
                    <td>${formatThaiDate(doc.approved_date || doc.submitted_date)}</td>
                    <td class="download-links">
                        <a href="${completedPdfLink}" title="ดาวน์โหลด .pdf" download><i class="fas fa-file-pdf"></i></a>
                    </td>
                `;
                completedDocsBody.appendChild(row);
            });
        }

    } catch (error) {
        console.error("Failed to load template page data:", error);
        document.querySelector('.page-container').innerHTML = `<p style="color: red; text-align: center;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>`;
    }
}

// =================================================================
// ภาค 3: Main Event Listener
// =================================================================
document.addEventListener('DOMContentLoaded', function() {
    // --- Navbar & Modal Logic ---
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

    if (logoutButton) logoutButton.addEventListener('click', (e) => { e.preventDefault(); logout(); });
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
    
    // --- Load data for this page ---
    loadTemplateData();
});