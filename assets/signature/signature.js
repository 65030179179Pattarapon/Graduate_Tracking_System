// /assets/signature/signature.js (New Version for Upload Only)

document.addEventListener("DOMContentLoaded", () => {
    
    // --- Element References ---
    const fileInput = document.getElementById("signature-file-input");
    const previewImage = document.getElementById("signature-preview");
    const previewText = document.getElementById("preview-text");
    const submitBtn = document.getElementById("submit-signature-btn");

    // ตรวจสอบว่าอยู่ในหน้า signature จริงหรือไม่
    if (!fileInput || !previewImage || !submitBtn) {
        return; 
    }

    let uploadedSignatureData = null; // ตัวแปรสำหรับเก็บข้อมูลลายเซ็นที่อัปโหลด

    // --- Event Listeners ---
    fileInput.addEventListener("change", handleFileSelect);
    submitBtn.addEventListener("click", submitSignature);

    // --- Functions ---
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type === "image/png" || file.type === "image/jpeg") {
            const reader = new FileReader();
            reader.onload = (e) => {
                // แสดงรูปภาพในช่อง preview
                previewImage.src = e.target.result;
                previewImage.style.display = 'block';
                // ซ่อนข้อความ placeholder
                previewText.style.display = 'none';
                // เก็บข้อมูลรูปภาพ (Base64) ไว้ในตัวแปร
                uploadedSignatureData = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            alert("กรุณาเลือกไฟล์รูปภาพประเภท .png หรือ .jpg เท่านั้น");
            uploadedSignatureData = null;
        }
        // Reset ค่าของ input เพื่อให้สามารถเลือกไฟล์เดิมซ้ำได้
        fileInput.value = ''; 
    }

    function submitSignature() {
        const email = localStorage.getItem("current_user");
        const role = localStorage.getItem("role");

        if (!email || !role) {
            alert("⚠️ ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
            return;
        }

        if (!uploadedSignatureData) {
            alert("🖼️ กรุณาอัปโหลดรูปภาพลายเซ็นของคุณก่อนบันทึก");
            return;
        }

        // บันทึกข้อมูลลายเซ็นและสถานะลง localStorage
        localStorage.setItem(`${email}_signature_data`, uploadedSignatureData);
        localStorage.setItem(`${email}_signature_updated_at`, Date.now().toString());
        localStorage.setItem(`${email}_signed`, "true"); 

        const basePath = {
            student: "/User_Page/html_user/",
            admin: "/Admin_Page/html_admin/",
            advisor: "/Advisor_Page/html_advisor/",
            external_professor: "/Professor_Page/html_professor/",
            executive: "/Executive_Page/html_executive/"
        };

        alert("✅ ลายเซ็นของคุณถูกบันทึกแล้ว");
        const homePageFile = (role === 'admin') ? "admin_home.html" : "home.html";
        if (basePath[role]) {
            window.location.href = basePath[role] + homePageFile;
        } else {
            console.error("Unknown role for redirection:", role);
            window.location.href = "/login/index.html";
        }
    }
});