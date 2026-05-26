# Sensor Dashboard

A small IoT-style tank-level monitoring prototype. A Python simulator sends telemetry for generic industrial storage tanks to a Node/Express backend, which validates readings, calculates alert status, stores them in memory, and pushes live updates to a Next.js dashboard over Socket.IO.

Built as hands-on practice with connected-product architecture: sensor telemetry, REST ingestion, status logic, live WebSocket updates, and a working dashboard.

## Current Architecture

```text
sensor-simulator (Python)
        |
        | REST POST
        v
backend (Express + Socket.IO + in-memory store)
        |
        | WebSocket (reading:new)
        v
Next.js dashboard (localhost:3000)
```

**Example tanks:** `tank-001` North Storage Tank, `tank-002` West Process Tank, `tank-003` Reserve Tank.

## Implemented Milestones

| Milestone | Status | Description |
| --------- | ------ | ----------- |
| 1 | Done | Backend REST API — ingest readings, return all/latest |
| 2 | Done | Python sensor simulator — posts readings for three tanks every 3 seconds |
| 3 | Done | Socket.IO live broadcasting — `reading:new` on ingest |
| 4 | Done | Next.js dashboard — REST initial load + Socket.IO live updates |

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Backend | Node.js, Express, TypeScript, Socket.IO |
| Simulator | Python 3 (stdlib only) |
| Frontend | Next.js, React, socket.io-client |
| Storage | In-memory array (backend process) |

## Project Structure

```text
sensor-dashboard/
  app/                   Next.js live dashboard
    page.tsx
  backend/               Express REST API + Socket.IO
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

### Run the frontend

In a third terminal, from the project root:

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. Tank cards load from REST and update live when new readings arrive.

### Manual test with curl

```bash
curl -X POST http://localhost:3001/api/readings \
  -H "Content-Type: application/json" \
  -d '{"tankId":"tank-001","tankName":"North Storage Tank","levelPercent":72}'

curl http://localhost:3001/api/readings/latest
```

## API Endpoints

### `POST /api/readings`

Ingest a tank reading. The backend adds `timestamp` (ISO 8601) and `status`, stores the reading, and broadcasts `reading:new` over Socket.IO.

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

Returns the most recent reading per `tankId`. Used by the dashboard on initial page load.

## Live Updates (Socket.IO)

| Event | Direction | Payload |
| ----- | --------- | ------- |
| `reading:new` | server → client | Complete `TankReading` object |

Connect from the frontend at `http://localhost:3001`. CORS is configured for `http://localhost:3000`.

## Status Logic

| Level (%) | Status |
| --------- | ------ |
| &lt; 10 | `LOW` |
| 10 – 84 | `OK` |
| 85 – 94 | `HIGH` |
| ≥ 95 | `CRITICAL` |

## Current Limitations

- In-memory storage only — data is lost on backend restart
- No persistent database
- No Docker, MQTT, or authentication
- Local development only (hardcoded `localhost` URLs)
- Simulator exits if the backend is unreachable

## Planned Next Steps

1. Reading history view
2. PostgreSQL persistence
3. Docker Compose for backend, frontend, and database
4. MQTT ingestion (stretch) — broker + shared ingestion layer with REST
5. Basic tests — status calculation, validation
