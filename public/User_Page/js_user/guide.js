// /User_Page/js_user/guide.js (Self-Contained Version)

// =================================================================
// ภาค 1: Guide Page Specific Logic
// =================================================================

/**
 * ตั้งค่าการทำงานของ Accordion ทั้งหมดในหน้า
 */
function setupAccordions() {
    const accordionBtns = document.querySelectorAll(".accordion-btn");

    accordionBtns.forEach(button => {
        button.addEventListener("click", function() {
            // สลับสถานะ active ของปุ่มที่กด
            this.classList.toggle("active");

            // หา panel ที่อยู่ถัดไป
            const panel = this.nextElementSibling;

            // เปิด-ปิด panel
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
                panel.style.padding = "0 20px";
            } else {
                panel.style.padding = "20px";
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
    });
}

/**
 * ตั้งค่าการทำงานของฟอร์มติดต่อ
 */
function setupContactForm() {
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
        contactForm.addEventListener("submit", function(e) {
            e.preventDefault();

            const topic = document.getElementById("contact-topic").value;
            const subject = document.getElementById("contact-subject").value;
            const details = document.getElementById("contact-details").value;
            const file = document.getElementById("contact-file").files[0];

            if (!topic || !subject || !details) {
                alert("กรุณากรอกข้อมูลในช่อง ประเภท, หัวข้อ, และรายละเอียดให้ครบถ้วน");
                return;
            }

            const formData = {
                userEmail: localStorage.getItem("current_user") || 'N/A',
                pageUrl: window.location.href,
                timestamp: new Date().toISOString(),
                topic: topic,
                subject: subject,
                details: details,
                fileName: file ? file.name : null
            };

            // ในระบบจริง ส่วนนี้จะส่งข้อมูล formData ไปยัง Server
            console.log("Contact Form Submitted:", formData);
            alert("✅ ได้รับข้อความของคุณแล้ว เจ้าหน้าที่จะติดต่อกลับ (ถ้าจำเป็น) ขอบคุณครับ");
            
            contactForm.reset(); // ล้างข้อมูลในฟอร์ม
            const fileNameDisplay = document.querySelector('#contact-form .file-name-display');
            if (fileNameDisplay) {
                fileNameDisplay.textContent = 'ยังไม่ได้เลือกไฟล์';
            }
        });
    }
}

/**
 * ตั้งค่าการแสดงชื่อไฟล์สำหรับ Input
 */
function setupFileInputDisplay() {
    const fileInput = document.getElementById('contact-file');
    if (fileInput) {
        const fileNameDisplay = fileInput.nextElementSibling;
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                fileNameDisplay.textContent = `ไฟล์ที่เลือก: ${fileInput.files[0].name}`;
            } else {
                fileNameDisplay.textContent = 'ยังไม่ได้เลือกไฟล์';
            }
        });
    }
}

// =================================================================
// ภาค 2: Main Event Listener
// =================================================================
document.addEventListener('DOMContentLoaded', function() {
    
    // --- Page Specific Function Calls ---
    const userEmail = localStorage.getItem("current_user");
    const navUsername = document.getElementById('nav-username');
    if(userEmail && navUsername) {
        navUsername.textContent = userEmail;
    }

    setupAccordions();
    setupContactForm();
    setupFileInputDisplay();
});