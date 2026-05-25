#!/usr/bin/env python3
"""
Simulates tank-level sensors posting readings to the backend REST API.

Run with the backend up:
  cd sensor-simulator
  python sensor.py
"""

import json
import random
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass

BACKEND_URL = "http://localhost:3001/api/readings"
INTERVAL_SECONDS = 3

TANKS = [
    {"tankId": "tank-001", "tankName": "North Storage Tank", "levelPercent": 72.0},
    {"tankId": "tank-002", "tankName": "West Process Tank", "levelPercent": 40.0},
    {"tankId": "tank-003", "tankName": "Reserve Tank", "levelPercent": 88.0},
]


@dataclass
class TankState:
    tank_id: str
    tank_name: str
    level_percent: float

    def next_reading(self) -> dict[str, str | float]:
        delta = random.uniform(-2.0, 2.0)
        self.level_percent = max(0.0, min(100.0, self.level_percent + delta))

        return {
            "tankId": self.tank_id,
            "tankName": self.tank_name,
            "levelPercent": round(self.level_percent, 1),
        }


def post_reading(url: str, payload: dict[str, str | float]) -> dict:
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> None:
    tanks = [
        TankState(t["tankId"], t["tankName"], t["levelPercent"])
        for t in TANKS
    ]

    print(f"Posting readings to {BACKEND_URL} every {INTERVAL_SECONDS}s")
    print("Press Ctrl+C to stop.\n")

    while True:
        for tank in tanks:
            payload = tank.next_reading()

            try:
                result = post_reading(BACKEND_URL, payload)
                status = result.get("status", "?")
                print(
                    f"{payload['tankId']}: {payload['levelPercent']}% -> {status}"
                )
            except urllib.error.URLError as err:
                print(f"Failed to reach backend: {err}", file=sys.stderr)
                print("Is the backend running? (cd backend && npm run dev)", file=sys.stderr)
                sys.exit(1)

        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nSimulator stopped.")
