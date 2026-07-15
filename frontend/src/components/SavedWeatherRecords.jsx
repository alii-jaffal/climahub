import EditWeatherRecordForm from "./EditWeatherRecordForm";
import WeatherRecordRow from "./WeatherRecordRow";

function SavedWeatherRecords({
  records,
  selectedRecordId,
  selectedRecord,
  loading,
  error,
  errorKind,
  actionLoading,
  actionError,
  actionErrorKind,
  onRefresh,
  onOpenRecord,
  onUpdateRecord,
  onDeleteRecord,
}) {
  const exportBaseUrl = `${import.meta.env.VITE_API_BASE_URL}/api/weather-records/export`;

  return (
    <section className="surface">
      <div className="section-header">
        <div>
          <span className="eyebrow">Library</span>
          <h2>Saved records</h2>
        </div>
        <div className="section-actions">
          <a
            className="secondary-button button-link"
            href={`${exportBaseUrl}?format=json`}
          >
            Export JSON
          </a>
          <a
            className="secondary-button button-link"
            href={`${exportBaseUrl}?format=csv`}
          >
            Export CSV
          </a>
          <button
            className="secondary-button"
            type="button"
            onClick={onRefresh}
            disabled={loading || actionLoading}
          >
            {loading ? "Refreshing..." : "Refresh list"}
          </button>
        </div>
      </div>

      {error ? (
        <p
          className={`error-banner ${
            errorKind === "location-not-found" ? "error-banner-warning" : ""
          }`}
        >
          {error}
        </p>
      ) : null}

      <div className="saved-records-layout">
        {loading && !records.length ? (
          <div className="state-card state-card-loading">
            <span className="loading-indicator" aria-hidden="true" />
            <div>
              <strong>Loading saved weather records</strong>
              <p>Waiting for the latest records from the API.</p>
            </div>
          </div>
        ) : error && !records.length ? (
          <div className="state-card state-card-error">
            <strong>Saved records are unavailable</strong>
            <p>{error}</p>
          </div>
        ) : records.length ? (
          <div className="record-list">
            {records.map((record) => (
              <WeatherRecordRow
                key={record.record_id}
                record={record}
                selected={record.record_id === selectedRecordId}
                onOpen={onOpenRecord}
                disabled={actionLoading}
              />
            ))}
          </div>
        ) : (
          <div className="state-card state-card-empty">
            <strong>No saved weather records yet</strong>
            <p>Create a weather record to populate this list.</p>
          </div>
        )}

        <EditWeatherRecordForm
          weatherRecord={selectedRecord}
          loading={actionLoading}
          error={actionError}
          errorKind={actionErrorKind}
          onSubmit={onUpdateRecord}
          onDelete={onDeleteRecord}
        />
      </div>
    </section>
  );
}

export default SavedWeatherRecords;
