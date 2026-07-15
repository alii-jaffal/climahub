const WEATHER_DESCRIPTIONS = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Light rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm with hail",
};

function normalizeCode(code) {
  const numericCode = Number(code);

  if (Number.isNaN(numericCode)) {
    return null;
  }

  return numericCode;
}

export function getWeatherDescription(code) {
  const numericCode = normalizeCode(code);

  if (numericCode === null) {
    return "Unknown conditions";
  }

  return WEATHER_DESCRIPTIONS[numericCode] ?? "Unknown conditions";
}

export function getWeatherIcon(code) {
  const numericCode = normalizeCode(code);

  if (numericCode === null) {
    return "?"
  }

  if (numericCode === 0) {
    return "☀️";
  }

  if (numericCode === 1 || numericCode === 2) {
    return "⛅";
  }

  if (numericCode === 3) {
    return "☁️";
  }

  if (numericCode === 45 || numericCode === 48) {
    return "🌫️";
  }

  if ([51, 53, 55, 56, 57].includes(numericCode)) {
    return "🌦️";
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(numericCode)) {
    return "🌧️";
  }

  if ([71, 73, 75, 77, 85, 86].includes(numericCode)) {
    return "❄️";
  }

  if ([95, 96, 99].includes(numericCode)) {
    return "⛈️";
  }

  return "🌤️";
}
