# Sensor Dashboard

## Structure

```
Sensor -> Backend -> Database -> UI
```

> **Design note:** Database and live UI come later. Milestone 1 uses in-memory storage on the backend only.

---

## REST API

REST API is the typical request/receive style. A browser or app sends a request like "GET", the server responds with a JSON object, for example.

> **User/Program:** "Can I get the latest reading for tank 123?"
>
> **Server:** "Yes, here it is."


| Method | Purpose                    |
| ------ | -------------------------- |
| GET    | read something             |
| POST   | create/send something      |
| PUT    | replace/update something   |
| PATCH  | partially update something |
| DELETE | delete something           |


**Example:**

- `POST /readings` — sensor sends a new reading
- `GET /readings/latest` — frontend asks for the latest reading
- `GET /readings/history` — frontend asks for past readings
- `POST /devices/tank-001/settings` — user changes a device setting

**Great for:**

- loading a page
- getting historical data
- submitting settings
- creating users/alerts
- requesting reports
- normal CRUD operations (create, read, update, delete)

**Limitation:**

- It's mainly request/response.
- Server does not normally speak until the client asks.
- A sensor reading changes every second must be queried by the client constantly.
  - This is polling, which works, but is inefficient or even delayed.

> **Design note:** REST is the first ingestion path because it is the fastest reliable way to get the Python simulator talking to the backend. MQTT can be added later as a second front door.

---

## WebSockets

WebSockets provide live two-way communication between a frontend/browser and a backend server.

**Rather than:**

```
browser asks -> server answers -> connection closes
```

**WebSocket does:**

```
browser connects initially -> connection stays open -> server can push updates whenever something changes
```

WebSocket vs REST is phone call vs persistent letter/email.

**Limitation:**

- More complex
- Have to account for:
  - possible connection drop--reconnection
  - multiple connected clients
  - stale data
  - authentication
  - scaling across servers

> **Design note:** Use WebSockets for live tank cards and alerts. Keep REST for initial page load and historical queries.

---

## MQTT

MQTT provides lightweight device messaging.

**Structure:**

```
device -> broker -> backend/services
```

Rather than devices calling a specific backend service, they publish a message to a topic, such as:

```
tank/001/level
```

Then, anything subscribed to that topic receives it.

**4 Parts:**


| Part       | Role                                                      |
| ---------- | --------------------------------------------------------- |
| Publisher  | sends messages (sensor/device)                            |
| Subscriber | listens for messages (backend service)                    |
| Broker     | middleman that receives and distributes messages (server) |
| Topic      | channel/path messages are sent to                         |


**Structure:**

```
sensor publishes to broker -> subscribed backends receive message -> backends store -> frontend receives through REST or WebSocket
```

**Good for:**

- small/limited devices
- unreliable network
- many devices sending small messages
- devices don't need to know backend details
- messages need routing by topic

MQTT is often better for IoT because devices can just publish telemetry without tightly coupling to a REST API.

**REST:**

> "Device sends directly to backend endpoint."

**MQTT:**

> "Device publishes to broker; backend subscribes."

> **Design note:** When MQTT is added, the backend subscriber should call the same shared ingestion logic as `POST /api/readings` — no duplicated validation, status, or storage code.

---

## Proposed Structure


| Area          | Choice                                                                                                                                                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sensor type   | Tank level sensor implementation.                                                                                                                                                                                                |
| Tank type     | Generic industrial storage tank for reusability and versatility across areas like pressure, temperature, or flow without rewriting the whole app.                                                                                |
| Scale         | Multiple generic industrial tanks, all using the same tank-level sensor model.                                                                                                                                                   |
| API           | Begin with REST ingestion, but design a boundary so MQTT can be added later in a simple way.                                                                                                                                     |
| Update method | WebSockets to support time-sensitive, frequent, and continuous updates to frontend without manual refresh or polling overhead. REST is useful for historical data retrieval, but WebSockets better support live readings/alerts. |
| Backend       | Node.js, Express, Socket.IO                                                                                                                                                                                                      |


> **Design note:** Example tanks for the prototype — `tank-001` North Storage Tank, `tank-002` West Process Tank, `tank-003` Reserve Tank. Keep names generic; avoid water/fuel/chemical-specific modeling.

