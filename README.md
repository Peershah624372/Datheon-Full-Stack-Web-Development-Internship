# Datheon Full Stack Web Development Internship

All four internship tasks, built with vanilla HTML5, CSS3 and JavaScript (ES6+). No build step and no server are needed: open any `index.html`, or host the repo on GitHub Pages.

| # | Project | Level | Highlights |
|---|---------|-------|------------|
| 1 | [Developer Portfolio](Task1-Portfolio/) | Beginner | Clean, modern design with an animated terminal hero, filterable project grid with modal popups, skills, experience/education timeline, web résumé + downloadable PDF, mobile-first Flexbox/Grid layout, dark/light theme (follows the system, choice saved), smooth scroll, hamburger menu, per-field form validation, skip link, keyboard focus handling, reduced-motion support |
| 2 | [Task Manager (CRUD)](Task2-Task-Manager/) | Beginner | Dashboard layout with category sidebar, progress bars, efficiency rings, completed-tasks chart and upcoming-deadline plan. Add/edit/delete, categories (Work/Personal/Study), due dates + overdue flag, All/Active/Completed filters, search, drag-and-drop or Alt + ↑/↓ reorder, edit title/category/date inline, undo for delete and "clear completed", sort by due date or A–Z, keyboard shortcuts (`/` search, `N` new task), `localStorage` persistence synced across tabs, completion animations |
| 3 | [Weather Forecast App](Task3-Weather-App/) | Intermediate | Widget dashboard: current weather, sunrise/sunset arc, hourly and 5-day forecast, precipitation, wind, humidity, pressure, UV index, air-quality gauge and alert banner. `fetch` + `async/await` + `try/catch`, loading spinner, request timeouts, invalid-city errors that keep the last result on screen, protection against out-of-order responses, recent searches, weather- and night-based themes, °C/°F (and km/h ↔ mph) remembered |
| 4 | [E-Commerce Store](Task4-E-Commerce/) | Intermediate | Architectural storefront design with arch-shaped collection filters, live hero scene and featured pick. FakeStoreAPI catalog, search, sort, slide-out cart with badge, quantity +/−, tax and shipping calculation, persistent cart synced across tabs, "added to cart" toast, simulated checkout with a validated delivery form and itemised receipt, focus-trapped drawer and modals, newsletter form |

## Screenshots

| Task 1 – Portfolio | Task 2 – Task Manager |
|---|---|
| ![Developer portfolio](screenshots/task1-portfolio.jpg) | ![Task management dashboard](screenshots/task2-task-manager.jpg) |
| **Task 3 – Weather App** | **Task 4 – E-Commerce Store** |
| ![Weather dashboard](screenshots/task3-weather.jpg) | ![E-commerce store](screenshots/task4-ecommerce.jpg) |

Mobile views: [portfolio](screenshots/task1-portfolio-mobile.jpg) · [store](screenshots/task4-ecommerce-mobile.jpg)

## Folder structure

```
.
├── index.html              # landing page showcasing all projects
├── screenshots/            # project screenshots used by the README and landing page
├── Task1-Portfolio/        # index.html, css/style.css, js/script.js, resume.html, assets/ (résumé PDF + project art)
├── Task2-Task-Manager/     # index.html, style.css, app.js
├── Task3-Weather-App/      # index.html, style.css, app.js
└── Task4-E-Commerce/       # index.html, style.css, app.js, products.json
```

## Architecture

Every project is a static, client-side app: one HTML file, one stylesheet and one script, with no build step or backend. State lives in plain JavaScript variables and is re-rendered into the DOM; the browser's `localStorage` is the only persistence.

| Project | State and data flow | Persistence and fallbacks |
|---------|--------------------|---------------------------|
| **Task 1 – Portfolio** | A `projects` array in `js/script.js` drives the project cards, category filters and the modal popup; a `CONFIG` object holds the contact links (empty ones are hidden). The theme, hamburger menu, scroll-reveal (`IntersectionObserver`) and contact-form validation are small independent modules. | The chosen theme is saved in `localStorage`. |
| **Task 2 – Task Manager** | A `tasks = []` array is the single source of truth. Every change (`addTask`, edit, toggle, delete, reorder) updates the array, calls `saveToLocalStorage()` and then `render()`, which rebuilds the list, filters, progress rings and charts. Deletions keep a snapshot so they can be undone for a few seconds. | Tasks are saved under the key `datheon.tasks.v1` and restored by `loadFromLocalStorage()` after a reload. |
| **Task 3 – Weather App** | `load()` fetches data with `async/await` inside `try/catch` (each request has a 10 s timeout), then builds one weather model that every widget renders from. Every request gets an id, so a slow older response can never overwrite a newer search. Failures throw a `WeatherError` that is shown as a friendly message while the last good result stays visible. | OpenWeatherMap is the primary source. If its key is not active, the app falls back to Open-Meteo (geocoding + forecast), which needs no key. The last searched city, the 5 most recent searches and the °C/°F choice are remembered. |
| **Task 4 – E-Commerce Store** | The `products` and `cart` arrays are the state. `addToCart()`, `removeFromCart()` and `updateQuantity()` change the cart, and `calculateTotal()` derives subtotal, 8% tax and shipping ($5.99, free over $100) before the drawer and badge re-render. `checkout()` opens a delivery form; `placeOrder()` validates it and shows the receipt. All API text goes through an `esc()` HTML-escaping helper. | The cart is saved in `localStorage`. Products come from FakeStoreAPI, with the bundled `products.json` used automatically if the API is unreachable. |

## Run locally

```bash
git clone https://github.com/<your-username>/Datheon_Full_Stack_Web_Development_Internship.git
cd Datheon_Full_Stack_Web_Development_Internship
npx serve .        # or just open any index.html
```

## Live demo

Enable **GitHub Pages** (Settings → Pages → Deploy from branch → `main` / root). Then add the URL here:
`https://<your-username>.github.io/Datheon_Full_Stack_Web_Development_Internship/`

## Notes

- **Weather app** uses the [OpenWeatherMap](https://openweathermap.org/api) free API (current weather + 5-day forecast). If the key is not yet active, it automatically falls back to [Open-Meteo](https://open-meteo.com/), which needs no key. Use only a free-tier key, since client-side keys are visible to anyone.
- **Store** data comes from [FakeStoreAPI](https://fakestoreapi.com/products). A copy of the catalog is bundled as `Task4-E-Commerce/products.json` and used automatically if the API is unreachable.
- **Personalise Task 1:** fill in `CONFIG` (email, GitHub, LinkedIn, Upwork) and `REPO` at the top of `Task1-Portfolio/js/script.js`. The résumé lives in `Task1-Portfolio/resume.html`; `assets/Peer_Shah_Resume.pdf` is printed from that page (open it in a browser → Print → Save as PDF to regenerate).
