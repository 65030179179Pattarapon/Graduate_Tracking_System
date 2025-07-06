// /assets/signature/signature.js (Updated Default Tab)

document.addEventListener("DOMContentLoaded", () => {
    // --- State Variables ---
    // BUG FIX: เปลี่ยนค่าเริ่มต้นให้เป็น 'draw'
    let activeMode = 'draw'; 
    let isCanvasInitialized = false;
    let isDrawing = false;
    let isCanvasDirty = false;
    let uploadedSignatureData = null;

    // --- Element References ---
    const submitBtn = document.getElementById("submit-signature-btn");
    const tabUploadBtn = document.getElementById("tab-upload");
    const tabDrawBtn = document.getElementById("tab-draw");
    const uploadContent = document.getElementById("upload-content");
    const drawContent = document.getElementById("draw-content");
    const fileInput = document.getElementById("signature-file-input");
    const previewImage = document.getElementById("signature-preview");
    const previewText = document.getElementById("preview-text");
    const canvas = document.getElementById("signature-canvas");
    const clearCanvasBtn = document.getElementById("clear-canvas-btn");
    const ctx = canvas.getContext('2d');

    // --- Initializer ---
    if (!submitBtn) return;
    initialize();

    function initialize() {
        tabUploadBtn.addEventListener('click', () => switchTab('upload'));
        tabDrawBtn.addEventListener('click', () => switchTab('draw'));
        fileInput.addEventListener('change', handleFileSelect);
        submitBtn.addEventListener('click', submitSignature);

        // BUG FIX: เรียกใช้การตั้งค่า Canvas ทันทีหาก 'draw' เป็นค่าเริ่มต้น
        if(activeMode === 'draw') {
            initializeCanvas();
        }
    }

    // --- Canvas Setup ---
    function initializeCanvas() {
        if (isCanvasInitialized) return; // ทำงานแค่ครั้งเดียว
        
        const canvasContainer = document.querySelector('.canvas-container');
        canvas.width = canvasContainer.clientWidth;
        canvas.height = canvasContainer.clientHeight;
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        canvas.addEventListener("mousedown", startDrawing);
        canvas.addEventListener("mousemove", draw);
        canvas.addEventListener("mouseup", stopDrawing);
        canvas.addEventListener("mouseleave", stopDrawing);

        canvas.addEventListener("touchstart", startDrawing, { passive: false });
        canvas.addEventListener("touchmove", draw, { passive: false });
        canvas.addEventListener("touchend", stopDrawing);
        
        clearCanvasBtn.addEventListener('click', clearCanvas);

        isCanvasInitialized = true;
    }

    // --- Drawing Functions ---
    function startDrawing(e) {
        e.preventDefault();
        isDrawing = true;
        ctx.beginPath();
        const [x, y] = getPosition(e);
        ctx.moveTo(x, y);
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        isCanvasDirty = true;
        const [x, y] = getPosition(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    function stopDrawing() {
        isDrawing = false;
    }

    function getPosition(e) {
        if (e.touches && e.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            return [e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top];
        } else {
            return [e.offsetX, e.offsetY];
        }
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        isCanvasDirty = false;
    }

    // --- General Logic ---
    function switchTab(mode) {
        activeMode = mode;
        if (mode === 'upload') {
            tabUploadBtn.classList.add('active');
            tabDrawBtn.classList.remove('active');
            uploadContent.classList.add('active');
            drawContent.classList.remove('active');
        } else {
            tabDrawBtn.classList.add('active');
            tabUploadBtn.classList.remove('active');
            drawContent.classList.add('active');
            uploadContent.classList.remove('active');
            
            if (!isCanvasInitialized) {
                initializeCanvas();
            }
        }
    }

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) {
            alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
            uploadedSignatureData = null;
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
            previewText.style.display = 'none';
            uploadedSignatureData = e.target.result;
        };
        reader.readAsDataURL(file);
        fileInput.value = '';
    }

    function submitSignature() {
        let signatureData = null;
        if (activeMode === 'upload') {
            if (!uploadedSignatureData) {
                alert("🖼️ กรุณาอัปโหลดรูปภาพลายเซ็นของคุณก่อนบันทึก");
                return;
            }
            signatureData = uploadedSignatureData;
        } else {
            if (!isCanvasDirty) {
                alert("✍️ กรุณาวาดลายเซ็นของคุณก่อนบันทึก");
                return;
            }
            signatureData = canvas.toDataURL('image/png'); 
        }

        const email = localStorage.getItem("current_user");
        const role = localStorage.getItem("role");
        if (!email || !role) {
            alert("⚠️ ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
            return;
        }
        
        localStorage.setItem(`${email}_signature_data`, signatureData);
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
        const homePageFile = (role === 'admin') ? "home.html" : "home.html";
        if (basePath[role]) {
            window.location.href = basePath[role] + homePageFile;
        } else {
            console.error("Unknown role for redirection:", role);
            window.location.href = "/login/index.html";
        }
    }
});