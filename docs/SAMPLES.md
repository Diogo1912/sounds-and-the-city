# City Rhythm samples v2

Field-recording one-shots for the City Rhythm beat-making toy. Each track is a cut of a real city sound object, not a generic drum hit.

All 24 files are mono, 44.1 kHz, Vorbis (`.ogg`), peak-normalised to about −1 dBFS, with a tight attack so the transient lands on the beat. Most hits are under 1.5 s; bells, the carillon, and the singing bowl are allowed to ring up to about 3 s. Every file is under 150 KB.

**Licences.** Prefer CC0, then CC BY. No CC-BY-NC material is included. Licences were read from the Freesound sound page or the Wikimedia Commons MediaWiki API (`LicenseShortName` / `LicenseUrl` / `Artist`), not from search-result chrome. Do not treat this file as a licence grant; follow the source page if anything conflicts.

**Attribution.** CC0 does not require credit; authors are listed anyway. Three tracks are not CC0 and **must** be credited in the app:

- `tokyo/train.ogg` — CC BY-SA 4.0, JIRCTRAINZ? (as credited on Wikimedia Commons). Adaptations, including this trim/conversion, must be shared under CC BY-SA 4.0.
- `tokyo/gate.ogg` — CC BY 4.0, Hinoki.owo.
- `tokyo/bowl.ogg` — CC BY-SA 4.0, Wikimedia user דג בלי מלח. Adaptations must be shared under CC BY-SA 4.0.

**Sources and encoding.** Wikimedia originals were downloaded from `upload.wikimedia.org`. Freesound originals require a login, so the official HQ MP3 previews on `cdn.freesound.org` were used; they are the same recordings under the same licences. Each one-shot was cut with ffmpeg, converted to mono 44.1 kHz, given a 4 ms fade-in and a short fade-out, and encoded with libvorbis q=5.

**Weak matches** are flagged in the tables below. Several hits are the right *kind* of object but were not recorded in that city, or are mixed with other street/train noise.

---

## New York

