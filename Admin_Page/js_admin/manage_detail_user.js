// /Admin_Page/js_admin/manage_detail_user.js

document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // 1. Global State & Element References
    // =================================================================
    
    let masterData = {
        students: [],
        advisors: [],
        programs: [],
        allDocuments: []
    };

    let currentStudent = null;
    // =================================================================
    // 2. Main Initializer
    // =================================================================

    async function initializePage() {
        try {
            const params = new URLSearchParams(window.location.search);
            const studentId = params.get('id');

            if (!studentId) {
                document.querySelector('.main-content').innerHTML = '<h2>ไม่พบรหัสนักศึกษา</h2>';
                return;
            }

            await fetchMasterData();
            
            currentStudent = masterData.students.find(s => s.student_id === studentId);

            if (!currentStudent) {
                document.querySelector('.main-content').innerHTML = `<h2>ไม่พบข้อมูลนักศึกษาสำหรับรหัส: ${studentId}</h2>`;
                return;
            }
            
            setupSidebarNavigation();
            setupEventListeners(); // <-- [ใหม่] เรียกใช้ฟังก์ชันติดตั้ง Event Listener
            populateAllData();
            
        } catch (error) {
            console.error("Failed to initialize student detail page:", error);
            document.querySelector('.main-content').innerHTML = '<h2>เกิดข้อผิดพลาดในการโหลดข้อมูล</h2>';
        }
    }

    // =================================================================
    // 3. Data Fetching
    // =================================================================

    async function fetchMasterData() {
        const [students, advisors, programs, pending, approved, rejected] = await Promise.all([
            fetch('/data/student.json').then(res => res.json()),
            fetch('/data/advisor.json').then(res => res.json()),
            fetch('/data/structures/programs.json').then(res => res.json()),
            Promise.resolve(JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]')),
            Promise.resolve(JSON.parse(localStorage.getItem('localStorage_approvedDocs') || '[]')),
            Promise.resolve(JSON.parse(localStorage.getItem('localStorage_rejectedDocs') || '[]'))
        ]);
        
        masterData.students = students;
        masterData.advisors = advisors;
        masterData.programs = programs;
        masterData.allDocuments = [...pending, ...approved, ...rejected];
    }

    // =================================================================
    // 4. Data Population & Rendering
    // =================================================================

    function populateAllData() {
        populateSidebarProfile();
        renderProfileSection();
        renderAcademicSection();
        renderAcademicThesisSection
        renderAccountSection(); // <-- [ใหม่] เรียกใช้ฟังก์ชันแสดงผลบัญชี
        renderDocumentsHistorySection();
    }

    function populateSidebarProfile() {
        document.getElementById('sidebar-profile-img').src = currentStudent.profile_image_url || '/assets/images/students/placeholder.png';
        document.getElementById('sidebar-fullname').textContent = `${currentStudent.prefix_th}${currentStudent.first_name_th} ${currentStudent.last_name_th}`;
        document.getElementById('sidebar-studentid').textContent = `รหัส: ${currentStudent.student_id}`;
    }

function renderProfileSection() {
        const prefixThSelect = document.getElementById('prefix-th');
        const prefixEnSelect = document.getElementById('prefix-en');
        const genderSelect = document.getElementById('gender');

        // สร้าง Options สำหรับคำนำหน้า (ไทย)
        prefixThSelect.innerHTML = `
            <option value="">-- เลือก --</option>
            <option value="นาย">นาย</option>
            <option value="นางสาว">นางสาว</option>
            <option value="นาง">นาง</option>
        `;
        // สร้าง Options สำหรับคำนำหน้า (อังกฤษ)
        prefixEnSelect.innerHTML = `
            <option value="">-- Select --</option>
            <option value="Mr.">Mr.</option>
            <option value="Ms.">Ms.</option>
            <option value="Mrs.">Mrs.</option>
        `;
        // สร้าง Options สำหรับเพศ
        genderSelect.innerHTML = `
            <option value="">-- ไม่ระบุ --</option>
            <option value="ชาย">ชาย</option>
            <option value="หญิง">หญิง</option>
            <option value="อื่นๆ">อื่นๆ</option>
        `;

        // ดึงข้อมูลทั้งหมดมาใส่ในช่องกรอกข้อมูล
        prefixThSelect.value = currentStudent.prefix_th;
        document.getElementById('firstname-th').value = currentStudent.first_name_th;
        document.getElementById('lastname-th').value = currentStudent.last_name_th;
        document.getElementById('middlename-th').value = currentStudent.middle_name_th || ''; // เพิ่มชื่อกลาง

        prefixEnSelect.value = currentStudent.prefix_en;
        document.getElementById('firstname-en').value = currentStudent.first_name_en;
        document.getElementById('lastname-en').value = currentStudent.last_name_en;
        document.getElementById('middlename-en').value = currentStudent.middle_name_en || ''; // เพิ่มชื่อกลาง

        document.getElementById('student-id').value = currentStudent.student_id;
        document.getElementById('email').value = currentStudent.email;
        document.getElementById('phone').value = currentStudent.phone;
        genderSelect.value = currentStudent.gender;

    }
    
    function renderAccountSection() {
        document.getElementById('current-email').value = currentStudent.email;
        document.getElementById('current-password').value = currentStudent.password || '••••••••'; // แสดงรหัสผ่านจำลอง
        document.getElementById('new-email').value = currentStudent.email;
    }

