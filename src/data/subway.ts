import { asNumber, fetchJson } from "../lib/http.ts";
import { nextDate, selectShowcaseDay } from "../lib/rhythm.ts";
import type { DayData, DrumId, Track } from "../types.ts";

const ENDPOINT = "https://data.ny.gov/resource/5wq4-mkjj.json";

const BOROUGHS: { id: string; name: string; drum: DrumId; key: string }[] = [
  { id: "manhattan", name: "Manhattan", drum: "kick", key: "Manhattan" },
  { id: "brooklyn", name: "Brooklyn", drum: "snare", key: "Brooklyn" },
  { id: "queens", name: "Queens", drum: "hat", key: "Queens" },
  { id: "bronx", name: "Bronx", drum: "tom", key: "Bronx" },
  { id: "staten-island", name: "Staten Island", drum: "rim", key: "Staten Island" },
];

export async function fetchSubway(now = new Date()): Promise<DayData> {
  const maxUrl = new URL(ENDPOINT);
  maxUrl.searchParams.set("$select", "max(transit_timestamp) as mx");
  maxUrl.searchParams.set("$limit", "1");
  const maxJson = await fetchJson(maxUrl.toString());
  const maxStamp = readMax(maxJson);
  const day = selectShowcaseDay(maxStamp);

  const dataUrl = new URL(ENDPOINT);
  dataUrl.searchParams.set("$select", "borough,date_extract_hh(transit_timestamp) as hr,sum(ridership) as riders");
  dataUrl.searchParams.set(
    "$where",
    `transit_timestamp >= '${day}T00:00:00' AND transit_timestamp < '${nextDate(day)}T00:00:00'`,
  );
  dataUrl.searchParams.set("$group", "borough,hr");
  dataUrl.searchParams.set("$limit", "200");
  const rows = await fetchJson(dataUrl.toString());
  if (!Array.isArray(rows)) throw new Error("Unexpected subway response");

  const table = new Map<string, number[]>();
  for (const borough of BOROUGHS) table.set(borough.key, Array.from({ length: 24 }, () => 0));
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const record = row as { borough?: unknown; hr?: unknown; riders?: unknown };
    const name = typeof record.borough === "string" ? record.borough : "";
    const hours = table.get(name);
    if (!hours) continue;
    const hour = asNumber(record.hr);
    if (hour < 0 || hour > 23) continue;
    hours[hour] = asNumber(record.riders);
  }

  const tracks: Track[] = BOROUGHS.map((borough) => {
    const hours = table.get(borough.key) ?? Array.from({ length: 24 }, () => 0);
    return {
      id: borough.id,
      name: borough.name,
      drum: borough.drum,
      hours,
      details: hours.map((value) => `${Math.round(value).toLocaleString("en-US")} entries`),
    };
  });

  if (tracks.every((track) => track.hours.every((value) => value === 0))) {
    throw new Error("Subway day was empty");
  }

  return {
    id: "nyc-subway",
    day,
    timezone: "America/New_York",
    rolling: false,
    nowHour: null,
    fetchedAt: now.toISOString(),
    tracks,
  };
}

function readMax(json: unknown): string {
  if (!Array.isArray(json) || !json[0] || typeof json[0] !== "object") {
    throw new Error("Unexpected subway response");
  }
  const stamp = (json[0] as { mx?: unknown }).mx;
  if (typeof stamp !== "string") throw new Error("Unexpected subway response");
  return stamp;
}
