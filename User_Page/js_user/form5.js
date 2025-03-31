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
  
        document.getElementById("prefix").value = student.prefix;
        document.getElementById("fullname").value = student.fullname;
        document.getElementById("student-id").value = student.student_id;
        document.getElementById("degree").value = student.degree;
  
        if (student.thesis) {
          document.getElementById("approval-date").value = student.thesis.approval_date || "-";
          document.getElementById("thesis-title").value = student.thesis.title || "-";
        }
      })
      .catch((err) => {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล:", err);
      });
  
    document.getElementById("form5").addEventListener("submit", (e) => {
      e.preventDefault();
      const types = Array.from(document.querySelectorAll('input[name="data-type"]:checked'))
                      .map(el => el.value);
      const other = document.getElementById("other-data").value;
      const numDocs = document.getElementById("num-docs").value;
  
      console.log("📥 เก็บข้อมูลวิจัย", { types, other, numDocs });
      alert("📤 ส่งฟอร์มขออนุญาตเก็บข้อมูลเรียบร้อยแล้ว!");
    });
  });
  
  function logout() {
    localStorage.clear();
    window.location.href = "/login/index.html";
  }
  