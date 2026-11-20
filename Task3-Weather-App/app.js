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

/* ---------- OpenWeatherMap (primary) ---------- */
// NOTE: client-side keys are visible to anyone. Use a free-tier key only.
const OWM_KEY = "";
const OWM = "https://api.openweathermap.org/data/2.5";

// Map OpenWeatherMap condition ids onto the WMO codes used by describe()
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

async function owmFetch(path, query) {
  let res;
  try { res = await fetch(`${OWM}/${path}?${query}&units=metric&appid=${OWM_KEY}`); }
  catch { throw new WeatherError("Network error. Please check your internet connection."); }
  if (res.status === 404) throw new WeatherError("City not found. Check the spelling and try again.");
  if (res.status === 401) throw new Error("OWM_KEY_INACTIVE");
  if (!res.ok) throw new WeatherError(`Weather service error (${res.status}). Try again later.`);
  return res.json();
}

// Fetch from OpenWeatherMap and convert to the shape render() expects
async function getOWM(query) {
  const [cur, fc] = await Promise.all([owmFetch("weather", query), owmFetch("forecast", query)]);
  const isDay = cur.dt >= cur.sys.sunrise && cur.dt < cur.sys.sunset ? 1 : 0;
  const byDay = {};
  fc.list.forEach((e) => {
    const day = new Date((e.dt + fc.city.timezone) * 1000).toISOString().slice(0, 10);
    (byDay[day] ??= []).push(e);
  });
  const days = Object.keys(byDay).slice(0, 5);
  return {
    place: [cur.name, cur.sys.country].filter(Boolean).join(", "),
    data: {
      current: {
        time: cur.dt * 1000, is_day: isDay, weather_code: owmToWmo(cur.weather[0].id),
        temperature_2m: cur.main.temp, apparent_temperature: cur.main.feels_like,
        relative_humidity_2m: cur.main.humidity, pressure_msl: cur.main.pressure,
        wind_speed_10m: Math.round(cur.wind.speed * 3.6),
      },
      daily: {
        time: days,
        weather_code: days.map((d) => owmToWmo(byDay[d][Math.floor(byDay[d].length / 2)].weather[0].id)),
        temperature_2m_max: days.map((d) => Math.max(...byDay[d].map((e) => e.main.temp_max))),
        temperature_2m_min: days.map((d) => Math.min(...byDay[d].map((e) => e.main.temp_min))),
      },
    },
  };
}

async function loadCity(city) {
  show("loader");
  try {
    try {
      last = await getOWM(`q=${encodeURIComponent(city)}`);
    } catch (err) {
      if (err.message !== "OWM_KEY_INACTIVE") throw err;
      console.warn("OpenWeatherMap key not active yet, falling back to Open-Meteo");
      const geo = await geocode(city);
      last = { place: geo.label, data: await getWeather(geo) };
    }
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
        try { last = await getOWM(`lat=${coords.latitude}&lon=${coords.longitude}`); }
        catch (err) {
          if (err.message !== "OWM_KEY_INACTIVE") throw err;
          last = { place: "Your location", data: await getWeather(coords) };
        }
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
