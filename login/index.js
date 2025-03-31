document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
  
    const email = document.getElementById("email").value.toLowerCase().trim();
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("error-msg");
  
    async function fetchAllUsers() {
      const roles = [
        { file: "student.json", role: "student" },
        { file: "admin.json", role: "admin" },
        { file: "advisor.json", role: "advisor" },
        { file: "external_professor.json", role: "external_professor" },
        { file: "executive.json", role: "executive" }
      ];
  
      const allUsers = {};
      for (const roleItem of roles) {
        const response = await fetch(`/data/${roleItem.file}`);
        const data = await response.json();
        data.forEach(user => {
          allUsers[user.email.toLowerCase()] = { ...user, role: roleItem.role };
        });
      }
      return allUsers;
    }
  
    const users = await fetchAllUsers();
  
    if (!users[email]) {
      errorMsg.textContent = "❌ ไม่พบบัญชีนี้ในระบบ!";
      return;
    }
  
    if (users[email].password !== password) {
      errorMsg.textContent = "❌ รหัสผ่านไม่ถูกต้อง!";
      return;
    }
  
    // 🔐 Save user login session
    localStorage.setItem("current_user", email);
    localStorage.setItem("role", users[email].role);
  
    // 🖊️ เช็กว่าผู้ใช้เคยเซ็นลายเซ็นหรือยัง
    const hasSigned = localStorage.getItem(`${email}_signed`) === "true";
  
    // 📍 กำหนด path แยกตาม role
    const basePath = {
      student: "/User_Page/html_user/",
      admin: "/Admin_Page/html_admin/",
      advisor: "/Advisor_Page/html_advisor/",
      external_professor: "/Professor_Page/html_professor/",
      executive: "/Executive_Page/html_executive/"
    };
  
    const redirectTo = hasSigned ? "home.html" : "signature.html";
  
    // 🧠 หากยังไม่เคยเซ็นชื่อเลย ให้บันทึกไว้ว่าเซ็นชื่อครั้งแรก
    if (!hasSigned) {
      localStorage.setItem(`${email}_signed`, "true");
    }
  
    window.location.href = basePath[users[email].role] + redirectTo;
  });
  