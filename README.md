# City Rhythm

A four-panel groovebox with drum kits and synthesizers for New York, Amsterdam, Tokyo, and London.

## Run

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:47221](http://127.0.0.1:47221).

```bash
npm test
npm run build
```

## Play

Pick **New York**, **Amsterdam**, **Tokyo**, or **London**. Each city loads its sounds, a starter bar, and a tempo.

- **Play** loops a 16-step bar. Space also toggles playback.
- **Tempo** sets quarter-note BPM. Each step is a sixteenth note.
- Click a pad to turn that step on or off. Drag to paint. On a touch screen, tap.
- Play the chromatic piano or use `A W S E D F T G Y H U J K`. The octave buttons change the keyboard range. Select a key and click a synth step to place the note.
- **Demo** loads a starter bar. **Reset** clears the drum and synth steps.
- **Record** captures one bar. Preview and download the take from **Animation & recording**.
- Click a name to hear that sound. **M** mutes the row.

Patterns and synth patches are saved separately for each city in your browser. Existing 24-step patterns are mapped across the 16-step bar. If two hits land on the same step, the strongest drum hit and the first synth note are kept. The original browser data is retained.

The 3 × 3 **Samples** panel has nine empty slots per city for future samples. The drum machine already uses the field recordings listed below.

## Shape a synth patch

- **Oscillators** mixes two waveforms or uses oscillator B to frequency-modulate A. Adjust tuning, fine detune, sub oscillator, and noise.
- **Filter** selects low-pass, high-pass, band-pass, or notch. Cutoff and resonance shape the tone, and the envelope amount sweeps the cutoff as a note plays.
- **Envelope** sets attack, decay, sustain, and release. The filter has its own ADSR and keyboard tracking. **LFO** adds pitch vibrato, filter movement, or tremolo.
- **Output** sets drive, stereo pan, synth level, and the percentage of a sequencer step each note is held. Cutoff, resonance, level, and pan respond on held notes. Other sound edits apply to the next note.
- Load any city preset or start with **Init · Sine**. **Reset patch** restores the current city's preset. **Demo** and the transport's **Reset** change the grid only.

Drag a dial vertically or focus it and use the arrow keys. Double-click a dial to restore its city preset value.

## Kits

Drum hits are recorded one-shots. A track with no sample, or one that fails to load, keeps its synthesised hit. The synth lane is still synthesised. Busier hours play the same sample louder.

| City | Sounds | Starter tempo |
| --- | --- | --- |
| New York | Subway, taxi horn, turnstile, radiator, door chime, jackhammer | 96 |
| Amsterdam | Tram bell, bike bell, cobbles, canal, carillon, bridge horn | 108 |
| Tokyo | Train motor, crossing, ticket gate, rail, door, temple bowl | 118 |
| London | Clock bell, tube alarm, cab horn, bus bell, rain, diesel | 92 |

## Credits

Each track is a field-recorded one-shot. The full source list is in [SAMPLES.md](docs/SAMPLES.md).

Most files are CC0. Attribution is not required for those; the authors are still listed in `SAMPLES.md`.

Three files require attribution:

- Tokyo train: “[TM6000_horn.wav](https://commons.wikimedia.org/wiki/File:TM6000_horn.wav)”, Wikimedia Commons, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The file page’s artist field is unclear, so this credits Wikimedia Commons. This copy was trimmed and converted to mono Ogg Vorbis. That adaptation is also shared under CC BY-SA 4.0.
- Tokyo gate: “Card Beep in Japan Railways Ticket Gate” by [Hinoki.owo](https://freesound.org/people/Hinoki.owo/sounds/796687/), Freesound, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Tokyo bowl: “[Tibetan Singing Bowl hit 4.5inch.flac](https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_hit_4.5inch.flac)” by [דג בלי מלח](https://commons.wikimedia.org/wiki/User:%D7%93%D7%92_%D7%91%D7%9C%D7%99_%D7%9E%D7%9C%D7%97), Wikimedia Commons, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). This copy was trimmed and converted to mono Ogg Vorbis. That adaptation is also shared under CC BY-SA 4.0.
