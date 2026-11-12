import type { DatasetId, DayData, LoadedDay } from "../types.ts";
import { fetchQuakes } from "./quakes.ts";
import { fetchSubway } from "./subway.ts";
import { fetchNo2 } from "./world.ts";

export async function fetchLive(id: DatasetId): Promise<DayData> {
  switch (id) {
    case "nyc-subway":
      return fetchSubway();
    case "usgs-quakes":
      return fetchQuakes();
    case "world-no2":
      return fetchNo2();
  }
}

export async function loadDataset(id: DatasetId): Promise<LoadedDay> {
  try {
    const live = await fetchLive(id);
    return { ...live, origin: "live" };
  } catch (error) {
    const liveError = error instanceof Error ? error.message : "Live feed failed";
    const snapshot = await fetchSnapshot(id);
    return { ...snapshot, origin: "snapshot", liveError };
  }
}

async function fetchSnapshot(id: DatasetId): Promise<DayData> {
  let response: Response;
  try {
    response = await fetch(`/snapshots/${id}.json`);
  } catch {
    throw new Error("Snapshot unavailable");
  }
  if (!response.ok) throw new Error("Snapshot unavailable");
  const json: unknown = await response.json();
  if (!isDayData(json) || json.id !== id) throw new Error("Snapshot was unreadable");
  return json;
}

function isDayData(value: unknown): value is DayData {
  if (!value || typeof value !== "object") return false;
  const day = value as DayData;
  return (
    Array.isArray(day.tracks) &&
    day.tracks.length > 0 &&
    day.tracks.every((track) => Array.isArray(track.hours) && track.hours.length === 24 && Array.isArray(track.details))
  );
}
