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
    pendingReview: { fullData: [], filteredData: [], currentPage: 1, rowsPerPage: 10 },
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
    // (เพิ่ม state สำหรับ section อื่นๆ ที่นี่ในอนาคต)
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
            displayPendingReviewPage(1);
            break;
        case 'pending-advisor':
            loadAdvisorApprovalData();
            break;
        case 'pending-external':
            loadExternalApprovalData();
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

    pageState.pendingExternal.fullData = { waiting: [], processed: [] };
    pageState.pendingExternal.filteredData = [];
    setupExternalApprovalFilters();

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
                <td class="checkbox-cell"><input type="checkbox" onclick="event.stopPropagation();"></td>
                <td>${doc.title}</td>
                <td>${doc.student_id}</td>
                <td>${studentName}</td>
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
    if(searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            pageState.pendingReview.filteredData = pageState.pendingReview.fullData.filter(doc => {
                const student = masterDataCache.students.find(s => s.email === doc.student_email);
                const studentName = student ? `${student.first_name_th} ${student.last_name_th}` : '';
                return doc.title.toLowerCase().includes(searchTerm) ||
                       studentName.toLowerCase().includes(searchTerm) ||
                       doc.student_id.includes(searchTerm);
            });
            displayPendingReviewPage(1);
        });
    }

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
// ภาค 7: Advisor Approval Section Logic
// =================================================================

function loadAdvisorApprovalData() {
    // ในระบบจริง ข้อมูลส่วนนี้จะมาจากฐานข้อมูลที่มีสถานะ 'รออาจารย์อนุมัติ'
    const waitingData = []; // Placeholder
    const processedData = []; // Placeholder
    
    pageState.pendingAdvisor.fullData = { waiting: waitingData, processed: processedData };

    document.getElementById('advisor-waiting-count').textContent = waitingData.length;
    document.getElementById('advisor-approved-today-count').textContent = "0";
    document.getElementById('advisor-rejected-today-count').textContent = "0";

    displayAdvisorApprovalPage('waiting', 1);
}

function displayAdvisorApprovalPage(tab, page) {
    pageState.pendingAdvisor.currentTab = tab;
    pageState.pendingAdvisor.currentPage = page;

    document.querySelectorAll('#section-pending-advisor .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('#section-pending-advisor .tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tab}`);
    });

    const dataForTab = pageState.pendingAdvisor.fullData[tab] || [];
    pageState.pendingAdvisor.filteredData = dataForTab;

    const tableBody = document.querySelector(`#table-advisor-${tab} tbody`);
    tableBody.innerHTML = '';

    const start = (page - 1) * pageState.pendingAdvisor.rowsPerPage;
    const end = start + pageState.pendingAdvisor.rowsPerPage;
    const paginatedItems = pageState.pendingAdvisor.filteredData.slice(start, end);
    
    if (paginatedItems.length === 0) {
        const colspan = (tab === 'waiting') ? 4 : 5;
        tableBody.innerHTML = `<tr><td colspan="${colspan}" class="loading-text">ไม่มีข้อมูลในรายการนี้</td></tr>`;
    } else {
        paginatedItems.forEach(doc => {
            // (เพิ่ม Logic สร้างแถวในตารางที่นี่)
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
    document.querySelectorAll('#section-pending-advisor .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            displayAdvisorApprovalPage(tabId, 1);
        });
    });
    // (เพิ่ม Logic ของ Filter และ Search ที่นี่)
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

    // Setup Search Inputs
    const waitingSearch = document.getElementById('external-waiting-search');
    const processedSearch = document.getElementById('external-processed-search');
    const processedStatusFilter = document.getElementById('external-processed-filter-status');

    const applyFilter = () => {
        const state = pageState.pendingExternal;
        const tab = state.currentTab;
        const sourceData = state.fullData[tab.replace('external-', '')] || [];

        const searchTerm = (tab === 'external-waiting' ? waitingSearch.value : processedSearch.value).toLowerCase();
        const statusFilter = (tab === 'external-processed') ? processedStatusFilter.value : 'all';

        state.filteredData = sourceData.filter(doc => {
            // (เพิ่ม Logic การกรองข้อมูลที่นี่)
            return true; // Placeholder
        });
        displayExternalApprovalPage(tab, 1);
    };

    waitingSearch?.addEventListener('input', applyFilter);
    processedSearch?.addEventListener('input', applyFilter);
    processedStatusFilter?.addEventListener('change', applyFilter);
}


// =================================================================
// ภาค 9: Main Execution
// =================================================================
document.addEventListener('DOMContentLoaded', initializeApp);