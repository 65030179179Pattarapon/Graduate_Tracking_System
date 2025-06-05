document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.toLowerCase().trim();
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("error-msg");
    errorMsg.textContent = ""; // Clear previous error messages

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
            try {
                const response = await fetch(`/data/${roleItem.file}`);
                if (!response.ok) {
                    console.warn(`Could not fetch ${roleItem.file}: ${response.status}`);
                    continue; // ข้ามไปไฟล์ถัดไปถ้าโหลดไม่ได้
                }
                const data = await response.json();
                data.forEach(user => {
                    if (user && typeof user.email === 'string') {
                        allUsers[user.email.toLowerCase()] = { ...user, role: roleItem.role };
                    } else {
                        console.warn(`User object in ${roleItem.file} is missing email or email is not a string:`, user);
                    }
                });
            } catch (error) {
                console.error(`Error processing ${roleItem.file}:`, error);
            }
        }
        return allUsers;
    }

    const users = await fetchAllUsers();

    if (Object.keys(users).length === 0 && !email) { // Check if users object is empty and no email typed
        errorMsg.textContent = "⚠️ ไม่สามารถโหลดข้อมูลผู้ใช้ได้ กรุณาลองอีกครั้ง";
        return;
    }

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

    // 🖊️ เช็กว่าผู้ใช้เคยเซ็นลายเซ็นหรือยัง (ใช้สำหรับ *ทุก* บทบาท)
    const hasSigned = localStorage.getItem(`${email}_signed`) === "true";

    // 📍 กำหนด path แยกตาม role
    const basePath = {
        student: "/User_Page/html_user/",
        admin: "/Admin_Page/html_admin/",
        advisor: "/Advisor_Page/html_advisor/",
        external_professor: "/Professor_Page/html_professor/",
        executive: "/Executive_Page/html_executive/"
    };

    const userRole = users[email].role;
    let redirectTo = "home.html"; // Default to home.html

    // ทุกบทบาทต้องไปหน้า signature.html หากยังไม่เคยเซ็นชื่อ
    if (!hasSigned) {
        redirectTo = "signature.html";
    }
    
    // 🧠 หากยังไม่เคยเซ็นชื่อเลย ให้บันทึกไว้ว่าเซ็นชื่อครั้งแรก (สำหรับ *ทุก* บทบาท)
    // การบันทึกสถานะ "signed" ควรเกิดขึ้น *หลังจาก* ผู้ใช้เซ็นชื่อสำเร็จในหน้า signature.html
    // แต่ใน logic นี้ เราจะตั้งค่าหลังจาก redirect ไปหน้า signature ทันที
    // ซึ่งในหน้า signature.js จะมีการบันทึก signature จริงๆ และยืนยันอีกครั้ง
    // เพื่อความง่ายในการ redirect ครั้งต่อไป เราจะตั้งค่าที่นี่เลย
    // if (!hasSigned) { // การย้าย localStorage.setItem(`${email}_signed`, "true"); ไปไว้ใน signature.js จะเหมาะสมกว่า
    //   localStorage.setItem(`${email}_signed`, "true"); 
    // } 
    // **หมายเหตุ:** การตั้งค่า `${email}_signed` เป็น "true" ทันทีที่นี่ อาจทำให้ถ้าผู้ใช้ปิดหน้า signature.html โดยไม่เซ็นชื่อจริง
    // ในการ login ครั้งถัดไป ระบบจะคิดว่าเซ็นแล้วและพาไปหน้า home.html เลย
    // ทางที่ดีคือให้หน้า signature.html เป็นคน set ค่านี้หลังจากเซ็นสำเร็จ
    // แต่เพื่อให้โค้ดนี้ทำงานตามที่คุณต้องการ (redirect ครั้งแรกไป signature) จะคงการทำงานนี้ไว้ก่อน
    // และใน signature.js (ที่คุณให้มา) ก็มีการ set ค่านี้อยู่แล้ว ซึ่งจะเขียนทับกันได้


    if (basePath[userRole]) {
        window.location.href = basePath[userRole] + redirectTo;
    } else {
        console.error(`No base path defined for role: ${userRole}`);
        errorMsg.textContent = "เกิดข้อผิดพลาด: ไม่สามารถกำหนดหน้าถัดไปสำหรับบทบาทนี้ได้";
    }
});