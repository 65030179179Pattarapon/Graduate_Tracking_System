// /Admin_Page/js_admin/home.js (Updated with External Advisor Logic)

// =================================================================
// ภาค 1: Global State & Configuration
// =================================================================
let masterDataCache = {
    students: [],
    advisors: [],
    programs: [],
    departments: [],
};

const pageState = {
    pendingReview: { 
        fullData: [], 
        filteredData: [], 
        currentPage: 1, 
        rowsPerPage: 10 
    },
    pendingAdvisor: { 
        fullData: { waiting: [], processed: [] }, 
        filteredData: [], 
        currentPage: 1, 
        rowsPerPage: 10, 
        currentTab: 'waiting'
    },
    pendingExternal: { 
        fullData: { waiting: [], processed: [] }, 
        filteredData: [], 
        currentPage: 1, 
        rowsPerPage: 10, 
        currentTab: 'external-waiting'
    },
    pendingExecutive: { 
        fullData: { waiting: [], processed: [] }, 
        filteredData: [], 
        currentPage: 1, 
        rowsPerPage: 10, 
        currentTab: 'executive-waiting'
    },
    allDocuments: { 
        fullData: [], 
        filteredData: [], 
        currentPage: 1, 
        rowsPerPage: 10 
    }
};


// =================================================================
// ภาค 2: Helper Functions
// =================================================================
function formatDate(isoString) {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (error) {
        return 'N/A';
    }
}

function goBack() {
    // ใช้ history.back() เพื่อกลับไปยังหน้าที่แล้วในประวัติการเข้าชม
    window.history.back();
}

// =================================================================
// ภาค 3: Navigation
// =================================================================
function viewDocumentDetail(docId, docType) {
    const detailPageUrl = `/Admin_Page/html_admin/document_detail.html?id=${encodeURIComponent(docId)}&type=${encodeURIComponent(docType || 'unknown')}`;
    window.location.href = detailPageUrl;
}

function viewStudentDetail(studentId) {
    const detailPageUrl = `/Admin_Page/html_admin/student_detail.html?id=${encodeURIComponent(studentId)}`;
    window.location.href = detailPageUrl;
}


// =================================================================
// ภาค 4: Main Application Logic
// =================================================================

/**
 * สลับการแสดงผลของแต่ละ Section ในหน้าหลัก
 * @param {string} sectionId - ID ของ section ที่จะแสดง (เช่น 'dashboard', 'pending-review')
 */
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.sidebar-btn').forEach(button => {
        button.classList.remove('active');
    });

    const activeSection = document.getElementById(`section-${sectionId}`);
    const activeButton = document.querySelector(`.sidebar-btn[data-section="${sectionId}"]`);
    
    if (activeSection) {
        activeSection.classList.add('active');
    }
    if (activeButton) {
        activeButton.classList.add('active');
    }

    // โหลดข้อมูลสำหรับ section ที่ถูกเลือก
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'pending-review':
            loadPendingReviewData();
            break;
        case 'pending-advisor':
            loadAdvisorApprovalData();
            break;
        case 'pending-external':
            loadExternalApprovalData();
            break;
        case 'pending-executive':
            loadExecutiveApprovalData();
            break;
        case 'all-documents':
            loadAllDocumentsData();
            break;
    }
}

/**
 * ดึงข้อมูลหลัก (Master Data) จากไฟล์ JSON มาเก็บไว้ใน Cache
 */
async function fetchAndCacheMasterData() {
    try {
        const [students, advisors, programs, departments] = await Promise.all([
            fetch("/data/student.json").then(res => res.json()),
            fetch("/data/advisor.json").then(res => res.json()),
            fetch("/data/structures/programs.json").then(res => res.json()),
            fetch("/data/structures/departments.json").then(res => res.json())
        ]);
        masterDataCache = { students, advisors, programs, departments };
    } catch (error) {
        console.error("Failed to fetch master data:", error);
    }
}

/**
 * ดึงและแสดงข้อมูลสำหรับ Section "เอกสารรอตรวจ"
 */
async function loadPendingReviewData() {
    try {
        const pendingDocs = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
        
        // อัปเดต Stat Cards ของหน้านี้
        document.getElementById('pending-total-count').textContent = pendingDocs.length;
        document.getElementById('pending-today-count').textContent = pendingDocs.filter(d => new Date(d.submitted_date).toDateString() === new Date().toDateString()).length;
        document.getElementById('pending-resubmitted-count').textContent = pendingDocs.filter(d => d.status === 'แก้ไขแล้วส่งกลับ').length;
        
        // เก็บข้อมูลและแสดงผลหน้าแรกของตาราง
        pageState.pendingReview.fullData = pendingDocs;
        pageState.pendingReview.filteredData = pendingDocs;
        displayPendingReviewPage(1);
        
    } catch (error) {
        console.error("Error loading pending review data:", error);
    }
}

/**
 * ฟังก์ชันเริ่มต้นการทำงานทั้งหมดของหน้า
 */
