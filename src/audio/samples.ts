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

export type DrumSample = { buffer: AudioBuffer; offset: number };

export async function loadDrumSamples(ctx: AudioContext, loaded: (track: string, sample: DrumSample) => void): Promise<void> {
  await Promise.all(
    Object.entries(SAMPLE_BY_TRACK).map(async ([track, file]) => {
      try {
        const response = await fetch(`/samples/${file}`);
        if (!response.ok) return;
        const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
        loaded(track, { buffer, offset: sampleOnset(buffer.getChannelData(0), buffer.sampleRate) });
      } catch {
        // This track keeps its synthesised hit.
      }
    }),
  );
}

/** Leave a short lead-in ahead of the first audible attack in the mono one-shot. */
export function sampleOnset(data: Float32Array, sampleRate: number): number {
  const searchLength = Math.min(data.length, Math.floor(sampleRate * 0.17));
  const peakLength = Math.min(data.length, Math.floor(sampleRate * 0.35));
  const window = Math.max(1, Math.round(sampleRate * 0.002));
  let peak = 0;
  for (let i = 0; i < peakLength; i++) peak = Math.max(peak, Math.abs(data[i]!));
  if (peak < 0.001) return 0;

  const thresholdSquared = Math.max(0.001, peak * 0.04) ** 2;
  for (let i = 0; i + window <= searchLength; i += window) {
    let energy = 0;
    for (let j = i; j < i + window; j++) energy += data[j]! ** 2;
    if (energy / window >= thresholdSquared) return Math.max(0, i / sampleRate - 0.002);
  }
  return 0;
}
