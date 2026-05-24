import cors from "cors";
import express, { Request, Response } from "express";

type TankStatus = "LOW" | "OK" | "HIGH" | "CRITICAL";

type TankReading = {
  tankId: string;
  tankName: string;
  levelPercent: number;
  timestamp: string;
  status: TankStatus;
};

type ReadingInput = {
  tankId: string;
  tankName: string;
  levelPercent: number;
};

const readings: TankReading[] = [];

function getStatus(levelPercent: number): TankStatus {
  if (levelPercent < 10) return "LOW";
  if (levelPercent >= 95) return "CRITICAL";
  if (levelPercent >= 85) return "HIGH";
  return "OK";
}

function validateReadingInput(body: unknown): ReadingInput | string {
  if (body === null || typeof body !== "object") {
    return "Request body must be a JSON object";
  }

  const { tankId, tankName, levelPercent } = body as Record<string, unknown>;

  if (typeof tankId !== "string" || tankId.trim() === "") {
    return "tankId is required and must be a non-empty string";
  }

  if (typeof tankName !== "string" || tankName.trim() === "") {
    return "tankName is required and must be a non-empty string";
  }

  if (typeof levelPercent !== "number" || Number.isNaN(levelPercent)) {
    return "levelPercent is required and must be a number";
  }

  if (levelPercent < 0 || levelPercent > 100) {
    return "levelPercent must be between 0 and 100";
  }

  return { tankId: tankId.trim(), tankName: tankName.trim(), levelPercent };
}

/** Shared ingestion path — REST and future MQTT should both call this. */
function ingestReading(input: ReadingInput): TankReading {
  const reading: TankReading = {
    tankId: input.tankId,
    tankName: input.tankName,
    levelPercent: input.levelPercent,
    timestamp: new Date().toISOString(),
    status: getStatus(input.levelPercent),
  };

  readings.push(reading);
  return reading;
}

function getLatestReadings(): TankReading[] {
  const latestByTank = new Map<string, TankReading>();

  for (const reading of readings) {
    latestByTank.set(reading.tankId, reading);
  }

  return Array.from(latestByTank.values());
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post("/api/readings", (req: Request, res: Response) => {
  const validated = validateReadingInput(req.body);

  if (typeof validated === "string") {
    return res.status(400).json({ error: validated });
  }

  const reading = ingestReading(validated);
  return res.status(201).json(reading);
});

app.get("/api/readings", (_req: Request, res: Response) => {
  res.json(readings);
});

app.get("/api/readings/latest", (_req: Request, res: Response) => {
  res.json(getLatestReadings());
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
