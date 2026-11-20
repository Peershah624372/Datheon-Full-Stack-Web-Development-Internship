"use strict";

const STORAGE_KEY = "datheon.tasks.v1";
const CATS = ["Work", "Personal", "Study"];
// colour + letter for each category (used by avatars, progress bars, rings and charts)
const META = {
  all: { label: "Overall", letter: "O", c: "var(--all)", cl: "var(--all-l)", dark: false },
  Work: { label: "Work", letter: "W", c: "var(--work)", cl: "var(--work-l)", dark: false },
  Personal: { label: "Personal", letter: "P", c: "var(--personal)", cl: "var(--personal-l)", dark: false },
  Study: { label: "Study", letter: "S", c: "var(--study)", cl: "var(--study-l)", dark: true },
};

let tasks = []; // { id, title, category, due, completed }
let statusFilter = "all";
let categoryFilter = "all";
let query = "";
let editingId = null;
let dragId = null;

const $ = (s) => document.querySelector(s);
const list = $("#task-list");

/* ---------- Persistence ---------- */
function saveToLocalStorage() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch (e) { console.warn("Save failed", e); }
}
function loadFromLocalStorage() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    tasks = Array.isArray(data) ? data.filter((t) => t && typeof t.title === "string" && t.id) : [];
  } catch { tasks = []; }
}

/* ---------- CRUD ---------- */
function addTask(title, category, due) {
  tasks.unshift({ id: crypto.randomUUID?.() ?? String(Date.now() + Math.random()), title, category, due, completed: false });
  commit();
}
function updateTask(id, patch) {
  tasks = tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
  commit();
}
function deleteTask(id, el) {
  const remove = () => { tasks = tasks.filter((t) => t.id !== id); commit(); };
  if (el) { el.classList.add("removing"); setTimeout(remove, 250); } else remove();
}
function commit() { saveToLocalStorage(); render(); }

