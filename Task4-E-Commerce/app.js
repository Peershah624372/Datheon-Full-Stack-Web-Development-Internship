"use strict";

const API = "https://fakestoreapi.com/products";
const TAX_RATE = 0.08;
const SHIPPING_FLAT = 5.99;
const FREE_SHIPPING_OVER = 100;
const CART_KEY = "datheon.cart.v1";
const MAX_QTY = 10;

let products = [];
let cart = []; // { id, qty }  (product data is looked up from `products`)
let category = "all";
let query = "";
let sortBy = "default";

const $ = (s) => document.querySelector(s);
const money = (n) => `$${n.toFixed(2)}`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const short = (s, n = 40) => (s.length > n ? s.slice(0, n).trimEnd() + "…" : s);
const findProduct = (id) => products.find((p) => p.id === id);

/* ---------- Data ---------- */
async function loadProducts() {
  $("#status").innerHTML = '<div class="spinner"></div>Loading products…';
  $("#products").innerHTML = "";
  try {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000); // don't wait forever on a slow API
      const res = await fetch(API, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
      if (!res.ok) throw new Error(res.status);
      products = await res.json();
    } catch (apiErr) {
      // FakeStoreAPI unreachable: use the bundled copy of the same catalog
      console.warn("FakeStoreAPI unavailable, using local products.json", apiErr);
      const res = await fetch("products.json");
      if (!res.ok) throw new Error(res.status);
      products = await res.json();
    }
    $("#status").textContent = "";
    renderProducts();
    renderShowcase();
    renderCart();
  } catch {
    $("#status").innerHTML = '⚠️ Could not load products. Check your connection.<br><button class="retry" id="retry">Retry</button>';
    $("#retry").addEventListener("click", loadProducts);
  }
}

/* ---------- Products ---------- */
function filtered() {
  let list = products.filter((p) =>
    (category === "all" || p.category === category) &&
    (p.title.toLowerCase().includes(query) || p.category.toLowerCase().includes(query))
  );
  if (sortBy === "low") list.sort((a, b) => a.price - b.price);
  if (sortBy === "high") list.sort((a, b) => b.price - a.price);
  if (sortBy === "rating") list.sort((a, b) => b.rating.rate - a.rating.rate);
  return list;
}
const stars = (r) => "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r));
// stars are decorative; screen readers get the number instead
const ratingHTML = (r, extra) => `<span aria-hidden="true">${stars(r.rate)}</span><span class="sr-only">Rated ${r.rate} out of 5</span> <span>${extra}</span>`;
// soft arch background per collection (matches the collection tiles)
const TINT = { electronics: "#f7d6d1", jewelery: "#d8ece1", "men's clothing": "#fbe1c6", "women's clothing": "#fbe4d8" };

function renderProducts() {
  const list = filtered();
  $("#products").innerHTML = list.map((p, i) => {
    return `
    <article class="product" style="--tint:${TINT[p.category] || "#efe6f8"};animation-delay:${Math.min(i, 12) * 40}ms">
      <span class="tag">${esc(p.category)}</span>
      ${p.rating.rate >= 4.5 ? '<span class="tag hot">Top rated!</span>' : ""}
      <div class="img" data-view="${p.id}" role="button" tabindex="0" aria-label="View details: ${esc(p.title)}"><img src="${esc(p.image)}" alt="" loading="lazy" /></div>
      <h2>${esc(p.title)}</h2>
      <div class="rating">${ratingHTML(p.rating, `(${p.rating.count})`)}</div>
      <div class="price-row"><span class="price">${money(p.price)}</span><button class="add" data-add="${p.id}"></button></div>
    </article>`;
  }).join("");
  updateAddButtons();
  $("#count").textContent = products.length ? `(${list.length} item${list.length === 1 ? "" : "s"})` : "";
  if (!list.length && products.length) {
    $("#status").innerHTML = 'No products match your search. <button class="retry" id="clear-filters" type="button">Clear filters</button>';
    $("#clear-filters").addEventListener("click", clearFilters);
  } else if (products.length) $("#status").textContent = "";
}
// show how many of each product are already in the cart, without rebuilding the grid
function updateAddButtons() {
  document.querySelectorAll("#products .add").forEach((b) => {
    const id = +b.dataset.add, p = findProduct(id);
    const qty = cart.find((c) => c.id === id)?.qty ?? 0;
    b.classList.toggle("in-cart", qty > 0);
    b.textContent = qty ? `In cart (${qty}) +` : "Add to cart";
    b.setAttribute("aria-label", `Add ${short(p?.title ?? "item")} to cart${qty ? `, ${qty} in cart` : ""}`);
  });
}
function setCategory(cat) {
  category = cat;
  document.querySelectorAll(".cat").forEach((c) => {
    const on = c.dataset.cat === cat;
    c.classList.toggle("active", on);
    c.setAttribute("aria-pressed", String(on));
  });
  renderProducts();
}
function clearFilters() {
  query = "";
  $("#search").value = "";
  setCategory("all");
  $("#search").focus();
}

