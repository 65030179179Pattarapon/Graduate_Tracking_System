document.addEventListener("DOMContentLoaded", () => {
  const userData = JSON.parse(localStorage.getItem("studentData")) || {};
  const fields = ["prefix", "fullname", "student-id", "degree", "program", "department", "phone", "email"];
  fields.forEach(id => {
    document.getElementById(id).value = userData[id.replace("-", "_")] || "";
  });

  const advisors = [
    "ผศ.สุระชัย พิมพ์สาลี",
    "ผศ.พงษ์เกียรติ จงไตรลักษณ์",
    "ผศ.ดร.ไพบูลย์ พวงวงศ์ตระกูล",
    "ผศ.อำพล ทองระอา",
    "ผศ.โกศล ตราชู"
  ];
  const mainSelect = document.getElementById("main-advisor");
  const coSelect = document.getElementById("co-advisor");
  advisors.forEach(name => {
    let opt1 = document.createElement("option");
    opt1.value = name;
    opt1.textContent = name;
    mainSelect.appendChild(opt1);

    let opt2 = document.createElement("option");
    opt2.value = name;
    opt2.textContent = name;
    coSelect.appendChild(opt2);
  });
});

function updateCoAdvisor() {
  const main = document.getElementById("main-advisor").value;
  const co = document.getElementById("co-advisor");
  for (let option of co.options) {
    option.disabled = option.value === main;
  }
}

document.getElementById("advisor-form").addEventListener("submit", (e) => {
  e.preventDefault();
  alert("📤 ส่งฟอร์มเรียบร้อยแล้ว!");
});

function logout() {
    localStorage.clear();
    window.location.href = "/login/index.html";
  }