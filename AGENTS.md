# AGENTS.md

sounds and the city is an Amsterdam groovebox. The top strip holds transport, a live waveform, and recording controls. The four panels are drum machine, graphical synth editor, empty sample pads, and piano with a note lane. The bar is 16 sixteenth-note steps.

## Commands

```bash
npm install
npm run dev       # http://127.0.0.1:47221
npm test
npm run lint
npm run build     # TypeScript and Vite → dist/
```

## Structure

| Path | Role |
| --- | --- |
| `src/App.tsx` | Transport, input, audio engine, pattern and patch state |
| `src/components/InstrumentPanels.tsx` | Transport strip, drum and sample pads, piano and synth sequence |
| `src/components/SynthDesigner.tsx` | Preset picker, simple controls, advanced oscillator and filter displays, envelope interaction |
| `src/components/plots.ts`, `patchGeometry.ts` | Canvas sizing, drawing, and envelope geometry |
| `src/index.css` | Responsive single-viewport instrument layout |
| `src/kits.ts`, `src/synthPatch.ts` | Amsterdam tracks, demo, synth parameters and preset |
| `src/audio/engine.ts`, `synth.ts` | Web Audio scheduling, synth graph, recording |
| `src/audio/samples.ts`, `voices.ts` | Drum sample mix, attack alignment, and synthesis fallback |
| `src/lib/settings.ts` | Amsterdam storage and migration from earlier versions |

## Audio and assets

Keep the six Amsterdam voice IDs stable. When replacing a drum sound, update the Ogg file under `public/samples/amsterdam/`, its mix settings, and `docs/SAMPLES.md`. Add visible attribution for any future sample whose licence requires it. Recording runs through the master compressor and stops at the end of the bar.

## Verification

Run the build and tests. Play the demo and check that drum preview uses each sample, both envelope displays change the patch, keyboard and pointer notes release, recording downloads a take, and all panels fit at phone and laptop sizes. Vercel builds the Vite app using `npm run build` and serves `dist/`.
