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
        document.getElementById("program").value = student.program;
        document.getElementById("faculty").value = student.faculty;
        document.getElementById("department").value = student.department;
        document.getElementById("phone").value = student.phone;
        document.getElementById("email").value = student.email;
      });
  
    document.getElementById("eng-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const examType = document.getElementById("exam-type").value;
      const score = document.getElementById("exam-score").value;
      const file = document.getElementById("exam-file").files[0];
  
      console.log("📤 ส่งผลสอบภาษาอังกฤษ", {
        examType,
        score,
        fileName: file?.name
      });
  
      alert("📤 ส่งฟอร์มยื่นผลสอบภาษาอังกฤษเรียบร้อยแล้ว!");
    });
  });
  
  function logout() {
    localStorage.clear();
    window.location.href = "/login/index.html";
  }
  