function logout() {
  localStorage.clear();
  window.location.href = "/login/index.html";
}

// ตัวอย่างสถานะ (Mock)
document.getElementById("submitted-count").textContent = 3;
document.getElementById("approved-count").textContent = 2;
document.getElementById("rejected-count").textContent = 1;