async function initializeApp() {
    await fetchAndCacheMasterData();
    
    // --- Setup Sidebar buttons ---
    document.querySelectorAll('.sidebar-btn').forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.getAttribute('data-section');
            showSection(sectionId);
        });
    });
    
    // --- โหลดข้อมูลสำหรับแต่ละ Section มาเตรียมไว้ ---
    const pendingDocs = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
    pageState.pendingReview.fullData = pendingDocs;
    pageState.pendingReview.filteredData = pendingDocs;
    setupPendingReviewFilters();
    
    // (ในระบบจริง ข้อมูลส่วนนี้จะมาจากฐานข้อมูล ไม่ใช่ localStorage ทั้งหมด)
    pageState.pendingAdvisor.fullData = { waiting: [], processed: [] };
    pageState.pendingAdvisor.filteredData = [];
    setupAdvisorApprovalFilters();
    setupExternalApprovalFilters();
    setupExecutiveApprovalFilters();
    setupAllDocumentsFilters();

    // ซ่อน Filter ไว้เป็นค่าเริ่มต้น
    const filterBody = document.getElementById('advanced-filter-body');
    const toggleBtn = document.getElementById('toggle-filter-btn');
    if (filterBody && toggleBtn) {
        filterBody.classList.add('hidden');
        toggleBtn.classList.add('collapsed');
        toggleBtn.textContent = 'แสดง';
    }

    // --- แสดงหน้า Dashboard เป็นหน้าแรก ---
    showSection('dashboard');
}


// =================================================================
// ภาค 5: Dashboard Logic
// =================================================================

function loadDashboardData() {
    const pendingDocs = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
    const approvedDocs = JSON.parse(localStorage.getItem('localStorage_approvedDocs') || '[]');
    const rejectedDocs = JSON.parse(localStorage.getItem('localStorage_rejectedDocs') || '[]');

    document.getElementById('stat-pending-admin').textContent = pendingDocs.filter(d => d.status === 'รอตรวจ').length;
    document.getElementById('stat-total-docs').textContent = pendingDocs.length + approvedDocs.length + rejectedDocs.length;
    
    // (Placeholders for other stats - จะถูกแทนที่ด้วย Logic จริงในอนาคต)
    document.getElementById('stat-waiting-advisor').textContent = "0";
    document.getElementById('stat-approved-advisor').textContent = "0";
    document.getElementById('stat-waiting-external').textContent = "0";
    document.getElementById('stat-approved-external').textContent = "0";
    document.getElementById('stat-waiting-executive').textContent = "0";
    document.getElementById('stat-approved-executive').textContent = "0";

    const latestTableBody = document.querySelector("#table-dashboard-latest tbody");
    latestTableBody.innerHTML = '';
    const allDocsForLatest = [...pendingDocs, ...approvedDocs, ...rejectedDocs]
        .sort((a, b) => new Date(b.submitted_date) - new Date(a.submitted_date))
        .slice(0, 10);

    if (allDocsForLatest.length === 0) {
        latestTableBody.innerHTML = `<tr><td colspan="4" class="loading-text">ไม่มีเอกสารในระบบ</td></tr>`;
    } else {
        allDocsForLatest.forEach(doc => {
            const student = masterDataCache.students.find(s => s.email === doc.student_email);
            const studentName = student ? `${student.first_name_th} ${student.last_name_th}` : doc.student_email;
            const tr = document.createElement('tr');
            tr.className = 'clickable-row';
            tr.onclick = () => viewDocumentDetail(doc.doc_id, doc.type);
            tr.innerHTML = `
                <td>${doc.title}</td>
                <td>${doc.student_id}</td>
                <td>${studentName}</td>
                <td>${formatDate(doc.submitted_date)}</td>
                <td><span class="status-badge ${doc.status === 'อนุมัติแล้ว' ? 'approved' : 'pending'}">${doc.status}</span></td>
            `;
            latestTableBody.appendChild(tr);
        });
    }
    
    document.getElementById('recent-activity-list').innerHTML = `<li class="loading-text">ยังไม่มีกิจกรรมล่าสุด</li>`;
}


// =================================================================
// ภาค 6: Pending Review Section Logic
// =================================================================

