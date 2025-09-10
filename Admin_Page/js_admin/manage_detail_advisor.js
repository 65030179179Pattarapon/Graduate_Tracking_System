// /Admin_Page/js_admin/manage_detail_advisor.js (Revised & Refactored Version)

document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // 1. GLOBAL STATE & CONFIGURATION
    // =================================================================
    
    let masterData = {
        advisors: [],
        students: [],
        approvedDocuments: []
    };
    let currentAdvisor = null;
    const advisorEmail = new URLSearchParams(window.location.search).get('email');

    // --- Configuration for pagination and unsaved changes tracking ---
    let pageState = {
        students: 1,
        publications: 1
    };
    const itemsPerPage = 10;
    let hasUnsavedChanges = false;

    // --- Static Data ---
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
    // 2. MAIN INITIALIZATION
    // =================================================================
    
    async function initializePage() {
        if (!advisorEmail) {
            displayError('<h1><i class="fas fa-exclamation-triangle"></i> ไม่พบอีเมลของอาจารย์</h1><p>กรุณากลับไปที่หน้ารายชื่อและเลือกอาจารย์อีกครั้ง</p>');
            return;
        }

        try {
            await fetchMasterData();
            currentAdvisor = masterData.advisors.find(a => a.email === advisorEmail);

            if (!currentAdvisor) {
                displayError(`<h1><i class="fas fa-times-circle"></i> ไม่พบข้อมูลอาจารย์</h1><p>ไม่พบข้อมูลสำหรับอีเมล: ${advisorEmail}</p>`);
                return;
            }

            populateAllSections();
            setupEventListeners();

        } catch (error) {
            console.error("Failed to initialize advisor detail page:", error);
            displayError('<h2><i class="fas fa-server"></i> เกิดข้อผิดพลาดในการโหลดข้อมูล</h2><p>กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ</p>');
        }
    }

    // =================================================================
    // 3. DATA FETCHING
    // =================================================================

    async function fetchMasterData() {
        const advisorsPromise = localStorage.getItem('savedAdvisors')
            ? Promise.resolve(JSON.parse(localStorage.getItem('savedAdvisors')))
            : fetch('/data/advisor.json').then(res => res.json());

        const studentsPromise = localStorage.getItem('savedStudents')
            ? Promise.resolve(JSON.parse(localStorage.getItem('savedStudents')))
            : fetch('/data/student.json').then(res => res.json());

        const approvedDocsPromise = Promise.resolve(
            JSON.parse(localStorage.getItem('localStorage_approvedDocs') || '[]')
        );

        const [advisorsData, studentsData, approvedDocsData] = await Promise.all([
            advisorsPromise,
            studentsPromise,
            approvedDocsPromise
        ]);

        masterData = {
            advisors: advisorsData,
            students: studentsData,
            approvedDocuments: approvedDocsData
        };
    }

    // =================================================================
    // 4. UI POPULATION
    // =================================================================

    function populateAllSections() {
        populateSidebar();
        populateAccountCard();
        populateProfileCard();
        populateRolesAndProgramsCard();
        populateAdvisedStudentsCard();
        populatePublicationsCard();
    }

    function populateSidebar() {
        const profileImg = document.getElementById('sidebar-profile-img');
        const fullName = document.getElementById('sidebar-fullname');
        const academicPos = document.getElementById('sidebar-academic-position');

        if (profileImg) {
            profileImg.src = currentAdvisor.profile_image_url || '/assets/images/advisors/placeholder.png';
            profileImg.onerror = () => { profileImg.src = '/assets/images/advisors/placeholder.png'; };
        }
        if (fullName) fullName.textContent = `${currentAdvisor.prefix_th}${currentAdvisor.first_name_th} ${currentAdvisor.last_name_th}`;
        if (academicPos) academicPos.textContent = currentAdvisor.academic_position || '-';
    }

    function populateAccountCard() {
        setInputValue('current-email', currentAdvisor.email);
        setInputValue('new-email', currentAdvisor.email);
    }

    function populateProfileCard() {
        populateSelect('prefix-th', ['นาย', 'นาง', 'นางสาว', 'อ.', 'ผศ.', 'รศ.', 'ศ.', 'ผศ.ดร.', 'รศ.ดร.', 'ศ.ดร.'], currentAdvisor.prefix_th);
        populateSelect('prefix-en', ['Mr.', 'Mrs.', 'Ms.', 'Lecturer', 'Asst. Prof.', 'Assoc. Prof.', 'Prof.', 'Asst. Prof. Dr.', 'Assoc. Prof. Dr.', 'Prof. Dr.'], currentAdvisor.prefix_en);
        populateSelect('gender', ['ชาย', 'หญิง', 'อื่นๆ'], ['ชาย', 'หญิง'].includes(currentAdvisor.gender) ? currentAdvisor.gender : 'อื่นๆ');
        
        setInputValue('advisor-id', currentAdvisor.advisor_id);
        setInputValue('firstname-th', currentAdvisor.first_name_th);
        setInputValue('middlename-th', currentAdvisor.middle_name_th);
        setInputValue('lastname-th', currentAdvisor.last_name_th);
        setInputValue('firstname-en', currentAdvisor.first_name_en);
        setInputValue('middlename-en', currentAdvisor.middle_name_en);
        setInputValue('lastname-en', currentAdvisor.last_name_en);
        setInputValue('contact-email', currentAdvisor.contact_email);
        setInputValue('phone', currentAdvisor.phone);
        setInputValue('backup-phone', currentAdvisor.backup_phone);

        const genderSelect = document.getElementById('gender');
        const genderOtherInput = document.getElementById('gender-other-input');
        if (genderSelect && genderOtherInput) {
            if (genderSelect.value === 'อื่นๆ') {
                genderOtherInput.classList.remove('hidden');
                if (!['ชาย', 'หญิง', undefined, null, ''].includes(currentAdvisor.gender)) {
                    genderOtherInput.value = currentAdvisor.gender;
                }
            } else {
                genderOtherInput.classList.add('hidden');
            }
        }
    }

    function populateRolesAndProgramsCard() {
        populateSelect('advisor-type', ["อาจารย์ประจำ", "อาจารย์ประจำหลักสูตร", "อาจารย์ผู้รับผิดชอบหลักสูตร", "อาจารย์บัณฑิตพิเศษภายใน", "อาจารย์บัณฑิตพิเศษภายนอก", "ผู้บริหารในคณะ"], currentAdvisor.type);
        
        const rolesContainer = document.getElementById('roles-checkbox-container');
        if (!rolesContainer) return;
        rolesContainer.innerHTML = '';
        const allRoles = ["สอน", "สอบ", "ที่ปรึกษาวิทยานิพนธ์", "ที่ปรึกษาวิทยานิพนธ์ร่วม", "คณบดี", "ผู้ช่วยคณบดี"];

        allRoles.forEach(role => {
            const isChecked = currentAdvisor.roles?.includes(role) || false;
            const item = document.createElement('div');
            item.className = 'checkbox-item';
            const roleId = `role-${role.replace(/\s+/g, '-')}`;
            
            let innerHtml = `
                <input type="checkbox" id="${roleId}" value="${role}" class="form-check-input" ${isChecked ? 'checked' : ''}>
                <label for="${roleId}" class="form-check-label">${role}</label>
            `;

            if (role === 'ผู้ช่วยคณบดี') {
                innerHtml += `
                    <select id="assistant-dean-department" class="form-control" style="display: ${isChecked ? 'block' : 'none'};">
                        <option value="">-- เลือกฝ่าย --</option>
                        <option value="วิชาการและวิจัย">วิชาการและวิจัย</option>
                        <option value="พัฒนานักศึกษา">พัฒนานักศึกษา</option>
                        <option value="บริหาร">บริหาร</option>
                    </select>
                `;
            }

            item.innerHTML = innerHtml;
            rolesContainer.appendChild(item);
        });

        const assistantDeanDropdown = document.getElementById('assistant-dean-department');
        if (assistantDeanDropdown && currentAdvisor.assistant_dean_department) {
            assistantDeanDropdown.value = currentAdvisor.assistant_dean_department;
        }

        const programContainer = document.getElementById('program-select-container');
        if (!programContainer) return;
        programContainer.innerHTML = '';
        const assignedProgramIds = currentAdvisor.assigned_programs || [];
        if (assignedProgramIds.length > 0) {
            assignedProgramIds.forEach(programId => createProgramDropdown(programId));
        } else {
            createProgramDropdown();
        }
    }

    function populateAdvisedStudentsCard() {
        const tbody = document.getElementById('advised-students-tbody');
        const paginationEl = document.getElementById('advised-students-pagination');
        if (!tbody || !paginationEl) return;

        const advisedStudents = masterData.students.filter(student => {
            const approvedForm1 = masterData.approvedDocuments.find(doc =>
                doc.student_email === student.email &&
                doc.type === 'ฟอร์ม 1' &&
                doc.status === 'อนุมัติแล้ว'
            );

            if (approvedForm1 && approvedForm1.advisor) {
                student.advisorRole = (approvedForm1.advisor.main_advisor_id === currentAdvisor.advisor_id) ? 'ที่ปรึกษาหลัก' : 'ที่ปรึกษาร่วม';
                return true;
            }
            return false;
        });

        const renderStudentRow = (tr, student) => {
            tr.innerHTML = `
                <td>${student.student_id || '-'}</td>
                <td>${student.prefix_th}${student.first_name_th} ${student.last_name_th}</td>
                <td>${student.email || '-'}</td>
                <td>${student.degree || '-'}</td>
                <td>${student.program || '-'}</td>
                <td>${student.advisorRole || '-'}</td>
                <td>${student.status || 'กำลังศึกษา'}</td>
            `;
        };

        renderTableWithPagination(tbody, paginationEl, advisedStudents, pageState.students, 'students', renderStudentRow);
    }

    function populatePublicationsCard() {
        const tbody = document.getElementById('publications-tbody');
        const paginationEl = document.getElementById('publications-pagination');
        if (!tbody || !paginationEl) return;

        const publications = currentAdvisor.academic_works || [];

        const renderPublicationRow = (tr, pub) => {
            tr.innerHTML = `
                <td>${pub.title || '-'}</td>
                <td>${pub.publish_date || '-'}</td>
                <td>${pub.publication_type || '-'}</td>
                <td><a href="${pub.attachment_file || '#'}" target="_blank" class="link-primary" ${!pub.attachment_file ? 'onclick="return false;"' : ''}>ดูเอกสาร</a></td>
                <td><button class="btn-icon btn-delete" title="ลบ"><i class="fas fa-trash-alt"></i></button></td>
            `;
        };

        renderTableWithPagination(tbody, paginationEl, publications, pageState.publications, 'publications', renderPublicationRow);
    }

    // =================================================================
    // 5. EVENT LISTENERS
    // =================================================================

    function setupEventListeners() {
        document.querySelectorAll('.sidebar-btn[data-section]').forEach(button => {
            button.addEventListener('click', () => {
                const sectionId = button.dataset.section;
                document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
                document.querySelectorAll('.sidebar-btn').forEach(btn => btn.classList.remove('active'));
                const section = document.getElementById(`section-${sectionId}`);
                if (section) section.classList.add('active');
                button.classList.add('active');
            });
        });

        const formContainer = document.querySelector('.main-content');
        if (formContainer) {
            formContainer.addEventListener('input', () => setUnsavedChanges(true));
            formContainer.addEventListener('change', () => setUnsavedChanges(true));
        }
        window.addEventListener('beforeunload', (event) => {
            if (hasUnsavedChanges) {
                event.preventDefault();
                event.returnValue = '';
            }
        });

        const genderSelect = document.getElementById('gender');
        const genderOtherInput = document.getElementById('gender-other-input');
        if (genderSelect && genderOtherInput) {
            genderSelect.addEventListener('change', () => {
                genderOtherInput.classList.toggle('hidden', genderSelect.value !== 'อื่นๆ');
                if (genderSelect.value === 'อื่นๆ') genderOtherInput.focus();
                else genderOtherInput.value = '';
            });
        }

        const rolesContainer = document.getElementById('roles-checkbox-container');
        if (rolesContainer) {
            rolesContainer.addEventListener('change', (event) => {
                if (event.target.value === 'ผู้ช่วยคณบดี') {
                    const dropdown = document.getElementById('assistant-dean-department');
                    if (dropdown) dropdown.style.display = event.target.checked ? 'block' : 'none';
                    if (!event.target.checked && dropdown) dropdown.value = '';
                }
            });
        }

        setupCurrentPasswordToggle('toggle-current-password', 'current-password', currentAdvisor.password);
        addPasswordToggle('toggle-new-password', 'new-password');
        addPasswordToggle('toggle-confirm-password', 'confirm-password');

        document.getElementById('generate-password-btn')?.addEventListener('click', () => {
            const newPass = generateRandomPassword();
            setInputValue('new-password', newPass);
            setInputValue('confirm-password', newPass);
        });

        document.getElementById('save-all-btn')?.addEventListener('click', handleSaveChanges);
        document.getElementById('add-program-btn')?.addEventListener('click', () => createProgramDropdown());
        document.getElementById('add-publication-btn')?.addEventListener('click', handleAddPublication);

        setupDynamicTableEventListeners();
    }

    function setupDynamicTableEventListeners() {
        const pubTbody = document.getElementById('publications-tbody');
        if (pubTbody) {
            pubTbody.addEventListener('change', (event) => {
                if (event.target.classList.contains('publication-file-input')) {
                    const fileInput = event.target;
                    const fileNameSpan = fileInput.closest('.file-input-wrapper')?.querySelector('.file-name');
                    if (fileNameSpan) {
                        fileNameSpan.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : 'ยังไม่มีไฟล์เลือก';
                    }
                }
            });

            pubTbody.addEventListener('click', (event) => {
                const deleteButton = event.target.closest('.btn-delete, .btn-remove');
                if (deleteButton) {
                    const rowToRemove = deleteButton.closest('tr');
                    const isNew = rowToRemove.classList.contains('new-data-row');
                    if (isNew || confirm('คุณต้องการลบรายการนี้อย่างถาวรใช่หรือไม่?')) {
                        rowToRemove.remove();
                        setUnsavedChanges(true);
                    }
                }
            });
        }

        document.body.addEventListener('click', (event) => {
            if (event.target.classList.contains('pagination-btn')) {
                const button = event.target;
                const dataType = button.dataset.type;
                const direction = button.dataset.direction;

                if (direction === 'next') pageState[dataType]++;
                else if (direction === 'prev') pageState[dataType]--;
                
                if (dataType === 'students') populateAdvisedStudentsCard();
                else if (dataType === 'publications') populatePublicationsCard();
            }
        });
    }

    // =================================================================
    // 6. DATA SAVING
    // =================================================================

    function handleSaveChanges() {
        if (!confirm('คุณต้องการบันทึกการเปลี่ยนแปลงทั้งหมดใช่หรือไม่?')) return;

        const newPassword = getInputValue('new-password');
        if (newPassword && newPassword !== getInputValue('confirm-password')) {
            alert('ข้อผิดพลาด: รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน!');
            document.getElementById('confirm-password')?.focus();
            return;
        }

        const updatedData = gatherDataFromForm();
        
        const advisorIndex = masterData.advisors.findIndex(a => a.advisor_id === currentAdvisor.advisor_id);
        if (advisorIndex === -1) {
            alert('เกิดข้อผิดพลาด: ไม่พบข้อมูลอาจารย์เดิมเพื่ออัปเดต');
            return;
        }

        masterData.advisors[advisorIndex] = updatedData;
        
        localStorage.setItem('savedAdvisors', JSON.stringify(masterData.advisors));
        setUnsavedChanges(false);

        alert('บันทึกข้อมูลอาจารย์สำเร็จ!');
        window.location.reload();
    }

    function gatherDataFromForm() {
        const updatedAdvisor = { ...currentAdvisor };

        updatedAdvisor.prefix_th = getInputValue('prefix-th');
        updatedAdvisor.first_name_th = getInputValue('firstname-th');
        updatedAdvisor.middlename_th = getInputValue('middlename-th');
        updatedAdvisor.last_name_th = getInputValue('lastname-th');
        updatedAdvisor.prefix_en = getInputValue('prefix-en');
        updatedAdvisor.first_name_en = getInputValue('firstname-en');
        updatedAdvisor.middlename_en = getInputValue('middlename-en');
        updatedAdvisor.last_name_en = getInputValue('lastname-en');
        updatedAdvisor.gender = getInputValue('gender') === 'อื่นๆ' 
            ? getInputValue('gender-other-input').trim() || 'อื่นๆ' 
            : getInputValue('gender');
        updatedAdvisor.contact_email = getInputValue('contact-email');
        updatedAdvisor.phone = getInputValue('phone');
        updatedAdvisor.backup_phone = getInputValue('backup-phone');
        
        updatedAdvisor.email = getInputValue('new-email');
        const newPassword = getInputValue('new-password');
        if (newPassword) updatedAdvisor.password = newPassword;
        
        updatedAdvisor.type = getInputValue('advisor-type');
        updatedAdvisor.roles = Array.from(document.querySelectorAll('#roles-checkbox-container input:checked')).map(cb => cb.value);
        if (updatedAdvisor.roles.includes('ผู้ช่วยคณบดี')) {
            updatedAdvisor.assistant_dean_department = getInputValue('assistant-dean-department');
        } else {
            delete updatedAdvisor.assistant_dean_department;
        }
        updatedAdvisor.assigned_programs = Array.from(document.querySelectorAll('.program-select'))
            .map(select => parseInt(select.value))
            .filter(value => !isNaN(value) && value > 0);

        const publications = [];
        document.querySelectorAll('#publications-tbody tr').forEach(row => {
            const inputs = row.querySelectorAll('input');
            const cells = row.querySelectorAll('td');
            if (cells.length < 5) return;

            const title = inputs.length > 0 ? inputs[0].value.trim() : cells[0].textContent.trim();
            if (!title) return;

            publications.push({
                title: title,
                publish_date: inputs.length > 0 ? inputs[1].value : cells[1].textContent.trim(),
                publication_type: inputs.length > 0 ? inputs[2].value : cells[2].textContent.trim(),
                attachment_file: cells[3].querySelector('a')?.getAttribute('href') || ''
            });
        });
        updatedAdvisor.academic_works = publications;

        return updatedAdvisor;
    }

    // =================================================================
    // 7. HELPER & UTILITY FUNCTIONS
    // =================================================================

    function setInputValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
    }

    function getInputValue(id) {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }
    
    function displayError(htmlContent) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) mainContent.innerHTML = htmlContent;
    }

    function setUnsavedChanges(status = true) {
        hasUnsavedChanges = status;
    }

    function populateSelect(elementId, options, selectedValue) {
        const select = document.getElementById(elementId);
        if (!select) return;
        select.innerHTML = '';
        options.forEach(option => {
            const opt = new Option(option, option);
            opt.selected = (option === selectedValue);
            select.add(opt);
        });
    }

    function handleAddPublication() {
        const tbody = document.getElementById('publications-tbody');
        if (!tbody) return;

        tbody.querySelector('td[colspan="5"]')?.parentElement.remove();

        const uniqueId = `file-upload-${Date.now()}`;
        const newRow = document.createElement('tr');
        newRow.className = 'new-data-row';
        newRow.innerHTML = `
            <td><input type="text" class="form-control" placeholder="ชื่อผลงาน"></td>
            <td><input type="date" class="form-control date-picker"></td>
            <td><input type="text" class="form-control" placeholder="ลักษณะการตีพิมพ์"></td>
            <td>
                <div class="file-input-wrapper">
                    <input type="file" class="publication-file-input" id="${uniqueId}">
                    <label for="${uniqueId}" class="btn btn-secondary custom-file-upload">
                        <i class="fas fa-upload"></i> เลือกไฟล์
                    </label>
                    <span class="file-name">ยังไม่มีไฟล์เลือก</span>
                </div>
            </td>
            <td>
                <button type="button" class="btn btn-danger btn-icon btn-remove" title="ลบผลงาน">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(newRow);
        setUnsavedChanges(true);
    }
    
    function createProgramDropdown(selectedProgramId = null) {
        const programContainer = document.getElementById('program-select-container');
        if (!programContainer) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'dynamic-select-wrapper';

        const select = document.createElement('select');
        select.className = 'form-control program-select';
        select.add(new Option("--- กรุณาเลือกหลักสูตร ---", ""));
        programs.forEach(program => {
            const option = new Option(`[${program.degreeLevel}] ${program.name}`, program.id);
            option.selected = (program.id === selectedProgramId);
            select.add(option);
        });

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn-remove-item';
        removeBtn.innerHTML = '<i class="fas fa-times-circle"></i>';
        removeBtn.onclick = () => {
            if (programContainer.querySelectorAll('.dynamic-select-wrapper').length > 1) {
                wrapper.remove();
                setUnsavedChanges(true);
            } else {
                alert("ต้องมีอย่างน้อย 1 หลักสูตร");
            }
        };

        wrapper.appendChild(select);
        wrapper.appendChild(removeBtn);
        programContainer.appendChild(wrapper);
    }

    function renderTableWithPagination(tbodyEl, paginationEl, data, currentPage, dataType, renderRowFunction) {
        tbodyEl.innerHTML = '';
        paginationEl.innerHTML = '';

        if (!data || data.length === 0) {
            const colspan = (dataType === 'students') ? 7 : 5;
            tbodyEl.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center;">ยังไม่มีข้อมูล</td></tr>`;
            return;
        }

        const totalPages = Math.ceil(data.length / itemsPerPage);
        const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

        paginatedData.forEach(item => {
            const tr = document.createElement('tr');
            renderRowFunction(tr, item);
            tbodyEl.appendChild(tr);
        });

        if (totalPages > 1) {
            paginationEl.innerHTML = `
                <button class="pagination-btn" data-type="${dataType}" data-direction="prev" ${currentPage === 1 ? 'disabled' : ''}>&lt; ย้อนกลับ</button>
                <span class="page-info">หน้า ${currentPage} / ${totalPages}</span>
                <button class="pagination-btn" data-type="${dataType}" data-direction="next" ${currentPage >= totalPages ? 'disabled' : ''}>ถัดไป &gt;</button>
            `;
        }
    }

    function generateRandomPassword(length = 12) {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
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
                const isPassword = input.getAttribute('type') === 'password';
                input.setAttribute('type', isPassword ? 'text' : 'password');
                button.querySelector('i')?.classList.toggle('fa-eye', !isPassword);
                button.querySelector('i')?.classList.toggle('fa-eye-slash', isPassword);
            });
        }
    }

    function setupCurrentPasswordToggle(buttonId, inputId, realPassword) {
        const button = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        if (!button || !input) return;

        let isVisible = false;
        input.value = '••••••••';
        button.addEventListener('click', () => {
            isVisible = !isVisible;
            input.type = isVisible ? 'text' : 'password';
            input.value = isVisible ? realPassword : '••••••••';
            button.querySelector('i')?.classList.toggle('fa-eye', !isVisible);
            button.querySelector('i')?.classList.toggle('fa-eye-slash', isVisible);
        });
    }

    // =================================================================
    // 8. INITIALIZE THE PAGE
    // =================================================================
    initializePage();
});