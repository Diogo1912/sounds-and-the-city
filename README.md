# City Rhythm

A drum machine with four city kits. Each step is an hour, so a pattern is one day in that city.

![New York day, with the bass lane](docs/screenshots/studio-new-york.png)

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

Pick **New York**, **Amsterdam**, **Tokyo**, or **London**. Each city loads its sounds, a starter day, and a tempo.

- **Play** runs the 24 hours. Space does the same. The clock is the current hour.
- **Tempo** is the quarter-note BPM. One hour is one beat, so a day lasts `24 × 60 / BPM` seconds.
- Click a pad to turn that hour on or off. Drag to paint. On a touch screen, tap.
- The bottom row is that city's synth. Pick a key, then click an hour to place the note. Keys `A S D F G H J K` play the keys.
- **Demo** loads a day. **Reset** clears it.
- **Record** captures one pass from 00:00. The take shows up under the rack. Save downloads it.
- Click a name to hear that sound. **M** mutes the row.

Patterns are kept in the browser while you switch cities.

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

- Tokyo train: “[TM6000_horn.wav](https://commons.wikimedia.org/wiki/File:TM6000_horn.wav)” by JIRCTRAINZ?, Wikimedia Commons, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). This copy was trimmed and converted to mono Ogg Vorbis. That adaptation is also shared under CC BY-SA 4.0.
- Tokyo gate: “Card Beep in Japan Railways Ticket Gate” by [Hinoki.owo](https://freesound.org/people/Hinoki.owo/sounds/796687/), Freesound, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Tokyo bowl: “[Tibetan Singing Bowl hit 4.5inch.flac](https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_hit_4.5inch.flac)” by [דג בלי מלח](https://commons.wikimedia.org/wiki/User:%D7%93%D7%92_%D7%91%D7%9C%D7%99_%D7%9E%D7%9C%D7%97), Wikimedia Commons, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). This copy was trimmed and converted to mono Ogg Vorbis. That adaptation is also shared under CC BY-SA 4.0.
