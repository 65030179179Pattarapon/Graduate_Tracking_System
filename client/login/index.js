document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("error-msg");

  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      errorMsg.textContent = data.message;
      return;
    }

    // บันทึกข้อมูลลง localStorage
    localStorage.setItem('user_id', data.id);
    localStorage.setItem('current_user', data.email);
    localStorage.setItem('role', data.role);

    // Redirect ตาม role
    let redirectPath = '/';
    if (data.role === 'student') redirectPath = '/User_Page/html_user/home.html';
    else if (data.role === 'admin') redirectPath = '/Admin_Page/html_admin/home.html';
    else if (data.role === 'advisor') redirectPath = '/Advisor_Page/html_advisor/home.html';
    else if (data.role === 'executive') redirectPath = '/Executive_Page/html_executive/home.html';

    window.location.href = redirectPath;

  } catch (err) {
    console.error(err);
    errorMsg.textContent = "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์";
  }
});