function displayPendingReviewPage(page) {
    const state = pageState.pendingReview;
    state.currentPage = page;

    const tableBody = document.querySelector("#table-pending-review tbody");
    tableBody.innerHTML = '';

    const start = (state.currentPage - 1) * state.rowsPerPage;
    const end = start + state.rowsPerPage;
    const paginatedItems = state.filteredData.slice(start, end);

    if (paginatedItems.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="loading-text">ไม่พบเอกสารตามเงื่อนไข</td></tr>`;
    } else {
        paginatedItems.forEach(doc => {
            const student = masterDataCache.students.find(s => s.email === doc.student_email);
            const studentName = student ? `${student.first_name_th} ${student.last_name_th}` : doc.student_email;
            const tr = document.createElement('tr');
            tr.className = 'clickable-row';
            tr.onclick = () => viewDocumentDetail(doc.doc_id, doc.type);
            tr.innerHTML = `
                <td>${doc.title}</td>
                <td>${doc.student_id}</td>
                <td>${studentName}</td>
                <td>${doc.student_email}</td>
                <td>${formatDate(doc.submitted_date)}</td>
                <td><span class="status-badge pending">${doc.status}</span></td>
            `;
            tableBody.appendChild(tr);
        });
    }
    updatePendingReviewPagination();
}

function updatePendingReviewPagination() {
    const state = pageState.pendingReview;
    const controlsContainer = document.getElementById("pagination-pending-review");
    if (!controlsContainer) return;
    const totalPages = Math.ceil(state.filteredData.length / state.rowsPerPage) || 1;

    controlsContainer.innerHTML = `
        <span class="page-info">หน้า ${state.currentPage} จาก ${totalPages}</span>
        <button class="prev-btn" ${state.currentPage === 1 ? 'disabled' : ''}>ก่อนหน้า</button>
        <button class="next-btn" ${state.currentPage >= totalPages ? 'disabled' : ''}>ถัดไป</button>
    `;
    controlsContainer.querySelector('.prev-btn').onclick = () => displayPendingReviewPage(state.currentPage - 1);
    controlsContainer.querySelector('.next-btn').onclick = () => displayPendingReviewPage(state.currentPage + 1);
}

function setupPendingReviewFilters() {
    const searchInput = document.getElementById('pending-search-input');
    const typeFilter = document.getElementById('pending-type-filter'); // ID ของ dropdown ใหม่

    const applyFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedType = typeFilter.value;

        pageState.pendingReview.filteredData = pageState.pendingReview.fullData.filter(doc => {
            const student = masterDataCache.students.find(s => s.email === doc.student_email);
            const studentName = student ? `${student.first_name_th} ${student.last_name_th}` : '';
            
            // ตรวจสอบประเภทฟอร์ม
            const typeMatch = (selectedType === 'all') || (doc.type === selectedType);

            // ตรวจสอบข้อความค้นหา
            const searchMatch = !searchTerm || 
                                doc.title.toLowerCase().includes(searchTerm) ||
                                studentName.toLowerCase().includes(searchTerm) ||
                                (doc.student_id && doc.student_id.includes(searchTerm));

            return typeMatch && searchMatch;
        });
        displayPendingReviewPage(1);
    };

    // ผูก Event ให้กับช่องค้นหาและ Dropdown
    searchInput?.addEventListener('input', applyFilters);
    typeFilter?.addEventListener('change', applyFilters);

    // ส่วนของ Stat Cards ยังทำงานเหมือนเดิม
    document.querySelectorAll('#section-pending-review .stat-card-inline').forEach(card => {
        card.addEventListener('click', () => {
            const filterValue = card.dataset.filterValue;
            if (filterValue === 'all') {
                pageState.pendingReview.filteredData = pageState.pendingReview.fullData;
            } else if (filterValue === 'today') {
                pageState.pendingReview.filteredData = pageState.pendingReview.fullData.filter(d => new Date(d.submitted_date).toDateString() === new Date().toDateString());
            } else {
                pageState.pendingReview.filteredData = pageState.pendingReview.fullData.filter(d => d.status === filterValue);
            }
            displayPendingReviewPage(1);
        });
    });
}

// =================================================================
// ภาค 7: Advisor Approval Section Logic (ฉบับแก้ไข)
// =================================================================

function loadAdvisorApprovalData() {
    const waitingData = JSON.parse(localStorage.getItem('localStorage_waitingAdvisorDocs') || '[]');
    const processedData = []; // Placeholder

    pageState.pendingAdvisor.fullData = { waiting: waitingData, processed: processedData };
    pageState.pendingAdvisor.filteredData = waitingData;
    
    document.getElementById('advisor-waiting-count').textContent = waitingData.length;
    document.getElementById('advisor-approved-today-count').textContent = "0";
    document.getElementById('advisor-rejected-today-count').textContent = "0";

    displayAdvisorApprovalPage('waiting', 1);
}

function displayAdvisorApprovalPage(tab, page) {
    pageState.pendingAdvisor.currentTab = tab;
    pageState.pendingAdvisor.currentPage = page;

    // สลับ Active Class ของปุ่ม Tab และเนื้อหา
    document.querySelectorAll('#section-pending-advisor .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('#section-pending-advisor .tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tab}`);
    });

    const dataForTab = pageState.pendingAdvisor.fullData[tab] || [];
    pageState.pendingAdvisor.filteredData = dataForTab;

    const tableBody = document.querySelector(`#table-advisor-${tab} tbody`);
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const start = (page - 1) * pageState.pendingAdvisor.rowsPerPage;
    const end = start + pageState.pendingAdvisor.rowsPerPage;
    const paginatedItems = pageState.pendingAdvisor.filteredData.slice(start, end);
    
    if (paginatedItems.length === 0) {
        const colspan = (tab === 'waiting') ? 5 : 6;
        tableBody.innerHTML = `<tr><td colspan="${colspan}" class="loading-text">ไม่มีข้อมูลในรายการนี้</td></tr>`;
    } else {
        paginatedItems.forEach(doc => {
            const student = masterDataCache.students.find(s => s.email === doc.student_email);
            const studentName = student ? `${student.first_name_th} ${student.last_name_th}` : doc.student_email;
            
            const tr = document.createElement('tr');
            tr.className = 'clickable-row';
            tr.onclick = () => viewDocumentDetail(doc.doc_id, doc.type);

            if (tab === 'waiting') {
                const mainAdvisor = masterDataCache.advisors.find(a => a.advisor_id === doc.selected_main_advisor_id);
                const coAdvisor = masterDataCache.advisors.find(a => a.advisor_id === doc.selected_co_advisor_id);
                const waitingFor = [mainAdvisor, coAdvisor].filter(Boolean).map(a => a.first_name_th).join(', ');
                
                tr.innerHTML = `
                    <td>${doc.title}</td>
                    <td>${doc.student_id}</td>
                    <td>${studentName}</td>
                    <td>${doc.student_email}</td>
                    <td>${waitingFor || 'N/A'}</td>
                    <td>${formatDate(doc.last_action_date)}</td>
                `;
            } else { // processed tab
                const advisor = masterDataCache.advisors.find(a => a.advisor_id === doc.processor_id);
                const advisorName = advisor ? `${advisor.prefix_th}${advisor.first_name_th} ${advisor.last_name_th}`.trim() : 'N/A';
                const statusClass = doc.status.includes('อนุมัติ') ? 'approved' : 'rejected';

                tr.innerHTML = `
                    <td>${doc.title}</td>
                    <td>${doc.student_id}</td>
                    <td>${studentName}</td>
                    <td>${advisorName}</td>
                    <td><span class="status-badge ${statusClass}">${doc.status}</span></td>
                    <td>${formatDate(doc.processed_date)}</td>
                `;
            }
            tableBody.appendChild(tr);
        });
    }
    updateAdvisorApprovalPagination();
}

