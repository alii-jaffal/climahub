import { useEffect, useState } from "react";

import {
  createWeatherRecord,
  createWeatherRecordFromCoordinates,
  deleteWeatherRecord,
  getWeatherRecord,
  getWeatherRecords,
  updateWeatherRecord,
} from "./api/weatherRecords";
import "./App.css";
import SavedWeatherRecords from "./components/SavedWeatherRecords";
import WeatherSearchForm from "./components/WeatherSearchForm";
import WeatherOverview from "./components/WeatherOverview";

function getErrorState(error, fallback = "Request failed") {
  const status = error.response?.status;
  const detail = error.response?.data?.detail;

  if (
    status === 404 &&
    typeof detail === "string" &&
    detail.toLowerCase().includes("location")
  ) {
    return {
      kind: "location-not-found",
      message:
        "No matching location was found. Try a more specific city, region, or country.",
    };
  }

  if (status === 504) {
    return {
      kind: "api-error",
      message: "The weather provider timed out. Try the request again.",
    };
  }

  if (status === 502) {
    return {
      kind: "api-error",
      message:
        "The weather provider returned an upstream error. Try again in a moment.",
    };
  }

  if (status === 500) {
    return {
      kind: "api-error",
      message: "The server could not complete the request. Check the backend logs.",
    };
  }

  if (typeof detail === "string" && detail) {
    return {
      kind: "api-error",
      message: detail,
    };
  }

  if (Array.isArray(detail) && detail.length) {
    return {
      kind: "api-error",
      message: detail
        .map((item) => item?.msg)
        .filter(Boolean)
        .join(". "),
    };
  }

  return {
    kind: "api-error",
    message: error.message || fallback,
  };
}

