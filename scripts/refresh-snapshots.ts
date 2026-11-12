import { mkdir, writeFile } from "node:fs/promises";
import { fetchQuakes } from "../src/data/quakes.ts";
import { fetchSubway } from "../src/data/subway.ts";
import { fetchNo2 } from "../src/data/world.ts";
import { shapeHours } from "../src/lib/rhythm.ts";
import type { DayData } from "../src/types.ts";

const jobs: { id: string; load: () => Promise<DayData> }[] = [
  { id: "nyc-subway", load: fetchSubway },
  { id: "usgs-quakes", load: fetchQuakes },
  { id: "world-no2", load: fetchNo2 },
];

await mkdir("public/snapshots", { recursive: true });

for (const job of jobs) {
  const data = await job.load();
  const path = `public/snapshots/${job.id}.json`;
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`${job.id}  ${data.day ?? "rolling"}  ${data.fetchedAt}`);
  for (const track of data.tracks) {
    const shaped = shapeHours(track.hours);
    const bar = shaped.map((value) => (value >= 0.4 ? "#" : value > 0.05 ? "." : " ")).join("");
    const peak = track.hours.indexOf(Math.max(...track.hours));
    console.log(`  ${track.name.padEnd(14)} ${String(peak).padStart(2)}h  ${bar}`);
  }
}
