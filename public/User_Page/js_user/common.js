// =================================================================
// ภาค 1: Helper Functions ที่ใช้ร่วมกัน
// =================================================================

/**
 * แสดง Modal ยืนยันการออกจากระบบ
 */
function logout() {
    const modal = document.getElementById('logout-confirm-modal');
    if (modal) {
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('show'));
    }
}

/**
 * ปิด Modal
 */
function closeModal() {
    const modal = document.getElementById('logout-confirm-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
}

/**
 * กรองเอกสารทั้งหมดจากหลายแหล่งข้อมูลให้เหลือเฉพาะของผู้ใช้ที่ระบุ
 */
function getUserDocuments(docArrays, studentId, studentFullName) {
    if (!studentId && !studentFullName) return [];
    
    const allUserDocs = [];
    docArrays.forEach(docArray => {
        if (!Array.isArray(docArray)) return;
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


// =================================================================
// ภาค 2: Logic หลักที่ต้องทำงานทุกหน้า (Navbar, Logout)
// =================================================================
document.addEventListener('DOMContentLoaded', function() {
    // --- Navbar Dropdown Logic ---
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

    // --- Logout Confirmation Modal Logic ---
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

    // --- Navbar Username Display ---
    const navUsername = document.getElementById('nav-username');
    const userEmail = localStorage.getItem("current_user");
    if (navUsername && userEmail) {
        navUsername.textContent = userEmail;
    }
});