function updateAdvisorApprovalPagination() {
    const state = pageState.pendingAdvisor;
    const controlsContainer = document.getElementById(`pagination-advisor-${state.currentTab}`);
    if (!controlsContainer) return;
    const totalPages = Math.ceil(state.filteredData.length / state.rowsPerPage) || 1;
    
    controlsContainer.innerHTML = `
        <span class="page-info">หน้า ${state.currentPage} จาก ${totalPages}</span>
        <button class="prev-btn" ${state.currentPage === 1 ? 'disabled' : ''}>ก่อนหน้า</button>
        <button class="next-btn" ${state.currentPage >= totalPages ? 'disabled' : ''}>ถัดไป</button>
    `;
    controlsContainer.querySelector('.prev-btn').onclick = () => displayAdvisorApprovalPage(state.currentTab, state.currentPage - 1);
    controlsContainer.querySelector('.next-btn').onclick = () => displayAdvisorApprovalPage(state.currentTab, state.currentPage + 1);
}

function setupAdvisorApprovalFilters() {
    // Setup Tab Buttons
    document.querySelectorAll('#section-pending-advisor .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            displayAdvisorApprovalPage(tabId, 1);
        });
    });

    // Setup Search & Filter Inputs
    const waitingSearch = document.getElementById('advisor-waiting-search');
    const processedSearch = document.getElementById('advisor-processed-search');
    const processedStatusFilter = document.getElementById('advisor-processed-filter-status');
    const processedTypeFilter = document.getElementById('advisor-processed-filter-type');

    const applyFilter = () => {
        const state = pageState.pendingAdvisor;
        const tab = state.currentTab;
        const sourceData = state.fullData[tab] || [];

        let searchTerm = '';
        let typeFilter = 'all';
        let statusFilter = 'all';

        if (tab === 'waiting') {
            searchTerm = waitingSearch.value.toLowerCase();
            typeFilter = document.getElementById('advisor-waiting-filter-type').value;
        } else { // processed
            searchTerm = processedSearch.value.toLowerCase();
            typeFilter = processedTypeFilter.value;
            statusFilter = processedStatusFilter.value;
        }

        state.filteredData = sourceData.filter(doc => {
            const student = masterDataCache.students.find(s => s.email === doc.student_email);
            const studentName = student ? `${student.first_name_th} ${student.last_name_th}`.toLowerCase() : '';
            
            // ตรวจสอบเงื่อนไขทั้งหมด
            const searchMatch = !searchTerm || doc.title.toLowerCase().includes(searchTerm) || studentName.includes(searchTerm);
            const statusMatch = (statusFilter === 'all') || doc.status === statusFilter;
            const typeMatch = (typeFilter === 'all') || doc.type === typeFilter;

            return searchMatch && statusMatch && typeMatch;
        });
        displayAdvisorApprovalPage(tab, 1);
    };

    waitingSearch?.addEventListener('input', applyFilter);
    document.getElementById('advisor-waiting-filter-type')?.addEventListener('change', applyFilter);
    processedSearch?.addEventListener('input', applyFilter);
    processedStatusFilter?.addEventListener('change', applyFilter);
    processedTypeFilter?.addEventListener('change', applyFilter);
}

// =================================================================
// ภาค 8: External Professor Approval Section Logic (ส่วนที่เพิ่มเติมและแก้ไข)
// =================================================================

