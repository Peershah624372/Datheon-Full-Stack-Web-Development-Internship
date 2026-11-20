# Datheon Full Stack Web Development Internship

All four internship tasks, built with vanilla HTML5, CSS3 and JavaScript (ES6+). No build step and no server are needed: open any `index.html`, or host the repo on GitHub Pages.

| # | Project | Level | Highlights |
|---|---------|-------|------------|
| 1 | [Developer Portfolio](Task1-Portfolio/) | Beginner | Mobile-first Flexbox/Grid layout, dark/light theme (saved), smooth scroll, hamburger menu, project modal popups, skill bars, form validation |
| 2 | [Task Manager (CRUD)](Task2-Task-Manager/) | Beginner | Add/edit/delete, categories (Work/Personal/Study), due dates + overdue flag, All/Active/Completed filters, search, drag-and-drop reorder, `localStorage` persistence, completion animations |
| 3 | [Weather Forecast App](Task3-Weather-App/) | Intermediate | `fetch` + `async/await` + `try/catch`, city search, icons, humidity/wind/pressure, 5-day forecast, loading spinner, invalid-city errors, dynamic gradient (sunny/rain/snow/storm/night), °C/°F |
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

- **Weather app** uses [Open-Meteo](https://open-meteo.com/), a free REST weather API that needs no API key, so it works as soon as it is deployed and no secret is committed. It follows the same pattern as OpenWeatherMap (geocode, then fetch, then render).
- **Store** data comes from [FakeStoreAPI](https://fakestoreapi.com/products).
- Personalise Task 1 by replacing "Your Name", the email, the social links and the project links.
