# City Rhythm · Amsterdam

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
- Choose oscillator shapes and switch between Mix and FM. The waveform shows the combined output and the B oscillator. Drag the filter display to set cutoff and resonance. Drag the envelope’s handles or enter its values directly. The envelope selector switches between amp and filter. Additional parameters are in **Voice**, **Modulation**, and **Output**.
- Play the virtual piano or use **A W S E D F T G Y H U J K**. Select a note and click a synth step to place it. The octave buttons change the keyboard range.
- **Record** captures one bar. **Listen** previews the selected take and **Save** downloads it. The nine sample pads are reserved for future sounds.

The browser saves the Amsterdam pattern and patch. Earlier Amsterdam patterns and patches load automatically. When a legacy 24-step pattern is mapped to 16 steps, collisions keep the strongest drum hit and first synth note. The original browser entries are preserved.

The drum kit uses six field recordings. See [sample credits](docs/SAMPLES.md).
