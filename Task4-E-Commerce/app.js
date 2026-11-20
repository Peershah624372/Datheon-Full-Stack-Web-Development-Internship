"use strict";

const API = "https://fakestoreapi.com/products";
const TAX_RATE = 0.08;
const SHIPPING_FLAT = 5.99;
const FREE_SHIPPING_OVER = 100;
const CART_KEY = "datheon.cart.v1";

let products = [];
let cart = []; // { id, qty }  (product data is looked up from `products`; snapshot kept for offline render)
let category = "all";
let query = "";
let sortBy = "default";

const $ = (s) => document.querySelector(s);
const money = (n) => `$${n.toFixed(2)}`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- Data ---------- */
async function loadProducts() {
  $("#status").innerHTML = '<div class="spinner"></div>Loading products…';
  $("#products").innerHTML = "";
  try {
    try {
      const res = await fetch(API);
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
// soft arch background per collection (matches the collection tiles)
const TINT = { electronics: "#f7d6d1", jewelery: "#d8ece1", "men's clothing": "#fbe1c6", "women's clothing": "#fbe4d8" };

function renderProducts() {
  const list = filtered();
  $("#products").innerHTML = list.map((p, i) => `
    <article class="product" style="--tint:${TINT[p.category] || "#efe6f8"};animation-delay:${Math.min(i, 12) * 40}ms">
      <span class="tag">${esc(p.category)}</span>
      ${p.rating.rate >= 4.5 ? '<span class="tag hot">Top rated!</span>' : ""}
      <div class="img" data-view="${p.id}" role="button" tabindex="0" aria-label="View details: ${esc(p.title)}"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" /></div>
      <h2>${esc(p.title)}</h2>
      <div class="rating">${stars(p.rating.rate)} <span>(${p.rating.count})</span></div>
      <div class="price-row"><span class="price">${money(p.price)}</span><button class="add" data-add="${p.id}">Add to cart</button></div>
    </article>`).join("");
  $("#count").textContent = products.length ? `(${list.length} item${list.length === 1 ? "" : "s"})` : "";
  if (!list.length) $("#status").textContent = "No products match your search.";
  else if (products.length) $("#status").textContent = "";
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
    <div class="stars">${stars(f.rating.rate)} <span>${f.rating.rate} · ${f.rating.count} reviews</span></div>
    <span class="feat-price">${money(f.price)}</span>
    <div class="feat-actions"><button class="btn btn-red" data-add="${f.id}">Add to cart</button><button class="btn btn-ghost" data-view="${f.id}">View details</button></div>`;
}

/* ---------- Cart ---------- */
function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {} }
function loadCart() {
  try {
    const c = JSON.parse(localStorage.getItem(CART_KEY));
    // keep only well-formed lines: numeric id, positive integer quantity
    cart = Array.isArray(c) ? c.filter((i) => i && Number.isInteger(i.id) && Number.isInteger(i.qty) && i.qty > 0) : [];
  } catch { cart = []; }
}
function addToCart(id) {
  const item = cart.find((i) => i.id === id);
  item ? item.qty++ : cart.push({ id, qty: 1 });
  cartChanged(true);
}
function removeFromCart(id) { cart = cart.filter((i) => i.id !== id); cartChanged(); }
function updateQuantity(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) return removeFromCart(id);
  cartChanged();
}
function calculateTotal() {
  const subtotal = cart.reduce((sum, i) => sum + (products.find((p) => p.id === i.id)?.price ?? 0) * i.qty, 0);
  const tax = subtotal * TAX_RATE;
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FLAT;
  return { subtotal, tax, shipping, total: subtotal + tax + shipping };
}
function cartChanged(bump = false) {
  saveCart();
  renderCart();
  if (bump) { const b = $("#cart-count"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); }
}

function renderCart() {
  const lines = cart.map((i) => ({ ...i, p: products.find((p) => p.id === i.id) })).filter((l) => l.p);
  $("#cart-count").textContent = lines.reduce((n, l) => n + l.qty, 0);
  $("#cart-items").innerHTML = lines.length
    ? lines.map(({ p, qty }) => `
      <div class="cart-item">
        <img src="${esc(p.image)}" alt="" />
        <div><h4>${esc(p.title)}</h4><div>${money(p.price)}</div>
          <div class="qty"><button data-dec="${p.id}" aria-label="Decrease quantity">−</button><span>${qty}</span><button data-inc="${p.id}" aria-label="Increase quantity">+</button></div></div>
        <button class="remove" data-remove="${p.id}" aria-label="Remove item">🗑️</button>
      </div>`).join("")
    : '<div class="cart-empty">🛒<br>Your cart is empty</div>';
  const t = calculateTotal();
  $("#subtotal").textContent = money(t.subtotal);
  $("#tax").textContent = money(t.tax);
  $("#shipping").textContent = t.subtotal === 0 ? "$0.00" : t.shipping === 0 ? "FREE" : money(t.shipping);
  $("#total").textContent = money(t.total);
  $("#free-note").textContent = t.subtotal > 0 && t.subtotal < FREE_SHIPPING_OVER ? `Add ${money(FREE_SHIPPING_OVER - t.subtotal)} more for free shipping!` : t.subtotal ? "🎉 You got free shipping!" : "";
  $("#checkout-btn").disabled = !lines.length;
}

function toggleDrawer(open) {
  $("#drawer").classList.toggle("open", open);
  $("#drawer").setAttribute("aria-hidden", !open);
  $("#drawer").inert = !open; // closed drawer must not be focusable
  $("#overlay").hidden = !open;
}

/* ---------- Modals ---------- */
function openModal(html) { $("#modal-content").innerHTML = html; $("#modal").hidden = false; }
function closeModal() { $("#modal").hidden = true; }
function viewProduct(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  openModal(`<img src="${esc(p.image)}" alt="${esc(p.title)}" /><h3>${esc(p.title)}</h3>
    <div class="rating">${stars(p.rating.rate)} <span>${p.rating.rate} (${p.rating.count} reviews)</span></div>
    <p>${esc(p.description)}</p><strong class="price">${money(p.price)}</strong><br>
    <button class="btn" data-add="${p.id}" data-close>Add to Cart</button><button class="btn ghost" data-close>Close</button>`);
}
function checkout() {
  const lines = cart.map((i) => ({ ...i, p: products.find((p) => p.id === i.id) })).filter((l) => l.p);
  const t = calculateTotal();
  const orderId = "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  openModal(`<div class="order-ok"><div class="check">✅</div><h3>Order Confirmed!</h3><p>Order <strong>${orderId}</strong> (simulated)</p>
    <ul>${lines.map((l) => `<li>${l.qty} × ${esc(l.p.title.slice(0, 40))}…</li>`).join("")}</ul>
    <strong>Total paid: ${money(t.total)}</strong><br><button class="btn" data-close>Continue Shopping</button></div>`);
  cart = [];
  cartChanged();
  toggleDrawer(false);
}

/* ---------- Events ---------- */
document.addEventListener("click", (e) => {
  const t = e.target;
  const add = t.closest("[data-add]");
  if (add) addToCart(+add.dataset.add);
  if (t.closest("[data-view]")) viewProduct(+t.closest("[data-view]").dataset.view);
  if (t.closest("[data-inc]")) updateQuantity(+t.closest("[data-inc]").dataset.inc, 1);
  if (t.closest("[data-dec]")) updateQuantity(+t.closest("[data-dec]").dataset.dec, -1);
  if (t.closest("[data-remove]")) removeFromCart(+t.closest("[data-remove]").dataset.remove);
  if (t.closest("[data-close]") || t.id === "modal") closeModal();
  const cat = t.closest(".cat");
  if (cat) {
    document.querySelectorAll(".cat").forEach((c) => c.classList.remove("active"));
    cat.classList.add("active");
    category = cat.dataset.cat;
    renderProducts();
  }
});
$("#cart-btn").addEventListener("click", () => toggleDrawer(true));
$("#close-cart").addEventListener("click", () => toggleDrawer(false));
$("#overlay").addEventListener("click", () => toggleDrawer(false));
$("#checkout-btn").addEventListener("click", checkout);
$("#search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); renderProducts(); });
$("#sort").addEventListener("change", (e) => { sortBy = e.target.value; renderProducts(); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeModal(); toggleDrawer(false); }
  // product image tiles act as buttons: open details with Enter / Space
  const tile = e.target.closest?.("[data-view][role=button]");
  if (tile && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); viewProduct(+tile.dataset.view); }
});

// Newsletter sign-up (demo: validates and confirms, nothing is sent)
$("#nl-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("#nl-email").value.trim(), status = $("#nl-status");
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  status.className = "nl-status" + (ok ? "" : " err");
  status.textContent = ok ? "🎉 You're in! Watch your inbox for exclusive drops." : "Please enter a valid email address.";
  if (ok) e.target.reset();
});

$("#year").textContent = new Date().getFullYear();
$("#drawer").inert = true;
loadCart();
loadProducts();
