"use strict";

/* =========================================================
   Settings – fill these in and the links appear automatically.
   Leave a value empty ("") to hide that link.
   ========================================================= */
const CONFIG = {
  email: "peershah624372@gmail.com",
  github: "",    // e.g. "https://github.com/your-username" (filled in automatically on GitHub Pages)
  linkedin: "https://www.linkedin.com/in/peer-shah-a14622401",
  upwork: "",    // e.g. "https://www.upwork.com/freelancers/~your-id"
};
// GitHub repo of this internship, worked out by ../repo-link.js (empty when opened locally:
// the "Source code" buttons are then hidden instead of pointing to a broken link)
const REPO = window.REPO_URL || "";
if (!CONFIG.github && REPO) CONFIG.github = REPO.split("/").slice(0, 4).join("/"); // https://github.com/<user>
const repoPath = (folder) => (REPO ? `${REPO}/tree/main/${folder}` : "");

/* ---------- Projects (from the résumé + the four internship tasks) ---------- */
const projects = [
  {
    title: "HOPIRIT", art: "assets/projects/hopirit.jpg", full: "HOPIRIT — AI Disaster Coordination Platform", cat: "ai", label: "Multi-agent platform", glyph: "◎", c: "#fb923c",
    desc: "A citizen reporting portal plus an operator command center, with always-on AI agents that sort, verify and flag incoming disaster reports.",
    points: [
      "Command center with Leaflet.js heatmaps and hazard zones.",
      "Three always-on AI agents — Triage, Verification and Silent Zone — sort, verify and flag reports.",
      "pnpm monorepo with Express, Drizzle ORM and an OpenAPI-driven pipeline (Orval, Zod); deployed on Render.",
    ],
    tags: ["React", "TypeScript", "Node.js", "PostgreSQL", "AI agents"],
  },
  {
    title: "CodeMate", art: "assets/projects/codemate.jpg", full: "CodeMate — Offline Voice Coding Assistant", cat: "ai", label: "Africa Deep Tech Challenge", glyph: "◐", c: "#67e8f9",
    desc: "A fully offline, voice-driven agentic coding assistant built to run on an 8 GB RAM laptop with no GPU.",
    points: [
      "FastAPI agent loop with Qwen2.5-Coder 1.5B running locally via llama.cpp.",
      "whisper.cpp speech-to-text and Piper TTS for a hands-free voice loop.",
      "Chroma RAG over the codebase for grounded answers.",
    ],
    tags: ["Python", "FastAPI", "llama.cpp", "whisper.cpp", "RAG"],
  },
  {
    title: "Wingman", art: "assets/projects/wingman.jpg", full: "Wingman — CLI AI Coding Companion", cat: "ai", label: "OpenAI Build Week", glyph: "❯", c: "#a78bfa",
    desc: "A Node.js / TypeScript command-line assistant, distributed via npx, for everyday developer work.",
    points: ["Runs straight from the terminal with npx — no install step.", "Built for daily developer workflows during OpenAI Build Week."],
    tags: ["Node.js", "TypeScript", "CLI", "LLM APIs"],
  },
  {
    title: "AI Control Plane", art: "assets/projects/controlplane.jpg", full: "AI Control Plane", cat: "ai", label: "Galuxium Nexus V2 SaaS Hackathon", glyph: "⌘", c: "#c6f432",
    desc: "An AI gateway combining guardrails, a smart multi-model LLM router, usage billing and governance.",
    points: ["Smart router picks the right model for each request.", "Guardrails, usage billing and governance in one gateway."],
    tags: ["LLM routing", "Guardrails", "SaaS", "TypeScript"],
  },
  {
    title: "FormSaathi", art: "assets/projects/formsaathi.jpg", full: "FormSaathi", cat: "ai", label: "Kiroween 2026", glyph: "▤", c: "#f472b6",
    desc: "An evidence-backed application navigator that maps form requirements to supporting documents for public services.",
    points: ["Maps each form requirement to the document that proves it.", "Built to make public-service applications less confusing."],
    tags: ["AI", "Document mapping", "Civic tech"],
  },
  {
    title: "Lead Qualifier", art: "assets/projects/leadqual.jpg", full: "AI Lead Qualification & CRM Automation", cat: "automation", label: "n8n · client-style project", glyph: "⟳", c: "#4ade80",
    desc: "An n8n + LLM workflow that qualifies incoming leads and keeps the CRM up to date automatically.",
    points: ["Connects forms, spreadsheets, CRM and email in one n8n workflow.", "An LLM qualifies each lead before it reaches a human."],
    tags: ["n8n", "LLM APIs", "CRM", "Email automation"],
  },
  {
    title: "Task Manager", full: "TaskFlow — Task Manager", cat: "web", label: "Datheon · Task 2", img: "../screenshots/task2-task-manager.jpg",
    desc: "A CRUD task app with categories, due dates, filters, undo, drag-and-drop and a progress dashboard — all saved in localStorage.",
    points: ["Add, edit, complete and delete tasks; undo deletions.", "Filters, search, sort and keyboard reordering.", "Progress bars, efficiency rings and an upcoming-deadline plan."],
    tags: ["JavaScript", "localStorage", "DOM"], live: "../Task2-Task-Manager/index.html", code: repoPath("Task2-Task-Manager"),
  },
  {
    title: "Weather Dashboard", full: "Weather Dashboard", cat: "web", label: "Datheon · Task 3", img: "../screenshots/task3-weather.jpg",
    desc: "Live weather, hourly and 5-day forecasts, sunrise/sunset, air quality and UV with weather-based themes and solid error handling.",
    points: ["OpenWeatherMap with an automatic Open-Meteo fallback.", "Request timeouts, out-of-order protection and recent searches.", "°C/°F and km/h ↔ mph, remembered between visits."],
    tags: ["Fetch API", "Async/Await", "REST"], live: "../Task3-Weather-App/index.html", code: repoPath("Task3-Weather-App"),
  },
  {
    title: "E-Commerce Store", full: "ShopEase — E-Commerce Store", cat: "web", label: "Datheon · Task 4", img: "../screenshots/task4-ecommerce.jpg",
    desc: "A storefront on FakeStoreAPI with collection filters, search, a slide-out cart and a validated checkout flow.",
    points: ["Cart with quantities, tax and free-shipping threshold, saved across visits.", "Checkout form with validation and an itemised receipt.", "Keyboard-friendly drawer and dialogs."],
    tags: ["JavaScript", "CSS Grid", "State"], live: "../Task4-E-Commerce/index.html", code: repoPath("Task4-E-Commerce"),
  },
];
const CAT_LABEL = { ai: "AI & Agents", automation: "Automation", web: "Web App" };

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Theme (saved choice, else follows the system setting) ---------- */
const root = document.documentElement;
const themeBtn = $("#theme-toggle");
const themeMeta = document.querySelector('meta[name="theme-color"]');
function setTheme(t, save = true) {
  root.setAttribute("data-theme", t);
  const dark = t === "dark";
  themeBtn.innerHTML = `<span aria-hidden="true">${dark ? "☀" : "☾"}</span>`;
  themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  themeBtn.setAttribute("aria-pressed", String(!dark));
  themeMeta?.setAttribute("content", dark ? "#0b0b0d" : "#f7f6f2");
  if (save) try { localStorage.setItem("theme", t); } catch {}
}
let saved = null;
try { saved = localStorage.getItem("theme"); } catch {}
setTheme(saved || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"), false);
themeBtn.addEventListener("click", () => setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"));

/* ---------- Mobile menu ---------- */
const hamburger = $("#hamburger");
const links = $("#nav-links");
function setMenu(open) {
  links.classList.toggle("open", open);
  hamburger.setAttribute("aria-expanded", String(open));
  hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  hamburger.innerHTML = `<span aria-hidden="true">${open ? "✕" : "☰"}</span>`;
}
hamburger.addEventListener("click", () => setMenu(!links.classList.contains("open")));
links.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
matchMedia("(min-width: 821px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

/* ---------- Social links from CONFIG ---------- */
const socials = $("#socials");
[
  ["email", CONFIG.email && `mailto:${CONFIG.email}`, `✉ ${CONFIG.email}`],
  ["github", CONFIG.github, "GitHub ↗"],
  ["linkedin", CONFIG.linkedin, "LinkedIn ↗"],
  ["upwork", CONFIG.upwork, "Hire me on Upwork ↗"],
].forEach(([, href, label]) => {
  if (!href) return;
  const li = document.createElement("li");
  const a = Object.assign(document.createElement("a"), { href, textContent: label });
  if (!href.startsWith("mailto:")) { a.target = "_blank"; a.rel = "noopener"; }
  li.appendChild(a);
  socials.appendChild(li);
});

/* ---------- Hero terminal ---------- */
const CONSOLE_LINES = [
  { cmd: "hopirit agents --watch" },
  { out: '<span class="tag">[triage]</span>       12 new reports <span class="dim">→</span> <span class="warn">3 urgent</span>' },
  { out: '<span class="tag">[verify]</span>       3/3 reports confirmed <span class="ok">✓</span>' },
  { out: '<span class="tag">[silent-zone]</span>  Sector 7 offline <span class="dim">→</span> flagged' },
  { cmd: "n8n run lead-qualifier" },
  { out: '<span class="ok">✓</span> 24 leads qualified · CRM synced' },
  { cmd: 'codemate --offline "explain this function"' },
  { out: '<span class="dim">● qwen2.5-coder 1.5B · 8 GB RAM · no GPU</span>' },
  { out: '<span class="ok">✓</span> answered in 2.1s <span class="dim">(RAG: 4 chunks)</span>' },
];
const consoleEl = $("#console");
const line = (html) => { const el = document.createElement("span"); el.className = "ln"; el.innerHTML = html; consoleEl.appendChild(el); return el; };
const caret = () => '<span class="caret"></span>';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function runConsole() {
  if (reducedMotion) {
    CONSOLE_LINES.forEach((l) => line(l.cmd ? `<span class="p">$</span> ${esc(l.cmd)}` : l.out));
    line(`<span class="p">$</span> ${caret()}`);
    return;
  }
  for (;;) {
    consoleEl.textContent = "";
    for (const l of CONSOLE_LINES) {
      if (l.cmd) {
        const el = line("");
        for (let i = 0; i <= l.cmd.length; i++) {
          el.innerHTML = `<span class="p">$</span> ${esc(l.cmd.slice(0, i))}${caret()}`;
          await wait(28 + Math.random() * 40);
        }
        el.innerHTML = `<span class="p">$</span> ${esc(l.cmd)}`;
        await wait(350);
      } else {
        line(l.out);
        await wait(420);
      }
    }
    const end = line(`<span class="p">$</span> ${caret()}`);
    await wait(4200);
    end.remove();
  }
}
runConsole();

/* ---------- Marquee: duplicate the list so it loops seamlessly ---------- */
const track = document.querySelector(".marquee-track");
if (!reducedMotion) [...track.children].forEach((li) => { const c = li.cloneNode(true); c.setAttribute("aria-hidden", "true"); track.appendChild(c); });

/* ---------- Projects grid + filters ---------- */
function coverHTML(p, big = false) {
  // illustrated cover art (projects without a live screenshot)
  if (p.art) return `<div class="cover art"><img src="${p.art}" alt="${big ? `Illustration of ${esc(p.full)}` : ""}" loading="lazy" /></div>`;
  if (p.img) return `<div class="cover shot"><img src="${p.img}" alt="${big ? `Screenshot of the ${esc(p.full)}` : ""}" loading="lazy" /></div>`;
  return `<div class="cover gen" style="--c:${p.c}"><div class="cv-top"><span>${CAT_LABEL[p.cat]}</span><span class="cv-glyph" aria-hidden="true">${esc(p.glyph)}</span></div><div class="cv-name">${esc(p.title)}</div></div>`;
}
const grid = $("#projects-grid");
projects.forEach((p, i) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "card";
  b.dataset.cat = p.cat;
  b.setAttribute("aria-label", `${p.full} – open project details`);
  b.innerHTML = `${coverHTML(p)}
    <div class="card-body">
      <div class="card-meta"><span>${esc(p.label)}</span><span class="arrow" aria-hidden="true">↗</span></div>
      <h3>${esc(p.full)}</h3>
      <p>${esc(p.desc)}</p>
      <ul class="chips">${p.tags.slice(0, 3).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
    </div>`;
  b.addEventListener("click", () => openModal(i, b));
  grid.appendChild(b);
});
document.querySelectorAll(".filter").forEach((f) => f.addEventListener("click", () => {
  const cat = f.dataset.filter;
  document.querySelectorAll(".filter").forEach((x) => { x.classList.toggle("active", x === f); x.setAttribute("aria-pressed", String(x === f)); });
  let shown = 0;
  grid.querySelectorAll(".card").forEach((c, i) => {
    const show = cat === "all" || c.dataset.cat === cat;
    c.hidden = !show;
    c.classList.remove("enter", "reveal");
    c.classList.add("visible");
    if (show) { shown++; if (!reducedMotion) { void c.offsetWidth; c.style.animationDelay = `${Math.min(i, 6) * 40}ms`; c.classList.add("enter"); } }
  });
  $("#filter-status").textContent = `${shown} project${shown === 1 ? "" : "s"} shown`;
}));

/* ---------- Project modal ---------- */
const modal = $("#modal");
let lastFocus = null;
function openModal(i, opener) {
  const p = projects[i];
  lastFocus = opener || document.activeElement;
  $("#modal-cover").innerHTML = coverHTML(p, true);
  $("#modal-meta").textContent = `${CAT_LABEL[p.cat]} · ${p.label}`;
  $("#modal-title").textContent = p.full;
  $("#modal-desc").textContent = p.desc;
  $("#modal-points").innerHTML = (p.points || []).map((t) => `<li>${esc(t)}</li>`).join("");
  $("#modal-tags").innerHTML = p.tags.map((t) => `<li>${esc(t)}</li>`).join("");
  $("#modal-links").innerHTML =
    (p.live ? `<a class="btn btn-primary" href="${p.live}" target="_blank" rel="noopener">Live demo <span aria-hidden="true">↗</span></a>` : "") +
    (p.code ? `<a class="btn btn-ghost" href="${p.code}" target="_blank" rel="noopener">Source code</a>` : "");
  modal.hidden = false;
  document.body.classList.add("no-scroll");
  $("#modal-close").focus();
}
function closeModal() {
  if (modal.hidden) return;
  modal.hidden = true;
  document.body.classList.remove("no-scroll");
  lastFocus?.focus();
}
$("#modal-close").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeModal(); if (links.classList.contains("open")) { setMenu(false); hamburger.focus(); } }
  // keep keyboard focus inside the open modal
  if (e.key === "Tab" && !modal.hidden) {
    const f = [...modal.querySelectorAll("button, a[href]")];
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ---------- Scroll reveal ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("visible");
    io.unobserve(en.target);
  });
}, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
document.querySelectorAll(".section-head, .card, .skill-card, .tl-item, .about > *, .contact").forEach((el, i) => {
  el.classList.add("reveal");
  el.style.transitionDelay = `${(i % 3) * 70}ms`;
  io.observe(el);
});

