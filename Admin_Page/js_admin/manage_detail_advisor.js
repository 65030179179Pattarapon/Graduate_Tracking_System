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

    const programs = [
        { "id": 1, "degreeLevel": "ปริญญาโท", "name": "วท.ม. การศึกษาวิทยาศาสตร์และเทคโนโลยี" },
        { "id": 2, "degreeLevel": "ปริญญาโท", "name": "ค.อ.ม. นวัตกรรมและการวิจัยเพื่อการเรียนรู้" },
        { "id": 3, "degreeLevel": "ปริญญาโท", "name": "ค.อ.ม. การบริหารการศึกษา" },
        { "id": 4, "degreeLevel": "ปริญญาเอก", "name": "ค.อ.ด. นวัตกรรมและการวิจัยเพื่อการเรียนรู้" },
        { "id": 5, "degreeLevel": "ปริญญาเอก", "name": "ค.อ.ด. การบริหารการศึกษา" },
        { "id": 6, "degreeLevel": "ปริญญาโท", "name": "ค.อ.ม. เทคโนโลยีการออกแบบผลิตภัณฑ์อุตสาหกรรม" },
        { "id": 7, "degreeLevel": "ปริญญาเอก", "name": "ปร.ด. สาขาวิชาเทคโนโลยีการออกแบบผลิตภัณฑ์อุตสาหกรรม" },
        { "id": 8, "degreeLevel": "ปริญญาโท", "name": "วท.ม. คอมพิวเตอร์ศึกษา" },
        { "id": 9, "degreeLevel": "ปริญญาโท", "name": "ค.อ.ม. วิศวกรรมไฟฟ้าสื่อสาร" },
        { "id": 10, "degreeLevel": "ปริญญาเอก", "name": "ปร.ด. คอมพิวเตอร์ศึกษา" },
        { "id": 11, "degreeLevel": "ปริญญาเอก", "name": "ปร.ด. วิศวกรรมไฟฟ้าศึกษา" },
        { "id": 12, "degreeLevel": "ปริญญาโท", "name": "วท.ม. การศึกษาเกษตร" },
        { "id": 13, "degreeLevel": "ปริญญาเอก", "name": "ปร.ด. การศึกษาเกษตร" }
    ];

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
        populateRolesAndProgramsCard();
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
        document.getElementById('new-email').value = currentAdvisor.email || '';
    }

    function populateProfileCard() {

    const prefixesTh = ['นาย', 'นาง', 'นางสาว', 'อ.', 'ผศ.', 'รศ.', 'ศ.', 'ผศ.ดร.', 'รศ.ดร.', 'ศ.ดร.'];
    const prefixesEn = ['Mr.', 'Mrs.', 'Ms.', 'Lecturer', 'Asst. Prof.', 'Assoc. Prof.', 'Prof.', 'Asst. Prof. Dr.', 'Assoc. Prof. Dr.', 'Prof. Dr.'];
    const genders = ['ชาย', 'หญิง', 'อื่นๆ'];
    
    populateSelect('prefix-th', prefixesTh, currentAdvisor.prefix_th);
    populateSelect('prefix-en', prefixesEn, currentAdvisor.prefix_en);
    populateSelect('gender', genders, ['ชาย', 'หญิง'].includes(currentAdvisor.gender) ? currentAdvisor.gender : 'อื่นๆ');

    document.getElementById('advisor-id').value = currentAdvisor.advisor_id || '';
    document.getElementById('firstname-th').value = currentAdvisor.first_name_th || '';
    document.getElementById('middlename-th').value = currentAdvisor.middle_name_th || ''; 
    document.getElementById('lastname-th').value = currentAdvisor.last_name_th || '';
    document.getElementById('firstname-en').value = currentAdvisor.first_name_en || '';
    document.getElementById('middlename-en').value = currentAdvisor.middle_name_en || ''; 
    document.getElementById('lastname-en').value = currentAdvisor.last_name_en || '';
    document.getElementById('contact-email').value = currentAdvisor.contact_email || '';
    document.getElementById('phone').value = currentAdvisor.phone || '';
    document.getElementById('backup-phone').value = currentAdvisor.backup_phone || ''; 

    const genderOtherInput = document.getElementById('gender-other-input');
    
        if (document.getElementById('gender').value === 'อื่นๆ') {
            genderOtherInput.classList.remove('hidden');
            if (!['ชาย', 'หญิง', undefined, null, ''].includes(currentAdvisor.gender)) {
                genderOtherInput.value = currentAdvisor.gender;
            }
        } else {
            genderOtherInput.classList.add('hidden');
        }
    }

    function populateRolesAndProgramsCard() {

        const advisorTypes = ["อาจารย์ประจำ", "อาจารย์ประจำหลักสูตร", "อาจารย์ผู้รับผิดชอบหลักสูตร", "อาจารย์บัณฑิตพิเศษภายใน", "อาจารย์บัณฑิตพิเศษภายนอก", "ผู้บริหารในคณะ"];
        populateSelect('advisor-type', advisorTypes, currentAdvisor.type);


        const allRoles = ["สอน", "สอบ", "ที่ปรึกษาวิทยานิพนธ์", "ที่ปรึกษาวิทยานิพนธ์ร่วม", "คณบดี", "ผู้ช่วยคณบดี"];
        const rolesContainer = document.getElementById('roles-checkbox-container');
        rolesContainer.innerHTML = '';
        allRoles.forEach(role => {
            const isChecked = currentAdvisor.roles && currentAdvisor.roles.includes(role);
            const item = document.createElement('div');
            item.className = 'checkbox-item';

            const roleId = `role-${role.replace(/\s+/g, '-')}`; 
            item.innerHTML = `
                <input type="checkbox" id="${roleId}" value="${role}" class="form-check-input" ${isChecked ? 'checked' : ''}>
                <label for="${roleId}" class="form-check-label">${role}</label>
            `;
            rolesContainer.appendChild(item);
        });

        const programContainer = document.getElementById('program-select-container');
        programContainer.innerHTML = ''; 
        

        const assignedProgramIds = currentAdvisor.assigned_programs || [];

        if (assignedProgramIds.length > 0) {

            assignedProgramIds.forEach(programId => {
                createProgramDropdown(programId); 
            });
        } else {

            createProgramDropdown();
        }

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

        const genderSelect = document.getElementById('gender');
        const genderOtherInput = document.getElementById('gender-other-input');
        if (genderSelect && genderOtherInput) {
            genderSelect.addEventListener('change', () => {
                if (genderSelect.value === 'อื่นๆ') {
                    genderOtherInput.classList.remove('hidden');
                    genderOtherInput.focus(); 
                } else {
                    genderOtherInput.classList.add('hidden');
                    genderOtherInput.value = '';
                }
            });
        }

    setupCurrentPasswordToggle('toggle-current-password', 'current-password', currentAdvisor.password);

        document.getElementById('generate-password-btn').addEventListener('click', () => {
            const newPass = generateRandomPassword();
            const newPassInput = document.getElementById('new-password');
            const confirmPassInput = document.getElementById('confirm-password');

            newPassInput.value = newPass;
            confirmPassInput.value = newPass;
        });

        document.getElementById('save-all-btn').addEventListener('click', handleSaveChanges);

            const addProgramBtn = document.getElementById('add-program-btn');
                if (addProgramBtn) {
                    addProgramBtn.addEventListener('click', () => {
                        createProgramDropdown();
                    });
                }
    }

    

    // =================================================================
    // 6. Data Saving
    // =================================================================

    function handleSaveChanges() {

        if (!confirm('คุณต้องการบันทึกการเปลี่ยนแปลงทั้งหมดใช่หรือไม่?')) return;

        let genderValue = document.getElementById('gender').value;
        if (genderValue === 'อื่นๆ') {
            genderValue = document.getElementById('gender-other-input').value.trim() || 'อื่นๆ';
        }

        const newPassword = document.getElementById('new-password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();


        if (newPassword !== confirmPassword) {
            alert('ข้อผิดพลาด: รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน!');

            document.getElementById('confirm-password').focus(); 
        }


        const updatedData = {

            email: document.getElementById('new-email').value.trim() || currentAdvisor.email,

            password: newPassword || currentAdvisor.password, 
           
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
          
            type: document.getElementById('advisor-type').value,
            roles: Array.from(document.querySelectorAll('#roles-checkbox-container input:checked')).map(cb => cb.value),
            assigned_programs: Array.from(document.querySelectorAll('.program-select'))
                .map(select => parseInt(select.value))
                .filter(value => !isNaN(value) && value > 0) 
    };
        

        const advisorIndex = masterData.advisors.findIndex(a => a.advisor_id === currentAdvisor.advisor_id);
        if (advisorIndex === -1) {
            alert('เกิดข้อผิดพลาด: ไม่พบข้อมูลอาจารย์เดิมเพื่ออัปเดต');
            return;
        }

        const updatedAdvisor = { ...masterData.advisors[advisorIndex], ...updatedData };

        masterData.advisors[advisorIndex] = updatedAdvisor;
        
        console.log("Saving updated advisor data:", updatedAdvisor);
        
        alert('บันทึกข้อมูลอาจารย์สำเร็จ!');
        window.location.reload();
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

    function addPasswordToggle(buttonId, inputId) {
        const button = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        if (button && input) {
            button.addEventListener('click', () => {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                const icon = button.querySelector('i');
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            });
        }
    }

    function setupCurrentPasswordToggle(buttonId, inputId, realPassword) {
        const button = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        let isVisible = false;
        if (button && input) {
            button.addEventListener('click', () => {
                isVisible = !isVisible;
                if (isVisible) {
                    input.type = 'text';
                    input.value = realPassword;
                    button.querySelector('i').classList.replace('fa-eye', 'fa-eye-slash');
                } else {
                    input.type = 'password';
                    input.value = '••••••••';
                    button.querySelector('i').classList.replace('fa-eye-slash', 'fa-eye');
                }
            });
        }
    }

    function createProgramDropdown(selectedProgramId = null) {
        const programContainer = document.getElementById('program-select-container');
        const wrapper = document.createElement('div');
        wrapper.className = 'dynamic-select-wrapper';

        const select = document.createElement('select');
        select.className = 'form-control program-select';

        const defaultOption = new Option("--- กรุณาเลือกหลักสูตร ---", "");
        select.appendChild(defaultOption);

        programs.forEach(program => {
            const optionText = `[${program.degreeLevel}] ${program.name}`;
            const option = new Option(optionText, program.id);
            if (program.id === selectedProgramId) {
                option.selected = true;
            }
            select.add(option);
        });

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn-remove-item';
        removeBtn.innerHTML = '<i class="fas fa-times-circle"></i>';
        removeBtn.onclick = () => {
            if (programContainer.querySelectorAll('.dynamic-select-wrapper').length > 1) {
                wrapper.remove();
            } else {
                alert("ต้องมีอย่างน้อย 1 หลักสูตร");
            }
        };

        wrapper.appendChild(select);
        wrapper.appendChild(removeBtn);
        programContainer.appendChild(wrapper);
    }

    // =================================================================
    // 8. Run Initializer
    // =================================================================
    initializePage();
});