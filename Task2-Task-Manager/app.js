"use strict";

const STORAGE_KEY = "datheon.tasks.v1";
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
    tasks = Array.isArray(data) ? data : [];
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

/* ---------- Rendering ---------- */
function visibleTasks() {
  return tasks.filter((t) =>
    (statusFilter === "all" || (statusFilter === "completed") === t.completed) &&
    (categoryFilter === "all" || t.category === categoryFilter) &&
    t.title.toLowerCase().includes(query)
  );
}
function formatDue(due) {
  if (!due) return "";
  const today = new Date().toISOString().slice(0, 10);
  const label = new Date(due + "T00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `<span class="${due < today ? "overdue" : ""}">📅 ${label}${due < today ? " (overdue)" : ""}</span>`;
}
function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

function render() {
  const items = visibleTasks();
  list.innerHTML = items.map((t) => `
    <li class="task ${t.completed ? "done" : ""}" data-id="${t.id}" data-cat="${t.category}" draggable="true">
      <input type="checkbox" ${t.completed ? "checked" : ""} aria-label="Mark complete" />
      <div class="task-body">
        ${editingId === t.id
          ? `<input class="edit-input" value="${esc(t.title).replace(/"/g, "&quot;")}" maxlength="120" aria-label="Edit task" />`
          : `<span class="task-title">${esc(t.title)}</span>`}
        <div class="meta"><span class="badge">${t.category}</span>${formatDue(t.due)}</div>
      </div>
      <button class="icon edit" title="Edit" aria-label="Edit task">${editingId === t.id ? "💾" : "✏️"}</button>
      <button class="icon del" title="Delete" aria-label="Delete task">🗑️</button>
    </li>`).join("");
  $("#empty").hidden = items.length > 0;
  const done = tasks.filter((t) => t.completed).length;
  $("#summary").textContent = tasks.length ? `${tasks.length - done} active · ${done} completed · ${tasks.length} total` : "Nothing planned yet";
  const ei = list.querySelector(".edit-input");
  if (ei) { ei.focus(); ei.setSelectionRange(ei.value.length, ei.value.length); }
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
$("#category-filter").addEventListener("change", (e) => { categoryFilter = e.target.value; render(); });
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
loadFromLocalStorage();
render();
