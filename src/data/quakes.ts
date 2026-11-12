import { fetchJson } from "../lib/http.ts";
import { REGION_META, quakeRegion, type RegionId } from "./regions.ts";
import type { DayData, Track } from "../types.ts";

const FEED = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";

type Bin = { energy: number; count: number; maxMag: number };

export async function fetchQuakes(now = new Date()): Promise<DayData> {
  const json = await fetchJson(FEED, 12000);
  const features = readFeatures(json);
  const bins = new Map<RegionId, Bin[]>();
  for (const region of REGION_META) {
    bins.set(
      region.id,
      Array.from({ length: 24 }, () => ({ energy: 0, count: 0, maxMag: 0 })),
    );
  }

  for (const feature of features) {
    const props = feature.properties;
    if (!props || props.type !== "earthquake" || typeof props.time !== "number") continue;
    const coords = feature.geometry?.coordinates;
    if (!coords || coords.length < 2) continue;
    const lon = coords[0];
    const lat = coords[1];
    if (typeof lon !== "number" || typeof lat !== "number") continue;
    const region = quakeRegion(lat, lon);
    const hour = new Date(props.time).getUTCHours();
    const bin = bins.get(region)?.[hour];
    if (!bin) continue;
    const mag = typeof props.mag === "number" && Number.isFinite(props.mag) ? props.mag : 0;
    bin.energy += Math.pow(10, Math.max(0, mag) / 2);
    bin.count += 1;
    bin.maxMag = bin.count === 1 ? mag : Math.max(bin.maxMag, mag);
  }

  const tracks: Track[] = REGION_META.map((region) => {
    const series = bins.get(region.id) ?? [];
    return {
      id: region.id,
      name: region.name,
      drum: region.drum,
      hours: series.map((bin) => bin.energy),
      details: series.map((bin) =>
        bin.count === 0 ? "Quiet" : `${bin.count} ${bin.count === 1 ? "quake" : "quakes"} · M${bin.maxMag.toFixed(1)}`,
      ),
    };
  });

  if (tracks.every((track) => track.hours.every((value) => value === 0))) {
    throw new Error("No earthquakes in the feed");
  }

  return {
    id: "usgs-quakes",
    day: null,
    timezone: "UTC",
    rolling: true,
    nowHour: now.getUTCHours(),
    fetchedAt: now.toISOString(),
    tracks,
  };
}

type Feature = {
  geometry?: { coordinates?: unknown[] };
  properties?: { mag?: unknown; time?: unknown; type?: unknown };
};

function readFeatures(json: unknown): Feature[] {
  if (!json || typeof json !== "object" || !("features" in json) || !Array.isArray(json.features)) {
    throw new Error("Unexpected quake response");
  }
  return json.features as Feature[];
}
