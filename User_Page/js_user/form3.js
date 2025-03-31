document.addEventListener("DOMContentLoaded", () => {
    const email = localStorage.getItem("current_user");
  
    fetch("/data/student.json")
      .then((res) => res.json())
      .then((students) => {
        const student = students.find((s) => s.email === email);
        if (!student) {
          alert("ไม่พบข้อมูลนักศึกษา");
          return;
        }
  
        // 🔹 แสดงข้อมูลนักศึกษา
        document.getElementById("prefix").value = student.prefix;
        document.getElementById("fullname").value = student.fullname;
        document.getElementById("student-id").value = student.student_id;
        document.getElementById("program").value = student.program;
  
        // 🔹 วันที่เสนอหัวข้อ และชื่อวิทยานิพนธ์จากข้อมูลใน thesis
        if (student.thesis) {
          document.getElementById("proposal-date").value = student.thesis.proposal_date || "-";
          document.getElementById("thesis-title").value = student.thesis.title || "";
        }
      })
      .catch((err) => {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล:", err);
      });
  
    document.getElementById("form3").addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("thesis-title").value;
      console.log("📤 ส่งเอกสารหัวข้อ:", title);
      alert("📨 ส่งฟอร์มนำส่งเอกสารหัวข้อเรียบร้อยแล้ว!");
    });
  });
  
  function logout() {
    localStorage.clear();
    window.location.href = "/login/index.html";
  }
  