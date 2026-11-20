"use strict";

/* ===================================================================
   Weather dashboard
   Primary source : OpenWeatherMap (current, 5-day/3-hour forecast, air pollution)
   Extra / fallback: Open-Meteo (UV index; full fallback if the OWM key fails)
   All data is normalised into one "model" object before rendering.
   =================================================================== */

// NOTE: client-side keys are visible to anyone. Use a free-tier key only.
const OWM_KEY = "";
const OWM = "https://api.openweathermap.org/data/2.5";
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WX_URL = "https://api.open-meteo.com/v1/forecast";
const AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

// WMO weather codes -> [label, day icon, night icon, theme]
const WMO = {
  0: ["Clear sky", "☀️", "🌙", "sunny"], 1: ["Mainly clear", "🌤️", "🌙", "sunny"],
  2: ["Partly cloudy", "⛅", "☁️", "cloudy"], 3: ["Overcast", "☁️", "☁️", "cloudy"],
  45: ["Fog", "🌫️", "🌫️", "cloudy"], 48: ["Rime fog", "🌫️", "🌫️", "cloudy"],
  51: ["Light drizzle", "🌦️", "🌧️", "rain"], 53: ["Drizzle", "🌦️", "🌧️", "rain"], 55: ["Heavy drizzle", "🌧️", "🌧️", "rain"],
  61: ["Light rain", "🌧️", "🌧️", "rain"], 63: ["Rain", "🌧️", "🌧️", "rain"], 65: ["Heavy rain", "🌧️", "🌧️", "rain"],
  71: ["Light snow", "🌨️", "🌨️", "snow"], 73: ["Snow", "❄️", "❄️", "snow"], 75: ["Heavy snow", "❄️", "❄️", "snow"], 77: ["Snow grains", "❄️", "❄️", "snow"],
  80: ["Rain showers", "🌦️", "🌧️", "rain"], 81: ["Rain showers", "🌧️", "🌧️", "rain"], 82: ["Violent showers", "⛈️", "⛈️", "storm"],
  85: ["Snow showers", "🌨️", "🌨️", "snow"], 86: ["Heavy snow showers", "🌨️", "🌨️", "snow"],
  95: ["Thunderstorm", "⛈️", "⛈️", "storm"], 96: ["Thunderstorm, hail", "⛈️", "⛈️", "storm"], 99: ["Severe thunderstorm", "⛈️", "⛈️", "storm"],
};
const describe = (code, isDay = true) => {
  const [label, day, night, theme] = WMO[code] ?? ["Unknown", "🌡️", "🌡️", "default"];
  return { label, icon: isDay ? day : night, theme };
};
const AQI_TEXT = ["", "Good air", "Fair air", "Moderate air", "Poor air", "Very poor air"];
const AQI_COLOR = ["", "#2fb37d", "#8bc34a", "#f5b400", "#f57c00", "#d32f2f"];

const $ = (id) => document.getElementById(id);
let useF = false;
let last = null;   // last model, re-rendered on unit switch / day select
let selDay = 0;

class WeatherError extends Error {}

/* ---------- fetch helpers ---------- */
async function fetchJSON(url) {
  let res;
  try { res = await fetch(url); }
  catch { throw new WeatherError("Network error. Please check your internet connection."); }
  if (!res.ok) throw new WeatherError(`Weather service error (${res.status}). Try again later.`);
  return res.json();
}
async function owmFetch(path, query) {
  let res;
  try { res = await fetch(`${OWM}/${path}?${query}&units=metric&appid=${OWM_KEY}`); }
  catch { throw new WeatherError("Network error. Please check your internet connection."); }
  if (res.status === 404) throw new WeatherError("City not found. Check the spelling and try again.");
  if (res.status === 401) throw new Error("OWM_KEY_INACTIVE");
  if (!res.ok) throw new WeatherError(`Weather service error (${res.status}). Try again later.`);
  return res.json();
}

/* ---------- time helpers ----------
   "lt" = the city's LOCAL clock time stored as a UTC timestamp, so formatting
   with timeZone:"UTC" shows the correct local time for any city.            */
