type Mix = { file: string; gain: number; hold: number };

/**
 * One field recording per track. Gain trims peak-normalised files so
 * horns and textures do not bury the quieter hits. Hold is the amp
 * envelope, in seconds, so a long ring ends before the next step.
 */
const TRACKS: Record<string, Mix> = {
  tram: { file: "amsterdam/tram.ogg", gain: 0.7, hold: 0.4 },
  bell: { file: "amsterdam/bell.ogg", gain: 0.85, hold: 0.55 },
  cobbles: { file: "amsterdam/cobbles.ogg", gain: 0.75, hold: 0.25 },
  canal: { file: "amsterdam/canal.ogg", gain: 1.6, hold: 0.4 },
  carillon: { file: "amsterdam/carillon.ogg", gain: 0.65, hold: 0.7 },
  bridge: { file: "amsterdam/bridge.ogg", gain: 0.7, hold: 0.3 },
};

export const SAMPLE_BY_TRACK: Record<string, string> = Object.fromEntries(
  Object.entries(TRACKS).map(([key, mix]) => [key, mix.file]),
);

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
