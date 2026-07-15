# ClimaHub

A full-stack weather application that retrieves real weather information, validates locations and date ranges, stores weather requests in PostgreSQL, and allows users to manage and export previously requested weather records.

**Candidate:** Ali Jaffal  
**Assessment:** AI Engineer Intern Technical Assessment  
**Completed:** Tech Assessment #1 — Frontend and Tech Assessment #2 — Backend

> **Demo video:** Add the public demo video URL here before submission.

---

## Overview

ClimaHub allows users to search for weather information using a city, town, postal code, landmark, or their current browser location.

The application resolves the requested location, retrieves real weather information from Open-Meteo, stores the request and returned weather data in PostgreSQL, and displays the result through a responsive React interface.

Users can also view previously saved requests, update them, delete them, and export stored weather data as JSON or CSV.

---

## Features

### Weather and location

- Search by city, town, postal code, landmark, or similar location text
- Validate and resolve locations through the Open-Meteo Geocoding API
- Use the browser's current geolocation
- Retrieve current and future weather
- Retrieve historical weather
- Display resolved location, coordinates, and timezone
- Display current temperature, apparent temperature, humidity, precipitation, and wind
- Display a five-day weather forecast
- Convert numeric weather codes into readable descriptions and icons

### Persistence and CRUD

- Create and store weather requests
- Read all saved weather records
- Read an individual weather record
- Update location, date range, or notes
- Automatically retrieve fresh weather when location or dates are changed
- Delete records and their associated daily weather rows
- Store complete provider responses using PostgreSQL `JSONB`

### Additional functionality

- Interactive map using Leaflet and OpenStreetMap
- Rule-based travel insights based on temperature, precipitation, wind, and UV conditions
- Export stored records as JSON
- Export stored records as CSV
- Loading, empty, error, timeout, and location-not-found states
- Responsive layout for desktop, tablet, and mobile devices
- Automatically generated Swagger/OpenAPI documentation

---

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- Axios
- React Leaflet
- Leaflet
- OpenStreetMap
- CSS Grid, Flexbox, and media queries

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- Pydantic Settings
- HTTPX
- SQLAlchemy
- Alembic
- Psycopg 3

### Database and infrastructure

- PostgreSQL 18
- Docker
- Docker Compose
- PostgreSQL `JSONB`
- Named Docker volume for persistence

---

## External APIs

ClimaHub uses the following Open-Meteo services:

| Service | Purpose |
|---|---|
| Open-Meteo Geocoding API | Resolves location searches into coordinates and timezone information |
| Open-Meteo Forecast API | Retrieves current and future weather |
| Open-Meteo Historical Weather API | Retrieves weather for historical date ranges |
| Browser Geolocation API | Retrieves the user's current coordinates with permission |
| OpenStreetMap | Provides map tiles |
| Leaflet | Displays the interactive map |

No Open-Meteo API key is required for this project.

