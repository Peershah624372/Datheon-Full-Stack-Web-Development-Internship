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
let sortMode = "manual";
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
    tasks = Array.isArray(data)
      ? data.filter((t) => t && typeof t.title === "string" && t.id).map((t) => ({
          id: String(t.id),
          title: t.title.slice(0, 120),
          category: CATS.includes(t.category) ? t.category : "Work",
          due: /^\d{4}-\d{2}-\d{2}$/.test(t.due) ? t.due : "",
          completed: !!t.completed,
        }))
      : [];
  } catch { tasks = []; }
}

/* ---------- CRUD ---------- */
const newId = () => crypto.randomUUID?.() ?? String(Date.now() + Math.random());
function addTask(title, category, due) {
  tasks.unshift({ id: newId(), title, category, due, completed: false });
  commit();
}
function updateTask(id, patch, focus) {
  tasks = tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
  commit(focus);
}
function deleteTask(id, el) {
  if (!tasks.some((t) => t.id === id)) return;
  // remember where focus should go: the next task, else the previous one, else the input
  const next = el?.nextElementSibling?.dataset.id || el?.previousElementSibling?.dataset.id;
  const remove = () => {
    const index = tasks.findIndex((t) => t.id === id); // look up again: the list may have changed during the animation
    if (index < 0) return;
    const [task] = tasks.splice(index, 1);
    commit(next ? { id: next, sel: 'input[type="checkbox"]' } : { el: "#task-input" });
    offerUndo(`Deleted “${task.title.length > 28 ? task.title.slice(0, 28) + "…" : task.title}”`, [{ task, index }]);
  };
  if (el && !matchMedia("(prefers-reduced-motion: reduce)").matches) { el.classList.add("removing"); setTimeout(remove, 250); } else remove();
}
function commit(focus) { saveToLocalStorage(); render(focus); }

/* ---------- Undo toast ---------- */
let undoItems = null, toastTimer = null;
function offerUndo(message, removed) {
  undoItems = removed;
  $("#toast-msg").textContent = message;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 6000);
}
function hideToast() { $("#toast").hidden = true; undoItems = null; }
$("#toast-undo").addEventListener("click", () => {
  if (!undoItems) return;
  // put tasks back at their original positions (lowest index first)
  undoItems.sort((a, b) => a.index - b.index).forEach(({ task, index }) => tasks.splice(Math.min(index, tasks.length), 0, task));
  const first = undoItems[0].task.id;
  hideToast();
  commit({ id: first, sel: 'input[type="checkbox"]' });
});

