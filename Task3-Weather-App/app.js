"use strict";

/* Open-Meteo: free, no API key required.
   Geocoding: https://open-meteo.com/en/docs/geocoding-api
   Forecast:  https://open-meteo.com/en/docs                */
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WX_URL = "https://api.open-meteo.com/v1/forecast";

// WMO weather codes -> [label, day icon, night icon, theme]
const WMO = {
  0: ["Clear sky", "☀️", "🌙", "sunny"],
  1: ["Mainly clear", "🌤️", "🌙", "sunny"],
  2: ["Partly cloudy", "⛅", "☁️", "cloudy"],
  3: ["Overcast", "☁️", "☁️", "cloudy"],
  45: ["Fog", "🌫️", "🌫️", "cloudy"], 48: ["Rime fog", "🌫️", "🌫️", "cloudy"],
  51: ["Light drizzle", "🌦️", "🌧️", "rain"], 53: ["Drizzle", "🌦️", "🌧️", "rain"], 55: ["Heavy drizzle", "🌧️", "🌧️", "rain"],
  61: ["Light rain", "🌧️", "🌧️", "rain"], 63: ["Rain", "🌧️", "🌧️", "rain"], 65: ["Heavy rain", "🌧️", "🌧️", "rain"],
  71: ["Light snow", "🌨️", "🌨️", "snow"], 73: ["Snow", "❄️", "❄️", "snow"], 75: ["Heavy snow", "❄️", "❄️", "snow"],
  77: ["Snow grains", "❄️", "❄️", "snow"],
  80: ["Rain showers", "🌦️", "🌧️", "rain"], 81: ["Rain showers", "🌧️", "🌧️", "rain"], 82: ["Violent showers", "⛈️", "⛈️", "storm"],
  85: ["Snow showers", "🌨️", "🌨️", "snow"], 86: ["Heavy snow showers", "🌨️", "🌨️", "snow"],
  95: ["Thunderstorm", "⛈️", "⛈️", "storm"], 96: ["Thunderstorm, hail", "⛈️", "⛈️", "storm"], 99: ["Severe thunderstorm", "⛈️", "⛈️", "storm"],
};
const describe = (code, isDay = 1) => {
  const [label, day, night, theme] = WMO[code] ?? ["Unknown", "🌡️", "🌡️", "default"];
  return { label, icon: isDay ? day : night, theme };
};

const $ = (id) => document.getElementById(id);
let useF = false;
let last = null; // last fetched data, to re-render on unit switch

class WeatherError extends Error {}

async function fetchJSON(url) {
  let res;
  try { res = await fetch(url); }
  catch { throw new WeatherError("Network error. Please check your internet connection."); }
  if (!res.ok) throw new WeatherError(`Weather service error (${res.status}). Try again later.`);
  return res.json();
}

async function geocode(city) {
  const data = await fetchJSON(`${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
  if (!data.results?.length) throw new WeatherError(`City "${city}" not found. Check the spelling and try again.`);
  const { latitude, longitude, name, country, admin1 } = data.results[0];
  return { latitude, longitude, label: [name, admin1, country].filter(Boolean).join(", ") };
}

async function getWeather({ latitude, longitude }) {
  const params = new URLSearchParams({
    latitude, longitude, timezone: "auto", forecast_days: 5,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,pressure_msl,wind_speed_10m,weather_code,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
  });
  return fetchJSON(`${WX_URL}?${params}`);
}

const toUnit = (c) => Math.round(useF ? (c * 9) / 5 + 32 : c);
const unit = () => (useF ? "°F" : "°C");

function show(section) {
  $("loader").hidden = section !== "loader";
  $("weather").hidden = section !== "weather";
  $("error").hidden = section !== "error";
}

function render({ place, data }) {
  const c = data.current;
  const info = describe(c.weather_code, c.is_day);
  $("place").textContent = place;
  $("date").textContent = new Date(c.time).toLocaleString(undefined, { weekday: "long", hour: "2-digit", minute: "2-digit" }) + (c.is_day ? " · Daytime" : " · Night");
  $("icon").textContent = info.icon;
  $("temp").textContent = `${toUnit(c.temperature_2m)}${unit()}`;
  $("condition").textContent = info.label;
  $("humidity").textContent = `${c.relative_humidity_2m}%`;
  $("wind").textContent = `${c.wind_speed_10m} km/h`;
  $("pressure").textContent = `${Math.round(c.pressure_msl)} hPa`;
  $("feels").textContent = `${toUnit(c.apparent_temperature)}${unit()}`;

  // Dynamic background: night overrides clear/cloudy themes
  const theme = !c.is_day && ["sunny", "cloudy"].includes(info.theme) ? "night" : info.theme;
  document.body.className = `theme-${theme}`;

  const d = data.daily;
  $("forecast").innerHTML = d.time.map((t, i) => {
    const day = describe(d.weather_code[i]);
    const name = i === 0 ? "Today" : new Date(t + "T00:00").toLocaleDateString(undefined, { weekday: "short" });
    return `<div class="day" style="animation-delay:${i * 80}ms">
      <div>${name}</div><div class="d-icon" title="${day.label}">${day.icon}</div>
      <div class="hi">${toUnit(d.temperature_2m_max[i])}°</div><div class="lo">${toUnit(d.temperature_2m_min[i])}°</div>
    </div>`;
  }).join("");
  show("weather");
}

async function loadCity(city) {
  show("loader");
  try {
    const geo = await geocode(city);
    const data = await getWeather(geo);
    last = { place: geo.label, data };
    render(last);
    try { localStorage.setItem("lastCity", city); } catch {}
  } catch (err) {
    $("error").textContent = err instanceof WeatherError ? err.message : "Something went wrong. Please try again.";
    show("error");
  }
}

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

$("locate-btn").addEventListener("click", () => {
  if (!navigator.geolocation) { $("error").textContent = "Geolocation is not supported by your browser."; return show("error"); }
  show("loader");
  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        const data = await getWeather(coords);
        last = { place: "Your location", data };
        render(last);
      } catch (err) { $("error").textContent = err.message; show("error"); }
    },
    () => { $("error").textContent = "Location permission denied. Search for a city instead."; show("error"); }
  );
});

// Initial load: last searched city or a default
let initial = "London";
try { initial = localStorage.getItem("lastCity") || initial; } catch {}
$("city-input").value = initial;
loadCity(initial);