function loadExternalApprovalData() {
    // ในระบบจริง ข้อมูลส่วนนี้จะมาจากฐานข้อมูลที่มีสถานะ 'รออาจารย์ภายนอกอนุมัติ'
    const waitingData = []; // Placeholder
    const processedData = []; // Placeholder
    
    pageState.pendingExternal.fullData = { waiting: waitingData, processed: processedData };

    document.getElementById('external-waiting-count').textContent = waitingData.length;
    document.getElementById('external-approved-today-count').textContent = "0";
    document.getElementById('external-rejected-today-count').textContent = "0";

    displayExternalApprovalPage('external-waiting', 1);
}

function displayExternalApprovalPage(tab, page) {
    pageState.pendingExternal.currentTab = tab;
    pageState.pendingExternal.currentPage = page;

    // สลับ Active Class ของปุ่ม Tab
    document.querySelectorAll('#section-pending-external .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    // สลับการแสดงผลของเนื้อหา Tab
    document.querySelectorAll('#section-pending-external .tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tab}`);
    });

    const dataForTab = pageState.pendingExternal.fullData[tab.replace('external-', '')] || [];
    pageState.pendingExternal.filteredData = dataForTab;

    const tableBody = document.querySelector(`#table-${tab} tbody`);
    tableBody.innerHTML = '';

    const start = (page - 1) * pageState.pendingExternal.rowsPerPage;
    const end = start + pageState.pendingExternal.rowsPerPage;
    const paginatedItems = pageState.pendingExternal.filteredData.slice(start, end);
    
    if (paginatedItems.length === 0) {
        const colspan = (tab === 'external-waiting') ? 5 : 6;
        tableBody.innerHTML = `<tr><td colspan="${colspan}" class="loading-text">ไม่มีข้อมูลในรายการนี้</td></tr>`;
    } else {
        paginatedItems.forEach(doc => {
            // (เพิ่ม Logic สร้างแถวในตารางที่นี่)
        });
    }
    updateExternalApprovalPagination();
}

function updateExternalApprovalPagination() {
    const state = pageState.pendingExternal;
    const controlsContainer = document.getElementById(`pagination-${state.currentTab}`);
    if (!controlsContainer) return;

    const totalPages = Math.ceil(state.filteredData.length / state.rowsPerPage) || 1;
    
    controlsContainer.innerHTML = `
        <span class="page-info">หน้า ${state.currentPage} จาก ${totalPages}</span>
        <button class="prev-btn" ${state.currentPage === 1 ? 'disabled' : ''}>ก่อนหน้า</button>
        <button class="next-btn" ${state.currentPage >= totalPages ? 'disabled' : ''}>ถัดไป</button>
    `;

    controlsContainer.querySelector('.prev-btn').onclick = () => displayExternalApprovalPage(state.currentTab, state.currentPage - 1);
    controlsContainer.querySelector('.next-btn').onclick = () => displayExternalApprovalPage(state.currentTab, state.currentPage + 1);
}

function setupExternalApprovalFilters() {
    // Setup Tab Buttons
    document.querySelectorAll('#section-pending-external .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            displayExternalApprovalPage(tabId, 1);
        });
    });

    // Setup Search & Filter Inputs
    const waitingSearch = document.getElementById('external-waiting-search');
    const processedSearch = document.getElementById('external-processed-search');
    const processedStatusFilter = document.getElementById('external-processed-filter-status');
    const processedTypeFilter = document.getElementById('external-processed-filter-type'); // <<< ตัวแปรใหม่

    const applyFilter = () => {
        const state = pageState.pendingExternal;
        const tab = state.currentTab;
        const sourceData = state.fullData[tab.replace('external-', '')] || [];

        const searchTerm = (tab === 'external-waiting' ? waitingSearch.value : processedSearch.value).toLowerCase();
        const statusFilter = (tab === 'external-processed') ? processedStatusFilter.value : 'all';
        const typeFilterValue = (tab === 'external-processed') ? processedTypeFilter.value : 'all'; // <<< ดึงค่าจาก Dropdown ใหม่

        state.filteredData = sourceData.filter(doc => {
            const student = masterDataCache.students.find(s => s.email === doc.student_email);
            const studentName = student ? `${student.first_name_th} ${student.last_name_th}`.toLowerCase() : '';
            const externalName = (doc.external_approver_name || '').toLowerCase();
            
            // ตรวจสอบเงื่อนไขทั้งหมด
            const searchMatch = !searchTerm || doc.title.toLowerCase().includes(searchTerm) || studentName.includes(searchTerm) || externalName.includes(searchTerm);
            const statusMatch = (statusFilter === 'all') || doc.status === statusFilter;
            const typeMatch = (typeFilterValue === 'all') || doc.type === typeFilterValue; // <<< ตรวจสอบเงื่อนไขใหม่

            return searchMatch && statusMatch && typeMatch;
        });
        displayExternalApprovalPage(tab, 1);
    };

    waitingSearch?.addEventListener('input', applyFilter);
    processedSearch?.addEventListener('input', applyFilter);
    processedStatusFilter?.addEventListener('change', applyFilter);
    processedTypeFilter?.addEventListener('change', applyFilter); // <<< ผูก Event ให้ Dropdown ใหม่
}

