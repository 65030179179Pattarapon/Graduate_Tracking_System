document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("signature-pad");
    if (!canvas) {
        console.error("Signature pad canvas not found!");
        return;
    }
    const ctx = canvas.getContext("2d");
    let drawing = false;
    let hasDrawing = false; // Flag to check if anything has been drawn or uploaded

    // ปรับขนาด canvas อัตโนมัติ
    function resizeCanvas() {
        const parentWidth = canvas.parentElement.offsetWidth;
        canvas.width = parentWidth > 0 ? parentWidth : 400; // Default width if parent has no width yet
        canvas.height = 200;
        // อาจจะต้อง redraw ลายเซ็นเดิมถ้ามีการ resize หลังจากวาดไปแล้ว (ถ้าต้องการ)
    }
    window.addEventListener('resize', resizeCanvas); // Adjust canvas on window resize
    resizeCanvas(); // Initial resize

    function getMousePos(canvasDom, event) {
        const rect = canvasDom.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    function getTouchPos(canvasDom, touchEvent) {
        const rect = canvasDom.getBoundingClientRect();
        return {
            x: touchEvent.clientX - rect.left,
            y: touchEvent.clientY - rect.top
        };
    }

    // --- Drawing on Canvas ---
    function startDrawing(e) {
        drawing = true;
        hasDrawing = true; // User started interacting
        draw(e); // Draw a dot on start
    }

    function stopDrawing() {
        drawing = false;
        ctx.beginPath(); // Reset path after lifting pen/mouse
    }

    function draw(e) {
        if (!drawing) return;

        let pos;
        if (e.touches && e.touches[0]) {
            pos = getTouchPos(canvas, e.touches[0]);
            e.preventDefault(); // Prevent scrolling while drawing on touch devices
        } else {
            pos = getMousePos(canvas, e);
        }

        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#333"; // Use var(--text) from CSS ideally

        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.beginPath(); // Start a new path
        ctx.moveTo(pos.x, pos.y); // Move to the current point
    }

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing); // Stop drawing if mouse leaves canvas
    canvas.addEventListener("mousemove", draw);

    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    canvas.addEventListener("touchend", stopDrawing);
    canvas.addEventListener("touchmove", draw, { passive: false });

    // --- Actions ---
    const clearButton = document.getElementById("clear-signature-btn");
    if (clearButton) {
        clearButton.addEventListener("click", clearPad);
    }

    const uploadButton = document.getElementById("upload-signature-btn");
    const fileInput = document.getElementById("signature-file-input");

    if (uploadButton && fileInput) {
        uploadButton.addEventListener("click", () => {
            fileInput.click(); // Trigger hidden file input
        });

        fileInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        clearPad(); // Clear previous drawing/image
                        // Scale image to fit canvas while maintaining aspect ratio
                        const hRatio = canvas.width / img.width;
                        const vRatio = canvas.height / img.height;
                        const ratio = Math.min(hRatio, vRatio, 1); // Ensure image is not scaled up beyond its original size, or canvas size
                        
                        const centerShift_x = (canvas.width - img.width * ratio) / 2;
                        const centerShift_y = (canvas.height - img.height * ratio) / 2;

                        ctx.drawImage(img, 0, 0, img.width, img.height,
                                      centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
                        hasDrawing = true; // Image is now on canvas
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                alert("กรุณาเลือกไฟล์รูปภาพประเภท .png หรือ .jpg เท่านั้น");
            }
            fileInput.value = ''; // Reset file input for next upload
        });
    }

    const submitButton = document.getElementById("submit-signature-btn");
    if (submitButton) {
        submitButton.addEventListener("click", submitSignature);
    }

    function clearPad() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasDrawing = false; // Reset flag
    }
    // Expose clearPad to global scope if called by onclick attribute in HTML
    window.clearPad = clearPad;


    function submitSignature() {
        const email = localStorage.getItem("current_user");
        const role = localStorage.getItem("role");

        if (!email || !role) {
            alert("⚠️ ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
            // window.location.href = "/login/index.html"; // Optionally redirect
            return;
        }

        if (!hasDrawing && !canvas.toDataURL().startsWith("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=")) {
             // A more robust check for an empty canvas might be needed than just hasDrawing.
             // The string is a 1x1 transparent PNG. Some browsers might return slightly different empty canvas data.
             // A simple check is if a significant amount of non-transparent pixels exist.
             // For now, a simple "hasDrawing" flag (set on mousedown or file load) can be a good start.
            if (!hasDrawing) { // Re-check if hasDrawing is reliably set
                alert("✍️ กรุณาลงลายเซ็นหรืออัปโหลดรูปภาพลายเซ็นก่อนบันทึก");
                return;
            }
        }


        const signatureData = canvas.toDataURL("image/png"); // Specify PNG for consistency

        // เก็บลายเซ็นใน LocalStorage
        // 🔐 เก็บลายเซ็นครั้งแรกไว้ (ถ้ายังไม่มี)
        if (!localStorage.getItem(`${email}_signature_first_saved_on_submit`)) {
            localStorage.setItem(`${email}_signature_first_saved_on_submit`, signatureData);
        }
        // 🔁 เก็บลายเซ็นปัจจุบัน (สำหรับ profile และการใช้งานทั่วไป)
        localStorage.setItem(`${email}_signature_data`, signatureData);
        localStorage.setItem(`${email}_signature_updated_at`, Date.now().toString());
        localStorage.setItem(`${email}_signed`, "true"); // ยืนยันว่าได้ผ่านขั้นตอนการเซ็น/บันทึกแล้ว

        // เปลี่ยนหน้าไปยัง home ตาม role
        const basePath = {
            student: "/User_Page/html_user/",
            admin: "/Admin_Page/html_admin/",
            advisor: "/Advisor_Page/html_advisor/",
            external_professor: "/Professor_Page/html_professor/",
            executive: "/Executive_Page/html_executive/"
        };

        alert("✅ ลายเซ็นของคุณถูกบันทึกแล้ว");
        if (basePath[role]) {
            window.location.href = basePath[role] + "home.html";
        } else {
            console.error("Unknown role for redirection:", role);
            alert("เกิดข้อผิดพลาดในการเปลี่ยนหน้า กรุณาติดต่อผู้ดูแลระบบ");
            window.location.href = "/login/index.html"; // Fallback to login
        }
    }
    // Expose submitSignature to global scope if called by onclick attribute in HTML
    window.submitSignature = submitSignature;

});