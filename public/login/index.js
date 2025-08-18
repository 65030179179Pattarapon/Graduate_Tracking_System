// public/login/index.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMsg = document.getElementById('error-msg');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // ป้องกันไม่ให้ฟอร์มรีเฟรชหน้าเว็บ

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            errorMsg.textContent = ''; // ล้างข้อความ error เก่า

            try {
                // ส่ง Request ไปยัง Login API ที่เราสร้างไว้
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    // --- Login สำเร็จ ---
                    //alert('เข้าสู่ระบบสำเร็จ!');

                    // 1. บันทึก Token และ Role ลงใน localStorage ของเบราว์เซอร์
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('role', data.role);
                    localStorage.setItem('current_user', email); // เก็บ email ผู้ใช้ปัจจุบัน

                    // 2. ส่งผู้ใช้ไปยังหน้าที่เหมาะสมตาม Role
                    switch (data.role) {
                        case 'admin':
                            window.location.href = '/Admin_Page/html_admin/home.html';
                            break;
                        case 'student':
                            window.location.href = '/User_Page/html_user/home.html';
                            break;
                        // สามารถเพิ่ม case สำหรับ 'advisor', 'executive' ได้ในอนาคต
                        default:
                            alert('ไม่พบหน้าที่เหมาะสมสำหรับบทบาทของคุณ');
                    }
                } else {
                    // --- Login ไม่สำเร็จ ---
                    // แสดงข้อความ error ที่ได้จาก API
                    errorMsg.textContent = `❌ ${data.message}`;
                }

            } catch (error) {
                console.error('Login request failed:', error);
                errorMsg.textContent = '❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
            }
        });
    }
});