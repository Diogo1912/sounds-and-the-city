# sounds and the city · Amsterdam

A one-screen Amsterdam groovebox with a field-recording drum kit, 16-step sequencer, graphic synth, and a chromatic piano.

## Run

```bash
npm install
npm run dev
npm test
npm run build
```

The development server runs at [127.0.0.1:47221](http://127.0.0.1:47221).

## Play

- Use **Play** or Space to run a four-beat bar. Set tempo in quarter-note BPM. Click or drag across drum steps to toggle them. Click a track name to hear the sound and **M** to mute it.
- Choose a synth instrument, then use **Try note** to hear it. Shape it with Brightness, Fade in, Fade out, and Volume. Open **Advanced** for oscillator routing, the drag-to-edit filter and envelopes, and the Voice, Modulation, and Output controls.
- Play the virtual piano or use **A W S E D F T G Y H U J K**. Select a note and click a synth step to place it. The octave buttons change the keyboard range.
- **Record** captures one bar. **Listen** previews the selected take and **Save** downloads it. The nine sample pads are reserved for future sounds.

The browser saves the Amsterdam pattern and patch. Earlier Amsterdam patterns and patches load automatically. When a legacy 24-step pattern is mapped to 16 steps, collisions keep the strongest drum hit and first synth note. The original browser entries are preserved.

Bo van Burken came up with the name. Open **Credits** in the instrument for the name and field-recording credits, or see [sample credits](docs/SAMPLES.md).
