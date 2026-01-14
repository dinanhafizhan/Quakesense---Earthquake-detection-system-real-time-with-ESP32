const sidebar = document.getElementById("sidebar");
const arrow = document.getElementById("arrowIcon");
const mainContent = document.getElementById("mainContent");

const texts = document.querySelectorAll(
  "#sidebarText, #menuText span, #logoutText span"
);

// Fungsi untuk menutup sidebar
function closeSidebar() {
  sidebar.classList.replace("w-[250px]", "w-[80px]");
  mainContent.classList.replace("ml-[260px]", "ml-[90px]");
  arrow.classList.replace("fa-chevron-left", "fa-chevron-right");
  texts.forEach(t => t.classList.add("hidden"));
  document.documentElement.setAttribute("data-sidebar-closed", "true");
  localStorage.setItem("sidebarState", "closed");
}

// Fungsi untuk membuka sidebar
function openSidebar() {
  sidebar.classList.replace("w-[80px]", "w-[250px]");
  mainContent.classList.replace("ml-[90px]", "ml-[260px]");
  arrow.classList.replace("fa-chevron-right", "fa-chevron-left");
  texts.forEach(t => t.classList.remove("hidden"));
  document.documentElement.removeAttribute("data-sidebar-closed");
  localStorage.setItem("sidebarState", "open");
}

// Restore state sidebar saat halaman load
window.addEventListener("DOMContentLoaded", () => {
  const sidebarState = localStorage.getItem("sidebarState");
  if (sidebarState === "closed") {
    closeSidebar();
  }
});

// Toggle sidebar saat tombol diklik
document.getElementById("toggleSidebar").addEventListener("click", () => {
  const isOpen = sidebar.classList.contains("w-[250px]");
  if (isOpen) {
    closeSidebar();
  } else {
    openSidebar();
  }
});
