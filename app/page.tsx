"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const BACKEND_URL = "http://localhost:3001";

type TankStatus = "LOW" | "OK" | "HIGH" | "CRITICAL";

type TankReading = {
  tankId: string;
  tankName: string;
  levelPercent: number;
  timestamp: string;
  status: TankStatus;
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

function statusClasses(status: TankStatus): string {
  switch (status) {
    case "LOW":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
    case "HIGH":
      return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200";
    case "CRITICAL":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
    default:
      return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200";
  }
}

export default function Home() {
  const [readings, setReadings] = useState<Map<string, TankReading>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let socket: Socket | undefined;
    let cancelled = false;

    async function init() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/readings/latest`);
        if (!res.ok) {
          throw new Error(`Failed to load readings (${res.status})`);
        }

        const data: TankReading[] = await res.json();
        if (!cancelled) {
          setReadings(new Map(data.map((reading) => [reading.tankId, reading])));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load readings"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }

      socket = io(BACKEND_URL);
      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));
      socket.on("reading:new", (reading: TankReading) => {
        setReadings((prev) => new Map(prev).set(reading.tankId, reading));
      });
    }

    init();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, []);

  const tanks = Array.from(readings.values()).sort((a, b) =>
    a.tankId.localeCompare(b.tankId)
  );

  return (
    <main className="min-h-full p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold">Tank Level Dashboard</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Generic industrial storage tank readings
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            WebSocket:{" "}
            <span className={connected ? "text-green-600" : "text-zinc-400"}>
              {connected ? "connected" : "disconnected"}
            </span>
          </p>
        </header>

        {loading && <p className="text-zinc-600">Loading readings…</p>}

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </p>
        )}

        {!loading && !error && tanks.length === 0 && (
          <p className="text-zinc-600">
            No readings yet. Start the backend and simulator.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tanks.map((tank) => (
            <article
              key={tank.tankId}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-medium">{tank.tankName}</h2>
                  <p className="text-sm text-zinc-500">{tank.tankId}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses(tank.status)}`}
                >
                  {tank.status}
                </span>
              </div>

              <p className="text-3xl font-semibold tabular-nums">
                {tank.levelPercent}%
              </p>

              <p className="mt-3 text-sm text-zinc-500">
                Updated {formatTimestamp(tank.timestamp)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