| Track | What it is | Source | Licence | Attribution | Notes |
|---|---|---|---|---|---|
| `subway` | NYC subway train brake squeal, a ~1 s burst as the train screeches to a halt | [carroll27 187313](https://freesound.org/people/carroll27/sounds/187313/) *NYC_Subway train, screeching to a halt* | CC0 1.0 | carroll27 | Strong match. The original is quiet and was gained up substantially. |
| `horn` | First short take of a car horn honk | [BaggoNotes 719428](https://freesound.org/people/BaggoNotes/sounds/719428/) *CarHorn_Takes* | CC0 1.0 | BaggoNotes | Real horn, recorded with an AT2020 and Zoom. Not labelled as a New York taxi horn. |
| `turnstile` | Metal NYC subway turnstile clack after a Metrocard swipe | [SpliceSound 369875](https://freesound.org/people/SpliceSound/sounds/369875/) *Subway, card swipe, double beep and turnstile* | CC0 1.0 | SpliceSound | Cut from the clack cluster, not the earlier double-beep. A little residual station noise sits under the hit. |
| `steam` | Close-up steam radiator: metallic clang with sputtering water | [flood-mix 413476](https://freesound.org/people/flood-mix/sounds/413476/) *RADIATOR - Metallic clanging, water spouting* | CC0 1.0 | flood-mix | **Weak place match:** a real radiator clang/hiss, but not labelled as a New York field recording. Punchier than the quieter NYC-specific radiator beds that were considered (sethlind 265013, mr_roboto24 259527). |
| `chime` | NYC subway door-opening ding-dong | [carroll27 187314](https://freesound.org/people/carroll27/sounds/187314/) *NYC_Subway, ding dong door opening sound* | CC0 1.0 | carroll27 | Strong match. Two-tone chime, trimmed of a short lead-in. |
| `hammer` | Short jackhammer-and-compressor burst | [the_yura 156893](https://freesound.org/people/the_yura/sounds/156893/) *Jackhammer and compressor* | CC0 1.0 | the_yura | Real pneumatic hits, not a pavement-only close-up; some compressor air is in the bed. Location not specified. |

## Amsterdam

| Track | What it is | Source | Licence | Attribution | Notes |
|---|---|---|---|---|---|
| `tram` | Amsterdam streetcar passing and using its warning bell | [ajvds 123990](https://freesound.org/people/ajvds/sounds/123990/) *Tram02 links rechts* | CC0 1.0 | ajvds | Strong place match (Amsterdam tram). The cut is a high-frequency burst from the pass-by; wheel/squeal energy is mixed with the bell, so it is not a perfectly isolated ding-ding. |
| `bell` | Bicycle bell, single ding with natural ring | [File:Bicycle-bell-1.wav](https://commons.wikimedia.org/wiki/File:Bicycle-bell-1.wav) | CC0 1.0 | Soundscape_Leuphana (Wikimedia Commons) | Kept from v1; this is the bike bell that already worked in the kit. |
| `cobbles` | Single thud/cluster of a bicycle riding over cobblestones | [gecop 528158](https://freesound.org/people/gecop/sounds/528158/) *cobblestones* | CC0 1.0 | gecop | Right object (bike on cobbles). Recording location is not given, so it is not confirmed as Amsterdam stone. |
| `canal` | One water splash / slap | [vero.marengere 524524](https://freesound.org/people/vero.marengere/sounds/524524/) *Water Splash in Lake 05* | CC0 1.0 | vero.marengere | **Weak place match:** a real splash, recorded in a lake, not an Amsterdam canal. |
| `carillon` | One carillon / church-chime note with ~2.7 s of ring | [Julien_Matthey 274987](https://freesound.org/people/Julien_Matthey/sounds/274987/) *Carillon du Monts des Arts, Bruxelles* | CC0 1.0 | Julien_Matthey | **Weak place match:** a real carillon, recorded at Mont des Arts, Brussels, not Westertoren or another Amsterdam tower. |
| `bridge` | Metal clank as an Amsterdam tram drives onto a bridge | [erilee 108360](https://freesound.org/people/erilee/sounds/108360/) *erilee_tram_over_bridge* | CC0 1.0 | erilee | Recorded in Amsterdam, and it is a metal bridge clank, but **not** a drawbridge warning bell. Some tram/road bed remains under the hit. |

## Tokyo

| Track | What it is | Source | Licence | Attribution | Notes |
|---|---|---|---|---|---|
| `train` | Tokyo Metro 6000 series train horn, one blast | [File:TM6000_horn.wav](https://commons.wikimedia.org/wiki/File:TM6000_horn.wav) | CC BY-SA 4.0 | JIRCTRAINZ? (as credited on Wikimedia Commons) | Real Tokyo Metro horn. Credit required; share-alike applies. Station departure melodies were avoided because of composition copyright. |
| `crossing` | Japanese railway level-crossing electronic bell (*kan-kan* / boom-gate beeping), short loop | [JotrainG 650317](https://freesound.org/people/JotrainG/sounds/650317/) *Japanese Railway Level Crossing Electronic Beeping Loop* | CC0 1.0 | JotrainG | Strong object match, recorded in Japan. Slightly longer than 1.5 s so two or three beeps can land as a phrase. |
| `gate` | Suica IC-card beep at a JR ticket gate, Tokyo station | [Hinoki.owo 796687](https://freesound.org/people/Hinoki.owo/sounds/796687/) *Card Beep in Japan Railways Ticket Gate* | CC BY 4.0 | Hinoki.owo | Strong match. Credit required. Tight cut of the beep only. |
| `rail` | Onboard rail-joint wheel clacks (a short double clack) | [kyles 637908](https://freesound.org/people/kyles/sounds/637908/) *train passenger India onboard rail clacks between cars maybe* | CC0 1.0 | kyles | **Weak place match:** the right kind of rail-joint clack, but recorded on a passenger train in India, not Tokyo. |
| `door` | Train door-closing warning signal, recorded inside a train | [Garuda1982 337754](https://freesound.org/people/Garuda1982/sounds/337754/) *train door closing signal* | CC0 1.0 | Garuda1982 | **Weak place match:** a real door-warning beep phrase, but the recording does not state that it is a Japanese / Tokyo train. |
| `bowl` | Single strike of a 4.5-inch Tibetan singing bowl, with ring | [File:Tibetan Singing Bowl hit 4.5inch.flac](https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_hit_4.5inch.flac) | CC BY-SA 4.0 | Wikimedia user [דג בלי מלח](https://commons.wikimedia.org/wiki/User:%D7%93%D7%92_%D7%91%D7%9C%D7%99_%D7%9E%D7%9C%D7%97) | **Weak cultural match:** a clean singing-bowl / rin-like strike, but it is a Tibetan bowl, not a confirmed Japanese *rin*. Credit required; share-alike applies. |

## London

| Track | What it is | Source | Licence | Attribution | Notes |
|---|---|---|---|---|---|
| `bell` | One Big Ben strike / large-bell bong, with ~3 s of ring | [hyderpotter 80290](https://freesound.org/people/hyderpotter/sounds/80290/) *BigBenstrikes* | CC0 1.0 | hyderpotter | Strong object match. Cut is a single strike, not the full hour chime. |
| `tube` | Short burst from the interior of an empty District Line train between Westminster and Victoria (high-frequency door/electrical beeps over train rumble) | [blaukreuz 252289](https://freesound.org/people/blaukreuz/sounds/252289/) *140802_London_TubeWestminsterVictoriaIn_F* | CC0 1.0 | blaukreuz | Real London Underground interior. **Not an isolated door-chime** — the beeps sit in the carriage bed. Speech / “mind the gap” was avoided on purpose. |
| `cab` | Car door slam, close and punchy | [mandymatz 424031](https://freesound.org/people/mandymatz/sounds/424031/) *Car Door Slam* | CC0 1.0 | mandymatz | **Weak object match:** a solid door slam, but the car is a late-2000s Chrysler sedan, not a London black cab. |
| `bus` | Routemaster bus bell ding | [peteberry007 475211](https://freesound.org/people/peteberry007/sounds/475211/) *routemaster bell nice* | CC0 1.0 | peteberry007 | Strong match (classic London bus bell). |
| `rain` | Short burst of heavy rain heard from under an umbrella | [TariqMK 497151](https://freesound.org/people/TariqMK/sounds/497151/) *Rain Underneath Umbrella* | CC0 1.0 | TariqMK | Right texture (rain/umbrella patter). Not a London-specific recording. |
| `diesel` | Short, fairly steady diesel-engine idle chug, usable as a loopable hit | [C-V 565598](https://freesound.org/people/C-V/sounds/565598/) *Diesel idle 1* | CC0 1.0 | C-V | **Weak object match:** a real diesel idle, described as a dually (pickup) engine, not a London bus. |

---

## Processing notes

Cuts start a few milliseconds before the chosen transient (except where the source already starts on the hit). Peak normalisation was applied after the trim. Quiet sources (especially the subway squeal) were gained by up to about 17 dB. Waveform duration, channel count, sample rate, file size, peak level, and onset time were checked with ffmpeg/ffprobe after encode.

Licence URLs:

- CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/
- CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/
- CC BY-SA 4.0 — https://creativecommons.org/licenses/by-sa/4.0/
