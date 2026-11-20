// Vercel serverless function: a small proxy that keeps the OpenWeatherMap API key on the server.
// Setup: Vercel → Project → Settings → Environment Variables → add OWM_KEY = <your key>, then redeploy.
// The weather app calls  /api/owm?path=weather&q=London  (or &lat=..&lon=..)  and never sees the key.

const ALLOWED_PATHS = new Set(["weather", "forecast", "air_pollution"]);

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const { path, q, lat, lon } = req.query || {};

  if (!ALLOWED_PATHS.has(path)) return res.status(400).end(JSON.stringify({ message: "Unsupported endpoint" }));

  const key = process.env.OWM_KEY;
  if (!key) return res.status(503).end(JSON.stringify({ message: "OWM_KEY is not configured" }));

  const params = new URLSearchParams({ units: "metric", appid: key });
  if (q) params.set("q", String(q).slice(0, 100));
  else if (lat && lon && !isNaN(lat) && !isNaN(lon)) { params.set("lat", String(lat)); params.set("lon", String(lon)); }
  else return res.status(400).end(JSON.stringify({ message: "Provide q or lat & lon" }));

  try {
    const upstream = await fetch(`https://api.openweathermap.org/data/2.5/${path}?${params}`);
    // cache identical requests at the edge for 10 minutes to save API calls
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=600");
    res.status(upstream.status).end(await upstream.text());
  } catch {
    res.status(502).end(JSON.stringify({ message: "Could not reach OpenWeatherMap" }));
  }
};