function renderAcademicSection() {
        // --- 1. ดึง Element ทั้งหมด ---
        const degreeSelect = document.getElementById('degree');
        const programSelect = document.getElementById('program');
        const majorInput = document.getElementById('major');
        const statusSelect = document.getElementById('student-status');
        const admitYearSelect = document.getElementById('admit-year');
        const admitSemesterSelect = document.getElementById('admit-semester');
        const admitTypeSelect = document.getElementById('admit-type');
        const studyPlanSelect = document.getElementById('study-plan');

        // --- 2. สร้าง Options สำหรับ Dropdown ต่างๆ ---
        degreeSelect.innerHTML = `
            <option value="">-- เลือกระดับ --</option>
            <option value="ปริญญาโท">ปริญญาโท</option>
            <option value="ปริญญาเอก">ปริญญาเอก</option>
        `;
        statusSelect.innerHTML = `
            <option value="">-- เลือกสถานะ --</option>
            <option value="กำลังศึกษา">กำลังศึกษา</option>
            <option value="พักการศึกษา">พักการศึกษา</option>
            <option value="สำเร็จการศึกษา">สำเร็จการศึกษา</option>
        `;
        admitYearSelect.innerHTML = '<option value="">-- เลือกปี --</option>';
        const currentYear = new Date().getFullYear() + 543;
        for (let i = 0; i < 15; i++) {
            const year = currentYear - i;
            admitYearSelect.add(new Option(year, year));
        }
        admitSemesterSelect.innerHTML = `
            <option value="">-- เลือกภาค --</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="ภาคพิเศษ">ภาคพิเศษ</option>
        `;
        admitTypeSelect.innerHTML = `
            <option value="">-- เลือกประเภท --</option>
            <option value="ปกติ">ปกติ</option>
            <option value="พิเศษ">พิเศษ</option>
            <option value="สมทบ">สมทบ</option>
        `;
        studyPlanSelect.innerHTML = `
            <option value="">-- เลือกแผน --</option>
            <option value="แผน ก แบบ ก2">แผน ก แบบ ก2</option>
            <option value="แบบ 1.1">แบบ 1.1</option>
            <option value="แบบ 2.1">แบบ 2.1</option>
        `;

        // --- 3. สร้าง Logic สำหรับ Dropdown หลักสูตรที่ขึ้นอยู่กับระดับปริญญา ---
        const programsByDegree = {
            'ปริญญาโท': [
                "วท.ม. การศึกษาวิทยาศาสตร์และเทคโนโลยี", "วท.ม. คอมพิวเตอร์ศึกษา", 
                "ค.อ.ม. นวัตกรรมและการวิจัยเพื่อการเรียนรู้", "วท.ม. การศึกษาเกษตร", 
                "ค.อ.ม. การบริหารการศึกษา", "ค.อ.ม. วิศวกรรมไฟฟ้าสื่อสาร", 
                "ค.อ.ม. เทคโนโลยีการออกแบบผลิตภัณฑ์อุตสาหกรรม"
            ],
            'ปริญญาเอก': [
                "ค.อ.ด. นวัตกรรมและการวิจัยเพื่อการเรียนรู้", "ค.อ.ด. การบริหารการศึกษา", 
                "ปร.ด. สาขาวิชาเทคโนโลยีการออกแบบผลิตภัณฑ์อุตสาหกรรม", "ปร.ด. คอมพิวเตอร์ศึกษา", 
                "ปร.ด. การศึกษาเกษตร", "ปร.ด. วิศวกรรมไฟฟ้าศึกษา"
            ]
        };

        const updateProgramOptions = () => {
            const selectedDegree = degreeSelect.value;
            programSelect.innerHTML = '<option value="">-- เลือกหลักสูตร --</option>';
            if (programsByDegree[selectedDegree]) {
                programsByDegree[selectedDegree].forEach(prog => {
                    programSelect.add(new Option(prog, prog));
                });
            }
        };
        degreeSelect.addEventListener('change', updateProgramOptions);

        // --- 4. ตั้งค่าเริ่มต้นจากข้อมูลของนักศึกษา (ถ้ามี) ---
        if (currentStudent) {
            degreeSelect.value = currentStudent.degree;
            updateProgramOptions(); // เรียกเพื่อให้ list ของ program ถูกสร้างขึ้น
            programSelect.value = masterData.programs.find(p => p.id === currentStudent.program_id)?.name || '';
            majorInput.value = currentStudent.major || ''; // สมมติว่ามีข้อมูลสาขาวิชาใน student.json
            statusSelect.value = currentStudent.status;
            admitYearSelect.value = currentStudent.admit_year;
            admitSemesterSelect.value = currentStudent.admit_semester;
            admitTypeSelect.value = currentStudent.admit_type || ''; // สมมติว่ามีข้อมูลประเภทรับเข้า
            studyPlanSelect.value = currentStudent.plan;
        }
    }
    

