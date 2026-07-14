import { useMemo, useState } from "react";

function WeatherSearchForm({ loading, error, onSubmit }) {
  const [formData, setFormData] = useState({
    location: "Beirut",
    start_date: "2026-07-14",
    end_date: "2026-07-18",
    notes: "Summer visit",
  });
  const [formError, setFormError] = useState("");

  const visibleError = useMemo(() => formError || error, [error, formError]);

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

    const trimmedLocation = formData.location.trim();
    const trimmedNotes = formData.notes.trim();

    if (!trimmedLocation || !formData.start_date || !formData.end_date) {
      setFormError("Location, start date, and end date are required.");
      return;
    }

    if (formData.start_date > formData.end_date) {
      setFormError("Start date must be before or equal to end date.");
      return;
    }

    await onSubmit({
      location: trimmedLocation,
      start_date: formData.start_date,
      end_date: formData.end_date,
      notes: trimmedNotes || null,
    });
  }

  return (
    <section className="surface form-surface">
      <div className="section-header">
        <div>
          <span className="eyebrow">Weather search</span>
          <h2>Create a saved weather record</h2>
        </div>
      </div>

      <form className="weather-form" onSubmit={handleSubmit}>
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
          />
        </label>

        {visibleError ? <p className="error-banner">{visibleError}</p> : null}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Search weather"}
        </button>
      </form>
    </section>
  );
}

export default WeatherSearchForm;