const DAY_MS = 864e5;
const fmtTime = (lt) => new Date(lt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const fmtHour = (lt) => new Date(lt).toLocaleTimeString([], { hour: "numeric", timeZone: "UTC" });
const fmtDay = (lt) => new Date(lt).toLocaleDateString([], { weekday: "short", timeZone: "UTC" });
const fmtFull = (lt) => new Date(lt).toLocaleString([], { weekday: "long", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const isDayAt = (lt, sr, ss) => { const t = lt % DAY_MS; return t >= sr % DAY_MS && t < ss % DAY_MS; };

/* ---------- OpenWeatherMap -> model ---------- */
function owmToWmo(id) {
  if (id >= 200 && id < 300) return 95;
  if (id >= 300 && id < 400) return 53;
  if (id === 500) return 61; if (id === 501) return 63; if (id >= 502 && id < 520) return 65;
  if (id >= 520 && id < 600) return 81;
  if (id === 600) return 71; if (id >= 601 && id < 700) return 75;
  if (id >= 700 && id < 800) return 45;
  if (id === 800) return 0; if (id === 801) return 1; if (id === 802) return 2;
  return 3;
}
async function fetchUV(lat, lon) {
  try { return (await fetchJSON(`${WX_URL}?latitude=${lat}&longitude=${lon}&current=uv_index&timezone=auto`)).current?.uv_index ?? null; }
  catch { return null; }
}
async function owmAir(lat, lon) {
  try {
    const level = (await owmFetch("air_pollution", `lat=${lat}&lon=${lon}`)).list?.[0]?.main?.aqi;
    return level ? { level, detail: `OpenWeatherMap index ${level} of 5` } : null;
  } catch { return null; }
}

async function getOWM(query) {
  const [cur, fc] = await Promise.all([owmFetch("weather", query), owmFetch("forecast", query)]);
  const { lat, lon } = cur.coord;
  const tz = cur.timezone;
  const L = (ts) => (ts + tz) * 1000;
  const sunrise = L(cur.sys.sunrise), sunset = L(cur.sys.sunset), now = L(cur.dt);
  const [aqi, uv] = await Promise.all([owmAir(lat, lon), fetchUV(lat, lon)]);

  const byDay = {};
  fc.list.forEach((e) => { (byDay[new Date(L(e.dt)).toISOString().slice(0, 10)] ??= []).push(e); });
  const daily = Object.keys(byDay).slice(0, 5).map((k) => {
    const items = byDay[k];
    return {
      lt: Date.parse(k + "T00:00:00Z"),
      code: owmToWmo(items[Math.floor(items.length / 2)].weather[0].id),
      max: Math.max(...items.map((e) => e.main.temp_max)),
      min: Math.min(...items.map((e) => e.main.temp_min)),
      pop: Math.round(Math.max(...items.map((e) => e.pop ?? 0)) * 100),
    };
  });

  return {
    place: [cur.name, cur.sys.country].filter(Boolean).join(", "),
    now, sunrise, sunset, isDay: now >= sunrise && now < sunset,
    cur: {
      temp: cur.main.temp, feels: cur.main.feels_like, humidity: cur.main.humidity,
      pressure: cur.main.pressure, wind: Math.round(cur.wind.speed * 3.6), code: owmToWmo(cur.weather[0].id),
    },
    hourly: fc.list.slice(0, 8).map((e) => ({ lt: L(e.dt), temp: e.main.temp, code: owmToWmo(e.weather[0].id), pop: Math.round((e.pop ?? 0) * 100) })),
    daily, aqi, uv,
  };
}

/* ---------- Open-Meteo fallback -> model ---------- */
async function geocode(city) {
  const data = await fetchJSON(`${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
  if (!data.results?.length) throw new WeatherError(`City "${city}" not found. Check the spelling and try again.`);
  const { latitude, longitude, name, country, admin1 } = data.results[0];
  return { latitude, longitude, label: [name, admin1, country].filter(Boolean).join(", ") };
}
async function omAir(lat, lon) {
  try {
    const v = (await fetchJSON(`${AQ_URL}?latitude=${lat}&longitude=${lon}&current=us_aqi`)).current?.us_aqi;
    if (v == null) return null;
    const level = v <= 50 ? 1 : v <= 100 ? 2 : v <= 150 ? 3 : v <= 200 ? 4 : 5;
    return { level, detail: `US AQI ${Math.round(v)}` };
  } catch { return null; }
}
async function getOpenMeteo({ latitude, longitude, label }) {
  const params = new URLSearchParams({
    latitude, longitude, timezone: "auto", forecast_days: 5,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,pressure_msl,wind_speed_10m,weather_code,is_day,uv_index",
    hourly: "temperature_2m,weather_code,precipitation_probability",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
  });
  const [d, aqi] = await Promise.all([fetchJSON(`${WX_URL}?${params}`), omAir(latitude, longitude)]);
  const LT = (s) => Date.parse(s + (s.length === 10 ? "T00:00" : "") + "Z");
  const c = d.current, now = LT(c.time);
  const i0 = Math.max(0, d.hourly.time.findIndex((t) => LT(t) >= now));
  const hourly = [];
  for (let i = i0; i < d.hourly.time.length && hourly.length < 8; i += 3)
    hourly.push({ lt: LT(d.hourly.time[i]), temp: d.hourly.temperature_2m[i], code: d.hourly.weather_code[i], pop: d.hourly.precipitation_probability[i] ?? 0 });
  return {
    place: label || "Your location",
    now, sunrise: LT(d.daily.sunrise[0]), sunset: LT(d.daily.sunset[0]), isDay: !!c.is_day,
    cur: { temp: c.temperature_2m, feels: c.apparent_temperature, humidity: c.relative_humidity_2m, pressure: c.pressure_msl, wind: Math.round(c.wind_speed_10m), code: c.weather_code },
    hourly,
    daily: d.daily.time.map((t, i) => ({ lt: LT(t), code: d.daily.weather_code[i], max: d.daily.temperature_2m_max[i], min: d.daily.temperature_2m_min[i], pop: d.daily.precipitation_probability_max[i] ?? 0 })),
    aqi, uv: c.uv_index ?? null,
  };
}

/* ---------- SVG arc (sun path + AQI gauge) ---------- */
function arc(pct, { color, needle = false, sun = false }) {
  const p = Math.min(100, Math.max(0, pct));
  const a = Math.PI * (p / 100);
  const x = 100 - 80 * Math.cos(a), y = 100 - 80 * Math.sin(a);
  return `<svg viewBox="0 0 200 112" aria-hidden="true">
    <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#e7e2d6" stroke-width="12" stroke-linecap="round" pathLength="100"/>
    <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" pathLength="100" stroke-dasharray="${p} 100"/>
    ${sun ? `<circle cx="${x}" cy="${y}" r="11" fill="#ffc94a" stroke="#fff" stroke-width="4"/>` : ""}
    ${needle ? `<line x1="100" y1="100" x2="${100 - 62 * Math.cos(a)}" y2="${100 - 62 * Math.sin(a)}" stroke="#0f1c3a" stroke-width="6" stroke-linecap="round"/><circle cx="100" cy="100" r="9" fill="#0f1c3a"/>` : ""}
  </svg>`;
}

/* ---------- render ---------- */
const toUnit = (c) => Math.round(useF ? (c * 9) / 5 + 32 : c);
const unit = () => (useF ? "°F" : "°C");
const uvText = (u) => (u <= 2 ? "Low" : u <= 5 ? "Moderate" : u <= 7 ? "High" : u <= 10 ? "Very high" : "Extreme");

function show(section) {
  $("loader").hidden = section !== "loader";
  $("weather").hidden = section !== "weather";
  $("error").hidden = section !== "error";
}

function render(m) {
  const info = describe(m.cur.code, m.isDay);
  // current card
  $("place").textContent = m.place;
  $("date").textContent = `${fmtFull(m.now)} · ${m.isDay ? "Daytime" : "Night"}`;
  $("icon").textContent = info.icon;
  $("temp").textContent = `${toUnit(m.cur.temp)}${unit()}`;
  $("condition").textContent = info.label;
  $("feels").textContent = `${toUnit(m.cur.feels)}${unit()}`;
  if (m.daily[0]) $("hilo").textContent = `H: ${toUnit(m.daily[0].max)}°  ·  L: ${toUnit(m.daily[0].min)}°`;
  $("cond-tag").textContent = !m.isDay ? "Night" : { sunny: "Clear", cloudy: "Cloudy", rain: "Rainy", snow: "Snowy", storm: "Stormy" }[info.theme] || "Live";

  // dynamic theme: night overrides clear/cloudy
  document.body.className = `theme-${!m.isDay && ["sunny", "cloudy", "default"].includes(info.theme) ? "night" : info.theme}`;

  // sunrise / sunset
  $("sunrise").textContent = fmtTime(m.sunrise);
  $("sunset").textContent = fmtTime(m.sunset);
  $("sun-arc").innerHTML = arc(((m.now - m.sunrise) / (m.sunset - m.sunrise)) * 100, { color: "#ffa24c", sun: true });

  // hourly
  $("hourly").innerHTML = m.hourly.map((h) => {
    const d = describe(h.code, isDayAt(h.lt, m.sunrise, m.sunset));
    return `<div class="hr"><span class="t">${fmtHour(h.lt)}</span><span class="i" title="${d.label}">${d.icon}</span><strong>${toUnit(h.temp)}°</strong><span class="p">💧 ${h.pop}%</span></div>`;
  }).join("");

  // 5-day
  $("forecast").innerHTML = m.daily.map((d, i) => {
    const w = describe(d.code);
    return `<button type="button" class="day ${i === selDay ? "sel" : ""}" data-i="${i}" aria-pressed="${i === selDay}" style="animation-delay:${i * 70}ms">
      <span class="dn">${i === 0 ? "Today" : fmtDay(d.lt)}</span><span class="d-icon" title="${w.label}">${w.icon}</span>
      <span class="hi">${toUnit(d.max)}°</span><span class="lo">${toUnit(d.min)}°</span><span class="pp">💧 ${d.pop}%</span></button>`;
  }).join("");

  // widgets
  renderPrecip(m);
  $("wind").textContent = `${m.cur.wind} km/h`;
  $("humidity").textContent = `${m.cur.humidity}%`;
  $("pressure").textContent = `${Math.round(m.cur.pressure)} hPa`;
  $("uv").textContent = m.uv == null ? "—" : Math.round(m.uv);
  $("uv-label").textContent = m.uv == null ? "not available" : uvText(m.uv);
  if (m.aqi) {
    $("aqi-gauge").innerHTML = arc(m.aqi.level * 20, { color: AQI_COLOR[m.aqi.level], needle: true });
    $("aqi-label").textContent = `${m.aqi.level} – ${AQI_TEXT[m.aqi.level]}`;
    $("aqi-detail").textContent = m.aqi.detail;
  } else {
    $("aqi-gauge").innerHTML = arc(0, { color: "#ccc" });
    $("aqi-label").textContent = "Not available";
    $("aqi-detail").textContent = "";
  }
  renderAlert(m);
  show("weather");
}

function renderPrecip(m) {
  const d = m.daily[selDay];
  $("precip").textContent = `${d ? d.pop : m.hourly[0]?.pop ?? 0}%`;
  $("precip-sub").textContent = `chance · ${selDay === 0 ? "today" : fmtDay(d.lt)}`;
}

function renderAlert(m) {
  const el = $("alert");
  const maxPop = Math.max(...m.hourly.map((h) => h.pop));
  const theme = describe(m.cur.code).theme;
  let msg = null;
  if (m.aqi && m.aqi.level >= 4) msg = "Air quality alert: limit long outdoor activity today.";
  else if (theme === "storm") msg = "Thunderstorm alert: stay indoors if you can.";
  else if (maxPop >= 60) msg = `Rain likely in the next 24 h (${maxPop}%) — take an umbrella.`;
  else if (m.uv != null && m.uv >= 8) msg = "High UV alert: wear sunscreen and sunglasses.";
  el.className = `alert ${msg ? "warn" : "ok"}`;
  el.innerHTML = `<span class="ai" aria-hidden="true">${msg ? "⚠️" : "✅"}</span>${msg ?? "No weather alerts — conditions look calm."}`;
}

/* ---------- loading flows ---------- */
async function load(owmQuery, fallbackGeo) {
  show("loader");
  try {
    try { last = await getOWM(owmQuery); }
    catch (err) {
      if (err.message !== "OWM_KEY_INACTIVE") throw err;
      console.warn("OpenWeatherMap key not active, falling back to Open-Meteo");
      last = await getOpenMeteo(await fallbackGeo());
    }
    selDay = 0;
    render(last);
    return true;
  } catch (err) {
    $("error").textContent = err instanceof WeatherError ? err.message : "Something went wrong. Please try again.";
    show("error");
    return false;
  }
}
async function loadCity(city) {
  const ok = await load(`q=${encodeURIComponent(city)}`, () => geocode(city));
  if (ok) try { localStorage.setItem("lastCity", city); } catch {}
}

/* ---------- events ---------- */
$("search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const city = $("city-input").value.trim();
  if (city) loadCity(city);
});
$("unit-toggle").addEventListener("click", () => {
  useF = !useF;
  $("unit-toggle").textContent = useF ? "Switch to °C" : "Switch to °F";
  if (last) render(last);
});
$("forecast").addEventListener("click", (e) => {
  const b = e.target.closest(".day");
  if (!b || !last) return;
  selDay = +b.dataset.i;
  document.querySelectorAll(".day").forEach((d, i) => { d.classList.toggle("sel", i === selDay); d.setAttribute("aria-pressed", i === selDay); });
  renderPrecip(last);
});
$("locate-btn").addEventListener("click", () => {
  if (!navigator.geolocation) { $("error").textContent = "Geolocation is not supported by your browser."; return show("error"); }
  show("loader");
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => load(`lat=${coords.latitude}&lon=${coords.longitude}`, async () => ({ latitude: coords.latitude, longitude: coords.longitude, label: "Your location" })),
    () => { $("error").textContent = "Location permission denied. Search for a city instead."; show("error"); }
  );
});

// initial load: last searched city or a default
let initial = "London";
try { initial = localStorage.getItem("lastCity") || initial; } catch {}
$("city-input").value = initial;
loadCity(initial);