/* ---------- Helpers ---------- */
// local calendar date (YYYY-MM-DD); toISOString() would give the UTC date and be off by a day near midnight
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
const fmtDate = (d) => new Date(d + "T00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
function formatDue(t) {
  if (!t.due) return "";
  const now = today();
  const late = !t.completed && t.due < now;
  const isToday = t.due === now;
  return `<span class="${late ? "overdue" : isToday && !t.completed ? "due-today" : ""}">📅 ${isToday ? "Today" : fmtDate(t.due)}${late ? " · overdue" : ""}</span>`;
}
function stats(cat) {
  const l = cat === "all" ? tasks : tasks.filter((t) => t.category === cat);
  const done = l.filter((t) => t.completed).length;
  return { total: l.length, done, pct: l.length ? Math.round((done / l.length) * 100) : 0 };
}
let srTimer;
function announce(msg) {
  let sr = $("#sr-status");
  if (!sr) { sr = Object.assign(document.createElement("div"), { id: "sr-status", className: "sr-only" }); sr.setAttribute("aria-live", "polite"); document.body.appendChild(sr); }
  sr.textContent = msg;
  clearTimeout(srTimer); srTimer = setTimeout(() => (sr.textContent = ""), 2000);
}

/* ---------- Rendering ---------- */
function visibleTasks() {
  const l = tasks.filter((t) =>
    (statusFilter === "all" || (statusFilter === "completed") === t.completed) &&
    (categoryFilter === "all" || t.category === categoryFilter) &&
    t.title.toLowerCase().includes(query)
  );
  if (sortMode === "due") l.sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
  if (sortMode === "az") l.sort((a, b) => a.title.localeCompare(b.title));
  return l;
}

function taskHTML(t) {
  const m = META[t.category] || META.all;
  const title = esc(t.title);
  const editing = editingId === t.id;
  const body = editing
    ? `<div class="edit-form">
        <input class="edit-input" value="${title.replace(/"/g, "&quot;")}" maxlength="120" aria-label="Task title" />
        <div class="edit-row">
          <select class="edit-cat" aria-label="Category">${CATS.map((c) => `<option ${c === t.category ? "selected" : ""}>${c}</option>`).join("")}</select>
          <input type="date" class="edit-due" value="${t.due || ""}" aria-label="Due date" />
        </div>
        <small class="edit-help">Enter to save · Esc to cancel</small>
      </div>`
    : `<span class="task-title">${title}</span>
       <div class="meta"><span class="chip">${esc(t.category)}</span>${t.completed ? '<span class="chip done">Done</span>' : ""}${formatDue(t)}</div>`;
  return `
    <li class="task ${t.completed ? "done" : ""} ${editing ? "editing" : ""}" data-id="${esc(t.id)}" data-cat="${esc(t.category)}" draggable="${sortMode === "manual" && !editing}">
      <input type="checkbox" ${t.completed ? "checked" : ""} aria-label="Mark “${title}” as ${t.completed ? "not done" : "done"}" />
      <span class="av ${m.dark ? "dark" : ""}" style="--c:${m.c}" aria-hidden="true">${m.letter}</span>
      <div class="task-body">${body}</div>
      <button class="icon edit" type="button" title="${editing ? "Save" : "Edit"}" aria-label="${editing ? "Save changes to" : "Edit"} “${title}”">${editing ? "💾" : "✏️"}</button>
      <button class="icon del" type="button" title="Delete" aria-label="Delete “${title}”">🗑️</button>
    </li>`;
}

/**
 * Re-render everything. `focus` restores keyboard focus after the list is rebuilt:
 *   { id, sel } -> element matching `sel` inside the task with that id
 *   { el }      -> any element by selector
 */
function render(focus) {
  const items = visibleTasks();
  list.innerHTML = items.map(taskHTML).join("");

  const empty = $("#empty");
  empty.hidden = items.length > 0;
  empty.textContent = tasks.length ? "No tasks match these filters. Try another filter or search." : "No tasks yet — add your first one above! 🎉";

  const all = stats("all");
  const overdue = tasks.filter((t) => !t.completed && t.due && t.due < today()).length;
  $("#summary").textContent = all.total
    ? `${all.total - all.done} active · ${all.done} completed · ${all.total} total${overdue ? ` · ${overdue} overdue` : ""}`
    : "Nothing planned yet — add your first task";
  $("#clear-completed").disabled = all.done === 0;
  $("#hint").textContent = sortMode === "manual" ? "Tip: drag tasks, or press Alt + ↑/↓, to reorder" : "Switch sort to “My order” to reorder tasks";

  const ei = list.querySelector(".edit-input");
  if (ei) { ei.focus(); ei.setSelectionRange(ei.value.length, ei.value.length); }
  else if (focus?.id) list.querySelector(`[data-id="${CSS.escape(focus.id)}"] ${focus.sel}`)?.focus();
  else if (focus?.el) $(focus.el)?.focus();
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
  const now = today();
  const upcoming = tasks.filter((t) => !t.completed && t.due).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);
  $("#plan").innerHTML = upcoming.length
    ? upcoming.map((t) => `<li style="--c:${(META[t.category] || META.all).c}"><b>${esc(t.title)}</b><span class="${t.due < now ? "late" : ""}">${t.due === now ? "Today" : fmtDate(t.due)}</span></li>`).join("")
    : '<li class="none">No upcoming deadlines 🎉</li>';

  $("#side-progress").textContent = s.all.pct + "%";
}

/* ---------- Category selection (sidebar + dropdown stay in sync) ---------- */
function setCategory(cat) {
  categoryFilter = cat;
  $("#category-filter").value = cat;
  document.querySelectorAll(".nav-item").forEach((b) => {
    const on = b.dataset.cat === cat;
    b.classList.toggle("active", on);
    on ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current");
  });
  $("#crumb-cat").textContent = cat === "all" ? "Today" : cat;
  // new tasks default to the category being viewed
  if (cat !== "all") $("#category-input").value = cat;
  render();
}

/* ---------- Events ---------- */
$("#task-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#task-input");
  const title = input.value.trim();
  if (!title) {
    $("#error").textContent = "Please enter a task title.";
    input.setAttribute("aria-invalid", "true");
    input.focus();
    return;
  }
  $("#error").textContent = "";
  input.removeAttribute("aria-invalid");
  const cat = $("#category-input").value;
  addTask(title, cat, $("#due-input").value);
  input.value = "";
  $("#due-input").value = "";
  input.focus();
  announce(`Added “${title}” to ${cat}`);
});
$("#task-input").addEventListener("input", (e) => { if (e.target.value.trim()) { $("#error").textContent = ""; e.target.removeAttribute("aria-invalid"); } });

