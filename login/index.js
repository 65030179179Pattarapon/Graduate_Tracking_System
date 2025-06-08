document.addEventListener("submit", async function (e) {
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
                    continue; 
                }
                const data = await response.json();
                data.forEach(user => {
                    if (user && typeof user.email === 'string') {
                        allUsers[user.email.toLowerCase()] = { ...user, role: roleItem.role };
                    }
                });
            } catch (error) {
                console.error(`Error processing ${roleItem.file}:`, error);
            }
        }
        return allUsers;
    }

    const users = await fetchAllUsers();

    if (Object.keys(users).length === 0 && !email) {
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

    localStorage.setItem("current_user", email);
    localStorage.setItem("role", users[email].role);

    const hasSigned = localStorage.getItem(`${email}_signed`) === "true";

    const basePath = {
        student: "/User_Page/html_user/",
        admin: "/Admin_Page/html_admin/",
        advisor: "/Advisor_Page/html_advisor/",
        external_professor: "/Professor_Page/html_professor/",
        executive: "/Executive_Page/html_executive/"
    };

    const userRole = users[email].role;
    let redirectTo = hasSigned ? (userRole === 'admin' ? "admin_home.html" : "home.html") : "signature.html";
    
    if (basePath[userRole]) {
        window.location.href = basePath[userRole] + redirectTo;
    } else {
        console.error(`No base path defined for role: ${userRole}`);
        errorMsg.textContent = "เกิดข้อผิดพลาด: ไม่สามารถกำหนดหน้าถัดไปสำหรับบทบาทนี้ได้";
    }
});