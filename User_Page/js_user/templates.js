document.addEventListener("DOMContentLoaded", () => {
    fetch("/data/templates.json")
      .then(res => res.json())
      .then(data => {
        const tableBody = document.getElementById("template-list");
        data.forEach(template => {
          const row = document.createElement("tr");
  
          row.innerHTML = `
            <td>${template.name}</td>
            <td><a href="${template.docx}" target="_blank">
          <img src="/assets/images/docx.png" alt="DOCX" title="ดาวน์โหลด .docx">
        </a></td>
        <td><a href="${template.pdf}" target="_blank">
          <img src="/assets/images/pdf.png" alt="PDF" title="ดาวน์โหลด .pdf">
        </a></td>
          `;
  
          tableBody.appendChild(row);
        });
      })
      .catch(err => {
        console.error("❌ ไม่สามารถโหลดข้อมูลเทมเพลตได้", err);
      });
  });
  
  function logout() {
    localStorage.clear();
    window.location.href = "/login/index.html";
  }
  