/* ---------- Hero scene + featured pick (filled from live product data) ---------- */
function renderShowcase() {
  const best = [...products].sort((a, b) => b.rating.rate - a.rating.rate || b.rating.count - a.rating.count);
  // one top product from each of three different collections for the hero pedestals
  const picks = [];
  for (const p of best) if (!picks.some((x) => x.category === p.category) && picks.length < 3) picks.push(p);
  picks.forEach((p, i) => { const img = $("#hp" + (i + 1)); img.src = p.image; });

  const f = best[0];
  if (!f) return;
  $("#feat-img").src = f.image;
  const second = best.find((p) => p.category !== f.category);
  if (second) $("#feat-img2").src = second.image;
  $("#feat-info").innerHTML = `
    <h3>${esc(f.title)}</h3>
    <div class="stars">${ratingHTML(f.rating, `${f.rating.rate} · ${f.rating.count} reviews`)}</div>
    <span class="feat-price">${money(f.price)}</span>
    <div class="feat-actions"><button class="btn btn-red" data-add="${f.id}">Add to cart</button><button class="btn btn-ghost" data-view="${f.id}">View details</button></div>`;
}

/* ---------- Cart ---------- */
function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {} }
function loadCart() {
  try {
    const c = JSON.parse(localStorage.getItem(CART_KEY));
    // keep only well-formed lines: numeric id, positive integer quantity
    cart = Array.isArray(c) ? c.filter((i) => i && Number.isInteger(i.id) && Number.isInteger(i.qty) && i.qty > 0).map((i) => ({ id: i.id, qty: Math.min(i.qty, MAX_QTY) })) : [];
  } catch { cart = []; }
}
function addToCart(id) {
  const p = findProduct(id);
  if (!p) return;
  const item = cart.find((i) => i.id === id);
  if (item && item.qty >= MAX_QTY) return showToast(`Maximum ${MAX_QTY} per item.`);
  item ? item.qty++ : cart.push({ id, qty: 1 });
  cartChanged(true);
  showToast(`Added “${short(p.title, 32)}” to your cart.`, true);
}
function removeFromCart(id) { cart = cart.filter((i) => i.id !== id); cartChanged(); }
function updateQuantity(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty = Math.min(MAX_QTY, item.qty + delta);
  if (item.qty <= 0) return removeFromCart(id);
  cartChanged();
}
function calculateTotal() {
  const subtotal = cart.reduce((sum, i) => sum + (findProduct(i.id)?.price ?? 0) * i.qty, 0);
  const tax = subtotal * TAX_RATE;
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FLAT;
  return { subtotal, tax, shipping, total: subtotal + tax + shipping };
}
const cartLines = () => cart.map((i) => ({ ...i, p: findProduct(i.id) })).filter((l) => l.p);
function cartChanged(bump = false) {
  saveCart();
  renderCart();
  updateAddButtons(); // refresh the "In cart" state on product buttons
  if (bump) { const b = $("#cart-count"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); }
}

function renderCart() {
  const lines = cartLines();
  const count = lines.reduce((n, l) => n + l.qty, 0);
  $("#cart-count").textContent = count;
  $("#cart-btn").setAttribute("aria-label", `Open cart, ${count} item${count === 1 ? "" : "s"}`);
  // keep focus on the same control after the list is rebuilt (e.g. pressing + repeatedly)
  const active = document.activeElement;
  const keep = active && $("#cart-items").contains(active) ? [...active.attributes].find((a) => /^data-(inc|dec|remove)$/.test(a.name)) : null;
  $("#cart-items").innerHTML = lines.length
    ? lines.map(({ p, qty }) => `
      <div class="cart-item">
        <img src="${esc(p.image)}" alt="" />
        <div><h4>${esc(p.title)}</h4><div>${money(p.price)}${qty > 1 ? ` <small>· ${money(p.price * qty)}</small>` : ""}</div>
          <div class="qty" role="group" aria-label="Quantity for ${esc(short(p.title))}">
            <button data-dec="${p.id}" aria-label="${qty === 1 ? "Remove" : "Decrease quantity of"} ${esc(short(p.title))}">−</button>
            <span aria-live="polite">${qty}</span>
            <button data-inc="${p.id}" aria-label="Increase quantity of ${esc(short(p.title))}" ${qty >= MAX_QTY ? "disabled" : ""}>+</button></div></div>
        <button class="remove" data-remove="${p.id}" aria-label="Remove ${esc(short(p.title))} from cart">🗑️</button>
      </div>`).join("")
    : '<div class="cart-empty">🛒<br>Your cart is empty<br><a href="#shop" class="btn btn-ghost" data-close-drawer>Browse products</a></div>';
  if (keep) {
    const again = $("#cart-items").querySelector(`[${keep.name}="${keep.value}"]`);
    (again && !again.disabled ? again : $("#close-cart")).focus();
  }
  const t = calculateTotal();
  $("#subtotal").textContent = money(t.subtotal);
  $("#tax").textContent = money(t.tax);
  $("#shipping").textContent = t.subtotal === 0 ? "$0.00" : t.shipping === 0 ? "FREE" : money(t.shipping);
  $("#total").textContent = money(t.total);
  $("#free-note").textContent = t.subtotal > 0 && t.subtotal < FREE_SHIPPING_OVER ? `Add ${money(FREE_SHIPPING_OVER - t.subtotal)} more for free shipping!` : t.subtotal ? "🎉 You got free shipping!" : "";
  $("#checkout-btn").disabled = !lines.length;
}

