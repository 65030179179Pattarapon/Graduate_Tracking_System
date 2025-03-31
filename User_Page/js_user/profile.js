document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem("current_user");

  fetch("/data/student.json")
    .then(res => res.json())
    .then(data => {
      const student = data.find(s => s.email === email);
      if (!student) return alert("ไม่พบข้อมูลนักศึกษา");

      document.getElementById("fullname").textContent = student.fullname;
      document.getElementById("student-id").textContent = student.student_id;
      document.getElementById("phone").textContent = student.phone;
      document.getElementById("email").textContent = student.email;
      document.getElementById("degree").textContent = student.degree;
      document.getElementById("program").textContent = student.program;
      document.getElementById("department").textContent = student.department;
      document.getElementById("faculty").textContent = student.faculty;
      document.getElementById("plan").textContent = student.plan;

      // Thesis
      const thesis = student.thesis || {};
      document.getElementById("thesis-title").textContent = thesis.title || "-";
      document.getElementById("advisor-main").textContent = thesis.advisor_main || "-";
      document.getElementById("advisor-co1").textContent = thesis.advisor_co1 || "-";
      document.getElementById("advisor-co2").textContent = thesis.advisor_co2 || "-";
      document.getElementById("proposal-date").textContent = thesis.proposal_date || "-";
      document.getElementById("proposal-status").textContent = thesis.proposal_status || "-";
      document.getElementById("final-date").textContent = thesis.final_date || "-";
      document.getElementById("final-status").textContent = thesis.final_status || "-";

      // English
      const english = student.english || {};
      document.getElementById("eng-type").textContent = english.type || "-";
      document.getElementById("eng-score").textContent = english.score || "-";
    });

  // Signature
  const canvas = document.getElementById("signature-canvas");
  const ctx = canvas.getContext("2d");
  let drawing = false;

  canvas.addEventListener("mousedown", () => drawing = true);
  canvas.addEventListener("mouseup", () => {
    drawing = false;
    ctx.beginPath();
  });
  canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#333";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  });

  document.getElementById("clear-signature").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  document.getElementById("submit-signature").addEventListener("click", () => {
    const dataURL = canvas.toDataURL();
    localStorage.setItem("signature_data", dataURL);
    localStorage.setItem("signature_updated_at", Date.now().toString());
    alert("✅ บันทึกลายเซ็นใหม่เรียบร้อยแล้ว!");
    location.reload();
  });

  // Load signature
  const sigData = localStorage.getItem("signature_data");
  const lastUpdate = localStorage.getItem("signature_updated_at");
  if (sigData) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = sigData;

    if (lastUpdate) {
      const nextDate = new Date(Number(lastUpdate));
      nextDate.setDate(nextDate.getDate() + 30);
      const today = new Date();
      const canChange = today >= nextDate;
      document.getElementById("signature-status").textContent = canChange
        ? "✅ สามารถเปลี่ยนลายเซ็นได้แล้ว"
        : `🔒 เปลี่ยนได้อีกครั้ง: ${nextDate.toLocaleDateString("th-TH")}`;
      document.getElementById("submit-signature").disabled = !canChange;
    }
  }

  // Profile image
  const upload = document.getElementById("upload-img");
  upload.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        document.getElementById("profile_img").src = e.target.result;
        localStorage.setItem("profile_image", e.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  // โหลดภาพจาก localStorage หากมี
const savedProfile = localStorage.getItem("profile_image");
if (savedProfile) {
  document.getElementById("profile_img").src = savedProfile;
}

// ✅ แสดงลายเซ็นที่เซ็นไว้ใน canvas หน้า profile
const signatureData = localStorage.getItem("signature_data");
if (signatureData) {
  const canvas = document.getElementById("signature-canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.onload = () => ctx.drawImage(img, 0, 0);
  img.src = signatureData;
}

// ปุ่มลบรูปโปรไฟล์
document.getElementById("remove-img").addEventListener("click", () => {
  localStorage.removeItem("profile_image");
  document.getElementById("profile-img").src = "/images/profile-placeholder.png";
  alert("🗑️ ลบรูปโปรไฟล์เรียบร้อยแล้ว");
});

});

function logout() {
  localStorage.clear();
  window.location.href = "/login/index.html";
}
