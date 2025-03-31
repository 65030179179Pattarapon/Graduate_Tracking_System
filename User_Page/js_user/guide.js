function showSection(sectionId) {
    const sections = document.querySelectorAll(".guide-section");
    sections.forEach((sec) => {
      sec.style.display = sec.id === sectionId ? "block" : "none";
    });
  }
  
  function logout() {
    localStorage.clear();
    window.location.href = "/login/index.html";
  }
  