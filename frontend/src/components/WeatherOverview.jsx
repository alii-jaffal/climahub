import { getWeatherDescription, getWeatherIcon } from "../utils/weatherCodes";
import { formatDate, formatTime, formatValue } from "../utils/weather";
import TravelInsights from "./TravelInsights";
import WeatherMap from "./WeatherMap";

const DEFAULT_CURRENT_UNITS = {
  temperature_2m: "C",
  apparent_temperature: "C",
  relative_humidity_2m: "%",
  precipitation: "mm",
  wind_speed_10m: "km/h",
};

const DEFAULT_DAILY_UNITS = {
  temperature_min: "C",
  temperature_max: "C",
  precipitation_sum: "mm",
  wind_speed_max: "km/h",
};

function WeatherOverview({ weatherRecord }) {
  const currentWeather = weatherRecord?.weather_data?.current ?? null;
  const currentUnits = {
    ...DEFAULT_CURRENT_UNITS,
    ...(weatherRecord?.weather_data?.current_units ?? {}),
  };
  const forecastDays = weatherRecord?.daily_weather?.slice(0, 5) ?? [];
  const currentWeatherCode = currentWeather?.weather_code;
  const currentTemperature = currentWeather
    ? formatValue(currentWeather.temperature_2m, currentUnits.temperature_2m)
    : "Unavailable";

  return (
    <section className="weather-overview">
      <header className="record-header">
        <div className="record-header-copy">
          <span className="eyebrow">Overview</span>
          <h2>{weatherRecord.resolved_location}</h2>
          <p className="record-subtitle">
            Saved from "{weatherRecord.location_query}"
          </p>
        </div>
        <div className="record-hero-stat">
          <span className="record-weather-icon" aria-hidden="true">
            {getWeatherIcon(currentWeatherCode)}
          </span>
          <div>
            <strong>{currentTemperature}</strong>
            <span>{getWeatherDescription(currentWeatherCode)}</span>
          </div>
        </div>
      </header>

      <div className="record-summary-grid">
        <article className="summary-card">
          <span>Range</span>
          <strong>
            {formatDate(weatherRecord.start_date)} to{" "}
            {formatDate(weatherRecord.end_date)}
          </strong>
        </article>
        <article className="summary-card">
          <span>Timezone</span>
          <strong>{weatherRecord.timezone}</strong>
        </article>
        <article className="summary-card">
          <span>Coordinates</span>
          <strong>
            {weatherRecord.latitude}, {weatherRecord.longitude}
          </strong>
        </article>
        <article className="summary-card">
          <span>Notes</span>
          <strong>{weatherRecord.notes || "No notes saved"}</strong>
        </article>
      </div>

      <div className="overview-main-grid">
        <section className="overview-panel overview-map-panel">
          <div className="panel-heading">
            <div>
              <h3>Map</h3>
              <p>Resolved location and live marker</p>
            </div>
          </div>
          <WeatherMap weatherRecord={weatherRecord} />
        </section>

        <section className="overview-panel">
          <div className="panel-heading">
            <div>
              <h3>Current conditions</h3>
              <p>Latest retrieved weather values</p>
            </div>
          </div>

          {currentWeather ? (
            <div className="metric-grid">
              <article className="metric-card metric-card-wide">
                <span className="metric-label">Condition</span>
                <div className="weather-label">
                  <span className="record-weather-icon" aria-hidden="true">
                    {getWeatherIcon(currentWeatherCode)}
                  </span>
                  <strong>{getWeatherDescription(currentWeatherCode)}</strong>
                </div>
              </article>
              <article className="metric-card">
                <span className="metric-label">Temperature</span>
                <strong>
                  {formatValue(
                    currentWeather.temperature_2m,
                    currentUnits.temperature_2m,
                  )}
                </strong>
              </article>
              <article className="metric-card">
                <span className="metric-label">Apparent</span>
                <strong>
                  {formatValue(
                    currentWeather.apparent_temperature,
                    currentUnits.apparent_temperature,
                  )}
                </strong>
              </article>
              <article className="metric-card">
                <span className="metric-label">Humidity</span>
                <strong>
                  {formatValue(
                    currentWeather.relative_humidity_2m,
                    currentUnits.relative_humidity_2m,
                  )}
                </strong>
              </article>
              <article className="metric-card">
                <span className="metric-label">Wind speed</span>
                <strong>
                  {formatValue(
                    currentWeather.wind_speed_10m,
                    currentUnits.wind_speed_10m,
                  )}
                </strong>
              </article>
              <article className="metric-card">
                <span className="metric-label">Precipitation</span>
                <strong>
                  {formatValue(
                    currentWeather.precipitation,
                    currentUnits.precipitation,
                  )}
                </strong>
              </article>
            </div>
          ) : (
            <div className="module-empty">
              Current conditions are unavailable for this saved range.
            </div>
          )}
        </section>
      </div>

      <section className="overview-panel">
        <div className="panel-heading">
          <div>
            <h3>Travel insights</h3>
            <p>Quick planning guidance derived from the saved forecast</p>
          </div>
        </div>
        <TravelInsights weatherRecord={weatherRecord} />
      </section>

      <section className="overview-panel">
        <div className="panel-heading">
          <div>
            <h3>Five-day outlook</h3>
            <p>First five saved daily rows from the selected record</p>
          </div>
        </div>

        {forecastDays.length ? (
          <div className="forecast-table-wrapper">
            <div className="forecast-table">
              <div className="forecast-row forecast-row-header">
                <span>Date</span>
                <span>Condition</span>
                <span>Min</span>
                <span>Max</span>
                <span>Precipitation</span>
                <span>Wind</span>
                <span>Sunrise</span>
                <span>Sunset</span>
              </div>
              {forecastDays.map((day) => (
                <div className="forecast-row" key={day.id}>
                  <strong>{formatDate(day.weather_date)}</strong>
                  <span className="weather-label-compact">
                    <span className="record-weather-icon" aria-hidden="true">
                      {getWeatherIcon(day.weather_code)}
                    </span>
                    <span>{getWeatherDescription(day.weather_code)}</span>
                  </span>
                  <span>
                    {formatValue(
                      day.temperature_min,
                      DEFAULT_DAILY_UNITS.temperature_min,
                    )}
                  </span>
                  <span>
                    {formatValue(
                      day.temperature_max,
                      DEFAULT_DAILY_UNITS.temperature_max,
                    )}
                  </span>
                  <span>
                    {formatValue(
                      day.precipitation_sum,
                      DEFAULT_DAILY_UNITS.precipitation_sum,
                    )}
                  </span>
                  <span>
                    {formatValue(
                      day.wind_speed_max,
                      DEFAULT_DAILY_UNITS.wind_speed_max,
                    )}
                  </span>
                  <span>{formatTime(day.sunrise)}</span>
                  <span>{formatTime(day.sunset)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="module-empty">No forecast rows were returned.</div>
        )}
      </section>
    </section>
  );
}

export default WeatherOverview;
