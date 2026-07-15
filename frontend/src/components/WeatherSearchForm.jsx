import { useMemo, useState } from "react";

function getDefaultDates() {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 4);

  return {
    start_date: startDate.toISOString().slice(0, 10),
    end_date: endDate.toISOString().slice(0, 10),
  };
}

function WeatherSearchForm({
  loading,
  error,
  errorKind,
  onSubmit,
  onUseCurrentLocation,
}) {
  const defaultDates = getDefaultDates();
  const [formData, setFormData] = useState({
    location: "Beirut",
    start_date: defaultDates.start_date,
    end_date: defaultDates.end_date,
    notes: "Summer visit",
  });
  const [formError, setFormError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const isBusy = loading || locationLoading;

  const visibleError = useMemo(() => formError || error, [error, formError]);
  const visibleErrorKind = formError ? "api-error" : errorKind;

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
    setFormError("");
  }

  function validateForm(requireLocation = true) {
    const trimmedLocation = formData.location.trim();
    const trimmedNotes = formData.notes.trim();

    if (
      (requireLocation && !trimmedLocation) ||
      !formData.start_date ||
      !formData.end_date
    ) {
      setFormError(
        requireLocation
          ? "Location, start date, and end date are required."
          : "Start date and end date are required.",
      );
      return null;
    }

    if (formData.start_date > formData.end_date) {
      setFormError("Start date must be before or equal to end date.");
      return null;
    }

    return {
      location: trimmedLocation,
      start_date: formData.start_date,
      end_date: formData.end_date,
      notes: trimmedNotes || null,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = validateForm();

    if (!payload) {
      return;
    }

    await onSubmit(payload);
  }

  function handleUseCurrentLocation() {
    if (!onUseCurrentLocation) {
      return;
    }

    const payload = validateForm(false);

    if (!payload) {
      return;
    }

    if (!navigator.geolocation) {
      setFormError("Geolocation is not supported by this browser.");
      return;
    }

    setFormError("");
    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocationLoading(false);

        await onUseCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          start_date: payload.start_date,
          end_date: payload.end_date,
          notes: payload.notes,
        });
      },
      () => {
        setLocationLoading(false);
        setFormError("Unable to access your current location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  return (
    <section className="surface form-surface">
      <div className="section-header">
        <div>
          <span className="eyebrow">Search</span>
          <h2>New weather record</h2>
        </div>
        {isBusy ? (
          <div className="status-inline">
            <span className="loading-indicator" aria-hidden="true" />
            <span>{locationLoading ? "Resolving location" : "Submitting"}</span>
          </div>
        ) : null}
      </div>

      <form className="weather-form" onSubmit={handleSubmit} aria-busy={isBusy}>
        <fieldset className="form-fieldset" disabled={isBusy}>
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
            <button className="primary-button" type="submit" disabled={isBusy}>
              {loading ? "Saving..." : "Search weather"}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isBusy}
            >
              {locationLoading ? "Locating..." : "Use my current location"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}

export default WeatherSearchForm;