// =================================================================
// ภาค 9: Executive Approval Section Logic
// =================================================================

/**
 * โหลดข้อมูลเริ่มต้นสำหรับ Section "รอผู้บริหารอนุมัติ"
 */
function loadExecutiveApprovalData() {
    // ในระบบจริง ข้อมูลส่วนนี้จะมาจากฐานข้อมูล
    const waitingData = []; // Placeholder
    const processedData = []; // Placeholder
    
    pageState.pendingExecutive.fullData = { waiting: waitingData, processed: processedData };

    // Update Stat Cards
    document.getElementById('executive-waiting-count').textContent = waitingData.length;
    document.getElementById('executive-approved-today-count').textContent = "0";
    document.getElementById('executive-rejected-today-count').textContent = "0";

    // แสดงแท็บ "กำลังรออนุมัติ" เป็นค่าเริ่มต้น
    displayExecutiveApprovalPage('executive-waiting', 1);
}

/**
 * แสดงข้อมูลในตารางตามแท็บที่เลือก (รออนุมัติ / ดำเนินการแล้ว)
 */
function displayExecutiveApprovalPage(tab, page) {
    pageState.pendingExecutive.currentTab = tab;
    pageState.pendingExecutive.currentPage = page;

    // สลับ Active Class ของปุ่ม Tab และเนื้อหา
    document.querySelectorAll('#section-pending-executive .tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
    document.querySelectorAll('#section-pending-executive .tab-content').forEach(content => content.classList.toggle('active', content.id === `tab-${tab}`));

    const dataForTab = pageState.pendingExecutive.fullData[tab.replace('executive-', '')] || [];
    pageState.pendingExecutive.filteredData = dataForTab;

    const tableBody = document.querySelector(`#table-${tab} tbody`);
    tableBody.innerHTML = '';

    const start = (page - 1) * pageState.pendingExecutive.rowsPerPage;
    const end = start + pageState.pendingExecutive.rowsPerPage;
    const paginatedItems = pageState.pendingExecutive.filteredData.slice(start, end);
    
    if (paginatedItems.length === 0) {
        const colspan = (tab === 'executive-waiting') ? 4 : 5;
        tableBody.innerHTML = `<tr><td colspan="${colspan}" class="loading-text">ไม่มีข้อมูลในรายการนี้</td></tr>`;
    } else {
        paginatedItems.forEach(doc => {
            const student = masterDataCache.students.find(s => s.email === doc.student_email);
            const studentName = student ? `${student.first_name_th} ${student.last_name_th}` : doc.student_email;
            const tr = document.createElement('tr');
            tr.className = 'clickable-row';
            tr.onclick = () => viewDocumentDetail(doc.doc_id, doc.type);

            if (tab === 'executive-waiting') {
                tr.innerHTML = `
                    <td>${doc.title}</td>
                    <td>${doc.student_id}</td>
                    <td>${studentName}</td>
                    <td>${formatDate(doc.forwarded_to_executive_date)}</td>
                `;
            } else { // executive-processed
                tr.innerHTML = `
                    <td>${doc.title}</td>
                    <td>${doc.student_id}</td>
                    <td>${studentName}</td>
                    <td><span class="status-badge ${doc.status === 'อนุมัติแล้ว' ? 'approved' : 'rejected'}">${doc.status}</span></td>
                    <td>${formatDate(doc.executive_action_date)}</td>
                `;
            }
            tableBody.appendChild(tr);
        });
    }
    updateExecutiveApprovalPagination();
}

/**
 * อัปเดตปุ่ม Pagination สำหรับหน้า "รอผู้บริหารอนุมัติ"
 */
function updateExecutiveApprovalPagination() {
    const state = pageState.pendingExecutive;
    const controlsContainer = document.getElementById(`pagination-${state.currentTab}`);
    if (!controlsContainer) return;
    const totalPages = Math.ceil(state.filteredData.length / state.rowsPerPage) || 1;
    
    controlsContainer.innerHTML = `
        <span class="page-info">หน้า ${state.currentPage} จาก ${totalPages}</span>
        <button class="prev-btn" ${state.currentPage === 1 ? 'disabled' : ''}>ก่อนหน้า</button>
        <button class="next-btn" ${state.currentPage >= totalPages ? 'disabled' : ''}>ถัดไป</button>
    `;

    controlsContainer.querySelector('.prev-btn').onclick = () => displayExecutiveApprovalPage(state.currentTab, state.currentPage - 1);
    controlsContainer.querySelector('.next-btn').onclick = () => displayExecutiveApprovalPage(state.currentTab, state.currentPage + 1);
}

/**
 * ตั้งค่าการกรองข้อมูลสำหรับหน้า "รอผู้บริหารอนุมัติ"
 */
function setupExecutiveApprovalFilters() {
    // Setup Tab Buttons
    document.querySelectorAll('#section-pending-executive .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            displayExecutiveApprovalPage(tabId, 1);
        });
    });

    // Setup Search & Filter Inputs
    const waitingSearch = document.getElementById('executive-waiting-search');
    const processedSearch = document.getElementById('executive-processed-search');
    const processedStatusFilter = document.getElementById('executive-processed-filter-status');
    const processedTypeFilter = document.getElementById('executive-processed-filter-type'); // <<< ตัวแปรใหม่

    const applyFilter = () => {
        const state = pageState.pendingExecutive;
        const tab = state.currentTab;
        const sourceData = state.fullData[tab.replace('executive-', '')] || [];

        const searchTerm = (tab === 'executive-waiting' ? waitingSearch.value : processedSearch.value).toLowerCase();
        const statusFilter = (tab === 'executive-processed') ? processedStatusFilter.value : 'all';
        const typeFilterValue = (tab === 'executive-processed') ? processedTypeFilter.value : 'all'; // <<< ดึงค่าจาก Dropdown ใหม่

        state.filteredData = sourceData.filter(doc => {
            const student = masterDataCache.students.find(s => s.email === doc.student_email);
            const studentName = student ? `${student.first_name_th} ${student.last_name_th}`.toLowerCase() : '';
            
            // ตรวจสอบเงื่อนไขทั้งหมด
            const searchMatch = !searchTerm || doc.title.toLowerCase().includes(searchTerm) || studentName.includes(searchTerm);
            const statusMatch = (statusFilter === 'all') || doc.status === statusFilter;
            const typeMatch = (typeFilterValue === 'all') || doc.type === typeFilterValue; // <<< ตรวจสอบเงื่อนไขใหม่

            return searchMatch && statusMatch && typeMatch;
        });
        displayExecutiveApprovalPage(tab, 1);
    };

    waitingSearch?.addEventListener('input', applyFilter);
    processedSearch?.addEventListener('input', applyFilter);
    processedStatusFilter?.addEventListener('change', applyFilter);
    processedTypeFilter?.addEventListener('change', applyFilter); // <<< ผูก Event ให้ Dropdown ใหม่
}