/* ---------- Focus helpers (drawer + modal) ---------- */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex="0"]';
function trapFocus(e, container) {
  const f = [...container.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

let drawerReturn = null;
function toggleDrawer(open) {
  const d = $("#drawer");
  if (d.classList.contains("open") === open) return;
  d.classList.toggle("open", open);
  d.setAttribute("aria-hidden", String(!open));
  d.inert = !open; // closed drawer must not be focusable
  $("#overlay").hidden = !open;
  $("#cart-btn").setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("no-scroll", open);
  if (open) { drawerReturn = document.activeElement; $("#close-cart").focus(); }
  else if ($("#modal").hidden) (drawerReturn || $("#cart-btn")).focus?.();
}

let modalReturn = null;
function openModal(html) {
  if ($("#modal").hidden) modalReturn = document.activeElement;
  $("#modal-content").innerHTML = html;
  $("#modal").hidden = false;
  document.body.classList.add("no-scroll");
  ($("#modal-content").querySelector("[autofocus]") || $(".modal-x")).focus();
}
function closeModal() {
  if ($("#modal").hidden) return;
  $("#modal").hidden = true;
  if (!$("#drawer").classList.contains("open")) document.body.classList.remove("no-scroll");
  const back = modalReturn && document.contains(modalReturn) && !modalReturn.closest("[inert]") ? modalReturn : $("#cart-btn");
  back.focus?.();
}
function viewProduct(id) {
  const p = findProduct(id);
  if (!p) return;
  openModal(`<img src="${esc(p.image)}" alt="${esc(p.title)}" /><h3 id="modal-title">${esc(p.title)}</h3>
    <div class="rating">${ratingHTML(p.rating, `${p.rating.rate} (${p.rating.count} reviews)`)}</div>
    <p>${esc(p.description)}</p><strong class="price">${money(p.price)}</strong><br>
    <button class="btn" data-add="${p.id}" data-close>Add to Cart</button><button class="btn ghost" data-close>Close</button>`);
}

/* ---------- Checkout: details form -> validation -> confirmation ---------- */
function checkout() {
  const lines = cartLines();
  if (!lines.length) return;
  const t = calculateTotal();
  toggleDrawer(false);
  openModal(`<h3 id="modal-title">Checkout</h3>
    <p>${lines.reduce((n, l) => n + l.qty, 0)} item(s) · <strong>${money(t.total)}</strong> incl. tax &amp; shipping</p>
    <form id="checkout-form" class="co-form" novalidate>
      <label>Full name <input name="name" autocomplete="name" required autofocus /></label>
      <label>Email <input name="email" type="email" autocomplete="email" required /></label>
      <label class="wide">Address <input name="address" autocomplete="street-address" required /></label>
      <label>City <input name="city" autocomplete="address-level2" required /></label>
      <label>Postal code <input name="zip" autocomplete="postal-code" inputmode="numeric" required /></label>
      <fieldset class="wide"><legend>Payment (simulated)</legend>
        <label class="radio"><input type="radio" name="pay" value="Card" checked /> Card</label>
        <label class="radio"><input type="radio" name="pay" value="Cash on delivery" /> Cash on delivery</label>
      </fieldset>
      <p class="co-error wide" id="co-error" role="alert"></p>
      <div class="wide co-actions"><button class="btn" type="submit">Place order · ${money(t.total)}</button><button class="btn ghost" type="button" data-close>Cancel</button></div>
    </form>`);
}
const CHECKS = {
  name: (v) => (v.length >= 2 ? "" : "Please enter your full name."),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Please enter a valid email address."),
  address: (v) => (v.length >= 5 ? "" : "Please enter your street address."),
  city: (v) => (v.length >= 2 ? "" : "Please enter your city."),
  zip: (v) => (/^[A-Za-z0-9 -]{3,10}$/.test(v) ? "" : "Please enter a valid postal code."),
};
function placeOrder(form) {
  let firstBad = null, msg = "";
  for (const [name, check] of Object.entries(CHECKS)) {
    const input = form.elements[name];
    const err = check(input.value.trim());
    input.toggleAttribute("aria-invalid", !!err);
    if (err && !firstBad) { firstBad = input; msg = err; }
  }
  if (firstBad) { $("#co-error").textContent = msg; firstBad.focus(); return; }

  const lines = cartLines();
  const t = calculateTotal();
  const name = form.elements.name.value.trim();
  const email = form.elements.email.value.trim();
  const pay = form.elements.pay.value;
  const orderId = "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  openModal(`<div class="order-ok"><div class="check" aria-hidden="true">✅</div><h3 id="modal-title">Order Confirmed!</h3>
    <p>Thank you, ${esc(name)}! Order <strong>${orderId}</strong> (simulated) · ${esc(pay)}</p>
    <ul>${lines.map((l) => `<li><span>${l.qty} × ${esc(short(l.p.title))}</span><span>${money(l.p.price * l.qty)}</span></li>`).join("")}</ul>
    <div class="order-sum"><span>Subtotal</span><span>${money(t.subtotal)}</span><span>Tax</span><span>${money(t.tax)}</span><span>Shipping</span><span>${t.shipping ? money(t.shipping) : "FREE"}</span><strong>Total paid</strong><strong>${money(t.total)}</strong></div>
    <p class="muted">A confirmation would be sent to ${esc(email)}.</p>
    <button class="btn" data-close autofocus>Continue Shopping</button></div>`);
  cart = [];
  cartChanged();
}

/* ---------- Toast ---------- */
let toastTimer = null;
function showToast(msg, withCartLink = false) {
  $("#toast-msg").textContent = msg;
  $("#toast-view").hidden = !withCartLink;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 3500);
}
$("#toast-view").addEventListener("click", () => { $("#toast").hidden = true; toggleDrawer(true); });

/* ---------- Events ---------- */
document.addEventListener("click", (e) => {
  const t = e.target;
  const add = t.closest("[data-add]");
  if (add) addToCart(+add.dataset.add);
  if (t.closest("[data-view]")) viewProduct(+t.closest("[data-view]").dataset.view);
  if (t.closest("[data-inc]")) updateQuantity(+t.closest("[data-inc]").dataset.inc, 1);
  if (t.closest("[data-dec]")) updateQuantity(+t.closest("[data-dec]").dataset.dec, -1);
  if (t.closest("[data-remove]")) removeFromCart(+t.closest("[data-remove]").dataset.remove);
  if (t.closest("[data-close-drawer]")) toggleDrawer(false);
  if (t.closest("[data-close]") || t.id === "modal") closeModal();
  const cat = t.closest(".cat");
  if (cat) setCategory(cat.dataset.cat);
});
document.addEventListener("submit", (e) => {
  if (e.target.id !== "checkout-form") return;
  e.preventDefault();
  placeOrder(e.target);
});
document.addEventListener("input", (e) => { if (e.target.closest("#checkout-form")) e.target.removeAttribute("aria-invalid"); });
$("#cart-btn").addEventListener("click", () => toggleDrawer(true));
$("#close-cart").addEventListener("click", () => toggleDrawer(false));
$("#overlay").addEventListener("click", () => toggleDrawer(false));
$("#checkout-btn").addEventListener("click", checkout);
$("#search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); renderProducts(); });
$("#sort").addEventListener("change", (e) => { sortBy = e.target.value; renderProducts(); });
document.addEventListener("keydown", (e) => {
  const modalOpen = !$("#modal").hidden, drawerOpen = $("#drawer").classList.contains("open");
  if (e.key === "Escape") { if (modalOpen) closeModal(); else if (drawerOpen) toggleDrawer(false); }
  if (e.key === "Tab") { if (modalOpen) trapFocus(e, $("#modal")); else if (drawerOpen) trapFocus(e, $("#drawer")); }
  // product image tiles act as buttons: open details with Enter / Space
  const tile = e.target.closest?.("[data-view][role=button]");
  if (tile && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); viewProduct(+tile.dataset.view); }
});
// keep the cart in sync across open tabs
addEventListener("storage", (e) => { if (e.key === CART_KEY) { loadCart(); renderCart(); updateAddButtons(); } });

// Newsletter sign-up (demo: validates and confirms, nothing is sent)
$("#nl-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#nl-email"), email = input.value.trim(), status = $("#nl-status");
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  status.className = "nl-status" + (ok ? "" : " err");
  status.textContent = ok ? "🎉 You're in! Watch your inbox for exclusive drops." : "Please enter a valid email address.";
  input.toggleAttribute("aria-invalid", !ok);
  if (ok) e.target.reset(); else input.focus();
});

$("#year").textContent = new Date().getFullYear();
$("#drawer").inert = true;
loadCart();
loadProducts();
