// /Admin_Page/js_admin/manage_user.js (Updated with Pagination)

document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // 1. Global State & Element References
    // =================================================================
    
    let masterData = {
        students: [],
        advisors: [],
        programs: [],
        externalProfessors: [],
        executives: []
    };
    
    let studentPageState = {
        filteredData: [],
        sortKey: null,
        sortDirection: null,
        filtersInitialized: false,
        currentPage: 1,      // หน้าปัจจุบัน
        rowsPerPage: 10      // จำนวนรายการต่อหน้า
    };

    let chartInstance = null;
    const studentsTableBody = document.getElementById('students-table-body');
    const advisorsTableBody = document.getElementById('advisors-table-body');

    // =================================================================
    // 2. Main Initializer
    // =================================================================

    async function initializePage() {
        try {
            await fetchMasterData();
            setupSidebarNavigation();
            const lastSection = sessionStorage.getItem('lastActiveUserMgmtSection') || 'students';
            showSection(lastSection);
        } catch (error) {
            console.error("Failed to initialize user management page:", error);
            document.querySelector('.main-content').innerHTML = '<h2>เกิดข้อผิดพลาดในการโหลดข้อมูลหลัก</h2>';
        }
    }

    // =================================================================
    // 3. Data Fetching
    // =================================================================

    async function fetchMasterData() {
        const [students, advisors, programs, externalProfessors, executives] = await Promise.all([
            fetch('/data/student.json').then(res => res.json()),
            fetch('/data/advisor.json').then(res => res.json()),
            fetch('/data/structures/programs.json').then(res => res.json()),
            fetch('/data/external_professor.json').then(res => res.json()),
            fetch('/data/executive.json').then(res => res.json())
        ]);
        
        masterData = { students, advisors, programs, externalProfessors, executives };
        studentPageState.filteredData = [...masterData.students]; // ตั้งค่าข้อมูลเริ่มต้น
    }

    // =================================================================
    // 4. Section Navigation & Rendering
    // =================================================================

    function setupSidebarNavigation() {
        document.querySelectorAll('.sidebar-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                if (e.currentTarget.tagName === 'A') e.preventDefault();
                const sectionId = e.currentTarget.dataset.section;
                if (sectionId) {
                    showSection(sectionId);
                } else if (e.currentTarget.href.includes('home.html')) {
                    window.location.href = e.currentTarget.href;
                }
            });
        });
    }

    function showSection(sectionId) {
        sessionStorage.setItem('lastActiveUserMgmtSection', sectionId);
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
        document.querySelectorAll('.sidebar-btn').forEach(button => button.classList.remove('active'));
        document.getElementById(`section-${sectionId}`)?.classList.add('active');
        document.querySelector(`.sidebar-btn[data-section="${sectionId}"]`)?.classList.add('active');

        switch(sectionId) {
            case 'overview': renderOverview(); break;
            case 'students': renderStudentsSection(); break;
            case 'advisors': renderAdvisorsSection(); break;
        }
    }

    // --- Section Renderers ---
    
    function renderOverview() {
        // --- ส่วนการคำนวณข้อมูลนักศึกษา ---
        const totalStudents = masterData.students.length;
        const masterStudents = masterData.students.filter(s => s.degree === 'ปริญญาโท').length;
        const phdStudents = masterData.students.filter(s => s.degree === 'ปริญญาเอก').length;

        document.getElementById('overview-student-total').textContent = totalStudents;
        document.getElementById('overview-student-master').textContent = masterStudents;
        document.getElementById('overview-student-phd').textContent = phdStudents;

        // --- ส่วนการคำนวณข้อมูลบุคลากร ---
        const totalAdvisors = masterData.advisors.length;
        const totalExternal = masterData.externalProfessors.length;
        const totalExecutives = masterData.executives.length;
        const totalStaff = totalAdvisors + totalExternal + totalExecutives;

        document.getElementById('overview-staff-total').textContent = totalStaff;
        document.getElementById('overview-advisor-count').textContent = totalAdvisors;
        document.getElementById('overview-external-count').textContent = totalExternal;
        document.getElementById('overview-executive-count').textContent = totalExecutives;

        // --- สร้างกราฟวงกลม ---
        createPieChart('student-overview-chart', ['ปริญญาโท', 'ปริญญาเอก'], [masterStudents, phdStudents]);
        createPieChart('staff-overview-chart', ['อาจารย์ภายใน', 'อาจารย์ภายนอก', 'ผู้บริหาร'], [totalAdvisors, totalExternal, totalExecutives]);
    }

    function renderStudentsSection() {
        if (!studentPageState.filtersInitialized) {
            populateAdvisorFilter();
            setupStudentFiltersAndSorting();
            studentPageState.filtersInitialized = true;
        }
        // [แก้ไข] เรียกใช้ฟังก์ชันที่ถูกต้องในการแสดงผลครั้งแรก
        applyStudentFiltersAndSorting(); 
    }
    
    function renderAdvisorsSection() {
        renderAdvisorsTable(masterData.advisors);
        // Add event listeners for advisor filters and buttons
    }

    // [ฟังก์ชันใหม่]
    function updateSortHeaders() {
        document.querySelectorAll('#section-students th.sortable').forEach(headerCell => {
            headerCell.classList.remove('asc', 'desc');
            if (headerCell.dataset.sortKey === studentSortState.key) {
                headerCell.classList.add(studentSortState.direction);
            }
        });
    }

    // =================================================================
    // 5. Component Rendering (Charts & Tables)
    // =================================================================
    
    function renderAdvisorsTable(advisorsToRender) {
         if (!advisorsTableBody) return;
        advisorsTableBody.innerHTML = '';
        
        advisorsToRender.forEach(advisor => {
             const tr = document.createElement('tr');
             const roles = advisor.roles && advisor.roles.length > 0 ? advisor.roles.join(', ') : 'N/A';
             tr.innerHTML = `
                <td>${advisor.prefix_th}${advisor.first_name_th} ${advisor.last_name_th}</td>
                <td>${advisor.email}</td>
                <td>${roles}</td>
                <td class="action-cell">
                    <button class="btn-edit" title="แก้ไข" data-id="${advisor.advisor_id}"><i class="fas fa-pencil-alt"></i></button>
                    <button class="btn-delete" title="ลบ" data-id="${advisor.advisor_id}"><i class="fas fa-trash-alt"></i></button>
                </td>
             `;
             advisorsTableBody.appendChild(tr);
        });
    }
    
    // [ฟังก์ชันใหม่] สำหรับสร้างกราฟวงกลม
    function createPieChart(canvasId, labels, data) {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return;
        
        // ทำลาย instance เก่าของ chart ถ้ามีอยู่
        if (Chart.getChart(canvasId)) {
            Chart.getChart(canvasId).destroy();
        }

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    // --- [ส่วนที่แก้ไข] เปลี่ยนชุดสีใหม่ ---
                    backgroundColor: [
                        '#F47C7C', // ชมพู-แดง อ่อน
                        '#F7A488', // ส้ม-พีช
                        '#FAD02E', // เหลือง
                        '#82E0AA', // เขียวพาสเทล
                        '#74B9FF', // ฟ้า
                        '#A593E0'  // ม่วงพาสเทล
                    ],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }

    function populateAdvisorFilter() {
        const advisorFilter = document.getElementById('filter-advisor-name');
        if (!advisorFilter) return;
        advisorFilter.innerHTML = '<option value="">อาจารย์ทั้งหมด</option>'; 
        masterData.advisors.forEach(advisor => {
            const fullName = `${advisor.prefix_th}${advisor.first_name_th} ${advisor.last_name_th}`.trim();
            advisorFilter.appendChild(new Option(fullName, advisor.advisor_id));
        });
    }

   function setupStudentFiltersAndSorting() {
        const studentIdFilter = document.getElementById('filter-student-id');
        const studentNameFilter = document.getElementById('filter-student-name');
        const studentEmailFilter = document.getElementById('filter-student-email');
        const advisorFilter = document.getElementById('filter-advisor-name');
        const resetBtn = document.getElementById('reset-student-filters-btn');

        [studentIdFilter, studentNameFilter, studentEmailFilter, advisorFilter].forEach(input => {
            input.addEventListener('input', () => {
                studentPageState.currentPage = 1; // กลับไปหน้าแรกเมื่อกรองใหม่
                applyStudentFiltersAndSorting();
            });
        });
        advisorFilter.addEventListener('change', () => {
            studentPageState.currentPage = 1;
            applyStudentFiltersAndSorting();
        });

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                studentIdFilter.value = '';
                studentNameFilter.value = '';
                studentEmailFilter.value = '';
                advisorFilter.value = '';
                studentPageState.sortKey = null;
                studentPageState.sortDirection = null;
                studentPageState.currentPage = 1;
                updateSortHeaders();
                applyStudentFiltersAndSorting();
            });
        }
        
        document.querySelectorAll('#section-students th.sortable').forEach(headerCell => {
            headerCell.addEventListener('click', () => {
                const sortKey = headerCell.dataset.sortKey;
                
                if (studentPageState.sortKey === sortKey) {
                    if (studentPageState.sortDirection === 'asc') {
                        studentPageState.sortDirection = 'desc';
                    } else { 
                        studentPageState.sortKey = null; 
                        studentPageState.sortDirection = null; 
                    }
                } else {
                    studentPageState.sortKey = sortKey;
                    studentPageState.sortDirection = 'asc';
                }
                
                // (บรรทัดที่ตั้งค่า currentPage = 1 ถูกลบออกไปแล้ว)
                
                applyStudentFiltersAndSorting();
            });
        });
    }

    function applyStudentFiltersAndSorting() {
        const studentIdFilter = document.getElementById('filter-student-id');
        const studentNameFilter = document.getElementById('filter-student-name');
        const studentEmailFilter = document.getElementById('filter-student-email');
        const advisorFilter = document.getElementById('filter-advisor-name');

        const idQuery = studentIdFilter.value.toLowerCase();
        const nameQuery = studentNameFilter.value.toLowerCase();
        const emailQuery = studentEmailFilter.value.toLowerCase();
        const advisorId = advisorFilter.value;

        let processedData = masterData.students.filter(student => {
            const fullName = `${student.prefix_th}${student.first_name_th} ${student.last_name_th}`.toLowerCase();
            const idMatch = student.student_id.toLowerCase().includes(idQuery);
            const nameMatch = fullName.includes(nameQuery);
            const emailMatch = student.email.toLowerCase().includes(emailQuery);
            const advisorMatch = !advisorId || student.main_advisor_id === advisorId;
            return idMatch && nameMatch && emailMatch && advisorMatch;
        });

        const { sortKey, sortDirection } = studentPageState;
        if (sortKey && sortDirection) {
            processedData.sort((a, b) => {
                const advisorA = masterData.advisors.find(adv => adv.advisor_id === a.main_advisor_id);
                const advisorB = masterData.advisors.find(adv => adv.advisor_id === b.main_advisor_id);
                const valA = getValueForSort(a, sortKey, advisorA);
                const valB = getValueForSort(b, sortKey, advisorB);
                if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        studentPageState.filteredData = processedData;
        renderStudentsTablePage();
        updateSortHeaders();
    }
    
    function getValueForSort(student, key, advisor) {
        switch (key) {
            case 'full_name': return `${student.first_name_th}${student.last_name_th}`;
            case 'advisor_name': return advisor ? `${advisor.first_name_th}${advisor.last_name_th}` : '';
            default: return student[key] || '';
        }
    }

    function updateSortHeaders() {
        document.querySelectorAll('#section-students th.sortable').forEach(headerCell => {
            headerCell.classList.remove('asc', 'desc');
            if (headerCell.dataset.sortKey === studentPageState.sortKey) {
                headerCell.classList.add(studentPageState.sortDirection);
            }
        });
    }

        function updateSortHeaders() {
        document.querySelectorAll('#section-students th.sortable').forEach(headerCell => {
            headerCell.classList.remove('asc', 'desc');
            if (headerCell.dataset.sortKey === studentPageState.sortKey) {
                headerCell.classList.add(studentPageState.sortDirection);
            }
        });
    }
    
    function renderStudentsTablePage() {
        if (!studentsTableBody) return;
        studentsTableBody.innerHTML = '';
        document.getElementById('student-count').textContent = studentPageState.filteredData.length;
        
        const start = (studentPageState.currentPage - 1) * studentPageState.rowsPerPage;
        const end = start + studentPageState.rowsPerPage;
        const paginatedItems = studentPageState.filteredData.slice(start, end);

        if (paginatedItems.length === 0) {
            studentsTableBody.innerHTML = `<tr><td colspan="6" class="text-center">ไม่พบข้อมูลนักศึกษาตามเงื่อนไข</td></tr>`;
        } else {
            paginatedItems.forEach(student => {
                const mainAdvisor = masterData.advisors.find(a => a.advisor_id === student.main_advisor_id);
                const mainAdvisorName = mainAdvisor ? `${mainAdvisor.first_name_th} ${mainAdvisor.last_name_th}`.trim() : '-';
                const tr = document.createElement('tr');
                tr.classList.add('clickable-row');
                tr.onclick = () => {
                    // กำหนด URL ของหน้ารายละเอียด พร้อมส่ง student_id ไปเป็น parameter
                    window.location.href = `/Admin_Page/html_admin/manage_detail_user.html?id=${student.student_id}`;
                };

                tr.innerHTML = `
                    <td>${student.student_id}</td>
                    <td>${student.prefix_th}${student.first_name_th} ${student.last_name_th}</td>
                    <td>${student.email}</td>
                    <td>${student.phone || '-'}</td>
                    <td>${mainAdvisorName}</td>
                    <td class="action-cell">
                        <button class="btn-edit" title="แก้ไข" data-id="${student.student_id}"><i class="fas fa-pencil-alt"></i></button>
                        <button class="btn-delete" title="ลบ" data-id="${student.student_id}"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
                
                tr.querySelector('.btn-edit').addEventListener('click', (e) => {
                    e.stopPropagation();
                    // เมื่อกดปุ่มแก้ไข ก็ให้ไปที่หน้ารายละเอียดเช่นกัน
                    window.location.href = `/Admin_Page/html_admin/manage_detail_user.html?id=${student.student_id}`;
                });
                tr.querySelector('.btn-delete').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`คุณต้องการลบข้อมูลของนักศึกษา ID: ${student.student_id} ใช่หรือไม่?`)) {
                        alert(`(จำลอง) กำลังลบข้อมูลนักศึกษา ID: ${student.student_id}`);
                    }
                });
                
                studentsTableBody.appendChild(tr);
            });
        }
        updateStudentPagination();
    }

    // --- [ฟังก์ชันใหม่] สำหรับสร้างและอัปเดตปุ่ม Pagination ---
    function updateStudentPagination() {
        const controlsContainer = document.getElementById('pagination-students');
        if (!controlsContainer) return;
        const totalPages = Math.ceil(studentPageState.filteredData.length / studentPageState.rowsPerPage);
        if (totalPages <= 1) {
            controlsContainer.innerHTML = '';
            return;
        }
        controlsContainer.innerHTML = `
            <span class="page-info">หน้า ${studentPageState.currentPage} จาก ${totalPages}</span>
            <button class="prev-btn" ${studentPageState.currentPage === 1 ? 'disabled' : ''}>ก่อนหน้า</button>
            <button class="next-btn" ${studentPageState.currentPage >= totalPages ? 'disabled' : ''}>ถัดไป</button>
        `;
        controlsContainer.querySelector('.prev-btn').addEventListener('click', () => {
            if (studentPageState.currentPage > 1) {
                studentPageState.currentPage--;
                renderStudentsTablePage();
            }
        });
        controlsContainer.querySelector('.next-btn').addEventListener('click', () => {
            if (studentPageState.currentPage < totalPages) {
                studentPageState.currentPage++;
                renderStudentsTablePage();
            }
        });
    }

    // =================================================================
    // 6. Initialize Page
    // =================================================================
    initializePage();
});