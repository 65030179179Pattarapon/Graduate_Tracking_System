document.addEventListener("DOMContentLoaded", () => {
    fetch("/data/mn_students.json")
      .then((res) => res.json())
      .then((data) => {
        window.studentList = data;
        renderTable(data);
      });
  
    document.getElementById("search-name").addEventListener("input", filterStudents);
    document.getElementById("filter-program").addEventListener("change", filterStudents);
    document.getElementById("filter-year").addEventListener("change", filterStudents);
  });
  
  function renderTable(students) {
    const tbody = document.getElementById("student-table-body");
    tbody.innerHTML = "";
  
    students.forEach((stu) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${stu.student_id}</td>
        <td>${stu.prefix_th}${stu.first_name_th} ${stu.last_name_th}</td>
        <td>${stu.degree_level}</td>
        <td>${stu.program}</td>
        <td>${stu.major}</td>
        <td>${stu.admit_year}</td>
      `;
      row.style.cursor = "pointer";
      row.addEventListener("click", () => {
        window.location.href = `manage_students.html?id=${stu.student_id}`;
      });
      tbody.appendChild(row);
    });
  }
  
  function filterStudents() {
    const nameKeyword = document.getElementById("search-name").value.toLowerCase();
    const program = document.getElementById("filter-program").value;
    const year = document.getElementById("filter-year").value;
  
    const filtered = window.studentList.filter((stu) => {
      const matchName = stu.first_name_th.toLowerCase().includes(nameKeyword) || stu.student_id.includes(nameKeyword);
      const matchProgram = !program || stu.degree_level === program;
      const matchYear = !year || stu.admit_year === year;
      return matchName && matchProgram && matchYear;
    });
  
    renderTable(filtered);
  }
  