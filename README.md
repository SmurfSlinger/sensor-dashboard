# Sensor Dashboard

A small IoT-style tank-level monitoring prototype. A Python simulator sends telemetry for generic industrial storage tanks to a Node/Express backend, which validates readings, calculates alert status, and stores them in memory.

Built as hands-on practice with connected-product architecture: sensor telemetry, REST ingestion, status logic, and (planned) live dashboard updates.

## Current Architecture

```text
sensor-simulator (Python)  --REST POST-->  backend (Node/Express + in-memory store)
                                                    |
                                            (planned: WebSocket --> Next.js dashboard)
```

**Example tanks:** `tank-001` North Storage Tank, `tank-002` West Process Tank, `tank-003` Reserve Tank.

## Implemented Milestones

| Milestone | Status | Description |
| --------- | ------ | ----------- |
| 1 | Done | Backend REST API — ingest readings, return all/latest |
| 2 | Done | Python sensor simulator — posts readings for three tanks every 3 seconds |
| 3 | Planned | Socket.IO live broadcasting from backend |
| 4 | Planned | Next.js dashboard (REST load + WebSocket updates) |

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Backend | Node.js, Express, TypeScript |
| Simulator | Python 3 (stdlib only) |
| Frontend | Next.js (scaffold present, dashboard not built yet) |
| Storage | In-memory array (backend process) |

## Project Structure

```text
sensor-dashboard/
  app/                   Next.js frontend (not implemented yet)
  backend/               Express REST API
    src/server.ts
  sensor-simulator/      Python fake sensor
    sensor.py
  README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- npm

### Run the backend

```bash
cd backend
npm install
npm run dev
```

Server listens on **http://localhost:3001**.

### Run the simulator

With the backend running, in a second terminal:

```bash
cd sensor-simulator
python3 sensor.py
```

The simulator posts a reading for each tank, waits 3 seconds, and repeats. Press `Ctrl+C` to stop.

### Manual test with curl

```bash
curl -X POST http://localhost:3001/api/readings \
  -H "Content-Type: application/json" \
  -d '{"tankId":"tank-001","tankName":"North Storage Tank","levelPercent":72}'

curl http://localhost:3001/api/readings/latest
```

## API Endpoints

### `POST /api/readings`

Ingest a tank reading. The backend adds `timestamp` (ISO 8601) and `status`.

**Request body:**

```json
{
  "tankId": "tank-001",
  "tankName": "North Storage Tank",
  "levelPercent": 72
}
```

**Response:** `201 Created` — full reading object including `timestamp` and `status`.

**Validation:** `tankId`, `tankName`, and `levelPercent` (0–100) are required.

### `GET /api/readings`

Returns all stored readings (newest last). Useful for debugging.

### `GET /api/readings/latest`

Returns the most recent reading per `tankId`.

## Status Logic

| Level (%) | Status |
| --------- | ------ |
| &lt; 10 | `LOW` |
| 10 – 84 | `OK` |
| 85 – 94 | `HIGH` |
| ≥ 95 | `CRITICAL` |

## Current Limitations

- In-memory storage only — data is lost on backend restart
- No live dashboard or WebSocket updates yet
- No persistent database
- No Docker, MQTT, or authentication
- Simulator exits if the backend is unreachable

## Planned Next Steps

1. Socket.IO broadcasting when a new reading is ingested
2. Next.js dashboard — load latest via REST, subscribe for live updates
3. Reading history view
4. PostgreSQL persistence
5. Docker Compose for backend, frontend, and database
6. MQTT ingestion (stretch) — broker + shared ingestion layer with REST
