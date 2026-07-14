import { useState } from "react";

import { createWeatherRecord } from "./api/weatherRecords";
import "./App.css";
import WeatherSearchForm from "./components/WeatherSearchForm";

function App() {
  const [weatherRecord, setWeatherRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateRecord(data) {
    setLoading(true);
    setError("");

    try {
      const createdRecord = await createWeatherRecord(data);
      setWeatherRecord(createdRecord);
    } catch (requestError) {
      const detail =
        requestError.response?.data?.detail ||
        requestError.message ||
        "Request failed";

      setError(detail);
    }
    finally {
      setLoading(false);
    }
  }

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
              <dd>Create weather record</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd>{loading ? "Submitting" : "Ready"}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="content-grid">
        <WeatherSearchForm
          loading={loading}
          error={error}
          onSubmit={handleCreateRecord}
        />

        <section className="surface result-surface">
          <div className="section-header">
            <div>
              <span className="eyebrow">Result</span>
              <h2>Latest stored response</h2>
            </div>
          </div>
          {weatherRecord ? (
            <pre className="json-preview">
              {JSON.stringify(weatherRecord, null, 2)}
            </pre>
          ) : (
            <p className="empty-state">
              Submit the form to create a saved weather record and inspect the
              returned JSON payload here.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
