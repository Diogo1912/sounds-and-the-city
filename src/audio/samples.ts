import type { CityId } from "../types.ts";

/**
 * Manifest track names mapped onto the current kit ids.
 * Borough drums and the New York hat sit on the New York rack.
 * The Amsterdam bell, Tokyo taiko, and London snare stay with those cities.
 * The remaining place-named hits fill the other rows.
 */
export const SAMPLE_BY_TRACK: Record<string, string> = {
  "new-york:subway": "nyc-subway/staten-island-bass-drum.ogg",
  "new-york:horn": "nyc-subway/bronx-snare.ogg",
  "new-york:turnstile": "nyc-subway/queens-conga.ogg",
  "new-york:steam": "air-quality/new-york-hihat.ogg",
  "new-york:chime": "nyc-subway/brooklyn-steel-pan.ogg",
  "new-york:hammer": "nyc-subway/manhattan-ride-cymbal.ogg",
  "amsterdam:bell": "air-quality/amsterdam-bicycle-bell.ogg",
  "amsterdam:tram": "earthquakes/alaska-frame-drum.ogg",
  "amsterdam:cobbles": "earthquakes/california-cajon.ogg",
  "amsterdam:canal": "earthquakes/hawaii-ipu.ogg",
  "amsterdam:carillon": "air-quality/delhi-tabla.ogg",
  "amsterdam:bridge": "earthquakes/americas-bombo-leguero.ogg",
  "tokyo:train": "air-quality/tokyo-taiko.ogg",
  "tokyo:crossing": "air-quality/los-angeles-timbales.ogg",
  "tokyo:rail": "earthquakes/pacific-log-drum.ogg",
  "tokyo:gate": "earthquakes/elsewhere-djembe.ogg",
  "london:tube": "air-quality/london-snare.ogg",
};

export function sampleKey(city: CityId, voice: string): string {
  return `${city}:${voice}`;
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
