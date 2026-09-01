/* ============================================================
   PRIME PAGE — scripts (minimal)
   ============================================================ */

// --- mobile nav ---
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector("header nav");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => nav.classList.toggle("open"));
  nav.addEventListener("click", (e) => {
    if (e.target.tagName === "A") nav.classList.remove("open");
  });
}

// --- footer year ---
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// --- FAQ accordion ---
document.querySelectorAll(".faq-item").forEach((item) => {
  const q = item.querySelector(".faq-q");
  if (!q) return;
  q.addEventListener("click", () => item.classList.toggle("open"));
});

