import { formatValue } from "../utils/weather";

const DEFAULT_CURRENT_UNITS = {
  temperature_2m: "C",
  precipitation: "mm",
  wind_speed_10m: "km/h",
};

const DEFAULT_DAILY_UNITS = {
  temperature_2m_max: "C",
  temperature_2m_min: "C",
  precipitation_sum: "mm",
  wind_speed_10m_max: "km/h",
};

function getNumericMax(values) {
  const numericValues = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!numericValues.length) {
    return null;
  }

  return Math.max(...numericValues);
}

function getNumericMin(values) {
  const numericValues = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!numericValues.length) {
    return null;
  }

  return Math.min(...numericValues);
}

function buildInsights(weatherRecord) {
  const currentWeather = weatherRecord?.weather_data?.current ?? {};
  const currentUnits = {
    ...DEFAULT_CURRENT_UNITS,
    ...(weatherRecord?.weather_data?.current_units ?? {}),
  };
  const dailyWeather = weatherRecord?.daily_weather ?? [];
  const dailyData = weatherRecord?.weather_data?.daily ?? {};

  const dailyPrecipitationMax = getNumericMax(
    dailyWeather.map((day) => day.precipitation_sum),
  );
  const dailyWindMax = getNumericMax(
    dailyWeather.map((day) => day.wind_speed_max),
  );
  const dailyTemperatureMax = getNumericMax(
    dailyWeather.map((day) => day.temperature_max),
  );
  const dailyTemperatureMin = getNumericMin(
    dailyWeather.map((day) => day.temperature_min),
  );
  const uvIndexMax = getNumericMax(
    Array.isArray(dailyData.uv_index_max) ? dailyData.uv_index_max : [],
  );
  const airQualityIndex = getNumericMax([
    currentWeather.us_aqi,
    currentWeather.european_aqi,
    currentWeather.air_quality,
  ]);

  const insights = [];

  if (dailyPrecipitationMax !== null && dailyPrecipitationMax >= 5) {
    insights.push({
      title: "Carry an umbrella",
      detail: `Daily precipitation can reach ${formatValue(
        dailyPrecipitationMax,
        DEFAULT_DAILY_UNITS.precipitation_sum,
      )}.`,
    });
  }

  if (uvIndexMax !== null && uvIndexMax >= 6) {
    insights.push({
      title: "Use sunscreen",
      detail: `The peak UV index reaches ${uvIndexMax.toFixed(1)} during this range.`,
    });
  }

  const windReference = getNumericMax([
    currentWeather.wind_speed_10m,
    dailyWindMax,
  ]);

  if (windReference !== null && windReference >= 30) {
    insights.push({
      title: "Outdoor activities may be uncomfortable",
      detail: `Wind speeds can reach ${formatValue(
        windReference,
        currentUnits.wind_speed_10m,
      )}.`,
    });
  }

  const highTemperatureReference = getNumericMax([
    currentWeather.temperature_2m,
    dailyTemperatureMax,
  ]);

  if (highTemperatureReference !== null && highTemperatureReference >= 30) {
    insights.push({
      title: "Stay hydrated",
      detail: `Temperatures climb to ${formatValue(
        highTemperatureReference,
        currentUnits.temperature_2m,
      )}.`,
    });
  }

  const lowTemperatureReference = getNumericMin([
    currentWeather.temperature_2m,
    dailyTemperatureMin,
  ]);

  if (lowTemperatureReference !== null && lowTemperatureReference <= 10) {
    insights.push({
      title: "Bring warm clothing",
      detail: `Temperatures can drop to ${formatValue(
        lowTemperatureReference,
        currentUnits.temperature_2m,
      )}.`,
    });
  }

  if (airQualityIndex !== null && airQualityIndex >= 100) {
    insights.push({
      title: "Limit extended outdoor activity",
      detail: `Air quality readings reach ${airQualityIndex.toFixed(0)} in the retrieved data.`,
    });
  }

  if (!insights.length) {
    const fallbackLow = dailyTemperatureMin;
    const fallbackHigh = dailyTemperatureMax;

    insights.push({
      title: "Conditions look manageable",
      detail:
        fallbackLow !== null && fallbackHigh !== null
          ? `The retrieved range stays between ${formatValue(
              fallbackLow,
              DEFAULT_DAILY_UNITS.temperature_2m_min,
            )} and ${formatValue(
              fallbackHigh,
              DEFAULT_DAILY_UNITS.temperature_2m_max,
            )}.`
          : "No major weather stressors stand out in the retrieved data.",
    });
  }

  return insights;
}

function TravelInsights({ weatherRecord }) {
  const insights = buildInsights(weatherRecord);

  return (
    <section className="overview-block">
      <div className="section-header compact-header">
        <div>
          <span className="eyebrow">Travel insights</span>
          <h3 className="subheading">Useful planning notes</h3>
        </div>
      </div>

      <div className="insights-grid">
        {insights.map((insight) => (
          <article
            className="insight-card"
            key={`${insight.title}-${insight.detail}`}
          >
            <strong>{insight.title}</strong>
            <p>{insight.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TravelInsights;
