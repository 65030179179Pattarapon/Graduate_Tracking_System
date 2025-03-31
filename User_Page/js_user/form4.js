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
        document.getElementById("degree").value = student.degree;
        document.getElementById("program").value = student.program;
        document.getElementById("department").value = student.department;
  
        // 🔹 ข้อมูลวิทยานิพนธ์
        if (student.thesis) {
          document.getElementById("proposal-date").value = student.thesis.proposal_date || "-";
          document.getElementById("thesis-title").value = student.thesis.title || "-";
        }
      })
      .catch((err) => {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล:", err);
      });
  
    document.getElementById("form4").addEventListener("submit", (e) => {
      e.preventDefault();
      const numEvaluators = document.getElementById("num-evaluators").value;
      const docTypes = Array.from(document.querySelectorAll('input[name="document-type"]:checked'))
                            .map(el => el.value);
      const otherText = document.getElementById("other-doc").value;
      const numDocs = document.getElementById("num-docs").value;
  
      console.log("✅ เชิญผู้ทรงคุณวุฒิ", {
        numEvaluators,
        docTypes,
        otherText,
        numDocs
      });
  
      alert("📤 ส่งฟอร์มขอเชิญผู้ทรงคุณวุฒิเรียบร้อยแล้ว!");
    });
  });
  
  function logout() {
    localStorage.clear();
    window.location.href = "/login/index.html";
  }
  