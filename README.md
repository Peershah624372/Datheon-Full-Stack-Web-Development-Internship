# Datheon Full Stack Web Development Internship

All four internship tasks, built with vanilla HTML5, CSS3 and JavaScript (ES6+). No build step and no server are needed: open any `index.html`, or host the repo on GitHub Pages.

| # | Project | Level | Highlights |
|---|---------|-------|------------|
| 1 | [Developer Portfolio](Task1-Portfolio/) | Beginner | Bold creative design with illustrated SVG avatar, mobile-first Flexbox/Grid layout, dark/light theme (saved), smooth scroll, hamburger menu, project modal popups, skill badges, form validation |
| 2 | [Task Manager (CRUD)](Task2-Task-Manager/) | Beginner | Dashboard layout with category sidebar, progress bars, efficiency rings, completed-tasks chart and upcoming-deadline plan. Add/edit/delete, categories (Work/Personal/Study), due dates + overdue flag, All/Active/Completed filters, search, drag-and-drop reorder, `localStorage` persistence, completion animations |
| 3 | [Weather Forecast App](Task3-Weather-App/) | Intermediate | Widget dashboard: current weather, sunrise/sunset arc, hourly and 5-day forecast, precipitation, wind, humidity, pressure, UV index, air-quality gauge and alert banner. `fetch` + `async/await` + `try/catch`, loading spinner, invalid-city errors, weather- and night-based themes, °C/°F |
| 4 | [E-Commerce Store](Task4-E-Commerce/) | Intermediate | FakeStoreAPI catalog, category filter, search, sort, slide-out cart with badge, quantity +/−, tax and shipping calculation, persistent cart, simulated checkout |

## Folder structure

```
.
├── index.html              # landing page linking all projects
├── Task1-Portfolio/        # index.html, css/style.css, js/script.js, resume.html
├── Task2-Task-Manager/     # index.html, style.css, app.js
├── Task3-Weather-App/      # index.html, style.css, app.js
└── Task4-E-Commerce/       # index.html, style.css, app.js
```

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
- Personalise Task 1 by replacing "Your Name", the email, the social links and the project links.
