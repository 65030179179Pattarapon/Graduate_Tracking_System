// /Admin_Page/js_admin/manage_detail_user.js

window.addEventListener('pageshow', function(event) {

    if (event.persisted) {
        console.log('Page was loaded from bfcache. Forcing a reload to ensure data is fresh.');

        window.location.reload();
    }
});

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

    let pageState = {
    publications: 1,
    attachments: 1
    };

    let hasUnsavedChanges = false;

    /**
     * [เพิ่ม] ฟังก์ชันสำหรับตั้งค่าสถานะการเปลี่ยนแปลง
     * @param {boolean} status - true หากมีการเปลี่ยนแปลง, false หากไม่มี
     */
    function setUnsavedChanges(status = true) {
        if (hasUnsavedChanges !== status) {
            console.log(`Unsaved changes status is now: ${status}`); // สำหรับ Debug
            hasUnsavedChanges = status;
        }
    }

        /**
     * แปลงวันที่รูปแบบ ISO String เป็นรูปแบบภาษาไทย (เช่น "18 มีนาคม 2568")
     * @param {string} isoString - วันที่ในรูปแบบ ISO (เช่น "2025-03-18T00:00:00.000Z")
     * @returns {string} วันที่ในรูปแบบภาษาไทย หรือ '-' ถ้าข้อมูลผิดพลาด
     */
    function formatDate(isoString) {
        if (!isoString) return '-';
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Asia/Bangkok' // แนะนำให้ใช้ Time Zone กรุงเทพฯ เพื่อความแม่นยำ
            });
        } catch (error) {
            console.error("Invalid date format:", isoString, error);
            return 'Invalid Date';
        }
    }

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
        try {
            // --- [แก้ไข] ตรวจสอบ localStorage สำหรับข้อมูลนักศึกษา ---
            const savedStudents = localStorage.getItem('savedStudents');
            let studentData;

            if (savedStudents) {
                console.log('Loading student data from localStorage.');
                studentData = JSON.parse(savedStudents);
            } else {
                console.log('Fetching student data from student.json.');
                studentData = await fetch('/data/student.json').then(res => res.json());
            }
            // ----------------------------------------------------

            const [advisors, programs, externalProfessors, pending, approved, rejected] = await Promise.all([
                fetch('/data/advisor.json').then(res => res.json()),
                fetch('/data/structures/programs.json').then(res => res.json()),
                fetch('/data/external_professor.json').then(res => res.json()),
                Promise.resolve(JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]')),
                Promise.resolve(JSON.parse(localStorage.getItem('localStorage_approvedDocs') || '[]')),
                Promise.resolve(JSON.parse(localStorage.getItem('localStorage_rejectedDocs') || '[]'))
            ]);
            
            masterData.students = studentData; // ใช้ข้อมูลที่ดึงมา ไม่ว่าจากแหล่งไหน
            masterData.advisors = advisors;
            masterData.programs = programs;
            masterData.allDocuments = [...pending, ...approved, ...rejected];
            masterData.externalProfessors = externalProfessors;

        } catch (error) {
            console.error("Failed to fetch master data:", error);
            document.querySelector('.main-content').innerHTML = '<h2>เกิดข้อผิดพลาดในการดึงข้อมูลหลัก</h2>';
            throw error; 
        }
    }

    // =================================================================
    // 4. Data Population & Rendering
    // =================================================================

    function populateAllData() {
        populateSidebarProfile();
        renderAccountSection();
        renderProfileSection();
        renderAcademicSection();
        renderThesisSection();
        renderCommitteeSection();
        renderPublicationsDocsSection();
        renderDocumentsHistorySection();
    }

    function populateSidebarProfile() {
        document.getElementById('sidebar-profile-img').src = currentStudent.profile_image_url || '/assets/images/students/placeholder.png';
        document.getElementById('sidebar-fullname').textContent = `${currentStudent.prefix_th}${currentStudent.first_name_th} ${currentStudent.last_name_th}`;
        document.getElementById('sidebar-studentid').textContent = `รหัส: ${currentStudent.student_id}`;
    }
    
    function renderAccountSection() {
        document.getElementById('current-email').value = currentStudent.email;
        document.getElementById('current-password').value = currentStudent.password || '••••••••'; // แสดงรหัสผ่านจำลอง
        document.getElementById('new-email').value = currentStudent.email;
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

        const genderValue = currentStudent.gender;
        const genderOtherInput = document.getElementById('gender-other-input');

        // ตรวจสอบว่าค่า gender ที่มีอยู่เป็นค่ามาตรฐานหรือไม่
        if (['ชาย', 'หญิง', ''].includes(genderValue)) {
            genderSelect.value = genderValue;
            genderOtherInput.classList.add('hidden');
        } else {
            // ถ้าไม่ใช่ ให้ถือว่าเป็น "อื่นๆ"
            genderSelect.value = 'อื่นๆ';
            genderOtherInput.value = genderValue || '';
            genderOtherInput.classList.remove('hidden');
        }
    }
    

    function renderAcademicSection() {
        // --- 1. ดึง Element ทั้งหมด ---
        const degreeSelect = document.getElementById('degree');
        const programSelect = document.getElementById('program');
        const majorSelect = document.getElementById('major'); // << เพิ่ม Element สาขาวิชา
        const statusSelect = document.getElementById('student-status');
        const admitYearSelect = document.getElementById('admit-year');
        const admitSemesterSelect = document.getElementById('admit-semester');
        const admitTypeSelect = document.getElementById('admit-type');
        const studyPlanSelect = document.getElementById('study-plan');

        // --- 2. สร้าง Options สำหรับ Dropdown ต่างๆ (เหมือนเดิม) ---
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

        // --- 3. สร้าง Logic สำหรับ Dropdown ที่ขึ้นต่อกัน ---
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

        const updateDependentDropdowns = () => {
            const selectedDegree = degreeSelect.value;
            
            // อัปเดต Dropdown หลักสูตร
            programSelect.innerHTML = '<option value="">-- เลือกหลักสูตร --</option>';
            if (programsByDegree[selectedDegree]) {
                programsByDegree[selectedDegree].forEach(prog => {
                    programSelect.add(new Option(prog, prog));
                });
            }

            // [ส่วนที่แก้ไข] อัปเดต Dropdown สาขาวิชา
            majorSelect.innerHTML = '<option value="">-- เลือกสาขาวิชา --</option>';
            if (programsByDegree[selectedDegree]) {
                programsByDegree[selectedDegree].forEach(prog => {
                    // ตัดคำย่อข้างหน้าออก (เช่น "วท.ม. ")
                    const majorName = prog.split(' ').slice(1).join(' ');
                    majorSelect.add(new Option(majorName, majorName));
                });
            }
        };
        
        degreeSelect.addEventListener('change', updateDependentDropdowns);

        // --- 4. ตั้งค่าเริ่มต้นจากข้อมูลของนักศึกษา ---
        if (currentStudent) {
            degreeSelect.value = currentStudent.degree;
            updateDependentDropdowns(); // เรียกเพื่อให้ list ของ program และ major ถูกสร้างขึ้น
            
            programSelect.value = masterData.programs.find(p => p.id === currentStudent.program_id)?.name || '';
            majorSelect.value = currentStudent.major || '';
            statusSelect.value = currentStudent.status;
            admitYearSelect.value = currentStudent.admit_year;
            admitSemesterSelect.value = currentStudent.admit_semester;
            admitTypeSelect.value = currentStudent.admit_type || '';
            studyPlanSelect.value = currentStudent.plan;
        }
    }

    function renderThesisSection() {
        // --- 1. ดึง Element ทั้งหมด ---
        const thesisTitleTh = document.getElementById('thesis-title-th');
        const thesisTitleEn = document.getElementById('thesis-title-en');
        const proposalExamDate = document.getElementById('proposal-exam-date');
        const proposalApprovalDate = document.getElementById('proposal-approval-date');
        const finalThesisTitleTh = document.getElementById('final-thesis-title-th');
        const finalThesisTitleEn = document.getElementById('final-thesis-title-en');
        const finalDefenseDate = document.getElementById('final-defense-date');
        const graduationDate = document.getElementById('graduation-date');
        const qualificationStatus = document.getElementById('qualification-status');
        const qualificationDate = document.getElementById('qualification-date');
        const engMasterEntrance = document.getElementById('eng-master-entrance');
        const engMasterExit = document.getElementById('eng-master-exit');
        const engMasterDate = document.getElementById('eng-master-date');
        const engPhdEntrance = document.getElementById('eng-phd-entrance');
        const engPhdExit = document.getElementById('eng-phd-exit');
        const engPhdDate = document.getElementById('eng-phd-date');

        // --- 2. แสดงผลข้อมูลอาจารย์ที่ปรึกษา (รูปแบบแสดงผลอย่างเดียว) ---
        const mainAdvisorDisplay = document.getElementById('main-advisor-display');
        const coAdvisor1Display = document.getElementById('co-advisor1-display');
        const coAdvisor2Display = document.getElementById('co-advisor2-display');

        // ฟังก์ชันช่วยในการค้นหาชื่ออาจารย์และนำไปแสดงผล
        const setAdvisorDisplay = (displayElement, advisorId) => {
            const placeholder = '— ยังไม่ได้เลือกอาจารย์ —';
            if (advisorId && masterData.advisors) {
                const advisor = masterData.advisors.find(a => a.advisor_id === advisorId);
                if (advisor) {
                    displayElement.value = `${advisor.prefix_th}${advisor.first_name_th} ${advisor.last_name_th} (${advisor.email})`;
                } else {
                    displayElement.value = '— ไม่พบข้อมูลอาจารย์ —'; // กรณีหา ID ไม่เจอ
                }
            } else {
                displayElement.value = placeholder;
            }
        };

        // ดึง ID อาจารย์ของนักศึกษาคนปัจจุบัน
        const mainAdvisorId = currentStudent.main_advisor_id;   
        const coAdvisor1Id = currentStudent.co_advisor1_id;

        // หา ID อาจารย์ที่ปรึกษาร่วม 2 จากฟอร์มที่อนุมัติแล้ว
        const approvedForm2 = masterData.allDocuments.find(d => d.student_email === currentStudent.email && d.type === 'ฟอร์ม 2' && d.status === 'อนุมัติแล้ว');
        const coAdvisor2Id = approvedForm2 ? approvedForm2.committee?.co_advisor2_id : null;

        // นำชื่อไปแสดงในช่อง input
        setAdvisorDisplay(mainAdvisorDisplay, mainAdvisorId);
        setAdvisorDisplay(coAdvisor1Display, coAdvisor1Id);
        setAdvisorDisplay(coAdvisor2Display, coAdvisor2Id);

        // --- 3. แสดงผลข้อมูลวิทยานิพนธ์ ---
        thesisTitleTh.value = currentStudent.thesis_title_th || '';
        thesisTitleEn.value = currentStudent.thesis_title_en || '';
        if (currentStudent.proposal_approval_date) {
            proposalApprovalDate.value = formatDate(currentStudent.proposal_approval_date);
        }
        
        finalThesisTitleTh.value = currentStudent.thesis_title_th || ''; // สมมติว่าใช้ชื่อเรื่องเดียวกัน
        finalThesisTitleEn.value = currentStudent.thesis_title_en || '';
        if (currentStudent.graduation_date) {
            graduationDate.value = formatDate(currentStudent.graduation_date);
        }

        // --- 4. สร้าง Options และแสดงผลการสอบอื่นๆ ---
        const passOptions = `
            <option value="">-- ยังไม่มีข้อมูล --</option>
            <option value="ผ่าน">ผ่าน</option>
            <option value="ไม่ผ่าน">ไม่ผ่าน</option>
        `;
        qualificationStatus.innerHTML = passOptions;
        engMasterEntrance.innerHTML = passOptions;
        engMasterExit.innerHTML = passOptions;
        engPhdEntrance.innerHTML = passOptions;
        engPhdExit.innerHTML = passOptions;

    }

    function renderCommitteeSection() {
        // --- 1. ดึง Element ของ Dropdown ทั้งหมด (เหมือนเดิม) ---
        const selects = {
            mainAdvisor: document.getElementById('committee-main-advisor'),
            coAdvisor1: document.getElementById('committee-co-advisor1'),
            coAdvisor2: document.getElementById('committee-co-advisor2'),
            chairman: document.getElementById('committee-chairman'),
            member5: document.getElementById('committee-member5'),
            external: document.getElementById('committee-external'),
            internal: document.getElementById('committee-internal')
        };

        // --- 2. สร้าง Options รายชื่ออาจารย์ "ภายใน" ทั้งหมด (สำหรับช่องส่วนใหญ่) ---
        let advisorOptionsHtml = '<option value="">-- โปรดเลือก --</option>';
        if (masterData.advisors) {
            masterData.advisors.forEach(advisor => {
                const fullNameWithEmail = `${advisor.prefix_th}${advisor.first_name_th} ${advisor.last_name_th} (${advisor.email})`;
                advisorOptionsHtml += `<option value="${advisor.advisor_id}">${fullNameWithEmail}</option>`;
            });
        }

        // --- [เพิ่ม] 2.1 สร้าง Options สำหรับอาจารย์ "ภายนอก" โดยเฉพาะ ---
        let externalProfessorOptionsHtml = '<option value="">-- โปรดเลือก --</option>';
        if (masterData.externalProfessors) {
            masterData.externalProfessors.forEach(prof => {
                // สมมติว่าโครงสร้างข้อมูลเหมือนกับ advisor.json
                const fullName = `${prof.prefix_th}${prof.first_name_th} ${prof.last_name_th}`;
                externalProfessorOptionsHtml += `<option value="${prof.advisor_id}">${fullName}</option>`;
            });
        }

        // --- [แก้ไข] 3. นำรายชื่อไปใส่ใน Dropdown โดยแยกตามประเภท ---
        for (const key in selects) {
            if (selects[key]) {
                // ถ้าเป็น Dropdown ของอาจารย์ภายนอก ให้ใช้ list ของอาจารย์ภายนอก
                if (key === 'external') {
                    selects[key].innerHTML = externalProfessorOptionsHtml;
                } else {
                // ถ้าเป็นช่องอื่นๆ ให้ใช้ list ของอาจารย์ภายในตามปกติ
                    selects[key].innerHTML = advisorOptionsHtml;
                }
            }
        }

        // --- 4. ตั้งค่าที่ถูกเลือกไว้แล้วสำหรับ "อาจารย์ที่ปรึกษา" ---
        if (currentStudent.main_advisor_id) {
            selects.mainAdvisor.value = currentStudent.main_advisor_id;
        }
        if (currentStudent.co_advisor1_id) {
            selects.coAdvisor1.value = currentStudent.co_advisor1_id;
        }

        // --- 5. ค้นหาข้อมูลจากฟอร์มที่อนุมัติแล้วเพื่อตั้งค่า "คณะกรรมการสอบ" ---
        // หาจากฟอร์ม 6 (สอบจบ) ก่อน ถ้าไม่เจอก็หาจากฟอร์ม 2 (สอบหัวข้อ)
        const approvedForm = masterData.allDocuments.find(d =>
            d.student_email === currentStudent.email &&
            (d.type === 'ฟอร์ม 6' || d.type === 'ฟอร์ม 2') &&
            d.status === 'อนุมัติแล้ว'
        );

        if (approvedForm && approvedForm.committee) {
            const committee = approvedForm.committee;
            // ตั้งค่าอาจารย์ที่ปรึกษาร่วม 2 (อาจมีในฟอร์ม)
            if (committee.co_advisor2_id) {
                selects.coAdvisor2.value = committee.co_advisor2_id;
            }
            // ตั้งค่าคณะกรรมการสอบ
            if (committee.chairman_id) {
                selects.chairman.value = committee.chairman_id;
            }
            if (committee.member5_id) {
                selects.member5.value = committee.member5_id;
            }
            if (committee.external_id) {
                selects.external.value = committee.external_id;
            }
            if (committee.internal_id) {
                selects.internal.value = committee.internal_id;
            }
        }
    }

    function renderPublicationsDocsSection() {
        // --- ดึงข้อมูลและ Element ที่จำเป็น ---
        const publications = currentStudent.publications || [];
        const attachments = currentStudent.attachments || [];
        const itemsPerPage = 5;

        // [แก้ไข] เปลี่ยนเป้าหมายเป็น tbody และ pagination
        const pubTbody = document.getElementById('publications-tbody');
        const pubPagination = document.getElementById('publications-pagination');
        const attachTbody = document.getElementById('attachments-tbody');
        const attachPagination = document.getElementById('attachments-pagination');

        /**
         * [ปรับปรุงใหม่] ฟังก์ชันสำหรับสร้าง "แถวข้อมูล" และปุ่มเปลี่ยนหน้า
         * @param {HTMLElement} tbodyEl - Container ของแถวข้อมูล (tbody)
         * @param {HTMLElement} paginationEl - Container ของปุ่มเปลี่ยนหน้า
         * @param {Array} data - ข้อมูลทั้งหมด
         * @param {number} currentPage - หน้าปัจจุบัน
         * @param {string} dataType - ประเภทข้อมูล ('publications' หรือ 'attachments')
         */
        const renderTableRows = (tbodyEl, paginationEl, data, currentPage, dataType) => {
            tbodyEl.innerHTML = ''; // เคลียร์เฉพาะข้อมูลเก่าใน tbody
            paginationEl.innerHTML = '';

            const columns = dataType === 'publications' ? 4 : 3;
            const message = dataType === 'publications' ? 'ยังไม่มีข้อมูลผลงานตีพิมพ์' : 'ยังไม่มีเอกสารแนบ';

            // [ปรับปรุง] การแสดงผลเมื่อไม่มีข้อมูล
            if (data.length === 0) {
                tbodyEl.innerHTML = `<tr><td colspan="${columns}" class="text-muted text-center" style="padding: 20px;">${message}</td></tr>`;
                return;
            }

            // --- 1. สร้างตาราง ---
            const totalPages = Math.ceil(data.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedData = data.slice(startIndex, endIndex);

            // [ปรับปรุง] สร้างเฉพาะ HTML ของแถวข้อมูล (tr)
            let tbodyHtml = '';
            paginatedData.forEach(item => {
                tbodyHtml += '<tr>';
                if (dataType === 'publications') {
                    tbodyHtml += `
                        <td>${item.title || '-'}</td>
                        <td>${item.type || '-'}</td>
                        <td><a href="${item.url || '#'}" target="_blank" class="link-primary">ดูเอกสาร</a></td>
                    `;
                } else {
                    tbodyHtml += `
                        <td>${item.name || '-'}</td>
                        <td><a href="${item.url || '#'}" target="_blank" class="link-primary">ดาวน์โหลด</a></td>
                    `;
                }
                tbodyHtml += `
                    <td><button class="btn-icon btn-delete" title="ลบ"><i class="fas fa-trash-alt"></i></button></td>
                </tr>`;
            });
            tbodyEl.innerHTML = tbodyHtml;

            // --- 2. สร้างปุ่มเปลี่ยนหน้า ---
            if (totalPages > 1) {
                let paginationHtml = `
                    <span class="page-info">หน้า ${currentPage} / ${totalPages}</span>
                    <button class="pagination-btn" id="prev-${dataType}" ${currentPage === 1 ? 'disabled' : ''}>ย้อนกลับ</button>
                    <button class="pagination-btn" id="next-${dataType}" ${currentPage === totalPages ? 'disabled' : ''}>ถัดไป</button>
                `;
                paginationEl.innerHTML = paginationHtml;

                // --- 3. เพิ่ม Event Listener ให้ปุ่ม ---
                document.getElementById(`prev-${dataType}`).addEventListener('click', () => {
                    if (pageState[dataType] > 1) {
                        pageState[dataType]--;
                        renderPublicationsDocsSection(); // Rerender ทั้งหมด
                    }
                });
                document.getElementById(`next-${dataType}`).addEventListener('click', () => {
                    if (pageState[dataType] < totalPages) {
                        pageState[dataType]++;
                        renderPublicationsDocsSection(); // Rerender ทั้งหมด
                    }
                });
            }
        };

        // --- เรียกใช้ฟังก์ชันเพื่อสร้างตารางทั้งสองส่วน ---
        // [แก้ไข] ส่ง tbody element เข้าไปแทน container div
        renderTableRows(pubTbody, pubPagination, publications, pageState.publications, 'publications');
        renderTableRows(attachTbody, attachPagination, attachments, pageState.attachments, 'attachments');
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
        sessionStorage.setItem('userDetail_lastActiveSection', sectionId);

        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
        document.querySelectorAll('.sidebar-btn').forEach(button => button.classList.remove('active'));

        const activeSection = document.getElementById(`section-${sectionId}`);
        if (activeSection) {
            activeSection.classList.add('active');
        }
        
        const activeButton = document.querySelector(`.sidebar-btn[data-section="${sectionId}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        // เรียกใช้ฟังก์ชัน render ตาม section ที่ถูกเลือก
        switch(sectionId) {
            case 'account':
                renderAccountSection();
                break;
            case 'profile':
                renderProfileSection();
                renderAcademicSection();
                break;
            case 'thesis':
                renderThesisSection();
                break;
            case 'committee':
                renderCommitteeSection();
                break;
            case 'publications-docs':
                renderPublicationsDocsSection();
                break;
            case 'history':
                renderDocumentsHistorySection();
                break;
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

    /**
     * [สร้างใหม่] ฟังก์ชันสำหรับรวบรวมข้อมูลล่าสุดทั้งหมดจากฟอร์มบนหน้าเว็บ
     * @returns {Object} อ็อบเจกต์ข้อมูลนักศึกษาที่อัปเดตแล้ว
     */
    function gatherDataFromForm() {
        const updatedData = { ...currentStudent }; // คัดลอกข้อมูลเดิมมาเป็นฐาน

        // === รวบรวมข้อมูลจากฟอร์มทั่วไปและข้อมูลการศึกษา ===
        updatedData.prefix_th = document.getElementById('prefix-th').value;
        updatedData.first_name_th = document.getElementById('firstname-th').value;
        updatedData.last_name_th = document.getElementById('lastname-th').value;
        // ... (เพิ่ม id อื่นๆ จากส่วนข้อมูลทั่วไปและการศึกษาตามที่คุณมี) ...
        updatedData.degree = document.getElementById('degree').value;
        updatedData.program_id = document.getElementById('program').value; // สมมติว่า value คือ id
        updatedData.major = document.getElementById('major').value;
        updatedData.status = document.getElementById('student-status').value;

        // === รวบรวมข้อมูลอาจารย์และคณะกรรมการ ===
        updatedData.main_advisor_id = document.getElementById('committee-main-advisor').value;
        updatedData.co_advisor1_id = document.getElementById('committee-co-advisor1').value;

 
        const publications = [];
        const pubRows = document.querySelectorAll('#publications-tbody tr');
        pubRows.forEach(row => {
            if (row.classList.contains('new-data-row')) { // แถวที่เพิ่มใหม่
                const inputs = row.querySelectorAll('input');
                publications.push({
                    title: inputs[0].value,
                    type: inputs[1].value,
 
                });
            } else {

            }
        });

        updatedData.publications = [...(currentStudent.publications || []), ...publications];


        const attachments = [];
        const attachRows = document.querySelectorAll('#attachments-tbody tr');
        attachRows.forEach(row => {
            if (row.classList.contains('new-data-row')) {
                const inputs = row.querySelectorAll('input');
                attachments.push({
                    name: inputs[0].value,
                });
            }
        });
        updatedData.attachments = [...(currentStudent.attachments || []), ...attachments];

        return updatedData;
    }


    function handleSaveAll() {
        console.log("Starting save process...");

        const updatedStudentData = gatherDataFromForm();

        const studentIndex = masterData.students.findIndex(s => s.student_id === currentStudent.student_id);
        if (studentIndex !== -1) {
            masterData.students[studentIndex] = updatedStudentData;

            localStorage.setItem('savedStudents', JSON.stringify(masterData.students));

            alert('บันทึกข้อมูลเรียบร้อยแล้ว');
            setUnsavedChanges(false);

            location.reload();

        } else {
            alert('เกิดข้อผิดพลาด: ไม่พบข้อมูลนักศึกษาในระบบ');
        }
    }

    function setupEventListeners() {
        const formContainer = document.querySelector('.main-content');
        if (formContainer) {
            formContainer.addEventListener('input', (event) => {
                if (event.target.type !== 'file') {
                    setUnsavedChanges(true);
                }
            });
            formContainer.addEventListener('change', (event) => {
                setUnsavedChanges(true);
            });
        }

        const addPubBtn = document.getElementById('add-publication-btn');
        const addAttachBtn = document.getElementById('add-attachment-btn');
        const pubTbody = document.getElementById('publications-tbody');
        const attachTbody = document.getElementById('attachments-tbody');

        if (addPubBtn && pubTbody) {
            addPubBtn.addEventListener('click', () => {
                setUnsavedChanges(true); 
                const noDataRow = pubTbody.querySelector('.no-data-row');
                if (noDataRow) noDataRow.remove();
                const newRowHtml = `...`; 
                pubTbody.insertAdjacentHTML('beforeend', newRowHtml);
            });
        }

        if (addAttachBtn && attachTbody) {
            addAttachBtn.addEventListener('click', () => {
                setUnsavedChanges(true); 
                const noDataRow = attachTbody.querySelector('.no-data-row');
                if (noDataRow) noDataRow.remove();
                const newRowHtml = `...`; 
                attachTbody.insertAdjacentHTML('beforeend', newRowHtml);
            });
        }

        const handleRowAction = (event) => {
            const cancelButton = event.target.closest('.btn-delete');
            if (cancelButton && cancelButton.closest('.new-data-row')) {
                cancelButton.closest('.new-data-row').remove();

                return; 
            }

            const deleteDataButton = event.target.closest('.btn-delete');
            if (deleteDataButton) {
                setUnsavedChanges(true); 
                console.log('Delete button on existing data clicked!');
                deleteDataButton.closest('tr').style.opacity = '0.5'; 
            }
        };
        
        if (pubTbody) pubTbody.addEventListener('click', handleRowAction);
        if (attachTbody) attachTbody.addEventListener('click', handleRowAction);

        const saveAllBtn = document.getElementById('save-all-btn');
        if (saveAllBtn) {
            saveAllBtn.addEventListener('click', handleSaveAll);
        }

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

                console.log('1. ปุ่ม "สร้าง" ถูกคลิกแล้ว!');

                const newPassword = generateRandomPassword();
                console.log('2. รหัสผ่านที่สุ่มได้คือ:', newPassword);

                console.log('3. Element ช่องกรอกรหัสผ่าน:', { 
                    new: newPasswordField, 
                    confirm: confirmPasswordField 
                });

                try {
                    newPasswordField.value = newPassword;
                    confirmPasswordField.value = newPassword;
                    console.log('4. ตั้งค่ารหัสผ่านในช่อง input สำเร็จ!');
                } catch (error) {
                    console.error('เกิดข้อผิดพลาดตอนตั้งค่ารหัสผ่าน!:', error);
                }
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
                }
            });
        }
    }
    
    const addPubBtn = document.getElementById('add-publication-btn');
    const addAttachBtn = document.getElementById('add-attachment-btn');
    const pubTbody = document.getElementById('publications-tbody');
    const attachTbody = document.getElementById('attachments-tbody');

    if (addPubBtn && pubTbody) {
        addPubBtn.addEventListener('click', () => {

            const noDataRow = pubTbody.querySelector('.no-data-row');
            if (noDataRow) noDataRow.remove();

            const newRowHtml = `
                <tr class="new-data-row">
                    <td><input type="text" placeholder="ระบุชื่อผลงาน"></td>
                    <td><input type="text" placeholder="เช่น TCI กลุ่ม 1, Scopus"></td>
                    <td><input type="file"></td>
                    <td>
                        <button class="btn-icon btn-delete" title="ยกเลิกการเพิ่ม">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;

            pubTbody.insertAdjacentHTML('beforeend', newRowHtml);
        });
    }

    if (addAttachBtn && attachTbody) {
        addAttachBtn.addEventListener('click', () => {
            const noDataRow = attachTbody.querySelector('.no-data-row');
            if (noDataRow) noDataRow.remove();

            const newRowHtml = `
                <tr class="new-data-row">
                    <td><input type="text" placeholder="ระบุชื่อเรื่อง"></td>
                    <td><input type="file"></td>
                    <td>
                        <button class="btn-icon btn-delete" title="ยกเลิกการเพิ่ม">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
            attachTbody.insertAdjacentHTML('beforeend', newRowHtml);
        });
    }

    const handleCancelAdd = (event) => {
        const deleteButton = event.target.closest('.btn-delete');
        if (deleteButton) {
            const rowToRemove = deleteButton.closest('.new-data-row');
            if (rowToRemove) {
                rowToRemove.remove();
            }
        }
    };

    if(pubTbody) pubTbody.addEventListener('click', handleCancelAdd);
    if(attachTbody) attachTbody.addEventListener('click', handleCancelAdd);

    window.addEventListener('beforeunload', (event) => {
        if (hasUnsavedChanges) {
            event.preventDefault();
            event.returnValue = '';
        }
    });

    // =================================================================
    // 6. Initialize Page
    // =================================================================
    initializePage();
});