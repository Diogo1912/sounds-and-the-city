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

All sounds are synthesized in the Web Audio API. No samples, no recordings.

| City | Sounds | Starter tempo |
| --- | --- | --- |
| New York | Subway, taxi horn, turnstile, radiator, door chime, jackhammer | 96 |
| Amsterdam | Tram bell, bike bell, cobbles, canal, carillon, bridge horn | 108 |
| Tokyo | Train motor, crossing, ticket gate, rail, door, temple bowl | 118 |
| London | Clock bell, tube alarm, cab horn, bus bell, rain, diesel | 92 |

The Tokyo crossing is two short beeps, in the manner of a pedestrian signal, not a station melody. The London and Amsterdam bells are single strikes, not clock tunes.