Weather data is provided by [Open-Meteo](https://open-meteo.com/).

Map data is provided by [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).

---

## Project Structure

```text
ClimaHub/
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   └── env.py
│   ├── app/
│   │   ├── api/
│   │   │   ├── dependencies.py
│   │   │   └── routes/
│   │   ├── database/
│   │   │   ├── connection.py
│   │   │   ├── models.py
│   │   │   └── repository.py
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── main.py
│   │   └── settings.py
│   ├── alembic.ini
│   ├── pyproject.toml
│   └── uv.lock
│
├── docker/
│   └── compose.yaml
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── .env
├── .gitignore
└── README.md
```

---

## Database Design

ClimaHub uses two application tables.

### `weather_records`

Stores one row for each user weather request.

Important fields include:

- Original location query
- Resolved location
- Latitude and longitude
- Timezone
- Start and end dates
- Optional notes
- Full provider response as `JSONB`
- Creation and update timestamps

### `daily_weather`

Stores one row for every day returned for a weather request.

Important fields include:

- Weather date
- Minimum temperature
- Maximum temperature
- Mean temperature
- Precipitation
- Maximum wind speed
- Weather code
- Sunrise
- Sunset

Each daily row belongs to one weather record.

Deleting a parent weather record also deletes its associated daily rows through cascading deletion.

The database also contains an `alembic_version` table used to track schema migrations.

---

## Prerequisites

Install the following before running ClimaHub:

- Git
- Docker Desktop
- Python 3.11 or newer
- [uv](https://docs.astral.sh/uv/)
- Node.js 20.19+ or 22.12+
- npm

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/alii-jaffal/climahub.git
cd climahub
```

### 2. Create the root environment file

Create a file named `.env` in the root `climahub` folder:

```env
POSTGRES_DB=climahub
POSTGRES_USER=climahub
POSTGRES_PASSWORD=climahub
POSTGRES_PORT=5433

DATABASE_URL=postgresql+psycopg://climahub:climahub@localhost:5433/climahub
```

The `.env` file is ignored by Git and should not be committed.

If port `5433` is already being used, change `POSTGRES_PORT` and the port inside `DATABASE_URL` to the same available port.

### 3. Start PostgreSQL

Run this command from the project root:

```bash
docker compose --env-file .env -f docker/compose.yaml up -d
```

Check the container status:

```bash
docker compose --env-file .env -f docker/compose.yaml ps
```

The PostgreSQL service should eventually report a healthy status.

### 4. Install backend dependencies

```bash
cd backend
uv sync
```

The backend dependencies are declared in `backend/pyproject.toml` and locked in `backend/uv.lock`.

### 5. Apply database migrations

From the `backend` folder:

```bash
uv run alembic upgrade head
```

This creates:

- `weather_records`
- `daily_weather`
- `alembic_version`

### 6. Start the FastAPI backend

```bash
uv run uvicorn app.main:app --reload
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

Health endpoint:

```text
http://127.0.0.1:8000/health
```

### 7. Configure the frontend

Open another terminal and move to the frontend folder:

```bash
cd frontend
```

Create `frontend/.env` with:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

You may also copy the included `frontend/.env.example`.

### 8. Install frontend dependencies

```bash
npm install
```

### 9. Start the frontend

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## Running the Complete Application

ClimaHub requires three running processes:

### PostgreSQL

From the project root:

```bash
docker compose --env-file .env -f docker/compose.yaml up -d
```

### FastAPI

From `backend/`:

```bash
uv run uvicorn app.main:app --reload
```

### React

From `frontend/`:

```bash
npm run dev
```

---

## API Endpoints

Base URL:

```text
http://127.0.0.1:8000
```

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Check backend health |
| `POST` | `/api/weather-records` | Create a record using a location query |
| `POST` | `/api/weather-records/coordinates` | Create a record using coordinates |
| `GET` | `/api/weather-records` | List saved weather records |
| `GET` | `/api/weather-records/{record_id}` | Read one saved record |
| `PATCH` | `/api/weather-records/{record_id}` | Partially update a saved record |
| `DELETE` | `/api/weather-records/{record_id}` | Delete a saved record |
| `GET` | `/api/weather-records/export?format=json` | Export all records as JSON |
| `GET` | `/api/weather-records/export?format=csv` | Export all records as CSV |

---

## Example Requests

### Create from a location

```http
POST /api/weather-records
Content-Type: application/json
```

```json
{
  "location": "Beirut",
  "start_date": "2026-07-15",
  "end_date": "2026-07-19",
  "notes": "Summer travel plan"
}
```

### Create from coordinates

```http
POST /api/weather-records/coordinates
Content-Type: application/json
```

```json
{
  "latitude": 33.8938,
  "longitude": 35.5018,
  "start_date": "2026-07-15",
  "end_date": "2026-07-19",
  "notes": "Current location"
}
```

### List records

```http
GET /api/weather-records?skip=0&limit=20
```

### Update notes

```http
PATCH /api/weather-records/1
Content-Type: application/json
```

```json
{
  "notes": "Updated travel notes"
}
```

### Update the location or date range

```json
{
  "location": "Paris",
  "start_date": "2026-07-16",
  "end_date": "2026-07-20"
}
```

When the location or dates change, ClimaHub calls the weather provider again and replaces the stored weather information.

---

## Validation and Error Handling

ClimaHub validates data at multiple levels.

### Request validation

Pydantic validates:

- Required fields
- Location length
- Latitude and longitude ranges
- Date formats
- Start date not being after end date
- Optional note length
- Pagination values

### Database validation

PostgreSQL and SQLAlchemy enforce:

- Primary keys
- Foreign keys
- Required columns
- Unique daily weather dates within each request
- Valid coordinate ranges
- Valid stored date order
- Cascading deletion

### External-service errors

The backend handles:

| Status | Meaning |
|---|---|
| `404` | Location or stored weather record was not found |
| `422` | Request validation failed |
| `502` | Open-Meteo returned an unsuccessful response |
| `504` | Open-Meteo timed out |
| `500` | Unexpected database or server failure |

The frontend displays understandable messages instead of exposing raw provider failures.

---

## Date-Range Behavior

ClimaHub selects the weather provider according to the requested dates:

- A fully historical range uses the Historical Weather API.
- A range beginning today or later uses the Forecast API.
- A range that starts before today and ends today or later is currently rejected.

Current weather is only included when the Forecast API is used. Historical requests contain daily historical weather but do not include live current conditions.

---

## Export Formats

### JSON

The JSON export includes complete saved weather records and their related daily weather data.

```text
GET /api/weather-records/export?format=json
```

### CSV

The CSV export produces one row per daily-weather entry and includes:

- Record ID
- Resolved location
- Coordinates
- Requested date range
- Weather date
- Minimum and maximum temperature
- Precipitation
- Maximum wind speed
- Weather code

```text
GET /api/weather-records/export?format=csv
```

---

## Responsive Design

The frontend follows a web-first responsive approach using:

- CSS Grid
- Flexbox
- Responsive widths
- Media queries
- Wrapping layouts
- Scrollable forecast content on narrow screens

The interface is designed to remain usable on:

- Desktop computers
- Tablets
- Smartphones

---

## PM Accelerator

This project was developed for the Product Manager Accelerator AI Engineer Intern Technical Assessment.

Product Manager Accelerator supports product-management professionals through different stages of their careers. Its programs focus on developing practical product skills, building portfolios, preparing for interviews, and helping professionals work on technology and AI-powered products.

Learn more through the official [Product Manager Accelerator LinkedIn page](https://www.linkedin.com/school/pmaccelerator/) and [PM Accelerator website](https://www.pmaccelerator.io/).

---

## Assessment Coverage

### Tech Assessment #1 — Frontend

- Location input
- Current weather
- Browser current-location support
- Five-day forecast
- Real API data
- Weather icons and descriptions
- Graceful error handling
- Responsive web design
- Interactive map

### Tech Assessment #2 — Backend

- PostgreSQL persistence
- Create, Read, Update, and Delete operations
- Location validation and geocoding
- Date-range validation
- Forecast and historical API integration
- RESTful API design
- Error handling
- JSON and CSV export
- Docker-based database setup
- Alembic database migrations

---

## Known Limitations

- Date ranges crossing from historical dates into today or the future are not currently supported.
- Current conditions are unavailable for fully historical searches.
- Geocoding automatically selects the strongest valid match returned by the provider.
- The backend and frontend are configured for local development by default.
- Public OpenStreetMap tiles should not be used for high-traffic production deployments without reviewing the tile usage policy.

---

## Useful Commands

### Stop PostgreSQL while preserving data

```bash
docker compose --env-file .env -f docker/compose.yaml down
```

### Delete PostgreSQL and its stored ClimaHub data

```bash
docker compose --env-file .env -f docker/compose.yaml down -v
```

Use `-v` only when you intentionally want to delete the database volume.

### View PostgreSQL logs

```bash
docker compose --env-file .env -f docker/compose.yaml logs postgres
```

### Check the active Alembic migration

```bash
cd backend
uv run alembic current
```

### Run backend linting

```bash
cd backend
uv run ruff check .
```

### Run frontend linting

```bash
cd frontend
npm run lint
```

### Create a production frontend build

```bash
cd frontend
npm run build
```

---

## Demo Video

Add the public 1–2 minute demo video link here before submitting the assessment.

The video should demonstrate:

1. Searching for a location
2. Viewing current weather and the five-day forecast
3. Using the current-location feature
4. Handling an invalid location or date range
5. Viewing saved records
6. Updating a record
7. Deleting a record
8. Exporting JSON or CSV
9. Briefly showing the backend routes and database structure

---

## Author

**Ali Jaffal**

- GitHub: [alii-jaffal](https://github.com/alii-jaffal)
- Project repository: [ClimaHub](https://github.com/alii-jaffal/climahub)

---

## Acknowledgements

- Weather and geocoding data: [Open-Meteo](https://open-meteo.com/)
- Map data: [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)
- Mapping library: [Leaflet](https://leafletjs.com/)
- Assessment organization: [Product Manager Accelerator](https://www.linkedin.com/school/pmaccelerator/)