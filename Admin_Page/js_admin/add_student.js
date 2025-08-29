document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // Helper Functions (ฟังก์ชันเสริม)
    // =================================================================

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
                button.querySelector('i').classList.toggle('fa-eye');
                button.querySelector('i').classList.toggle('fa-eye-slash');
            });
        }
    }

    // =================================================================
    // Setup Functions (ฟังก์ชันสำหรับเตรียมหน้าเว็บ)
    // =================================================================

    function populateSelectOptions() {
        const prefixThSelect = document.getElementById('prefix-th');
        if (prefixThSelect) {
            prefixThSelect.innerHTML = `
                <option value="" disabled selected>-- เลือกคำนำหน้า --</option>
                <option value="นาย">นาย</option>
                <option value="นางสาว">นางสาว</option>
                <option value="นาง">นาง</option>
            `;
        }
        const prefixEnSelect = document.getElementById('prefix-en');
        if (prefixEnSelect) {
            prefixEnSelect.innerHTML = `
                <option value="" disabled selected>-- Select Prefix --</option>
                <option value="Mr.">Mr.</option>
                <option value="Ms.">Ms.</option>
                <option value="Mrs.">Mrs.</option>
            `;
        }
        const genderSelect = document.getElementById('gender');
        if (genderSelect) {
            genderSelect.innerHTML = `
                <option value="" disabled selected>-- เลือกเพศ --</option>
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
                <option value="อื่นๆ">อื่นๆ</option>
            `;
        }

        const degreeSelect = document.getElementById('degree');
        const statusSelect = document.getElementById('student-status');
        const admitYearSelect = document.getElementById('admit-year');
        const admitSemesterSelect = document.getElementById('admit-semester');
        const admitTypeSelect = document.getElementById('admit-type');
        const studyPlanSelect = document.getElementById('study-plan');

        if (degreeSelect) {
            degreeSelect.innerHTML = `
                <option value="" disabled selected>-- เลือกระดับ --</option>
                <option value="ปริญญาโท">ปริญญาโท</option>
                <option value="ปริญญาเอก">ปริญญาเอก</option>
            `;
        }
        if (statusSelect) {
            statusSelect.innerHTML = `
                <option value="กำลังศึกษา" selected>กำลังศึกษา</option>
                <option value="พักการศึกษา">พักการศึกษา</option>
            `;
        }
        if (admitSemesterSelect) {
            admitSemesterSelect.innerHTML = `
                <option value="" disabled selected>-- เลือกภาค --</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="ภาคพิเศษ">ภาคพิเศษ</option>
            `;
        }
        if (admitTypeSelect) {
            admitTypeSelect.innerHTML = `
                <option value="" disabled selected>-- เลือกประเภท --</option>
                <option value="ปกติ">ปกติ</option>
                <option value="พิเศษ">พิเศษ</option>
            `;
        }
        if (studyPlanSelect) {
            studyPlanSelect.innerHTML = `
                <option value="" disabled selected>-- เลือกแผน --</option>
                <option value="แผน ก แบบ ก2">แผน ก แบบ ก2</option>
                <option value="แบบ 1.1">แบบ 1.1</option>
                <option value="แบบ 2.1">แบบ 2.1</option>
            `;
        }
        if (admitYearSelect) {
            admitYearSelect.innerHTML = '<option value="" disabled selected>-- เลือกปี --</option>';
            const currentBuddhistYear = new Date().getFullYear() + 543;
            for (let i = 0; i < 10; i++) {
                const year = currentBuddhistYear - i;
                admitYearSelect.add(new Option(year, year));
            }
        }

        const programSelect = document.getElementById('program');
        const majorSelect = document.getElementById('major');
        const programsByDegree = {
            'ปริญญาโท': [
                "วท.ม. การศึกษาวิทยาศาสตร์และเทคโนโลยี", 
                "วท.ม. คอมพิวเตอร์ศึกษา", 
                "ค.อ.ม. นวัตกรรมและการวิจัยเพื่อการเรียนรู้", 
                "วท.ม. การศึกษาเกษตร", 
                "ค.อ.ม. การบริหารการศึกษา", 
                "ค.อ.ม. วิศวกรรมไฟฟ้าสื่อสาร", 
                "ค.อ.ม. เทคโนโลยีการออกแบบผลิตภัณฑ์อุตสาหกรรม"
            ],
            'ปริญญาเอก': [
                "ค.อ.ด. นวัตกรรมและการวิจัยเพื่อการเรียนรู้", 
                "ค.อ.ด. การบริหารการศึกษา", 
                "ปร.ด. สาขาวิชาเทคโนโลยีการออกแบบผลิตภัณฑ์อุตสาหกรรม", 
                "ปร.ด. คอมพิวเตอร์ศึกษา", 
                "ปร.ด. การศึกษาเกษตร", 
                "ปร.ด. วิศวกรรมไฟฟ้าศึกษา"
            ]
        };
        const updateDependentDropdowns = () => {
            const selectedDegree = degreeSelect ? degreeSelect.value : '';
            const programs = programsByDegree[selectedDegree] || [];
            if (programSelect) {
                programSelect.innerHTML = '<option value="" disabled selected>-- เลือกหลักสูตร --</option>';
                programs.forEach(prog => programSelect.add(new Option(prog, prog)));
            }
            if (majorSelect) {
                majorSelect.innerHTML = '<option value="" disabled selected>-- เลือกสาขาวิชา --</option>';
                programs.forEach(prog => {
                    const majorName = prog.split(' ').slice(1).join(' ');
                    majorSelect.add(new Option(majorName, majorName));
                });
            }
        };
        if (degreeSelect) {
            degreeSelect.addEventListener('change', updateDependentDropdowns);
        }
        updateDependentDropdowns();
    }

    function setupPageEventListeners() {
        const generatePassBtn = document.getElementById('generate-password-btn');
        const newPasswordField = document.getElementById('new-password');
        const confirmPasswordField = document.getElementById('confirm-password');
        if (generatePassBtn && newPasswordField && confirmPasswordField) {
            generatePassBtn.addEventListener('click', () => {
                const newPassword = generateRandomPassword();
                newPasswordField.value = newPassword;
                confirmPasswordField.value = newPassword;
            });
        }

        addPasswordToggle('toggle-new-password', 'new-password');
        addPasswordToggle('toggle-confirm-password', 'confirm-password');

        const sidebarBtns = document.querySelectorAll('.sidebar-btn[data-section]');
        const contentSections = document.querySelectorAll('.content-section');
        sidebarBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                sidebarBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const sectionId = btn.dataset.section;
                contentSections.forEach(sec => {
                    sec.classList.toggle('active', sec.id === `section-${sectionId}`);
                });
            });
        });
    }

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

    // =================================================================
    // Form Submission (ฟังก์ชันสำหรับบันทึกข้อมูล)
    // =================================================================
    const studentForm = document.getElementById('add-student-form');
    if (studentForm) {
        studentForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const validateForm = () => {
                const errors = [];
                studentForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

                const requiredFields = [
                    'new-email', 'new-password', 'confirm-password',
                    'prefix-th', 'firstname-th', 'lastname-th',
                    'prefix-en', 'firstname-en', 'lastname-en',
                    'email', 'phone', 'gender',
                    'degree', 'program', 'major', 'student-status',
                    'admit-year', 'admit-semester', 'admit-type', 'study-plan'
                ];

                requiredFields.forEach(id => {
                    const field = document.getElementById(id);
                    if (field && field.value.trim() === '') {
                        field.classList.add('is-invalid');
                        const label = document.querySelector(`label[for="${id}"]`);
                        errors.push({
                            element: field,
                            label: label ? label.textContent : id
                        });
                    }
                });

                const newPassword = document.getElementById('new-password');
                const confirmPassword = document.getElementById('confirm-password');
                if (newPassword.value !== confirmPassword.value) {
                    newPassword.classList.add('is-invalid');
                    confirmPassword.classList.add('is-invalid');
                    errors.push({ element: newPassword, label: "รหัสผ่านไม่ตรงกัน" });
                }

                return errors;
            };

            const validationErrors = validateForm();

            if (validationErrors.length > 0) {
                const errorLabels = validationErrors.map(err => err.label);
                alert('กรุณากรอกข้อมูลให้ครบถ้วน:\n\n- ' + errorLabels.join('\n- '));

                const firstErrorField = validationErrors[0].element;
                const errorSection = firstErrorField.closest('.content-section');
                if (errorSection) {
                    const sectionId = errorSection.id.replace('section-', '');
                    const tabButton = document.querySelector(`.sidebar-btn[data-section="${sectionId}"]`);
                    if (tabButton) {
                        tabButton.click(); 
                    }
                }
                firstErrorField.focus(); 
                return; 
            }
            
            let genderValue = document.getElementById('gender').value;
            if (genderValue === 'อื่นๆ') {
                genderValue = document.getElementById('gender-other-input').value || 'อื่นๆ';
            }

            const newStudent = {
                email: document.getElementById('new-email').value,
                password: document.getElementById('new-password').value,
                student_id: document.getElementById('student-id').value,
                prefix_th: document.getElementById('prefix-th').value,
                first_name_th: document.getElementById('firstname-th').value,
                middle_name_th: document.getElementById('middlename-th').value,
                last_name_th: document.getElementById('lastname-th').value,
                prefix_en: document.getElementById('prefix-en').value,
                first_name_en: document.getElementById('firstname-en').value,
                middle_name_en: document.getElementById('middlename-en').value,
                last_name_en: document.getElementById('lastname-en').value,
                contact_email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                gender: genderValue,
                degree: document.getElementById('degree').value,
                program: document.getElementById('program').value,
                major: document.getElementById('major').value,
                status: document.getElementById('student-status').value || 'กำลังศึกษา',
                admit_year: document.getElementById('admit-year').value,
                admit_semester: document.getElementById('admit-semester').value,
                admit_type: document.getElementById('admit-type').value,
                plan: document.getElementById('study-plan').value,
                profile_image_url: '/assets/images/students/placeholder.png',
                thesis_title_th: null,
                main_advisor_id: null,
                publications: [],
                attachments: []
            };

            if (!newStudent.student_id || !newStudent.email || !newStudent.password) {
                alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนเป็นอย่างน้อย: รหัสนักศึกษา, อีเมล และรหัสผ่าน');
                return;
            }

            let students = JSON.parse(localStorage.getItem('savedStudents') || '[]');
            students.push(newStudent);
            localStorage.setItem('savedStudents', JSON.stringify(students));

            alert(`เพิ่มข้อมูลนักศึกษา "${newStudent.first_name_th}" สำเร็จ!`);
            window.location.href = '/Admin_Page/html_admin/manage_user.html';
        });
    }

    // =================================================================
    // Initialization (เริ่มต้นการทำงาน)
    // =================================================================
    populateSelectOptions();
    setupPageEventListeners();
});