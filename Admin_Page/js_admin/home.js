function logout() {
  localStorage.clear();
  window.location.href = "/login/index.html";
}

function showSection(sectionId) {
  document.querySelectorAll(".content-section").forEach(sec => {
    sec.style.display = "none";
  });
  document.getElementById(sectionId).style.display = "block";
}

document.addEventListener("DOMContentLoaded", async () => {
  const pending = await fetch("data/document_pending.json").then(res => res.json());
  const due = await fetch("data/document_near_due.json").then(res => res.json());
  const students = await fetch("data/student_data.json").then(res => res.json());

  document.getElementById("pending").innerHTML = `
    <h2>📄 เอกสารรอตรวจ</h2>
    <ul>${pending.map(doc => `<li>${doc.title} - โดย ${doc.student} (${doc.status})</li>`).join("")}</ul>
  `;

  document.getElementById("due").innerHTML = `
    <h2>⏰ เอกสารใกล้กำหนด</h2>
    <ul>${due.map(doc => `<li>${doc.title} - ส่งโดย ${doc.student} (เหลือ ${doc.days_left} วัน)</li>`).join("")}</ul>
  `;

  document.getElementById("students").innerHTML = `
    <h2>👨‍🎓 นักศึกษาทั้งหมด</h2>
    <ul>${students.map(st => `<li>${st.name} - ${st.program} (${st.status})</li>`).join("")}</ul>
  `;
});

function logout() {
    localStorage.clear();
    window.location.href = "/login/index.html";
  }