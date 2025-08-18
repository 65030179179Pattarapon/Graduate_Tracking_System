// /User_Page/js_user/common.js

/**
 * ฟังก์ชันสำหรับจัดการการแสดงผลของเมนู Dropdown ทั้งหมด
 */
function handleDropdowns() {
    const dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');

    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(event) {
            event.preventDefault();
            const dropdownMenu = this.nextElementSibling;

            // ปิด Dropdown อื่นๆ ทั้งหมดก่อนเปิดอันที่เลือก
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                if (menu !== dropdownMenu) {
                    menu.classList.remove('show');
                }
            });

            // เปิด/ปิด Dropdown ที่เลือก
            if (dropdownMenu) {
                dropdownMenu.classList.toggle('show');
            }
        });
    });

    // ปิด Dropdown เมื่อคลิกนอกพื้นที่
    window.addEventListener('click', function(event) {
        if (!event.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
}

/**
 * ฟังก์ชันสำหรับแสดง Modal ยืนยันการออกจากระบบ
 */
function showLogoutModal() {
    const modal = document.getElementById('logout-confirm-modal');
    if (modal) {
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('show'));
    }
}

/**
 * ฟังก์ชันสำหรับปิด Modal
 */
function closeModal() {
    const modal = document.getElementById('logout-confirm-modal');
    if (modal) {
        modal.classList.remove('show');
        // รอให้ animation ของการซ่อนจบก่อน แล้วค่อย display: none
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
}

/**
 * ฟังก์ชันสำหรับผูก Event กับปุ่มและองค์ประกอบต่างๆ ใน Modal
 */
function setupLogoutModal() {
    const logoutButton = document.getElementById("logout-button");
    const modal = document.getElementById('logout-confirm-modal');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');

    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            showLogoutModal();
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = "/login/index.html";
        });
    }
    // ทำให้สามารถกดปิด Modal ได้เมื่อคลิกที่พื้นหลังสีดำ
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
}

/**
 * ฟังก์ชันสำหรับแสดงชื่อผู้ใช้บน Navbar
 */
function displayNavUsername() {
    const userEmail = localStorage.getItem("current_user");
    const navUsername = document.getElementById('nav-username');
    if (userEmail && navUsername) {
        navUsername.textContent = userEmail;
    } else if (navUsername) {
        navUsername.textContent = "ไม่มีผู้ใช้";
    }
}

// =================================================================
// Main Event Listener - จะทำงานเมื่อหน้าเว็บโหลดเสร็จ
// =================================================================
document.addEventListener('DOMContentLoaded', function() {
    // เรียกใช้งานฟังก์ชันที่จำเป็นสำหรับทุกหน้า
    handleDropdowns();
    setupLogoutModal();
    displayNavUsername();
});