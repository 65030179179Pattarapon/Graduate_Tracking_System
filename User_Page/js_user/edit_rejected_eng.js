document.getElementById("resubmit-form").addEventListener("submit", function(e) {
    e.preventDefault();
  
    const examType = document.getElementById("exam-type").value;
    const score = document.getElementById("score").value;
    const file = document.getElementById("new-file").files[0];
  
    if (!examType || !score || !file) {
      alert("⚠️ กรุณากรอกข้อมูลและแนบไฟล์ให้ครบถ้วน!");
      return;
    }
  
    alert("📤 ส่งแบบฟอร์มอีกครั้งเรียบร้อยแล้ว!");
    window.location.href = "/User_Page/html_user/status.html"; // กลับไปหน้าสถานะ
  });
  
  function logout() {
    localStorage.clear();
    window.location.href = "/login/index.html";
  }