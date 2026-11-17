# AGENTS.md

City Rhythm is a browser drum machine with four city kits: New York, Amsterdam, Tokyo, and London. The sequencer is a 16-step, four-beat bar. Each drum track is a literal city sound object (subway, tram, ticket gate, bus bell), not a generic drum. Each city has its own synth lane, tempo, and panel. Demo loads a starter bar. Reset clears the grid. Record captures one pass from step 1 as an audio take. Patterns and synth patches stay in `localStorage` per city.

## Stack and commands

Vite, React 19, TypeScript, Tailwind v4. shadcn/ui is only for primitives already in `src/components/ui`. Dev server is port **47221**.

```bash
npm install
npm run dev       # http://127.0.0.1:47221
npm test          # vitest
npm run lint      # oxlint
npm run build     # tsc -b && vite build → dist/
npm run preview   # static dist on :47221
```

`npm run build` is the typecheck. There is no separate `typecheck` script.

## Folder map

| Path | Role |
| --- | --- |
| `src/kits.ts` | Cities, voice ids, demo patterns, `SYNTH`, `DEMO_NOTES`, `demoSong` / `emptySong` |
| `src/types.ts` | `CityId` union. Adding a city starts here. |
| `src/audio/engine.ts` | Web Audio graph, lookahead scheduler, sample playback, choke, recording, analyser |
| `src/audio/samples.ts` | `city:voice` → file, gain trim, hold time. `SAMPLE_BY_TRACK` is derived from this. |
| `src/audio/voices.ts` | Synthesised drum hits (fallback) |
| `src/audio/synth.ts`, `src/synthPatch.ts` | Synth voice graph, editable parameters, and city presets |
| `src/audio/samples.test.ts` | Every manifest file is mapped exactly once |
| `src/App.tsx` | Transport, city switch, keyboard, in-app credits |
| `src/index.css` | Skins on `.face[data-city]`. Knobs, cells, plates, playhead |
| `src/components/Knob.tsx`, `TempoDial.tsx` | Rotary controls. Drag up/down, double-click resets, tip while dragging |
| `src/components/Sequencer.tsx` | 16-step grid. Track names stay pinned; hours scroll |
| `src/components/SynthPanel.tsx`, `Glyph.tsx`, `ScopeMeter.tsx` | Compact keys, per-object SVG glyphs, scope and level meter |
| `public/samples/<city>/<voice>.ogg` | One mono 44.1 kHz Vorbis one-shot per track |
| `public/samples/manifest.json` | City → voice id → relative path |
| `docs/SAMPLES.md` | Source, licence, and author for every file |
| `vercel.json` | Vite framework, `npm run build`, output `dist` |

## Add a city or swap a sample

Voice ids are stable keys (`subway`, `bell`, `train`). The sample key is `` `${cityId}:${voiceId}` ``. A new city needs all of:

1. Extend `CityId` and `isCityId` in `src/types.ts`.
2. Add the kit in `src/kits.ts`: label, bpm, six voices, a 16-step pattern, `SYNTH` (name and 8-note scale), and `DEMO_NOTES`. Update `emptySongs`, `CITY_PATCHES` in `src/synthPatch.ts`, and `loadPatches` in `src/lib/settings.ts`.
3. Put `public/samples/<city>/<voice>.ogg` files in place and add them to `manifest.json`.
4. Add a `TRACKS` entry in `src/audio/samples.ts` with `file`, `gain`, and `hold`.
5. Add a `.face[data-city="<id>"]` skin, a nameplate, cell shape, and glyphs. Give the tempo dial and record button a treatment that belongs to that city.
6. If any file is not CC0, add the exact author and link to `docs/SAMPLES.md`, the README Credits section, **and** the credits line in `src/App.tsx`.

To swap a sample, replace the `.ogg`, keep the voice id, retune `gain` and `hold`, and update `docs/SAMPLES.md`. CC0 needs no in-app credit; still list the author in `docs/SAMPLES.md`. **CC BY and CC BY-SA must stay attributed in both the README and the in-app credits**, with the author name and source link. BY-SA adaptations (trim, mono, Ogg) stay under BY-SA. Do not use CC BY-NC. Do not drop an attribution when a file is removed unless that file is actually gone.

Current required credits: Tokyo train (Wikimedia Commons, CC BY-SA 4.0; the file-page artist field is unclear), Tokyo gate (Hinoki.owo, Freesound, CC BY 4.0), Tokyo bowl (דג בלי מלח, Wikimedia Commons, CC BY-SA 4.0).

## Audio

`Engine` builds one graph: master gain → compressor → analyser → destination. A lookahead timer schedules hits on `currentTime`. Each track decodes once into a buffer. Velocity scales level. `gain` in `samples.ts` level-matches peak-normalised files so horns and textures do not bury quieter hits. `hold` is the amp envelope in seconds: the voice stays up, then ramps to silence so a long ring (bell, bowl, carillon) or a texture (rain, diesel, tube) does not smear into the next hour. Retriggering the same `city:voice` chokes the previous voice with a short ramp. If fetch or decode fails, that track uses `triggerVoice` in `voices.ts`. The synth lane uses `startSynthVoice` for the sequencer and keyboard. City patches control its oscillators, filters, envelope, and modulation. Recording taps the compressor into a `MediaStream` and stops after one bar.

## Design

The UI is a hardware instrument, not a marketing page. Keep it quiet and specific.

- No gradient blobs, glassmorphism, neon glow, emoji, or filler copy. Icons are small SVG glyphs in `Glyph.tsx`.
- Each city is its own instrument: its own colour, cell material, nameplate, and controls. Do not recolour one generic layout.
- Tempo, level, cutoff, and decay are rotary knobs, not sliders. Record is a labelled button with an on state.
- Motion is transform and opacity, snappy, and off under `prefers-reduced-motion`. The scope canvas is the exception.
- The grid gets the space. The desktop station uses a 2 × 2 panel grid and stacks on phones. The synth panel includes a chromatic keyboard and its own note lane. On a phone, track names stay fixed while steps scroll.
- Active steps must read in that city's accent. The playhead is the accent colour, not a white outline.

## Deployment

Vercel serves the static Vite build. `base` is `/`. `vercel.json` sets framework `vite`, build `npm run build`, output `dist`. Pushes to `main` deploy. `dist/` is gitignored; do not commit it. Samples in `public/samples` are copied into `dist/samples` by the build.

## Verify before you commit

- `npm run build` passes.
- `npm test` passes. The sample test must still see every manifest file exactly once.
- All 24 ogg files decode in the browser. No track should be on the synth fallback.
- Play Demo through a full bar in all four cities, plus one phone-width pass. Check the accent on drum steps and synth notes, the playhead, track names, and the credits line.
