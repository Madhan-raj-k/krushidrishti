const NASHIK_WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=19.9975&longitude=73.7898&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m&daily=precipitation_probability_max,precipitation_sum&timezone=Asia/Kolkata&forecast_days=7";

function setText(id, value, className) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
  if (className !== undefined) el.className = "v " + className;
}

function riskLevel(score) {
  if (score >= 75) return "severe";
  if (score >= 55) return "high";
  if (score >= 35) return "moderate";
  return "low";
}

function sprayLabel(rh, rainChance, precip, wind) {
  if (precip > 0.2 || rainChance >= 45 || rh >= 90) return "CLOSED";
  if (rainChance >= 22 || rh >= 80 || wind > 22) return "TIGHT";
  return "OPEN";
}

function hourIndex(times, iso) {
  if (!times || !times.length) return 0;
  const stamp = iso ? Date.parse(iso) : Date.now();
  let best = 0;
  for (let i = 0; i < times.length; i += 1) {
    if (Math.abs(Date.parse(times[i]) - stamp) < Math.abs(Date.parse(times[best]) - stamp)) {
      best = i;
    }
  }
  return best;
}

async function loadNashikWeather() {
  try {
    const res = await fetch(NASHIK_WEATHER_URL);
    if (!res.ok) throw new Error("Open-Meteo " + res.status);
    const data = await res.json();
    const current = data.current || {};
    const hourly = data.hourly || {};
    const daily = data.daily || {};
    const idx = hourIndex(hourly.time, current.time);
    const next24 = Math.min((hourly.time || []).length, idx + 24);
    let wetHours = 0;
    for (let i = idx; i < next24; i += 1) {
      const rh = (hourly.relative_humidity_2m || [])[i] || 0;
      const p = (hourly.precipitation || [])[i] || 0;
      if (rh >= 90 || p > 0.1) wetHours += 1;
    }
    const rainChance = Math.round(
      (hourly.precipitation_probability && hourly.precipitation_probability[idx]) ||
        (daily.precipitation_probability_max && daily.precipitation_probability_max[0]) ||
        0
    );
    const rh = Math.round(current.relative_humidity_2m || 0);
    const spray = sprayLabel(
      current.relative_humidity_2m || 0,
      rainChance,
      current.precipitation || 0,
      current.wind_speed_10m || 0
    );
    const dailyRisk = (daily.time || []).slice(0, 7).map(function (day, i) {
      const pop = (daily.precipitation_probability_max || [])[i] || 0;
      const rain = (daily.precipitation_sum || [])[i] || 0;
      const score = Math.round(Math.min(99, pop * 0.7 + rain * 12 + (rh > 80 ? 10 : 0)));
      return {
        day: day,
        label: ["S", "M", "T", "W", "T", "F", "S"][new Date(day + "T12:00:00").getDay()],
        score: score,
        level: riskLevel(score),
      };
    });

    if (window.KD) {
      KD.field = {
        temp: Math.round(current.temperature_2m),
        humidity: rh,
        wetHours: wetHours,
        rainChance: rainChance,
        spray: spray,
        dailyRisk: dailyRisk,
      };
    }

    setText("wxPlace", "Nashik");
    setText("wxTemp", Math.round(current.temperature_2m) + "°C");
    setText("wxHumidity", rh + "%");
    setText("wxWet", wetHours + " h");
    setText("wxRain", rainChance + "%");
    setText(
      "wxSpray",
      spray,
      spray === "OPEN" ? "open" : spray === "TIGHT" ? "tight" : "closed"
    );
    window.dispatchEvent(new Event("kd-weather"));
  } catch (err) {
    console.error(err);
    setText("wxPlace", "Nashik");
    setText("wxTemp", "—");
    setText("wxHumidity", "—");
    setText("wxWet", "—");
    setText("wxRain", "—");
    setText("wxSpray", "—");
  }
}

loadNashikWeather();
