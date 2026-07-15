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

  return (
    <section className="surface weather-overview">
      <div className="section-header">
        <div>
          <span className="eyebrow">Forecast result</span>
          <h2>{weatherRecord.resolved_location}</h2>
        </div>
      </div>

      <dl className="summary-grid">
        <div>
          <dt>Requested range</dt>
          <dd>
            {formatDate(weatherRecord.start_date)} to{" "}
            {formatDate(weatherRecord.end_date)}
          </dd>
        </div>
        <div>
          <dt>Coordinates</dt>
          <dd>
            {weatherRecord.latitude}, {weatherRecord.longitude}
          </dd>
        </div>
      </dl>

      <WeatherMap weatherRecord={weatherRecord} />

      <section className="overview-block">
        <div className="section-header compact-header">
          <div>
            <span className="eyebrow">Current weather</span>
            <h3 className="subheading">Live conditions</h3>
          </div>
        </div>

        {currentWeather ? (
          <div className="metric-grid">
            <article className="metric-card">
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
          <p className="empty-state">
            Current weather is only available when the saved range uses the
            forecast service.
          </p>
        )}
      </section>

      <TravelInsights weatherRecord={weatherRecord} />

      <section className="overview-block">
        <div className="section-header compact-header">
          <div>
            <span className="eyebrow">Five-day forecast</span>
            <h3 className="subheading">Daily outlook</h3>
          </div>
        </div>

        {forecastDays.length ? (
          <div className="forecast-grid">
            {forecastDays.map((day) => (
              <article className="forecast-card" key={day.id}>
                <header className="forecast-card-header">
                  <strong>{formatDate(day.weather_date)}</strong>
                  <span className="weather-label-compact">
                    <span className="record-weather-icon" aria-hidden="true">
                      {getWeatherIcon(day.weather_code)}
                    </span>
                    <span>{getWeatherDescription(day.weather_code)}</span>
                  </span>
                </header>
                <dl className="forecast-details">
                  <div>
                    <dt>Min</dt>
                    <dd>
                      {formatValue(
                        day.temperature_min,
                        DEFAULT_DAILY_UNITS.temperature_min,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Max</dt>
                    <dd>
                      {formatValue(
                        day.temperature_max,
                        DEFAULT_DAILY_UNITS.temperature_max,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Precipitation</dt>
                    <dd>
                      {formatValue(
                        day.precipitation_sum,
                        DEFAULT_DAILY_UNITS.precipitation_sum,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Wind max</dt>
                    <dd>
                      {formatValue(
                        day.wind_speed_max,
                        DEFAULT_DAILY_UNITS.wind_speed_max,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Sunrise</dt>
                    <dd>{formatTime(day.sunrise)}</dd>
                  </div>
                  <div>
                    <dt>Sunset</dt>
                    <dd>{formatTime(day.sunset)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">No forecast rows were returned.</p>
        )}
      </section>
    </section>
  );
}

export default WeatherOverview;
