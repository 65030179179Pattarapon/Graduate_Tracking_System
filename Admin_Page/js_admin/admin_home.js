function logout() {
  localStorage.clear();
  window.location.href = "/login/index.html"; // Ensure path is correct
}

// --- Navigation for Clickable Rows ---
function viewDocumentDetail(docId, docType) {
  // Path ไปยังหน้ารายละเอียดเอกสารของคุณ (ตรวจสอบให้แน่ใจว่าถูกต้อง)
  const detailPageUrl = `/Admin_Page/html_admin/document_detail.html?id=${encodeURIComponent(docId)}&type=${encodeURIComponent(docType || 'unknown')}`;
  window.location.href = detailPageUrl;
}

function viewStudentDetail(studentId) {
  // Path ไปยังหน้ารายละเอียดนักศึกษาของคุณ (ตรวจสอบให้แน่ใจว่าถูกต้อง)
  const detailPageUrl = `/Admin_Page/html_admin/student_detail.html?id=${encodeURIComponent(studentId)}`;
  window.location.href = detailPageUrl;
}


// --- Pagination State & Configuration ---
const paginationConfig = {
  rowsPerPage: 10,
  states: {}
};

function showSection(sectionToShow) {
  const allSectionIdentifiers = ["pending", "due", "students", "approved", "rejected", "all-documents"];
  allSectionIdentifiers.forEach(id => {
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.style.display = id === sectionToShow ? "block" : "none";
    }
  });

  if (sectionToShow === 'all-documents') {
    if (!paginationConfig.states['all-documents'] || paginationConfig.states['all-documents'].fullData.length === 0) {
      loadAllDocumentsAggregatedData();
    } else {
      displayPage('all-documents', paginationConfig.states['all-documents'].currentPage);
    }
  } else if (paginationConfig.states[sectionToShow] && paginationConfig.states[sectionToShow].fullData.length > 0) {
    displayPage(sectionToShow, paginationConfig.states[sectionToShow].currentPage);
  }
}

function displayPage(sectionName, page) {
  const state = paginationConfig.states[sectionName];
  if (!state || !state.filteredData) {
    const tbody = document.querySelector(`#table-${sectionName} tbody`);
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">กำลังเตรียมข้อมูล...</td></tr>`;
    updatePaginationControls(sectionName);
    return;
  }

  state.currentPage = parseInt(page, 10);
  const start = (state.currentPage - 1) * paginationConfig.rowsPerPage;
  const end = start + paginationConfig.rowsPerPage;
  const dataForPage = state.filteredData.slice(start, end);

  const tbody = document.querySelector(`#table-${sectionName} tbody`);
  if (!tbody) return;
  tbody.innerHTML = '';

  switch (sectionName) {
    case 'pending': populatePendingTable(tbody, dataForPage); break;
    case 'due': populateDueTable(tbody, dataForPage); break;
    case 'students': populateStudentsTable(tbody, dataForPage); break;
    case 'approved': populateApprovedTable(tbody, dataForPage); break;
    case 'rejected': populateRejectedTable(tbody, dataForPage); break;
    case 'all-documents': populateAllDocumentsTable(tbody, dataForPage); break;
  }
  updatePaginationControls(sectionName);
}

function updatePaginationControls(sectionName) {
  const state = paginationConfig.states[sectionName];
  const controlsContainer = document.getElementById(`pagination-controls-${sectionName}`);
  if (!controlsContainer) return;

  if (!state || !state.filteredData) {
    controlsContainer.innerHTML = `<button class="prev-btn" disabled>ᐸ ก่อนหน้า</button><span class="page-info">หน้า 1 / 1</span><button class="next-btn" disabled>ถัดไป ᐳ</button>`;
    return;
  }
  
  state.totalPages = Math.ceil(state.filteredData.length / paginationConfig.rowsPerPage) || 1;

  controlsContainer.innerHTML = `
    <button class="prev-btn" ${state.currentPage === 1 ? 'disabled' : ''}>ᐸ ก่อนหน้า</button>
    <span class="page-info">หน้า ${state.currentPage} / ${state.totalPages}</span>
    <button class="next-btn" ${state.currentPage >= state.totalPages ? 'disabled' : ''}>ถัดไป ᐳ</button>
  `;

  controlsContainer.querySelector('.prev-btn').addEventListener('click', () => {
    if (state.currentPage > 1) displayPage(sectionName, state.currentPage - 1);
  });
  controlsContainer.querySelector('.next-btn').addEventListener('click', () => {
    if (state.currentPage < state.totalPages) displayPage(sectionName, state.currentPage + 1);
  });
}

