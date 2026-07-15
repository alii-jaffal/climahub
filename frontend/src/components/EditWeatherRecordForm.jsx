import { useEffect, useMemo, useState } from "react";

function getInitialFormState(weatherRecord) {
  if (!weatherRecord) {
    return {
      location: "",
      start_date: "",
      end_date: "",
      notes: "",
    };
  }

  return {
    location: weatherRecord.location_query ?? "",
    start_date: weatherRecord.start_date ?? "",
    end_date: weatherRecord.end_date ?? "",
    notes: weatherRecord.notes ?? "",
  };
}

function EditWeatherRecordForm({
  weatherRecord,
  loading,
  error,
  errorKind,
  onSubmit,
  onDelete,
}) {
  const [formData, setFormData] = useState(getInitialFormState(weatherRecord));
  const [formError, setFormError] = useState("");
  const visibleError = useMemo(() => formError || error, [error, formError]);
  const visibleErrorKind = formError ? "api-error" : errorKind;

  useEffect(() => {
    setFormData(getInitialFormState(weatherRecord));
    setFormError("");
  }, [weatherRecord]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!weatherRecord) {
      return;
    }

    const trimmedLocation = formData.location.trim();
    const normalizedNotes = formData.notes.trim() || null;

    if (!trimmedLocation || !formData.start_date || !formData.end_date) {
      setFormError("Location, start date, and end date are required.");
      return;
    }

    if (formData.start_date > formData.end_date) {
      setFormError("Start date must be before or equal to end date.");
      return;
    }

    const updates = {};

    if (trimmedLocation !== weatherRecord.location_query) {
      updates.location = trimmedLocation;
    }

    if (formData.start_date !== weatherRecord.start_date) {
      updates.start_date = formData.start_date;
    }

    if (formData.end_date !== weatherRecord.end_date) {
      updates.end_date = formData.end_date;
    }

    if (normalizedNotes !== (weatherRecord.notes ?? null)) {
      updates.notes = normalizedNotes;
    }

    if (!Object.keys(updates).length) {
      setFormError("No changes to save.");
      return;
    }

    await onSubmit(weatherRecord.record_id, updates);
  }

  function handleDelete() {
    if (!weatherRecord) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this weather record?",
    );

    if (!confirmed) {
      return;
    }

    onDelete(weatherRecord.record_id);
  }

  if (!weatherRecord) {
    return (
      <section className="edit-panel edit-panel-empty">
        <p>Select a saved record to inspect, update, or delete it.</p>
      </section>
    );
  }

  return (
    <section className="edit-panel">
      <div className="section-header">
        <div>
          <span className="eyebrow">Selected record</span>
          <h2>Edit saved request</h2>
        </div>
        {loading ? (
          <div className="status-inline">
            <span className="loading-indicator" aria-hidden="true" />
            <span>Saving changes</span>
          </div>
        ) : null}
      </div>

      <form className="weather-form" onSubmit={handleSubmit} aria-busy={loading}>
        <fieldset className="form-fieldset" disabled={loading}>
          <label className="field">
            <span>Location</span>
            <input
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              placeholder="Beirut"
              required
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Start date</span>
              <input
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                required
              />
            </label>

            <label className="field">
              <span>End date</span>
              <input
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <label className="field">
            <span>Notes</span>
            <textarea
              name="notes"
              rows="4"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Optional travel context"
              maxLength={2000}
            />
          </label>

          {visibleError ? (
            <p
              className={`error-banner ${
                visibleErrorKind === "location-not-found"
                  ? "error-banner-warning"
                  : ""
              }`}
            >
              {visibleError}
            </p>
          ) : null}

          <div className="button-row">
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </button>
            <button
              className="danger-button"
              type="button"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Working..." : "Delete record"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}

export default EditWeatherRecordForm;