function renderAcademicThesisSection() {
        // ส่วนข้อมูลการศึกษา
        document.getElementById('degree').value = currentStudent.degree;
        document.getElementById('program').value = masterData.programs.find(p => p.id === currentStudent.program_id)?.name || '';
        document.getElementById('student-status').value = currentStudent.status;
        document.getElementById('admit-year').value = currentStudent.admit_year;
        document.getElementById('admit-semester').value = currentStudent.admit_semester;
        document.getElementById('study-plan').value = currentStudent.plan;

        // ส่วนข้อมูลวิทยานิพนธ์
        document.getElementById('thesis-title-th').value = currentStudent.thesis_title_th || '';
        document.getElementById('thesis-title-en').value = currentStudent.thesis_title_en || '';
        
        // แปลง ISO date string เป็น YYYY-MM-DD สำหรับ input type="date"
        if (currentStudent.proposal_approval_date) {
            document.getElementById('proposal-approval-date').value = new Date(currentStudent.proposal_approval_date).toISOString().split('T')[0];
        }
    }

    function renderDocumentsHistorySection() {
        const tableBody = document.querySelector('#documents-history-table tbody');
        tableBody.innerHTML = '';

        const studentDocs = masterData.allDocuments
            .filter(doc => doc.student_email === currentStudent.email)
            .sort((a, b) => new Date(b.submitted_date) - new Date(a.submitted_date));

        if (studentDocs.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4">ยังไม่มีประวัติการยื่นเอกสาร</td></tr>`;
            return;
        }

        studentDocs.forEach(doc => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${doc.title}</td>
                <td>${formatThaiDateTime(doc.submitted_date)}</td>
                <td><span class="status-badge">${doc.status}</span></td>
                <td><a href="/Admin_Page/html_admin/document_detail.html?id=${doc.doc_id}" class="btn-view" title="ดูรายละเอียด"><i class="fas fa-eye"></i></a></td>
            `;
            tableBody.appendChild(tr);
        });
    }


    // =================================================================
    // 5. Section Navigation
    // =================================================================

    function setupSidebarNavigation() {
        document.querySelectorAll('.sidebar-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                if (e.currentTarget.tagName === 'A') {
                    e.preventDefault();
                }
                const sectionId = e.currentTarget.dataset.section;
                if (sectionId) {
                    showSection(sectionId);
                } else if (e.currentTarget.href) {
                    window.location.href = e.currentTarget.href;
                }
            });
        });
    }

    function showSection(sectionId) {
        // ซ่อนทุก Section และเอา active class ออกจากทุกปุ่มใน Sidebar
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
        document.querySelectorAll('.sidebar-btn').forEach(button => button.classList.remove('active'));

        // แสดง Section ที่ถูกเลือก
        const activeSection = document.getElementById(`section-${sectionId}`);
        if (activeSection) {
            activeSection.classList.add('active');
        }
        
        // เพิ่ม active class ให้ปุ่มที่ถูกเลือกใน Sidebar
        const activeButton = document.querySelector(`.sidebar-btn[data-section="${sectionId}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

 function setupEventListeners() {
        const togglePasswordBtn = document.getElementById('toggle-password-visibility');
        const currentPasswordField = document.getElementById('current-password');
        const generatePassBtn = document.getElementById('generate-password-btn');
        const newPasswordField = document.getElementById('new-password');
        const confirmPasswordField = document.getElementById('confirm-password');

        if (togglePasswordBtn && currentPasswordField) {
            togglePasswordBtn.addEventListener('click', () => {
                const type = currentPasswordField.getAttribute('type') === 'password' ? 'text' : 'password';
                currentPasswordField.setAttribute('type', type);
                togglePasswordBtn.querySelector('i').classList.toggle('fa-eye');
                togglePasswordBtn.querySelector('i').classList.toggle('fa-eye-slash');
            });
        }

        if (generatePassBtn && newPasswordField && confirmPasswordField) {
            generatePassBtn.addEventListener('click', () => {
                const newPassword = generateRandomPassword();
                newPasswordField.value = newPassword;
                confirmPasswordField.value = newPassword;
            });
        }
    }
    
    function generateRandomPassword(length = 10) {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }

    // =================================================================
    // 6. Initialize Page
    // =================================================================
    initializePage();
});