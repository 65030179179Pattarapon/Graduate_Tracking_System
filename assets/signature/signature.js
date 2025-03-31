const canvas = document.getElementById("signature-pad");
const ctx = canvas.getContext("2d");
let drawing = false;

// ปรับขนาด canvas อัตโนมัติ
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = 200;
}
resizeCanvas();

canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("touchstart", () => drawing = true);
canvas.addEventListener("touchend", () => drawing = false);
canvas.addEventListener("touchmove", e => draw(e.touches[0]));

function draw(e) {
  if (!drawing) return;
  const x = e.clientX - canvas.getBoundingClientRect().left;
  const y = e.clientY - canvas.getBoundingClientRect().top;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

function clearPad() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function submitSignature() {
  const email = localStorage.getItem("current_user");
  const role = localStorage.getItem("role");

  if (!email || !role) {
    alert("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
    return;
  }

  // เก็บลายเซ็นใน LocalStorage (base64)
  const signatureData = canvas.toDataURL();
  localStorage.setItem(`${email}_signature`, signatureData);
  localStorage.setItem(`${email}_signed`, "true");

  // เปลี่ยนหน้าไปยัง home ตาม role
  const basePath = {
    student: "/User_Page/html_user/",
    admin: "/Admin_Page/html_admin/",
    advisor: "/Advisor_Page/html_advisor/",
    external_professor: "/Professor_Page/html_professor/",
    executive: "/Executive_Page/html_executive/"
  };

  alert("✅ ลายเซ็นของคุณถูกบันทึกแล้ว");
  window.location.href = basePath[role] + "home.html";
}

document.getElementById("submit-signature").addEventListener("click", () => {
  const canvas = document.getElementById("signature-canvas");
  const dataURL = canvas.toDataURL(); // ✅ แปลงภาพลายเซ็นเป็น base64

  const email = localStorage.getItem("current_user");

  // 🔐 เก็บลายเซ็นครั้งแรกไว้ไม่ให้ลบ
  if (!localStorage.getItem(`${email}_signature_first`)) {
    localStorage.setItem(`${email}_signature_first`, dataURL); // ✅ ลายเซ็นครั้งแรก
  }

  // 🔁 เก็บลายเซ็นปัจจุบัน (ไว้ใช้ใน profile)
  localStorage.setItem("signature_data", dataURL);
  localStorage.setItem("signature_updated_at", Date.now().toString());
  localStorage.setItem(`${email}_signed`, "true");

  alert("✅ บันทึกลายเซ็นเรียบร้อยแล้ว!");
  window.location.href = `/User_Page/html_user/home.html`; // หรือหน้าหลักของบทบาทนั้น
});

