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

    let advisorPageState = {
        filtersInitialized: false,
        filteredData: [],
        currentPage: 1,
        rowsPerPage: 10,
        sortKey: null,      
        sortDirection: null  
    };

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

    const addStudentButton = document.getElementById('add-student-btn');
    if (addStudentButton) {
        addStudentButton.addEventListener('click', () => {
            window.location.href = '/Admin_Page/html_admin/add_student.html'; 
        });
    }

    // =================================================================
    // 3. Data Fetching
    // =================================================================

    async function fetchMasterData() {
        const [studentsData, advisorsData, programsData] = await Promise.all([
            localStorage.getItem('savedStudents') 
                ? Promise.resolve(JSON.parse(localStorage.getItem('savedStudents')))
                : fetch('/data/student.json').then(res => res.json()),
            fetch('/data/advisor.json').then(res => res.json()),
            fetch('/data/structures/programs.json').then(res => res.json())
        ]);
        
        masterData = { 
            students: studentsData,
            advisors: advisorsData,
            programs: programsData
        };

        studentPageState.filteredData = [...masterData.students];
        advisorPageState.filteredData = [...masterData.advisors];
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
    
    function renderOverview() {
        const totalStudents = masterData.students.length;
        const masterStudents = masterData.students.filter(s => s.degree === 'ปริญญาโท').length;
        const phdStudents = masterData.students.filter(s => s.degree === 'ปริญญาเอก').length;

        document.getElementById('overview-student-total').textContent = totalStudents;
        document.getElementById('overview-student-master').textContent = masterStudents;
        document.getElementById('overview-student-phd').textContent = phdStudents;

        const allStaff = masterData.advisors || [];
        const totalStaff = allStaff.length;

        const totalInternalAdvisors = allStaff.filter(a => a.type.includes('อาจารย์ประจำ')).length;
        const totalExternal = allStaff.filter(a => a.type === 'อาจารย์บัณฑิตพิเศษภายนอก').length;
        const totalExecutives = allStaff.filter(a => a.type === 'ผู้บริหารในคณะ').length;

        document.getElementById('overview-staff-total').textContent = totalStaff;
        document.getElementById('overview-advisor-count').textContent = totalInternalAdvisors;
        document.getElementById('overview-external-count').textContent = totalExternal;
        document.getElementById('overview-executive-count').textContent = totalExecutives;

        createPieChart('staff-overview-chart', 
            ['อาจารย์ภายใน', 'อาจารย์ภายนอก', 'ผู้บริหาร'], 
            [totalInternalAdvisors, totalExternal, totalExecutives]);
    }

    function renderStudentsSection() {
        if (!studentPageState.filtersInitialized) {
            populateAdvisorFilter();
            setupStudentFiltersAndSorting();
            studentPageState.filtersInitialized = true;
        }
        applyStudentFiltersAndSorting(); 
    }
    
    function renderAdvisorsSection() {
        if (!advisorPageState.filtersInitialized) {
            populateAdvisorTypeFilter();
            setupAdvisorFilters();
            advisorPageState.filtersInitialized = true;
        }
        applyAdvisorFilters(); 
    }

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
    
    function createPieChart(canvasId, labels, data) {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return;
        
        if (Chart.getChart(canvasId)) {
            Chart.getChart(canvasId).destroy();
        }

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#F47C7C',
                        '#F7A488', 
                        '#FAD02E', 
                        '#82E0AA', 
                        '#74B9FF', 
                        '#A593E0' 
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
                studentPageState.currentPage = 1;
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
        
        processedData.reverse();

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
                    window.location.href = `/Admin_Page/html_admin/manage_detail_user.html?id=${student.student_id}`;
                });
                tr.querySelector('.btn-delete').addEventListener('click', (e) => {
                    e.stopPropagation();

                    const studentIdToDelete = e.currentTarget.dataset.id;

                    if (confirm(`คุณต้องการลบข้อมูลของนักศึกษา ID: ${studentIdToDelete} ใช่หรือไม่?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) {

                        let students = JSON.parse(localStorage.getItem('savedStudents') || '[]');

                        const updatedStudents = students.filter(s => s.student_id !== studentIdToDelete);

                        localStorage.setItem('savedStudents', JSON.stringify(updatedStudents));

                        alert(`ลบข้อมูลนักศึกษา ID: ${studentIdToDelete} เรียบร้อยแล้ว`);
                        window.location.reload();
                    }
                });
                
                studentsTableBody.appendChild(tr);
            });
        }
        updateStudentPagination();
    }

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

    function renderAdvisorsSection() {
    if (!advisorPageState.filtersInitialized) {
        populateAdvisorTypeFilter();
        setupAdvisorFilters();
        setupAdvisorSorting();
        advisorPageState.filtersInitialized = true;
    }
        advisorPageState.filteredData = [...masterData.advisors];
        renderAdvisorsTablePage();
    }

    function populateAdvisorTypeFilter() {
        const advisorTypeFilter = document.getElementById('filter-advisor-type');
        if (!advisorTypeFilter) return;

        const advisorTypes = [
            "อาจารย์ประจำ", "อาจารย์ประจำหลักสูตร", "อาจารย์ผู้รับผิดชอบหลักสูตร",
            "อาจารย์บัณฑิตพิเศษภายใน", "อาจารย์บัณฑิตพิเศษภายนอก", "ผู้บริหาร"
        ];

        advisorTypeFilter.innerHTML = '<option value="">ทุกประเภท</option>';
        advisorTypes.forEach(type => {
            advisorTypeFilter.add(new Option(type, type));
        });
    }

    function setupAdvisorFilters() {
        const nameFilter = document.getElementById('filter-advisor-by-name');
        const emailFilter = document.getElementById('filter-advisor-email');
        const phoneFilter = document.getElementById('filter-advisor-phone');
        const typeFilter = document.getElementById('filter-advisor-type');
        const resetBtn = document.getElementById('reset-advisor-filters-btn');

        const filterInputs = [nameFilter, emailFilter, phoneFilter, typeFilter];

        filterInputs.forEach(input => {
            input.addEventListener('input', () => {
                advisorPageState.currentPage = 1;
                applyAdvisorFilters();
            });
        });

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                nameFilter.value = '';
                emailFilter.value = '';
                phoneFilter.value = '';
                typeFilter.value = '';
                advisorPageState.currentPage = 1;
                advisorPageState.sortKey = null;
                advisorPageState.sortDirection = null;
                applyAdvisorFilters();
            });
        }
    }

    function applyAdvisorFilters() {
        const nameQuery = document.getElementById('filter-advisor-by-name').value.toLowerCase();
        const emailQuery = document.getElementById('filter-advisor-email').value.toLowerCase();
        const phoneQuery = document.getElementById('filter-advisor-phone').value;
        const typeQuery = document.getElementById('filter-advisor-type').value;

        let processedData = masterData.advisors.filter(advisor => {
            const fullName = `${advisor.prefix_th || ''}${advisor.first_name_th || ''} ${advisor.last_name_th || ''}`.toLowerCase();
            const phone = advisor.phone || '';

            const nameMatch = !nameQuery || fullName.includes(nameQuery);
            const emailMatch = !emailQuery || advisor.email.toLowerCase().includes(emailQuery);
            const phoneMatch = !phoneQuery || phone.includes(phoneQuery);
            const typeMatch = !typeQuery || advisor.type === typeQuery;

            return nameMatch && emailMatch && phoneMatch && typeMatch;
        });

            const { sortKey, sortDirection } = advisorPageState;
            if (sortKey && sortDirection) {
            processedData.sort((a, b) => {
                const valA = getAdvisorValueForSort(a, sortKey);
                const valB = getAdvisorValueForSort(b, sortKey);

                const comparison = String(valA).localeCompare(String(valB), 'th');
                
                return sortDirection === 'asc' ? comparison : -comparison;
            });
        }

        advisorPageState.filteredData = processedData;
        renderAdvisorsTablePage();
        updateAdvisorSortHeaders();
    }

    function setupAdvisorSorting() {
    document.querySelectorAll('#section-advisors th.sortable').forEach(headerCell => {
        headerCell.addEventListener('click', () => {
            const sortKey = headerCell.dataset.sortKey;
            
            if (advisorPageState.sortKey === sortKey) {
                if (advisorPageState.sortDirection === 'asc') {
                    advisorPageState.sortDirection = 'desc';
                } else {
                    advisorPageState.sortKey = null;
                    advisorPageState.sortDirection = null;
                }
            } else {
                advisorPageState.sortKey = sortKey;
                advisorPageState.sortDirection = 'asc';
            }
            
            applyAdvisorFilters();
        });
    });
}

    function getAdvisorValueForSort(advisor, key) {
        switch (key) {
            case 'full_name':
                return `${advisor.prefix_th}${advisor.first_name_th} ${advisor.last_name_th}`;
            default:
                return advisor[key] || '';
        }
    }

    function updateAdvisorSortHeaders() {
        document.querySelectorAll('#section-advisors th.sortable').forEach(headerCell => {
            headerCell.classList.remove('asc', 'desc');
            if (headerCell.dataset.sortKey === advisorPageState.sortKey) {
                headerCell.classList.add(advisorPageState.sortDirection);
            }
        });
    }

    function renderAdvisorsTablePage() {
        const advisorsTableBody = document.getElementById('advisors-table-body');
        if (!advisorsTableBody) return;

        advisorsTableBody.innerHTML = '';
        document.getElementById('advisor-count').textContent = `รายชื่ออาจารย์ (${advisorPageState.filteredData.length})`;

        const start = (advisorPageState.currentPage - 1) * advisorPageState.rowsPerPage;
        const end = start + advisorPageState.rowsPerPage;
        const paginatedItems = advisorPageState.filteredData.slice(start, end);

        if (paginatedItems.length === 0) {
            advisorsTableBody.innerHTML = `<tr><td colspan="5" class="text-center">ไม่พบข้อมูลอาจารย์ตามเงื่อนไข</td></tr>`;
        } else {
            paginatedItems.forEach(advisor => {
                const tr = document.createElement('tr');
                tr.classList.add('clickable-row');
                tr.addEventListener('click', () => {
                    if (advisor.email) {
                        window.location.href = `/Admin_Page/html_admin/manage_detail_advisor.html?email=${advisor.email}`;
                    } else {
                        alert('ไม่พบอีเมลของอาจารย์ท่านนี้');
                    }
                });

                tr.innerHTML = `
                    <td>${advisor.prefix_th}${advisor.first_name_th} ${advisor.last_name_th}</td>
                    <td>${advisor.email || '-'}</td>
                    <td>${advisor.phone || '-'}</td>
                    <td>${advisor.type || '-'}</td>
                    <td class="action-cell">
                        <button class="btn-edit" title="แก้ไข" data-id="${advisor.advisor_id}"><i class="fas fa-pencil-alt"></i></button>
                        <button class="btn-delete" title="ลบ" data-id="${advisor.advisor_id}"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;

                const editButton = tr.querySelector('.btn-edit');
                const deleteButton = tr.querySelector('.btn-delete');

                if (editButton) {
                    editButton.addEventListener('click', (e) => {
                        e.stopPropagation(); 
                        const advisorId = e.currentTarget.dataset.id;
                        alert(`(ตัวอย่าง) กำลังแก้ไขข้อมูลอาจารย์ ID: ${advisorId}`);
                    });
                }

                if (deleteButton) {
                    deleteButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const advisorId = e.currentTarget.dataset.id;
                        if (confirm(`คุณต้องการลบข้อมูลอาจารย์ ID: ${advisorId} ใช่หรือไม่?`)) {
                            alert(`(ตัวอย่าง) กำลังลบข้อมูลอาจารย์ ID: ${advisorId}`);
                        }
                    });
                }
                
                advisorsTableBody.appendChild(tr);
            });
        }
        updateAdvisorPagination();
    }

    function updateAdvisorPagination() {
        const controlsContainer = document.getElementById('pagination-advisors');
        if (!controlsContainer) return;

        const totalPages = Math.ceil(advisorPageState.filteredData.length / advisorPageState.rowsPerPage);
        if (totalPages <= 1) {
            controlsContainer.innerHTML = '';
            return;
        }

        controlsContainer.innerHTML = `
            <span class="page-info">หน้า ${advisorPageState.currentPage} จาก ${totalPages}</span>
            <button class="pagination-btn prev-btn" ${advisorPageState.currentPage === 1 ? 'disabled' : ''}>ก่อนหน้า</button>
            <button class="pagination-btn next-btn" ${advisorPageState.currentPage >= totalPages ? 'disabled' : ''}>ถัดไป</button>
        `;

        controlsContainer.querySelector('.prev-btn').addEventListener('click', () => {
            if (advisorPageState.currentPage > 1) {
                advisorPageState.currentPage--;
                renderAdvisorsTablePage();
            }
        });
        controlsContainer.querySelector('.next-btn').addEventListener('click', () => {
            if (advisorPageState.currentPage < totalPages) {
                advisorPageState.currentPage++;
                renderAdvisorsTablePage();
            }
        });
    }
    // =================================================================
    // 6. Initialize Page
    // =================================================================
    initializePage();
});