// =================================================================
// ภาค 10: All Documents Section Logic
// =================================================================

/** 
 * โหลดข้อมูลเริ่มต้นสำหรับ Section "เอกสารทั้งหมด"
 */
async function loadAllDocumentsData() {
    const pendingDocs = JSON.parse(localStorage.getItem('localStorage_pendingDocs') || '[]');
    const approvedDocs = JSON.parse(localStorage.getItem('localStorage_approvedDocs') || '[]');
    const rejectedDocs = JSON.parse(localStorage.getItem('localStorage_rejectedDocs') || '[]');
    
    pageState.allDocuments.fullData = [...pendingDocs, ...approvedDocs, ...rejectedDocs];
    pageState.allDocuments.filteredData = pageState.allDocuments.fullData;

    document.getElementById('all-docs-count').textContent = `พบ ${pageState.allDocuments.fullData.length} รายการ`;
    displayAllDocumentsPage(1);
}

/**
 * แสดงข้อมูลในตาราง "เอกสารทั้งหมด"
 */
function displayAllDocumentsPage(page) {
    const state = pageState.allDocuments;
    state.currentPage = page;

    const tableBody = document.querySelector("#table-all-documents tbody");
    tableBody.innerHTML = '';

    const start = (state.currentPage - 1) * state.rowsPerPage;
    const end = start + state.rowsPerPage;
    const paginatedItems = state.filteredData.slice(start, end);
    
    if (paginatedItems.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="loading-text">ไม่พบเอกสารตามเงื่อนไข</td></tr>`;
    } else {
        paginatedItems.forEach(doc => {
            const student = masterDataCache.students.find(s => s.email === doc.student_email);
            const studentName = student ? `${student.first_name_th} ${student.last_name_th}` : doc.student_email;
            const tr = document.createElement('tr');
            tr.className = 'clickable-row';
            tr.onclick = () => viewDocumentDetail(doc.doc_id, doc.type);
            tr.innerHTML = `
                <td>${doc.title}</td>
                <td>${doc.type}</td>
                <td>${doc.student_id}</td>
                <td>${studentName}</td>
                <td>${doc.student_email}</td>
                <td><span class="status-badge ${doc.status === 'อนุมัติแล้ว' ? 'approved' : (doc.status === 'ไม่อนุมัติ' ? 'rejected' : 'pending')}">${doc.status}</span></td>
                <td>${formatDate(doc.submitted_date)}</td>
            `;
            tableBody.appendChild(tr);
        });
    }
    updateAllDocumentsPagination();
}

/**
 * อัปเดตปุ่ม Pagination สำหรับหน้า "เอกสารทั้งหมด"
 */
function updateAllDocumentsPagination() {
    const state = pageState.allDocuments;
    const controlsContainer = document.getElementById("pagination-all-documents");
    if (!controlsContainer) return;
    const totalPages = Math.ceil(state.filteredData.length / state.rowsPerPage) || 1;
    
    controlsContainer.innerHTML = `
        <span class="page-info">หน้า ${state.currentPage} จาก ${totalPages}</span>
        <button class="prev-btn" ${state.currentPage === 1 ? 'disabled' : ''}>ก่อนหน้า</button>
        <button class="next-btn" ${state.currentPage >= totalPages ? 'disabled' : ''}>ถัดไป</button>
    `;

    controlsContainer.querySelector('.prev-btn').onclick = () => displayAllDocumentsPage(state.currentPage - 1);
    controlsContainer.querySelector('.next-btn').onclick = () => displayAllDocumentsPage(state.currentPage + 1);
}

/**
 * กรองข้อมูลในตาราง "เอกสารทั้งหมด" ตามเงื่อนไขที่เลือก
 */
function applyAllDocumentsFilters() {
    const state = pageState.allDocuments;
    if (!state) return;

    // ดึงค่าจากทุกช่อง Filter
    const searchTerm = document.getElementById('search-all-input').value.toLowerCase();
    const status = document.getElementById('filter-status-all').value;
    const docType = document.getElementById('filter-type-all').value;
    const program = document.getElementById('filter-program-all').value;
    const dateStart = document.getElementById('filter-date-start').value;
    const dateEnd = document.getElementById('filter-date-end').value;

    state.filteredData = state.fullData.filter(doc => {
        const student = masterDataCache.students.find(s => s.email === doc.student_email);
        const studentName = student ? `${student.first_name_th} ${student.last_name_th}`.toLowerCase() : '';
        const programName = student ? masterDataCache.programs.find(p => p.id === student.program_id)?.name : '';

        // ตรวจสอบแต่ละเงื่อนไข
        if (status && doc.status !== status) return false;
        if (docType && doc.type !== docType) return false;
        if (program && programName !== program) return false;
        if (dateStart && new Date(doc.submitted_date) < new Date(dateStart)) return false;
        if (dateEnd && new Date(doc.submitted_date) > new Date(dateEnd)) return false;
        
        // ตรวจสอบ Search Term
        if (searchTerm && !(
            doc.title.toLowerCase().includes(searchTerm) ||
            studentName.includes(searchTerm) ||
            doc.student_id.includes(searchTerm) ||
            doc.student_email.includes(searchTerm)
        )) {
            return false;
        }

        return true;
    });

    displayAllDocumentsPage(1);
    document.getElementById('all-docs-count').textContent = `พบ ${state.filteredData.length} รายการ`;
}

/**
 * ตั้งค่าการกรองข้อมูลสำหรับหน้า "เอกสารทั้งหมด"
 */
function setupAllDocumentsFilters() {
    const applyBtn = document.getElementById('apply-filters-btn');
    const resetBtn = document.getElementById('reset-filters-btn');
    const searchInput = document.getElementById('search-all-input');
    
    const applyFilters = () => {
        const state = pageState.allDocuments;
        const searchTerm = searchInput.value.toLowerCase();
        // (เพิ่ม Logic การกรองจาก Dropdown และ Date ที่นี่)
        
        state.filteredData = state.fullData.filter(doc => {
            const student = masterDataCache.students.find(s => s.email === doc.student_email);
            const studentName = student ? `${student.first_name_th} ${student.last_name_th}` : '';
            return doc.title.toLowerCase().includes(searchTerm) ||
                   studentName.toLowerCase().includes(searchTerm);
        });
        displayAllDocumentsPage(1);
    };

    applyBtn?.addEventListener('click', applyFilters);
    searchInput?.addEventListener('input', applyFilters);

    resetBtn?.addEventListener('click', () => {
        document.getElementById('search-all-input').value = '';
        // (เพิ่มการรีเซ็ต Filter อื่นๆ)
        pageState.allDocuments.filteredData = pageState.allDocuments.fullData;
        displayAllDocumentsPage(1);
    });
}

/**
 * ตั้งค่า Event Listeners สำหรับหน้า "เอกสารทั้งหมด"
 */
function setupAllDocumentsFilters() {
    const applyBtn = document.getElementById('apply-filters-btn');
    const resetBtn = document.getElementById('reset-filters-btn');
    const toggleBtn = document.getElementById('toggle-filter-btn');
    const filterBody = document.getElementById('advanced-filter-body');

    // ปุ่มซ่อน/แสดง
    toggleBtn?.addEventListener('click', () => {
        filterBody.classList.toggle('hidden');
        toggleBtn.classList.toggle('collapsed');
        toggleBtn.textContent = filterBody.classList.contains('hidden') ? 'แสดง' : 'ซ่อน';
    });

    // ปุ่มใช้ตัวกรอง และ ล้างตัวกรอง
    applyBtn?.addEventListener('click', applyAllDocumentsFilters);
    resetBtn?.addEventListener('click', () => {
        document.getElementById('search-all-input').value = '';
        document.getElementById('filter-status-all').value = '';
        document.getElementById('filter-type-all').value = '';
        document.getElementById('filter-program-all').value = '';
        document.getElementById('filter-date-start').value = '';
        document.getElementById('filter-date-end').value = '';
        applyAllDocumentsFilters();
    });
}

// =================================================================
// ภาค 11: Main Execution
// =================================================================
document.addEventListener('DOMContentLoaded', initializeApp);