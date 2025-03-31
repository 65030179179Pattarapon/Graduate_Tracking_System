document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("studentData")) || {};
  
    // 🧍 ข้อมูลนักศึกษา
    document.getElementById("prefix").value = user.prefix || "";
    document.getElementById("fullname").value = user.fullname || "";
    document.getElementById("student-id").value = user.student_id || "";
    document.getElementById("program").value = user.program || "";
  
    // 👨‍🏫 แสดงที่ปรึกษาหลักและร่วมจาก form1
    document.getElementById("main-advisor").value = user.advisor_main || "";
    document.getElementById("co-advisor").value = user.advisor_co || "";
  
    // 🔁 สร้างตัวเลือกที่ปรึกษาร่วมคนที่ 2 ยกเว้นที่เลือกไปแล้ว
    const used = [user.advisor_main, user.advisor_co];
    const co2 = document.getElementById("co-advisor-2");
  
    const advisorList = [
      "ผศ.ดร.ไพบูลย์ พวงวงศ์ตระกูล",
      "ผศ.อำพล ทองระอา",
      "ผศ.โกศล ตราชู"
    ];
  
    advisorList.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      if (used.includes(name)) {
        opt.disabled = true;
      }
      co2.appendChild(opt);
    });
  
    // 📆 ปีการศึกษา
    const yearSelect = document.getElementById("year");
    const currentYear = new Date().getFullYear() + 543;
    for (let y = currentYear; y >= currentYear - 10; y--) {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      yearSelect.appendChild(opt);
    }
  });
  
  document.getElementById("thesis-form").addEventListener("submit", (e) => {
    e.preventDefault();
    alert("📤 ส่งฟอร์มเสนอหัวข้อเรียบร้อยแล้ว!");
  });
  
  function logout() {
    localStorage.clear();
    window.location.href = "/login/index.html";
  }