/* ---------- Active nav link + back-to-top ---------- */
const sections = [...document.querySelectorAll("main section[id]")];
const navAnchors = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const toTop = $("#to-top");
let ticking = false;
function onScroll() {
  const y = scrollY + 140;
  const cur = sections.filter((s) => s.offsetTop <= y).pop();
  navAnchors.forEach((a) => {
    const active = !!cur && a.getAttribute("href") === "#" + cur.id;
    a.classList.toggle("active", active);
    active ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current");
  });
  toTop.hidden = scrollY < 700;
  ticking = false;
}
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
toTop.addEventListener("click", () => { scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }); $("#main").focus({ preventScroll: true }); });
onScroll();

/* ---------- Contact form validation (per field) ---------- */
const form = $("#contact-form");
const fields = {
  name: { el: $("#c-name"), check: (v) => (v.length >= 2 ? "" : "Please enter your name (at least 2 characters).") },
  email: { el: $("#c-email"), check: (v) => (!v ? "Please enter your email." : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Please enter a valid email address.") },
  msg: { el: $("#c-msg"), check: (v) => (v.length >= 10 ? "" : "Please tell me a bit more (at least 10 characters).") },
};
Object.values(fields).forEach((f) => f.el.addEventListener("input", () => f.el.removeAttribute("aria-invalid")));
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const status = $("#form-status");
  let firstBad = null, firstMsg = "";
  for (const f of Object.values(fields)) {
    const err = f.check(f.el.value.trim());
    f.el.toggleAttribute("aria-invalid", !!err);
    if (err && !firstBad) { firstBad = f.el; firstMsg = err; }
  }
  if (firstBad) { status.className = "error"; status.textContent = firstMsg; firstBad.focus(); return; }
  const btn = $("#send-btn");
  btn.disabled = true;
  btn.textContent = "Sending…";
  // demo only: nothing is sent to a server
  setTimeout(() => {
    status.className = "ok";
    status.textContent = `Thanks ${fields.name.el.value.trim()}! Your message was received (demo).`;
    form.reset();
    btn.disabled = false;
    btn.innerHTML = 'Send message <span aria-hidden="true">→</span>';
  }, 700);
});

$("#year").textContent = new Date().getFullYear();
