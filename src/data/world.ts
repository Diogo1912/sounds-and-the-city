import { fetchJson } from "../lib/http.ts";
import { pickCompleteDay } from "../lib/rhythm.ts";
import type { DayData, DrumId, Track } from "../types.ts";

const CITIES: { id: string; name: string; drum: DrumId; lat: number; lon: number; timeZone: string }[] = [
  { id: "new-york", name: "New York", drum: "kick", lat: 40.748, lon: -73.986, timeZone: "America/New_York" },
  { id: "amsterdam", name: "Amsterdam", drum: "snare", lat: 52.373, lon: 4.904, timeZone: "Europe/Amsterdam" },
  { id: "tokyo", name: "Tokyo", drum: "hat", lat: 35.681, lon: 139.767, timeZone: "Asia/Tokyo" },
  { id: "london", name: "London", drum: "tom", lat: 51.507, lon: -0.128, timeZone: "Europe/London" },
  { id: "delhi", name: "Delhi", drum: "clap", lat: 28.613, lon: 77.209, timeZone: "Asia/Kolkata" },
  { id: "los-angeles", name: "Los Angeles", drum: "rim", lat: 34.052, lon: -118.244, timeZone: "America/Los_Angeles" },
];

type Point = {
  hourly?: {
    time?: string[];
    nitrogen_dioxide?: (number | null)[];
  };
};

export async function fetchNo2(now = new Date()): Promise<DayData> {
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.searchParams.set("latitude", CITIES.map((city) => city.lat).join(","));
  url.searchParams.set("longitude", CITIES.map((city) => city.lon).join(","));
  url.searchParams.set("hourly", "nitrogen_dioxide");
  url.searchParams.set("timezone", "UTC");
  url.searchParams.set("past_days", "3");
  url.searchParams.set("forecast_days", "1");

  const json = await fetchJson(url.toString());
  const points = readPoints(json);
  if (points.length < CITIES.length) throw new Error("Air quality response was short");

  const tracks: Track[] = [];
  let day: string | null = null;

  for (let index = 0; index < CITIES.length; index += 1) {
    const city = CITIES[index];
    const point = points[index];
    if (!city || !point?.hourly?.time || !point.hourly.nitrogen_dioxide) {
      throw new Error("Air quality response was short");
    }
    const picked = pickCompleteDay(point.hourly.time, point.hourly.nitrogen_dioxide, now);
    if (!picked) throw new Error("No complete air-quality day");
    if (!day) day = picked.day;
    if (picked.day !== day) {
      const aligned = hoursForDay(point.hourly.time, point.hourly.nitrogen_dioxide, day);
      if (!aligned) throw new Error("Cities did not share a day");
      tracks.push(trackFrom(city, aligned));
      continue;
    }
    tracks.push(trackFrom(city, picked.hours));
  }

  if (!day) throw new Error("No complete air-quality day");

  return {
    id: "world-no2",
    day,
    timezone: "UTC",
    rolling: false,
    nowHour: null,
    fetchedAt: now.toISOString(),
    tracks,
  };
}

function trackFrom(city: (typeof CITIES)[number], hours: number[]): Track {
  return {
    id: city.id,
    name: city.name,
    drum: city.drum,
    timeZone: city.timeZone,
    hours,
    details: hours.map((value) => `${value.toFixed(1)} µg/m³`),
  };
}

function hoursForDay(times: string[], values: (number | null)[], day: string): number[] | null {
  const hours = Array.from({ length: 24 }, () => Number.NaN);
  for (let index = 0; index < times.length; index += 1) {
    const time = times[index];
    if (!time?.startsWith(day)) continue;
    const hour = Number(time.slice(11, 13));
    const value = values[index];
    if (hour >= 0 && hour < 24 && value != null && Number.isFinite(value)) hours[hour] = value;
  }
  return hours.every((value) => Number.isFinite(value)) ? hours : null;
}

function readPoints(json: unknown): Point[] {
  if (!json || typeof json !== "object") throw new Error("Unexpected air quality response");
  if ("error" in json && json.error) throw new Error("Air quality request failed");
  if (Array.isArray(json)) return json as Point[];
  if ("hourly" in json) return [json as Point];
  throw new Error("Unexpected air quality response");
}
