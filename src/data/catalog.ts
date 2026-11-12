import type { DatasetId } from "../types.ts";

export type DatasetMeta = {
  id: DatasetId;
  label: string;
  title: string;
  clock: string;
  sourceName: string;
  sourceUrl: string;
  note: string;
};

export const DATASETS: DatasetMeta[] = [
  {
    id: "nyc-subway",
    label: "Subway",
    title: "NYC subway",
    clock: "New York",
    sourceName: "MTA Subway Hourly Ridership",
    sourceUrl: "https://data.ny.gov/Transportation/MTA-Subway-Hourly-Ridership-Beginning-2025/5wq4-mkjj",
    note: "Entries by borough for the latest complete weekday.",
  },
  {
    id: "usgs-quakes",
    label: "Quakes",
    title: "Earthquakes",
    clock: "UTC",
    sourceName: "USGS past day",
    sourceUrl: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
    note: "Rolling 24 hours, grouped by region.",
  },
  {
    id: "world-no2",
    label: "NO₂",
    title: "NO₂, six cities",
    clock: "UTC",
    sourceName: "Open-Meteo Air Quality",
    sourceUrl: "https://open-meteo.com/en/docs/air-quality-api",
    note: "Hourly nitrogen dioxide for one UTC day. Modelled (CAMS).",
  },
];

export function datasetMeta(id: DatasetId): DatasetMeta {
  const meta = DATASETS.find((item) => item.id === id);
  if (!meta) throw new Error(`Unknown dataset ${id}`);
  return meta;
}

export function isDatasetId(value: unknown): value is DatasetId {
  return value === "nyc-subway" || value === "usgs-quakes" || value === "world-no2";
}
