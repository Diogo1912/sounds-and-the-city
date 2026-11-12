export type DatasetId = "nyc-subway" | "usgs-quakes" | "world-no2";

export type DrumId = "kick" | "snare" | "hat" | "tom" | "clap" | "rim";

export type Track = {
  id: string;
  name: string;
  drum: DrumId;
  /** 24 raw hourly values, before per-track scaling. */
  hours: number[];
  /** Same length as hours. Shown in the readout. */
  details: string[];
  /** IANA zone, when the track is a city on a UTC grid. */
  timeZone?: string;
};

export type DayData = {
  id: DatasetId;
  /** YYYY-MM-DD in the dataset clock, or null for a rolling window. */
  day: string | null;
  timezone: string;
  rolling: boolean;
  /** Wall-clock hour 0–23 in the dataset clock, if the slice contains now. */
  nowHour: number | null;
  fetchedAt: string;
  tracks: Track[];
};

export type LoadedDay = DayData & {
  origin: "live" | "snapshot";
  liveError?: string;
};

export type StepCount = 24 | 96;
