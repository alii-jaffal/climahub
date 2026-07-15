import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";

import { formatValue } from "../utils/weather";

const DEFAULT_CURRENT_UNITS = {
  temperature_2m: "C",
};

function MapViewport({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), {
      animate: true,
    });
  }, [center, map]);

  return null;
}

function WeatherMap({ weatherRecord }) {
  const center = [weatherRecord.latitude, weatherRecord.longitude];
  const currentWeather = weatherRecord?.weather_data?.current ?? null;
  const currentUnits = {
    ...DEFAULT_CURRENT_UNITS,
    ...(weatherRecord?.weather_data?.current_units ?? {}),
  };

  return (
    <div className="map-frame">
      <MapContainer
        center={center}
        zoom={10}
        scrollWheelZoom={false}
        className="map-container"
      >
        <MapViewport center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={center}
          radius={10}
          pathOptions={{
            color: "#176a56",
            fillColor: "#176a56",
            fillOpacity: 0.88,
            weight: 2,
          }}
        >
          <Popup>
            <div className="map-popup">
              <strong>{weatherRecord.resolved_location}</strong>
              <span>
                Current temperature:{" "}
                {currentWeather
                  ? formatValue(
                      currentWeather.temperature_2m,
                      currentUnits.temperature_2m,
                    )
                  : "Unavailable for this saved range"}
              </span>
            </div>
          </Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}

export default WeatherMap;