/* ---------- Helpers ---------- */
const today = () => new Date().toISOString().slice(0, 10);
function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
const fmtDate = (d) => new Date(d + "T00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
function formatDue(due) {
  if (!due) return "";
  const late = due < today();
  return `<span class="${late ? "overdue" : ""}">📅 ${fmtDate(due)}${late ? " · overdue" : ""}</span>`;
}
function stats(cat) {
  const l = cat === "all" ? tasks : tasks.filter((t) => t.category === cat);
  const done = l.filter((t) => t.completed).length;
  return { total: l.length, done, pct: l.length ? Math.round((done / l.length) * 100) : 0 };
}

/* ---------- Rendering ---------- */
function visibleTasks() {
  return tasks.filter((t) =>
    (statusFilter === "all" || (statusFilter === "completed") === t.completed) &&
    (categoryFilter === "all" || t.category === categoryFilter) &&
    t.title.toLowerCase().includes(query)
  );
}

function render() {
  const items = visibleTasks();
  list.innerHTML = items.map((t) => {
    const m = META[t.category] || META.all;
    return `
    <li class="task ${t.completed ? "done" : ""}" data-id="${t.id}" data-cat="${esc(t.category)}" draggable="true">
      <input type="checkbox" ${t.completed ? "checked" : ""} aria-label="Mark complete" />
      <span class="av ${m.dark ? "dark" : ""}" style="--c:${m.c}" aria-hidden="true">${m.letter}</span>
      <div class="task-body">
        ${editingId === t.id
          ? `<input class="edit-input" value="${esc(t.title).replace(/"/g, "&quot;")}" maxlength="120" aria-label="Edit task" />`
          : `<span class="task-title">${esc(t.title)}</span>`}
        <div class="meta"><span class="chip">${esc(t.category)}</span>${t.completed ? '<span class="chip done">Done</span>' : ""}${formatDue(t.due)}</div>
      </div>
      <button class="icon edit" title="Edit" aria-label="Edit task">${editingId === t.id ? "💾" : "✏️"}</button>
      <button class="icon del" title="Delete" aria-label="Delete task">🗑️</button>
    </li>`;
  }).join("");
  $("#empty").hidden = items.length > 0;
  const all = stats("all");
  $("#summary").textContent = all.total
    ? `${all.total - all.done} active · ${all.done} completed · ${all.total} total`
    : "Nothing planned yet — add your first task";
  const ei = list.querySelector(".edit-input");
  if (ei) { ei.focus(); ei.setSelectionRange(ei.value.length, ei.value.length); }
  renderDashboard();
}

function renderDashboard() {
  const keys = ["all", ...CATS];
  const s = Object.fromEntries(keys.map((k) => [k, stats(k)]));

  // Progress bars per category
  $("#gantt").innerHTML = keys.map((k) => {
    const m = META[k];
    return `<div class="g-row">
      <div class="g-label"><span class="av ${m.dark ? "dark" : ""}" style="--c:${m.c}" aria-hidden="true">${m.letter}</span>
        <div>${m.label}<small>${s[k].done}/${s[k].total} done</small></div></div>
      <div class="g-track" style="--cl:${m.cl}" role="progressbar" aria-label="${m.label} progress" aria-valuenow="${s[k].pct}" aria-valuemin="0" aria-valuemax="100">
        <div class="g-fill ${m.dark ? "dark" : ""}" style="--c:${m.c};width:${Math.max(s[k].pct, 0)}%">${s[k].pct}%</div>
      </div></div>`;
  }).join("");

  // Efficiency rings
  $("#rings").innerHTML = keys.map((k) => `<div><div class="ring" style="--c:${META[k].c};--p:${s[k].pct}" role="img" aria-label="${META[k].label} ${s[k].pct}% complete"><span>${s[k].pct}</span></div><b>${META[k].label}</b></div>`).join("");

  // Completed vs remaining bars
  const max = Math.max(1, ...CATS.map((c) => s[c].total));
  $("#bars").innerHTML = CATS.map((c) => {
    const m = META[c], done = s[c].done, left = s[c].total - done;
    return `<div class="bar-group" role="img" aria-label="${c}: ${done} completed, ${left} remaining">
      <div class="bar-pair" style="--c:${m.c};--cl:${m.cl}"><i style="height:${(done / max) * 100}%"></i><i class="l" style="height:${(left / max) * 100}%"></i></div>
      <strong>${done}</strong><small>${c}</small></div>`;
  }).join("");

  // Plan: next upcoming / overdue tasks with a due date
  const upcoming = tasks.filter((t) => !t.completed && t.due).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);
  $("#plan").innerHTML = upcoming.length
    ? upcoming.map((t) => `<li style="--c:${(META[t.category] || META.all).c}"><b>${esc(t.title)}</b><span class="${t.due < today() ? "late" : ""}">${t.due === today() ? "Today" : fmtDate(t.due)}</span></li>`).join("")
    : '<li class="none">No upcoming deadlines 🎉</li>';

  $("#side-progress").textContent = s.all.pct + "%";
}

/* ---------- Category selection (sidebar + dropdown stay in sync) ---------- */
function setCategory(cat) {
  categoryFilter = cat;
  $("#category-filter").value = cat;
  document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
  $("#crumb-cat").textContent = cat === "all" ? "Today" : cat;
  render();
}

/* ---------- Events ---------- */
$("#task-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = $("#task-input").value.trim();
  if (!title) { $("#error").textContent = "Please enter a task title."; return; }
  $("#error").textContent = "";
  addTask(title, $("#category-input").value, $("#due-input").value);
  e.target.reset();
  $("#task-input").focus();
});

document.querySelectorAll(".filter").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll(".filter").forEach((x) => x.classList.remove("active"));
  b.classList.add("active");
  statusFilter = b.dataset.filter;
  render();
}));
document.querySelectorAll(".nav-item").forEach((b) => b.addEventListener("click", () => setCategory(b.dataset.cat)));
$("#category-filter").addEventListener("change", (e) => setCategory(e.target.value));
$("#search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
$("#clear-completed").addEventListener("click", () => { tasks = tasks.filter((t) => !t.completed); commit(); });

function finishEdit(li) {
  const val = li.querySelector(".edit-input")?.value.trim();
  const id = li.dataset.id;
  editingId = null;
  val ? updateTask(id, { title: val }) : render();
}

list.addEventListener("click", (e) => {
  const li = e.target.closest(".task");
  if (!li) return;
  const id = li.dataset.id;
  if (e.target.matches('input[type="checkbox"]')) updateTask(id, { completed: e.target.checked });
  else if (e.target.closest(".del")) deleteTask(id, li);
  else if (e.target.closest(".edit")) editingId === id ? finishEdit(li) : ((editingId = id), render());
});
list.addEventListener("keydown", (e) => {
  if (!e.target.matches(".edit-input")) return;
  const li = e.target.closest(".task");
  if (e.key === "Enter") finishEdit(li);
  if (e.key === "Escape") { editingId = null; render(); }
});

/* ---------- Drag & drop reordering ---------- */
list.addEventListener("dragstart", (e) => {
  const li = e.target.closest(".task");
  if (!li) return;
  dragId = li.dataset.id;
  li.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", dragId);
});
list.addEventListener("dragover", (e) => {
  e.preventDefault();
  list.querySelectorAll(".drag-over").forEach((x) => x.classList.remove("drag-over"));
  e.target.closest(".task")?.classList.add("drag-over");
});
list.addEventListener("dragend", () => { dragId = null; render(); });
list.addEventListener("drop", (e) => {
  e.preventDefault();
  const target = e.target.closest(".task");
  if (!target || !dragId || target.dataset.id === dragId) return;
  const from = tasks.findIndex((t) => t.id === dragId);
  const [moved] = tasks.splice(from, 1);
  tasks.splice(tasks.findIndex((t) => t.id === target.dataset.id), 0, moved);
  dragId = null;
  commit();
});

/* ---------- Init ---------- */
$("#today-label").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
loadFromLocalStorage();
render();
