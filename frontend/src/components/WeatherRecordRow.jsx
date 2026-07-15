import { getWeatherDescription, getWeatherIcon } from "../utils/weatherCodes";
import { formatDate } from "../utils/weather";

function WeatherRecordRow({ record, selected, onOpen, disabled = false }) {
  const previewCode =
    record?.weather_data?.current?.weather_code ??
    record?.daily_weather?.[0]?.weather_code;

  return (
    <button
      type="button"
      className={`record-row ${selected ? "record-row-selected" : ""}`}
      onClick={() => onOpen(record.record_id)}
      disabled={disabled}
    >
      <div className="record-row-main">
        <span className="record-weather-icon" aria-hidden="true">
          {getWeatherIcon(previewCode)}
        </span>
        <div className="record-row-copy">
          <strong>{record.resolved_location}</strong>
          <span>{getWeatherDescription(previewCode)}</span>
        </div>
      </div>
      <div className="record-row-meta">
        <span>
          {formatDate(record.start_date)} to {formatDate(record.end_date)}
        </span>
        <span>Saved from "{record.location_query}"</span>
      </div>
    </button>
  );
}

export default WeatherRecordRow;