// --- Section-Specific Table Populators (Updated for Clickable Rows) ---
function populatePendingTable(tbody, data) {
  if (data.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">ไม่พบข้อมูล</td></tr>`; return; }
  data.forEach(doc => {
    const tr = document.createElement("tr");
    tr.className = 'clickable-row';
    // Ensure doc has a unique ID, e.g., doc.id or doc.document_id
    // Using a generic 'id' or a specific one like 'request_id' or 'doc_id' from your JSON
    const docId = doc.id || doc.request_id || doc.title + doc.student; // Fallback, ensure uniqueness
    tr.setAttribute('onclick', `viewDocumentDetail('${docId}', '${doc.type || 'pending'}')`);
    tr.innerHTML = `<td>${doc.title||''}</td><td>${doc.student||''}</td><td>${doc.status||''}</td><td>${doc.type||''}</td><td>${doc.submitted_date||''}</td>`;
    tbody.appendChild(tr);
  });
}
function populateDueTable(tbody, data) {
  if (data.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">ไม่พบข้อมูล</td></tr>`; return; }
  data.forEach(doc => {
    const tr = document.createElement("tr");
    tr.className = 'clickable-row';
    const docId = doc.id || doc.request_id || doc.title + doc.student;
    tr.setAttribute('onclick', `viewDocumentDetail('${docId}', '${doc.type || 'due'}')`);
    tr.innerHTML = `<td>${doc.title||''}</td><td>${doc.student||''}</td><td>${doc.status||''}</td><td>${doc.type||''}</td><td>${doc.days_left !== undefined ? doc.days_left + ' วัน' : ''}</td>`;
    tbody.appendChild(tr);
  });
}
function populateStudentsTable(tbody, data) {
  if (data.length === 0) { tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">ไม่พบข้อมูล</td></tr>`; return; }
  data.forEach(st => {
    const tr = document.createElement("tr");
    tr.className = 'clickable-row';
    tr.setAttribute('onclick', `viewStudentDetail('${st.student_id}')`);
    tr.innerHTML = `<td>${st.prefix_th||''}</td><td>${st.first_name_th||''}</td><td>${st.last_name_th||''}</td><td>${st.program||''}</td><td>${st.degree||''}</td><td>${st.department||''}</td><td>${st.plan||''}</td><td>${st.status||''}</td>`;
    tbody.appendChild(tr);
  });
}
function populateApprovedTable(tbody, data) {
  if (data.length === 0) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">ไม่พบข้อมูล</td></tr>`; return; }
  data.forEach(doc => {
    const tr = document.createElement("tr");
    tr.className = 'clickable-row';
    const docId = doc.id || doc.request_id || doc.title + doc.student;
    tr.setAttribute('onclick', `viewDocumentDetail('${docId}', '${doc.type || 'approved'}')`);
    tr.innerHTML = `<td>${doc.title||''}</td><td>${doc.student||''}</td><td>${doc.type||''}</td><td>${doc.submitted_date||''}</td>`;
    tbody.appendChild(tr);
  });
}
function populateRejectedTable(tbody, data) {
  if (data.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">ไม่พบข้อมูล</td></tr>`; return; }
  data.forEach(doc => {
    const tr = document.createElement("tr");
    tr.className = 'clickable-row';
    const docId = doc.id || doc.request_id || doc.title + doc.student;
    tr.setAttribute('onclick', `viewDocumentDetail('${docId}', '${doc.type || 'rejected'}')`);
    tr.innerHTML = `<td>${doc.title||''}</td><td>${doc.student||''}</td><td>${doc.type||''}</td><td>${doc.rejected_date||''}</td><td>${doc.comment||''}</td>`;
    tbody.appendChild(tr);
  });
}
function populateAllDocumentsTable(tbody, data) {
  if (data.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">ไม่พบข้อมูล</td></tr>`; return; }
  data.forEach(doc => {
    const tr = document.createElement("tr");
    tr.className = 'clickable-row';
    // Ensure 'doc' objects in allDocumentsData have a unique 'id' and 'doc_type_for_detail_page'
    const docId = doc.id || doc.originalDoc?.id || doc.title + doc.student; // Prioritize a unique ID
    const docType = doc.type || doc.originalDoc?.type || 'general';
    tr.setAttribute('onclick', `viewDocumentDetail('${docId}', '${docType}')`);
    tr.innerHTML = `<td>${doc.title||'N/A'}</td><td>${doc.type||'N/A'}</td><td>${doc.student||'N/A'}</td><td>${doc.status||'N/A'}</td><td>${doc.date||'N/A'}</td>`;
    tbody.appendChild(tr);
  });
}


// --- Filtering for Simple Tables ---
const filterPropertyMap = {
    pending: { title: 'title', student: 'student', status: 'status', type: 'type', submitted_date: 'submitted_date' },
    due: { title: 'title', student: 'student', status: 'status', type: 'type', days_left: 'days_left' },
    students: { fullName: 'fullName', program: 'program', degree: 'degree', department: 'department', plan: 'plan', status: 'status' },
    approved: { title: 'title', student: 'student', type: 'type', submitted_date: 'submitted_date' },
    rejected: { title: 'title', student: 'student', type: 'type', rejected_date: 'rejected_date', comment: 'comment' }
};

function applyTableFilterAndPaginate(sectionName, filterCategoryFromStat = null, filterValueFromStat = null) {
  const state = paginationConfig.states[sectionName];
  if (!state) { console.warn(`State for ${sectionName} not found for filtering.`); return; }

  const inputEl = document.getElementById(`filter-input-${sectionName}`);
  const categoryEl = document.getElementById(`filter-category-${sectionName}`);

  let searchTerm = "";
  let categoryValue = "all";

  if (filterCategoryFromStat) {
    categoryValue = filterCategoryFromStat;
    searchTerm = filterValueFromStat ? String(filterValueFromStat).toLowerCase() : "";
    if (inputEl) inputEl.value = filterCategoryFromStat.startsWith('all-') ? "" : (filterValueFromStat || "");
    if (categoryEl) categoryEl.value = filterCategoryFromStat.startsWith('all-') ? "all" : filterCategoryFromStat;
  } else {
    if (inputEl) searchTerm = inputEl.value.trim().toLowerCase();
    if (categoryEl) categoryValue = categoryEl.value;
  }
  
  state.filterValues = { category: categoryValue, searchTerm: searchTerm };

  state.filteredData = state.fullData.filter(item => {
    if (categoryValue === "all" || categoryValue.startsWith("all-")) return true;

    if (sectionName === 'due' && categoryValue === 'days') {
        const daysLeft = parseInt(item.days_left);
        return !isNaN(daysLeft) && daysLeft <= parseInt(searchTerm);
    }
    
    const propertyToFilter = filterPropertyMap[sectionName]?.[categoryValue];

    if (sectionName === 'students' && categoryValue === 'fullName') {
        const pf = String(item.prefix_th||'').toLowerCase();
        const fn = String(item.first_name_th||'').toLowerCase();
        const ln = String(item.last_name_th||'').toLowerCase();
        const search = searchTerm.replace(/\s+/g, ''); // Remove spaces from search term for combined name
        return (pf+fn+ln).includes(search) || 
               `${pf} ${fn} ${ln}`.toLowerCase().includes(searchTerm) || 
               fn.includes(searchTerm) || 
               ln.includes(searchTerm);
    }
    
    if (propertyToFilter && item.hasOwnProperty(propertyToFilter)) {
        return String(item[propertyToFilter]).toLowerCase().includes(searchTerm);
    }
    // Fallback for direct category value match if searchTerm from stat is the full value
    if (filterCategoryFromStat && item.hasOwnProperty(categoryValue)) {
        return String(item[categoryValue]).toLowerCase() === searchTerm;
    }

    if (searchTerm === "") return true;
    return Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm));
  });

  state.currentPage = 1;
  displayPage(sectionName, 1);
}

// --- "All Documents" Section Specific Filtering & Data Aggregation ---
let allDocsMasterDataCache = [];

async function loadAllDocumentsAggregatedData() {
  const sectionName = 'all-documents';
  if (!paginationConfig.states[sectionName]) {
    paginationConfig.states[sectionName] = { currentPage: 1, fullData: [], filteredData: [], totalPages: 1, filterValues: {} };
  }
  const state = paginationConfig.states[sectionName];
  const tbody = document.querySelector("#table-all-documents tbody");

  if (allDocsMasterDataCache.length > 0) {
    state.fullData = allDocsMasterDataCache;
    state.filteredData = [...allDocsMasterDataCache];
    const totalCountEl = document.getElementById("alldocs-total-count");
    if(totalCountEl) totalCountEl.textContent = `📄 เอกสารในระบบ: ${state.fullData.length}`;
    displayPage(sectionName, 1);
    return;
  }
  
  if (!tbody) { console.error("All docs table body not found"); return; }
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">กำลังโหลดข้อมูล...</td></tr>`;

  try {
    const [pending, approved, rejected, studentsData, due] = await Promise.all([
      fetch('/data/document_pending.json').then(res => res.ok ? res.json() : []).catch(()=>[]),
      fetch('/data/document_approved.json').then(res => res.ok ? res.json() : []).catch(()=>[]),
      fetch('/data/document_rejected.json').then(res => res.ok ? res.json() : []).catch(()=>[]),
      fetch('/data/student.json').then(res => res.ok ? res.json() : []).catch(()=>[]),
      fetch('/data/document_near_due.json').then(res => res.ok ? res.json() : []).catch(()=>[])
    ]);

    const studentMap = new Map();
    studentsData.forEach(s => studentMap.set(s.student_id, s));
    allDocsMasterDataCache = [];

    const processDocs = (docs, defaultStatus, docBaseType) => {
      docs.forEach((d, index) => {
        let studentDetail = studentMap.get(d.student_id) || studentsData.find(s => (s.first_name_th + " " + s.last_name_th) === d.student) || {};
         if (!d.student && d.student_id && studentMap.has(d.student_id)) {
            studentDetail = studentMap.get(d.student_id);
        }
        // Create a more stable ID for documents if they don't have one
        const docId = d.id || d.request_id || `${docBaseType}_${d.title}_${index}`;

        allDocsMasterDataCache.push({
          id: docId, // Ensure each doc has an ID for navigation
          title: d.title || 'N/A', type: d.type || 'N/A',
          student: d.student || (studentDetail.first_name_th ? `${studentDetail.first_name_th} ${studentDetail.last_name_th}` : 'N/A'),
          status: d.status || defaultStatus,
          date: d.submitted_date || d.approved_date || d.rejected_date || d.proposal_date || (d.days_left !== undefined ? `เหลือ ${d.days_left} วัน` : 'N/A'),
          // link: d.link || '#', // Link property from original data, not used for display in row
          degree: studentDetail.degree || d.degree || '',
          program: studentDetail.program || d.program || '',
          department: studentDetail.department || d.department || '',
          doc_type_for_detail_page: docBaseType // To help viewDocumentDetail construct URL
        });
      });
    };

    processDocs(pending, 'รอตรวจ', 'pending'); processDocs(approved, 'อนุมัติแล้ว', 'approved');
    processDocs(rejected, 'ไม่อนุมัติ', 'rejected'); processDocs(due, 'ใกล้กำหนด', 'due');
    
    state.fullData = allDocsMasterDataCache;
    state.filteredData = [...allDocsMasterDataCache];
    const totalCountEl = document.getElementById("alldocs-total-count");
    if(totalCountEl) totalCountEl.textContent = `📄 เอกสารในระบบ: ${state.fullData.length}`;
    displayPage(sectionName, 1);

  } catch (error) {
    console.error("Error loading aggregated all documents data:", error);
    if(tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:red;">เกิดข้อผิดพลาด: ${error.message}</td></tr>`;
  }
}

function applyAllDocumentsFiltersFromUI() {
  const state = paginationConfig.states['all-documents'];
  if (!state || !state.fullData) { console.warn("State or fullData for all-documents not found."); return; }

  const generalSearch = document.getElementById('alldocs-search-general').value.trim().toLowerCase();
  const status = document.getElementById('alldocs-filter-status').value;
  const docType = document.getElementById('alldocs-filter-doctype').value;
  const degree = document.getElementById('alldocs-filter-degree').value;
  const program = document.getElementById('alldocs-filter-program').value;
  const department = document.getElementById('alldocs-filter-department').value;
  const dateStart = document.getElementById('alldocs-filter-date-start').value;
  const dateEnd = document.getElementById('alldocs-filter-date-end').value;

  state.filterValues = { generalSearch, status, docType, degree, program, department, dateStart, dateEnd };

  state.filteredData = state.fullData.filter(doc => {
    if (generalSearch && !( (doc.title && doc.title.toLowerCase().includes(generalSearch)) || (doc.student && doc.student.toLowerCase().includes(generalSearch)) || (doc.type && doc.type.toLowerCase().includes(generalSearch)) )) return false;
    if (status && doc.status !== status) return false;
    if (docType && doc.type !== docType) return false;
    if (degree && doc.degree !== degree) return false;
    if (program && doc.program !== program) return false;
    if (department && doc.department !== department) return false;
    
    const docDateStr = doc.date;
    if (docDateStr && (dateStart || dateEnd)) {
        let comparableDocDateStr = docDateStr;
        if (docDateStr.includes('/')) { 
            const parts = docDateStr.split('/');
            if (parts.length === 3) comparableDocDateStr = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
        } else if (docDateStr.includes('เหลือ')) { 
            return !(dateStart || dateEnd); 
        }
        if (dateStart && comparableDocDateStr < dateStart) return false;
        if (dateEnd && comparableDocDateStr > dateEnd) return false;
    } else if (!docDateStr && (dateStart || dateEnd)) {
        return false;
    }
    return true;
  });
  state.currentPage = 1;
  displayPage('all-documents', 1);
}

function resetAllDocumentsFiltersFromUI() {
  document.getElementById('alldocs-search-general').value = "";
  document.getElementById('alldocs-filter-status').value = "";
  document.getElementById('alldocs-filter-doctype').value = "";
  document.getElementById('alldocs-filter-degree').value = "";
  document.getElementById('alldocs-filter-program').value = "";
  document.getElementById('alldocs-filter-department').value = "";
  document.getElementById('alldocs-filter-date-start').value = "";
  document.getElementById('alldocs-filter-date-end').value = "";
  
  const state = paginationConfig.states['all-documents'];
  if (state && state.fullData) {
    state.filteredData = [...state.fullData];
    state.filterValues = {};
    state.currentPage = 1;
    displayPage('all-documents', 1);
  }
}

// --- Initialize Data and Event Listeners on DOMContentLoaded ---
async function initializeSection(sectionName, filePath, statsUpdater) {
  try {
    const data = await fetch(filePath).then(res => { if (!res.ok) throw new Error(`Data fetch failed for ${sectionName}: ${res.status}`); return res.json();});
    paginationConfig.states[sectionName] = {
      currentPage: 1,
      fullData: data,
      filteredData: [...data],
      totalPages: Math.ceil(data.length / paginationConfig.rowsPerPage) || 1,
      filterValues: {}
    };
    if (statsUpdater) statsUpdater(data);
    // displayPage(sectionName, 1); // Will be called by showSection or initial default
  } catch (error) {
    console.error(`Error initializing data for ${sectionName}:`, error);
    const tbody = document.querySelector(`#table-${sectionName} tbody`);
    if(tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:red;">โหลดข้อมูล ${sectionName} ผิดพลาด</td></tr>`;
    updatePaginationControls(sectionName); // Attempt to render controls even on error
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initializeSection('pending', '/data/document_pending.json', (data) => {
      let pc=0, rc=0; data.forEach(d => d.status==="รอตรวจ"?pc++:d.status==="แก้ไขแล้วส่งกลับ"?rc++:null);
      document.getElementById("total-docs").textContent = `📄 ทั้งหมด: ${data.length}`;
      document.getElementById("status-pending").textContent = `⏳ รอตรวจ: ${pc}`;
      document.getElementById("status-revised").textContent = `📝 แก้ไขแล้วส่งกลับ: ${rc}`;
    });
    await initializeSection('due', '/data/document_near_due.json', (data) => {
      let c3=0,c7=0; data.forEach(d => {if(d.days_left !== undefined && d.days_left<=3)c3++; if(d.days_left !== undefined && d.days_left<=7)c7++;});
      document.getElementById("due-total").textContent = `📄 ทั้งหมด: ${data.length}`;
      document.getElementById("due-3days").textContent = `⚠️ น้อยกว่า 3 วัน: ${c3}`;
      document.getElementById("due-7days").textContent = `⏳ น้อยกว่า 7 วัน: ${c7}`;
    });
     await initializeSection('students', '/data/student.json', (data) => {
        let cm=0,cp=0,s=0,d=0; data.forEach(st=>{if(st.degree==="ปริญญาโท")cm++; if(st.degree==="ปริญญาเอก")cp++; if(st.status==="กำลังศึกษา")s++; if(st.status==="พักการเรียน")d++;});
        document.getElementById("students-total").textContent = `👥 ทั้งหมด: ${data.length}`;
        document.getElementById("students-master").textContent = `🎓 ปริญญาโท: ${cm}`;
        document.getElementById("students-phd").textContent = `🎓 ปริญญาเอก: ${cp}`;
        document.getElementById("students-status-studying").textContent = `✅ กำลังศึกษา: ${s}`;
        document.getElementById("students-status-drop").textContent = `⛔ พักการเรียน: ${d}`;
    });
    await initializeSection('approved', '/data/document_approved.json', (data) => {
        const stats={1:0,2:0,3:0,4:0,5:0}; data.forEach(doc=>{if(doc.type){const m=doc.type.match(/\d+/);if(m&&stats.hasOwnProperty(m[0]))stats[m[0]]++;}});
        document.querySelector("#section-approved .stats span:nth-child(1)").textContent = `📄 ทั้งหมด: ${data.length}`;
        for(let i=1;i<=5;i++){const el=document.querySelector(`#section-approved #approved-form${i}`); if(el)el.textContent=`📝 ฟอร์ม ${i}: ${stats[i]||0}`;}
    });
    await initializeSection('rejected', '/data/document_rejected.json', (data) => {
        const stats={1:0,2:0,3:0,4:0,5:0}; data.forEach(doc=>{if(doc.type){const m=doc.type.match(/\d+/);if(m&&stats.hasOwnProperty(m[0]))stats[m[0]]++;}});
        document.querySelector("#section-rejected .stats span:nth-child(1)").textContent = `📄 ทั้งหมด: ${data.length}`;
        for(let i=1;i<=5;i++){const el=document.querySelector(`#section-rejected #rejected-form${i}`); if(el)el.textContent=`📝 ฟอร์ม ${i}: ${stats[i]||0}`;}
    });

    // Setup for "All Documents" section
    document.getElementById('alldocs-apply-filters-btn')?.addEventListener('click', applyAllDocumentsFiltersFromUI);
    document.getElementById('alldocs-reset-filters-btn')?.addEventListener('click', resetAllDocumentsFiltersFromUI);

    // Show default section and its first page
    showSection('pending'); // This will now also call displayPage if data is loaded

  } catch (error) {
    console.error("Error during DOMContentLoaded setup:", error);
    const mainArea = document.querySelector("main");
    if (mainArea) mainArea.innerHTML = `<p style="color:red; text-align:center; padding:20px;">เกิดข้อผิดพลาดในการโหลดข้อมูลหลัก: ${error.message}. กรุณาตรวจสอบ Console.</p>`;
  }
});