function App() {
  const [savedRecords, setSavedRecords] = useState([]);
  const [weatherRecord, setWeatherRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState(null);
  const [recordActionLoading, setRecordActionLoading] = useState(false);
  const [recordActionError, setRecordActionError] = useState(null);

  useEffect(() => {
    void refreshRecords();
  }, []);

  async function refreshRecords(preferredRecordId = null, preferredRecord = null) {
    setRecordsLoading(true);
    setRecordsError(null);

    try {
      const response = await getWeatherRecords(0, 20);
      const nextRecords = response.records ?? [];
      const selectedRecord =
        preferredRecord ??
        nextRecords.find((record) => record.record_id === preferredRecordId) ??
        nextRecords.find((record) => record.record_id === weatherRecord?.record_id) ??
        nextRecords[0] ??
        null;

      setSavedRecords(nextRecords);
      setWeatherRecord(selectedRecord);
    } catch (requestError) {
      setRecordsError(
        getErrorState(requestError, "Could not load saved weather records."),
      );
    } finally {
      setRecordsLoading(false);
    }
  }

  async function handleCreateRecord(data) {
    setLoading(true);
    setError(null);
    setRecordActionError(null);

    try {
      const createdRecord = await createWeatherRecord(data);
      setWeatherRecord(createdRecord);
      await refreshRecords(createdRecord.record_id, createdRecord);
    } catch (requestError) {
      setError(getErrorState(requestError));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRecordFromCoordinates(data) {
    setLoading(true);
    setError(null);
    setRecordActionError(null);

    try {
      const createdRecord = await createWeatherRecordFromCoordinates(data);
      setWeatherRecord(createdRecord);
      await refreshRecords(createdRecord.record_id, createdRecord);
    } catch (requestError) {
      setError(
        getErrorState(
          requestError,
          "Could not create a record from your current location.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenRecord(recordId) {
    setRecordActionLoading(true);
    setRecordActionError(null);

    try {
      const record = await getWeatherRecord(recordId);
      setWeatherRecord(record);
    } catch (requestError) {
      setRecordActionError(
        getErrorState(requestError, "Could not open saved weather record."),
      );
    } finally {
      setRecordActionLoading(false);
    }
  }

  async function handleUpdateRecord(recordId, data) {
    setRecordActionLoading(true);
    setRecordActionError(null);

    try {
      const updatedRecord = await updateWeatherRecord(recordId, data);
      setWeatherRecord(updatedRecord);
      await refreshRecords(updatedRecord.record_id, updatedRecord);
    } catch (requestError) {
      setRecordActionError(
        getErrorState(requestError, "Could not update weather record."),
      );
    } finally {
      setRecordActionLoading(false);
    }
  }

  async function handleDeleteRecord(recordId) {
    setRecordActionLoading(true);
    setRecordActionError(null);

    try {
      await deleteWeatherRecord(recordId);
      await refreshRecords();
    } catch (requestError) {
      setRecordActionError(
        getErrorState(requestError, "Could not delete weather record."),
      );
    } finally {
      setRecordActionLoading(false);
    }
  }

  const isBusy = loading || recordsLoading || recordActionLoading;
  const showResultLoading =
    loading || recordActionLoading || (recordsLoading && !weatherRecord);
  const emptyResultState = recordActionError || recordsError || error;

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">ClimaHub</span>
          <h1>Search and persist weather records from the browser.</h1>
          <p className="lead">
            The form below sends a location, date range, and optional notes to
            FastAPI, then renders the stored response that came back from
            PostgreSQL.
          </p>
        </div>
        <div className="status-panel status-healthy">
          <div className="section-header">
            <div>
              <span className="eyebrow">Connection</span>
              <h2>Frontend API client</h2>
            </div>
          </div>
          <dl className="meta-grid">
            <div>
              <dt>Base URL</dt>
              <dd>{import.meta.env.VITE_API_BASE_URL}</dd>
            </div>
            <div>
              <dt>Transport</dt>
              <dd>axios + JSON</dd>
            </div>
            <div>
              <dt>Workflow</dt>
              <dd>Full browser CRUD</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd>
                {isBusy ? "Busy" : "Ready"}
              </dd>
            </div>
          </dl>
          {isBusy ? (
            <div className="status-inline">
              <span className="loading-indicator" aria-hidden="true" />
              <span>Processing your latest request.</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="content-grid">
        <div className="sidebar-stack">
          <WeatherSearchForm
            loading={loading}
            error={error?.message ?? ""}
            errorKind={error?.kind ?? "api-error"}
            onSubmit={handleCreateRecord}
            onUseCurrentLocation={handleCreateRecordFromCoordinates}
          />
          <SavedWeatherRecords
            records={savedRecords}
            selectedRecordId={weatherRecord?.record_id ?? null}
            selectedRecord={weatherRecord}
            loading={recordsLoading}
            error={recordsError?.message ?? ""}
            errorKind={recordsError?.kind ?? "api-error"}
            actionLoading={recordActionLoading}
            actionError={recordActionError?.message ?? ""}
            actionErrorKind={recordActionError?.kind ?? "api-error"}
            onRefresh={() => refreshRecords()}
            onOpenRecord={handleOpenRecord}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
          />
        </div>

        <section className="surface result-surface">
          <div className="section-header">
            <div>
              <span className="eyebrow">Result</span>
              <h2>Saved weather view</h2>
            </div>
          </div>
          {showResultLoading ? (
            <div className="state-card state-card-loading">
              <span className="loading-indicator" aria-hidden="true" />
              <div>
                <strong>Loading weather result</strong>
                <p>Waiting for the API and database response.</p>
              </div>
            </div>
          ) : weatherRecord ? (
            <div className="result-stack">
              <WeatherOverview weatherRecord={weatherRecord} />
              <details className="raw-json">
                <summary>Raw JSON response</summary>
                <pre className="json-preview">
                  {JSON.stringify(weatherRecord, null, 2)}
                </pre>
              </details>
            </div>
          ) : emptyResultState ? (
            <div
              className={`state-card ${
                emptyResultState.kind === "location-not-found"
                  ? "state-card-warning"
                  : "state-card-error"
              }`}
            >
              <strong>
                {emptyResultState.kind === "location-not-found"
                  ? "Location not found"
                  : "API request failed"}
              </strong>
              <p>{emptyResultState.message}</p>
            </div>
          ) : (
            <div className="state-card state-card-empty">
              <strong>No weather record selected</strong>
              <p>
                Create or open a saved weather record to see the current
                conditions, map, insights, and forecast here.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
