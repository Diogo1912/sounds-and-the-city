import type { CityId } from "../types.ts";

type Mix = { file: string; gain: number; hold: number };

/**
 * One field recording per track. Gain trims peak-normalised files so
 * horns and textures do not bury the quieter hits. Hold is the amp
 * envelope, in seconds, so a long ring ends before the next step.
 */
const TRACKS: Record<string, Mix> = {
  "new-york:subway": { file: "new-york/subway.ogg", gain: 0.9, hold: 0.42 },
  "new-york:horn": { file: "new-york/horn.ogg", gain: 0.75, hold: 0.28 },
  "new-york:turnstile": { file: "new-york/turnstile.ogg", gain: 1.15, hold: 0.22 },
  "new-york:steam": { file: "new-york/steam.ogg", gain: 0.85, hold: 0.35 },
  "new-york:chime": { file: "new-york/chime.ogg", gain: 0.95, hold: 0.45 },
  "new-york:hammer": { file: "new-york/hammer.ogg", gain: 0.8, hold: 0.32 },
  "amsterdam:tram": { file: "amsterdam/tram.ogg", gain: 0.7, hold: 0.4 },
  "amsterdam:bell": { file: "amsterdam/bell.ogg", gain: 0.85, hold: 0.55 },
  "amsterdam:cobbles": { file: "amsterdam/cobbles.ogg", gain: 0.75, hold: 0.25 },
  "amsterdam:canal": { file: "amsterdam/canal.ogg", gain: 1.6, hold: 0.4 },
  "amsterdam:carillon": { file: "amsterdam/carillon.ogg", gain: 0.65, hold: 0.7 },
  "amsterdam:bridge": { file: "amsterdam/bridge.ogg", gain: 0.7, hold: 0.3 },
  "tokyo:train": { file: "tokyo/train.ogg", gain: 0.55, hold: 0.45 },
  "tokyo:crossing": { file: "tokyo/crossing.ogg", gain: 0.5, hold: 0.5 },
  "tokyo:gate": { file: "tokyo/gate.ogg", gain: 1.2, hold: 0.25 },
  "tokyo:rail": { file: "tokyo/rail.ogg", gain: 0.45, hold: 0.22 },
  "tokyo:door": { file: "tokyo/door.ogg", gain: 0.5, hold: 0.4 },
  "tokyo:bowl": { file: "tokyo/bowl.ogg", gain: 0.7, hold: 0.75 },
  "london:bell": { file: "london/bell.ogg", gain: 0.6, hold: 0.7 },
  "london:tube": { file: "london/tube.ogg", gain: 0.45, hold: 0.4 },
  "london:cab": { file: "london/cab.ogg", gain: 0.8, hold: 0.25 },
  "london:bus": { file: "london/bus.ogg", gain: 1.3, hold: 0.5 },
  "london:rain": { file: "london/rain.ogg", gain: 1.1, hold: 0.45 },
  "london:diesel": { file: "london/diesel.ogg", gain: 0.55, hold: 0.4 },
};

export const SAMPLE_BY_TRACK: Record<string, string> = Object.fromEntries(
  Object.entries(TRACKS).map(([key, mix]) => [key, mix.file]),
);

export function sampleKey(city: CityId, voice: string): string {
  return `${city}:${voice}`;
}

export function trackMix(key: string): { gain: number; hold: number } {
  const mix = TRACKS[key];
  return mix ? { gain: mix.gain, hold: mix.hold } : { gain: 0.7, hold: 0.4 };
}

export async function loadSampleBuffers(ctx: AudioContext): Promise<Map<string, AudioBuffer>> {
  const loaded = new Map<string, AudioBuffer>();
  await Promise.all(
    Object.entries(SAMPLE_BY_TRACK).map(async ([key, file]) => {
      try {
        const response = await fetch(`/samples/${file}`);
        if (!response.ok) return;
        const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
        loaded.set(key, buffer);
      } catch {
        // This track keeps its synthesised hit.
      }
    }),
  );
  return loaded;
}
