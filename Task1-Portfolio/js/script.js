"use strict";

const projects = [
  { emoji: "🌐", type: "Web Design", grad: "linear-gradient(135deg,#ffd93d,#ff8a00)", title: "Portfolio Website", desc: "Responsive developer portfolio with dark/light theme, smooth scrolling and modal project showcase.", tags: ["HTML5", "CSS3", "JavaScript"], live: "#", code: "#" },
  { emoji: "✅", type: "Productivity App", grad: "linear-gradient(135deg,#7c3aed,#2563eb)", title: "Task Manager", desc: "CRUD task app with categories, due dates, filters, drag-and-drop, a progress dashboard and localStorage persistence.", tags: ["JavaScript", "localStorage", "DOM"], live: "../Task2-Task-Manager/index.html", code: "../Task2-Task-Manager" },
  { emoji: "⛅", type: "API Dashboard", grad: "linear-gradient(135deg,#38bdf8,#6366f1)", title: "Weather Dashboard", desc: "Live weather, hourly and 5-day forecast, sunrise/sunset, air quality and UV with dynamic themes and error handling.", tags: ["Fetch API", "Async/Await", "REST"], live: "../Task3-Weather-App/index.html", code: "../Task3-Weather-App" },
  { emoji: "🛒", type: "E-Commerce", grad: "linear-gradient(135deg,#fb923c,#e11d48)", title: "E-Commerce Store", desc: "Product catalog from FakeStoreAPI with filters, search, slide-out cart and simulated checkout.", tags: ["JavaScript", "CSS Grid", "State"], live: "../Task4-E-Commerce/index.html", code: "../Task4-E-Commerce" },
];

const $ = (s) => document.querySelector(s);

/* ---------- Theme toggle (persisted) ---------- */
const root = document.documentElement;
const themeBtn = $("#theme-toggle");
function setTheme(t) {
  root.setAttribute("data-theme", t);
  themeBtn.textContent = t === "dark" ? "☀️" : "🌙";
  try { localStorage.setItem("theme", t); } catch {}
}
let saved = null;
try { saved = localStorage.getItem("theme"); } catch {}
setTheme(saved || "dark");
themeBtn.addEventListener("click", () => setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"));

/* ---------- Mobile menu ---------- */
const hamburger = $("#hamburger");
const links = $("#nav-links");
hamburger.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  hamburger.setAttribute("aria-expanded", open);
  hamburger.textContent = open ? "✕" : "☰";
});
links.addEventListener("click", (e) => {
  if (e.target.tagName === "A") { links.classList.remove("open"); hamburger.textContent = "☰"; hamburger.setAttribute("aria-expanded", false); }
});

/* ---------- Typing effect ---------- */
const roles = ["Frontend Developer", "JavaScript Enthusiast", "Problem Solver"];
let r = 0, c = 0, deleting = false;
(function type() {
  const word = roles[r];
  $("#typed-text").textContent = word.slice(0, c);
  if (!deleting && c++ === word.length) { deleting = true; return setTimeout(type, 1400); }
  if (deleting && --c === 0) { deleting = false; r = (r + 1) % roles.length; }
  setTimeout(type, deleting ? 40 : 90);
})();

/* ---------- Projects + modal ---------- */
const grid = $("#projects-grid");
projects.forEach((p, i) => {
  const b = document.createElement("button");
  b.className = "card reveal";
  b.innerHTML = `<div class="thumb" style="background:${p.grad}"><span aria-hidden="true">${p.emoji}</span></div>
    <div class="info"><div><h3>${p.title}</h3><small>${p.type}</small></div><span class="arrow" aria-hidden="true">↗</span></div>
    <div class="tags">${p.tags.map((t) => `<span>${t}</span>`).join("")}</div>`;
  b.addEventListener("click", () => openModal(i));
  grid.appendChild(b);
});
const modal = $("#modal");
function openModal(i) {
  const p = projects[i];
  $("#modal-title").textContent = `${p.emoji} ${p.title}`;
  $("#modal-desc").textContent = p.desc;
  $("#modal-tags").innerHTML = p.tags.map((t) => `<span>${t}</span>`).join("");
  $("#modal-links").innerHTML = `<a class="btn btn-primary" href="${p.live}" target="_blank" rel="noopener">Live Demo</a><a class="btn btn-outline" href="${p.code}" target="_blank" rel="noopener">Source</a>`;
  modal.hidden = false;
  $("#modal-close").focus();
}
const closeModal = () => (modal.hidden = true);
$("#modal-close").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

/* ---------- Scroll reveal, skill bars, active link ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("visible");
    en.target.querySelectorAll?.(".bar i").forEach((b) => (b.style.width = b.dataset.level + "%"));
    io.unobserve(en.target);
  });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal, .section").forEach((el) => { el.classList.add("reveal"); io.observe(el); });

const sections = [...document.querySelectorAll("main section[id]")];
addEventListener("scroll", () => {
  const y = scrollY + 120;
  const cur = sections.filter((s) => s.offsetTop <= y).pop();
  document.querySelectorAll(".nav-links a").forEach((a) => a.classList.toggle("active", cur && a.getAttribute("href") === "#" + cur.id));
}, { passive: true });

/* ---------- Contact form validation ---------- */
$("#contact-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#c-name").value.trim(), email = $("#c-email").value.trim(), msg = $("#c-msg").value.trim();
  const status = $("#form-status");
  status.className = "error";
  if (!name || !email || !msg) return (status.textContent = "Please fill in all fields.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return (status.textContent = "Please enter a valid email.");
  status.className = "ok";
  status.textContent = `Thanks ${name}! Your message was received (demo).`;
  e.target.reset();
});

$("#year").textContent = new Date().getFullYear();