document.querySelectorAll(".filter").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll(".filter").forEach((x) => { x.classList.toggle("active", x === b); x.setAttribute("aria-pressed", String(x === b)); });
  statusFilter = b.dataset.filter;
  render();
}));
document.querySelectorAll(".nav-item").forEach((b) => b.addEventListener("click", () => setCategory(b.dataset.cat)));
$("#category-filter").addEventListener("change", (e) => setCategory(e.target.value));
$("#sort").addEventListener("change", (e) => { sortMode = e.target.value; render(); });
$("#search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
$("#clear-completed").addEventListener("click", () => {
  const removed = tasks.map((task, index) => ({ task, index })).filter(({ task }) => task.completed);
  if (!removed.length) return;
  tasks = tasks.filter((t) => !t.completed);
  commit({ el: "#task-input" });
  offerUndo(`Cleared ${removed.length} completed task${removed.length === 1 ? "" : "s"}`, removed);
});

function finishEdit(li) {
  const id = li.dataset.id;
  const title = li.querySelector(".edit-input")?.value.trim();
  const category = li.querySelector(".edit-cat")?.value;
  const due = li.querySelector(".edit-due")?.value ?? "";
  editingId = null;
  const focus = { id, sel: ".edit" };
  title ? updateTask(id, { title, category, due }, focus) : render(focus);
}
function cancelEdit(li) { editingId = null; render({ id: li.dataset.id, sel: ".edit" }); }

list.addEventListener("click", (e) => {
  const li = e.target.closest(".task");
  if (!li) return;
  const id = li.dataset.id;
  if (e.target.matches('input[type="checkbox"]')) {
    updateTask(id, { completed: e.target.checked }, { id, sel: 'input[type="checkbox"]' });
    announce(e.target.checked ? "Task completed" : "Task marked as not done");
  }
  else if (e.target.closest(".del")) deleteTask(id, li);
  else if (e.target.closest(".edit")) editingId === id ? finishEdit(li) : ((editingId = id), render());
});
list.addEventListener("keydown", (e) => {
  const li = e.target.closest(".task");
  if (!li) return;
  // editing: Enter saves, Escape cancels (from any field in the edit form)
  if (e.target.closest(".edit-form")) {
    if (e.key === "Enter") { e.preventDefault(); finishEdit(li); }
    if (e.key === "Escape") { e.preventDefault(); cancelEdit(li); }
    return;
  }
  // keyboard reordering: Alt + ArrowUp / ArrowDown
  if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown") && sortMode === "manual") {
    e.preventDefault();
    const vis = visibleTasks();
    const i = vis.findIndex((t) => t.id === li.dataset.id);
    const j = i + (e.key === "ArrowUp" ? -1 : 1);
    if (i < 0 || j < 0 || j >= vis.length) return;
    const a = tasks.findIndex((t) => t.id === vis[i].id), b = tasks.findIndex((t) => t.id === vis[j].id);
    [tasks[a], tasks[b]] = [tasks[b], tasks[a]];
    const sel = e.target.matches('input[type="checkbox"]') ? 'input[type="checkbox"]' : e.target.matches(".del") ? ".del" : ".edit";
    commit({ id: li.dataset.id, sel });
    announce(`Moved to position ${j + 1} of ${vis.length}`);
  }
});

// global shortcuts: "/" focuses search, "n" focuses the new-task field
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest("input, select, textarea")) return;
  if (e.key === "/") { e.preventDefault(); $("#search").focus(); }
  if (e.key === "n" || e.key === "N") { e.preventDefault(); $("#task-input").focus(); }
});

/* ---------- Drag & drop reordering ---------- */
list.addEventListener("dragstart", (e) => {
  const li = e.target.closest(".task");
  if (!li || sortMode !== "manual") return;
  dragId = li.dataset.id;
  li.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", dragId);
});
list.addEventListener("dragover", (e) => {
  if (!dragId) return;
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

// keep tabs in sync: changes made in another tab show up here
addEventListener("storage", (e) => { if (e.key === STORAGE_KEY) { loadFromLocalStorage(); render(); } });

/* ---------- Init ---------- */
$("#today-label").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
loadFromLocalStorage();
render();
