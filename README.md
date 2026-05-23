
Structure:

Sensor -> Backend -> Database -> UI

REST API is the typical request/receive style. A browser or app sends a request like "GET", the server responds with a JSON object, for example.
    "Can I get the latest reading for tank 123?" -User/Program
    "Yes, here it is." -Server

    GET = read something
    POST = create/send something
    PUT = replace/update something
    PATCH = partially update something
    DELETE = delete something

Example:
    POST /readings: sensor sends a new reading
    GET /readings/latest: frontend asks for the latest reading
    GET /readings/history: frontend asks for past readings
    POST /devices/tank-001/settings: user changes a device setting


Great for:
    loading a page
    getting historical data
    submitting settings
    creating users/alerts
    requesting reports
    normal CRUD operations (create, read, update, delete)

Limitation:
    It's mainly request/response.
    Server does not normally speak until the client asks.
    A sensor reading changes every second must be queried by the client constantly.
        This is polling, which works, but is inefficient or even delayed.


WebSockets provide live two-way communication between a frontend/browser and a backend server.

Rather than:
    browser asks -> server answers -> connection closes

Websocket does:
    browser connects initially -> connection stays open -> server can push updates whenever something changes

WebSocket vs REST is phone call vs persistent letter/email.

Limitation:
    More complex
    Have to account for:
        possible connection drop--reconnection
        multiple connected clients
        stale data
        authentication
        scaling across servers


MQTT provides lightweight device messaging.
Structure:
    device -> broker -> backend/services

Rather than devices calling a specific backend service, they publish a message to a topic, such as:
    tank/001/level
Then, anything subscribed to that topic receives it.

4 Parts:
    Publisher: sends messages (sensor/device)
    Subscriber: listens for messages (backend service)
    Broker: middleman that receives and distributes messages (server)
    Topic: channel/path messages are sent to

Structure:
sensor publishes to broker -> subscribed backends receive message -> backends store -> frontend receives through REST or WebSocket

Good for:
    small/limited devices
    unreliable network
    many devices sending small messages
    devices don't need to know backend details
    messages need routing by topic

MQTT is often better for IoT because devices can just publish telemetry without tightly coupling to a REST API.

REST:
    “Device sends directly to backend endpoint.”

MQTT:
    “Device publishes to broker; backend subscribes.”



Proposed structure:

Sensor type:
    Tank level sensor implementation.
Tank type:
    Generic industrial storage tank for reusability and versatility across areas like pressure, temperature, or flow without rewriting the whole app.
Scale:
    Multiple generic industrial tanks, all using the same tank-level sensor model.
API:
    Begin with REST ingestion, but design a boundary so MQTT can be added later in a simple way.
Update method:
    WebSockets to support time-sensitive, frequent, and continuous updates to frontend without manual refresh or polling overhead. REST is useful for historical data retrieval, but WebSockets better support live readings/alerts.
Backend:
    Node.js, Express, Socket.IO
