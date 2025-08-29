// /Admin_Page/js_admin/manage_detail_advisor.js

document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // 1. Global State & Element References
    // =================================================================
    let masterData = {
        advisors: [],
        students: []
    };
    let currentAdvisor = null;
    const advisorEmail = new URLSearchParams(window.location.search).get('email');


    // =================================================================
    // 2. Main Initializer
    // =================================================================
    async function initializePage() {
        if (!advisorEmail) {
            document.querySelector('.main-content').innerHTML = '<h1><i class="fas fa-exclamation-triangle"></i> ไม่พบอีเมลของอาจารย์</h1><p>กรุณากลับไปที่หน้ารายชื่อและเลือกอาจารย์อีกครั้ง</p>';
            return;
        }

        try {
            await fetchMasterData();
            currentAdvisor = masterData.advisors.find(a => a.email === advisorEmail);

            if (!currentAdvisor) {
                document.querySelector('.main-content').innerHTML = `<h1><i class="fas fa-times-circle"></i> ไม่พบข้อมูลอาจารย์</h1><p>ไม่พบข้อมูลสำหรับอีเมล: ${advisorEmail}</p>`;
                return;
            }

            populateAllSections();
            setupEventListeners();

        } catch (error) {
            console.error("Failed to initialize advisor detail page:", error);
            document.querySelector('.main-content').innerHTML = '<h2><i class="fas fa-server"></i> เกิดข้อผิดพลาดในการโหลดข้อมูล</h2>';
        }
    }

    // =================================================================
    // 3. Data Fetching
    // =================================================================
    async function fetchMasterData() {
        const [advisorsData, studentsData] = await Promise.all([
            fetch('/data/advisor.json').then(res => res.json()),
            localStorage.getItem('savedStudents') 
                ? Promise.resolve(JSON.parse(localStorage.getItem('savedStudents')))
                : fetch('/data/student.json').then(res => res.json())
        ]);
        
        masterData = { 
            advisors: advisorsData,
            students: studentsData
        };
    }

    // =================================================================
    // 4. UI Population
    // =================================================================
    function populateAllSections() {
        populateSidebar();
        populateAccountCard();
        populateProfileCard();
        populateRolesCard();
        populateAdvisedStudentsCard();
        populateDocumentsCard();
    }

    function populateSidebar() {
        document.getElementById('sidebar-profile-img').src = currentAdvisor.profile_image_url || '/assets/images/advisors/placeholder.png';
        document.getElementById('sidebar-fullname').textContent = `${currentAdvisor.prefix_th}${currentAdvisor.first_name_th} ${currentAdvisor.last_name_th}`;
        document.getElementById('sidebar-academic-position').textContent = currentAdvisor.academic_position || '-';
    }

    function populateAccountCard() {
        document.getElementById('current-email').value = currentAdvisor.email || '';
    }

    function populateProfileCard() {
        // Populate dropdowns first
        const prefixesTh = ['อ.', 'ผศ.', 'รศ.', 'ศ.', 'ผศ.ดร.', 'รศ.ดร.', 'ศ.ดร.'];
        const prefixesEn = ['Lecturer', 'Asst. Prof.', 'Assoc. Prof.', 'Prof.', 'Asst. Prof. Dr.', 'Assoc. Prof. Dr.', 'Prof. Dr.'];
        const academicPositions = ['อาจารย์', 'ผู้ช่วยศาสตราจารย์', 'รองศาสตราจารย์', 'ศาสตราจารย์'];
        
        populateSelect('prefix-th', prefixesTh, currentAdvisor.prefix_th);
        populateSelect('prefix-en', prefixesEn, currentAdvisor.prefix_en);
        populateSelect('academic-position', academicPositions, currentAdvisor.academic_position);

        // Populate text inputs
        document.getElementById('advisor-id').value = currentAdvisor.advisor_id || '';
        document.getElementById('firstname-th').value = currentAdvisor.first_name_th || '';
        document.getElementById('lastname-th').value = currentAdvisor.last_name_th || '';
        document.getElementById('firstname-en').value = currentAdvisor.first_name_en || '';
        document.getElementById('lastname-en').value = currentAdvisor.last_name_en || '';
        document.getElementById('contact-email').value = currentAdvisor.contact_email || '';
        document.getElementById('phone').value = currentAdvisor.phone || '';
        document.getElementById('office-location').value = currentAdvisor.office_location || '';
        document.getElementById('faculty').value = currentAdvisor.faculty || '';
    }

    function populateRolesCard() {
        const advisorTypes = ["อาจารย์ประจำ", "อาจารย์ประจำหลักสูตร", "อาจารย์ผู้รับผิดชอบหลักสูตร", "อาจารย์บัณฑิตพิเศษภายใน", "อาจารย์บัณฑิตพิเศษภายนอก", "ผู้บริหารในคณะ"];
        populateSelect('advisor-type', advisorTypes, currentAdvisor.type);

        const allRoles = ["สอน", "สอบ", "ที่ปรึกษาวิทยานิพนธ์", "ที่ปรึกษาวิทยานิพนธ์ร่วม", "คณบดี", "ผู้ช่วยคณบดีฝ่ายวิชาการ"];
        const container = document.getElementById('roles-checkbox-container');
        container.innerHTML = '';
        allRoles.forEach(role => {
            const isChecked = currentAdvisor.roles && currentAdvisor.roles.includes(role);
            const item = document.createElement('div');
            item.className = 'checkbox-item';
            item.innerHTML = `
                <input type="checkbox" id="role-${role}" value="${role}" ${isChecked ? 'checked' : ''}>
                <label for="role-${role}">${role}</label>
            `;
            container.appendChild(item);
        });

        document.getElementById('expertise').value = (currentAdvisor.expertise || []).join(', ');
    }

    function populateAdvisedStudentsCard() {
        const tbody = document.getElementById('advised-students-tbody');
        tbody.innerHTML = '';
        const advisedStudents = masterData.students.filter(
            s => s.main_advisor_id === currentAdvisor.advisor_id
        );

        if (advisedStudents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">ยังไม่มีนักศึกษาในที่ปรึกษา</td></tr>';
            return;
        }

        advisedStudents.forEach(student => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student.student_id}</td>
                <td>${student.prefix_th}${student.first_name_th} ${student.last_name_th}</td>
                <td>${student.program || '-'}</td>
                <td>ที่ปรึกษาหลัก</td>
                <td>${student.status || 'กำลังศึกษา'}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function populateDocumentsCard() {
        const tbody = document.getElementById('attachments-tbody');
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">ยังไม่มีเอกสารแนบ</td></tr>';
        // This is a placeholder. You would loop through advisor's documents if they exist.
    }


    // =================================================================
    // 5. Event Listeners
    // =================================================================
    function setupEventListeners() {
        // Sidebar Navigation
        document.querySelectorAll('.sidebar-btn[data-section]').forEach(button => {
            button.addEventListener('click', () => {
                const sectionId = button.dataset.section;
                document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
                document.querySelectorAll('.sidebar-btn').forEach(btn => btn.classList.remove('active'));
                document.getElementById(`section-${sectionId}`).classList.add('active');
                button.classList.add('active');
            });
        });

        // Generate Password Button
        document.getElementById('generate-password-btn').addEventListener('click', () => {
            const newPass = generateRandomPassword();
            document.getElementById('new-password').value = newPass;
            document.getElementById('confirm-password').value = newPass;
        });

        // Save All Button
        document.getElementById('save-all-btn').addEventListener('click', handleSaveChanges);
    }

    // =================================================================
    // 6. Data Saving
    // =================================================================
    function handleSaveChanges() {
        if (!confirm('คุณต้องการบันทึกการเปลี่ยนแปลงทั้งหมดใช่หรือไม่?')) return;

        // Collect all data from form fields
        const updatedData = {
            // Account
            email: document.getElementById('new-email').value.trim() || currentAdvisor.email,
            password: document.getElementById('new-password').value.trim() || currentAdvisor.password,
            // Profile
            prefix_th: document.getElementById('prefix-th').value,
            first_name_th: document.getElementById('firstname-th').value.trim(),
            last_name_th: document.getElementById('lastname-th').value.trim(),
            prefix_en: document.getElementById('prefix-en').value,
            first_name_en: document.getElementById('firstname-en').value.trim(),
            last_name_en: document.getElementById('lastname-en').value.trim(),
            academic_position: document.getElementById('academic-position').value,
            contact_email: document.getElementById('contact-email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            office_location: document.getElementById('office-location').value.trim(),
            faculty: document.getElementById('faculty').value.trim(),
            // Roles & Expertise
            type: document.getElementById('advisor-type').value,
            roles: Array.from(document.querySelectorAll('#roles-checkbox-container input:checked')).map(cb => cb.value),
            expertise: document.getElementById('expertise').value.split(',').map(item => item.trim()).filter(Boolean)
        };
        
        // Find the index of the current advisor in the master array
        const advisorIndex = masterData.advisors.findIndex(a => a.advisor_id === currentAdvisor.advisor_id);
        if (advisorIndex === -1) {
            alert('เกิดข้อผิดพลาด: ไม่พบข้อมูลอาจารย์เดิมเพื่ออัปเดต');
            return;
        }

        // Merge updated data with existing data
        const updatedAdvisor = { ...masterData.advisors[advisorIndex], ...updatedData };
        
        // Update the master data array
        masterData.advisors[advisorIndex] = updatedAdvisor;
        
        // This is a simulation. In a real app, you would send this to a server.
        // For this project, we'll log it to the console.
        console.log("Saving updated advisor data:", updatedAdvisor);
        
        // If you were using Local Storage for advisors:
        // localStorage.setItem('savedAdvisors', JSON.stringify(masterData.advisors));

        alert('บันทึกข้อมูลอาจารย์สำเร็จ!');
        window.location.reload(); // Reload to see changes reflected (if any)
    }

    // =================================================================
    // 7. Helper Functions
    // =================================================================
    function populateSelect(elementId, options, selectedValue) {
        const select = document.getElementById(elementId);
        if (!select) return;
        select.innerHTML = '';
        options.forEach(option => {
            const opt = new Option(option, option);
            if (option === selectedValue) {
                opt.selected = true;
            }
            select.add(opt);
        });
    }

    function generateRandomPassword(length = 10) {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let password = "";
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }

    // =================================================================
    // 8. Run Initializer
    // =================================================================
    initializePage();
});