import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Knob } from "@/components/Knob";
import { ScopeMeter } from "@/components/ScopeMeter";
import { Sequencer } from "@/components/Sequencer";
import { SynthPanel } from "@/components/SynthPanel";
import { TempoDial } from "@/components/TempoDial";
import { Engine } from "@/audio/engine";
import { CITIES, SYNTH, cityById, demoSong, emptySong, writeCell } from "@/kits";
import { loadSettings, loadSongs, saveSettings, saveSongs } from "@/lib/settings";
import { dayPhase, formatHour } from "@/lib/time";
import type { CityId, StepHit } from "@/types";

const KEY_MAP = ["a", "s", "d", "f", "g", "h", "j", "k"];

type Take = { id: number; url: string; city: string; type: string };

export default function App() {
  const stored = useState(loadSettings)[0];
  const [cityId, setCityId] = useState<CityId>(stored.cityId);
  const [bpm, setBpm] = useState(stored.bpm);
  const [volume, setVolume] = useState(stored.volume);
  const [songs, setSongs] = useState(loadSongs);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [muted, setMuted] = useState<ReadonlySet<string>>(() => new Set());
  const [cutoff, setCutoff] = useState(SYNTH[stored.cityId].cutoff);
  const [decay, setDecay] = useState(SYNTH[stored.cityId].decay);
  const [armed, setArmed] = useState(SYNTH[stored.cityId].scale[0] ?? 60);
  const [recording, setRecording] = useState(false);
  const [takes, setTakes] = useState<Take[]>([]);
  const [switching, setSwitching] = useState(false);
  const engineRef = useRef<Engine | null>(null);
  const playingRef = useRef(false);
  const stepRef = useRef(0);
  const recordingRef = useRef(false);
  const loopedRef = useRef(false);
  const cityIdRef = useRef(cityId);
  const takesRef = useRef<Take[]>([]);

  const city = cityById(cityId);
  const synth = SYNTH[cityId];
  const song = songs[cityId];

  const hits = useMemo(
    () => toHits(city.voices.map((voice) => voice.id), song.drums, song.notes, muted),
    [city, song, muted],
  );

  useEffect(() => {
    const engine = new Engine((index) => {
      setStep(index);
      if (!recordingRef.current) return;
      if (index !== 0) return;
      if (!loopedRef.current) {
        loopedRef.current = true;
        return;
      }
      loopedRef.current = false;
      void finishTake();
    });
    engine.preload();
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setCity(cityId);
  }, [cityId]);

  useEffect(() => {
    engineRef.current?.setTransport({ bpm, volume });
  }, [bpm, volume]);

  useEffect(() => {
    engineRef.current?.setSynth({ cutoff, decay });
  }, [cutoff, decay]);

  useEffect(() => {
    engineRef.current?.setPattern(hits);
  }, [hits]);

  useEffect(() => {
    saveSettings({ cityId, bpm, volume });
  }, [cityId, bpm, volume]);

  useEffect(() => {
    saveSongs(songs);
  }, [songs]);

  useEffect(() => {
    cityIdRef.current = cityId;
  }, [cityId]);

  useEffect(() => {
    takesRef.current = takes;
  }, [takes]);

  useEffect(() => {
    return () => {
      for (const take of takesRef.current) URL.revokeObjectURL(take.url);
    };
  }, []);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("[data-slot='slider']")) return;
      if (event.key === " ") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        nudge(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        nudge(-1);
      } else if (!(target instanceof HTMLElement && target.closest("button"))) {
        const keyIndex = KEY_MAP.indexOf(event.key.toLowerCase());
        if (keyIndex >= 0) {
          event.preventDefault();
          const midi = SYNTH[cityIdRef.current].scale[keyIndex];
          if (midi != null) playKey(midi);
        }
      }
    }
    function togglePlay() {
      const engine = engineRef.current;
      if (!engine) return;
      if (playingRef.current) {
        engine.pause();
        setPlaying(false);
      } else {
        engine.play();
        setPlaying(true);
      }
    }
    function nudge(delta: number) {
      const next = (stepRef.current + delta + 24) % 24;
      const engine = engineRef.current;
      engine?.jump(next);
      setStep(next);
      if (!playingRef.current) engine?.previewStep();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function togglePlay() {
    const engine = engineRef.current;
    if (!engine) return;
    if (playing) {
      engine.pause();
      setPlaying(false);
    } else {
      engine.play();
      setPlaying(true);
    }
  }

  function chooseCity(id: CityId) {
    if (id === cityId) return;
    const next = cityById(id);
    const tone = SYNTH[id];
    setSwitching(true);
    window.setTimeout(() => setSwitching(false), 280);
    setCityId(id);
    setBpm(next.bpm);
    setCutoff(tone.cutoff);
    setDecay(tone.decay);
    setArmed(tone.scale[0] ?? 60);
    setMuted(new Set());
    setStep(0);
    engineRef.current?.jump(0);
  }

  function playKey(midi: number) {
    setArmed(midi);
    engineRef.current?.previewSynth(midi);
    if (!recordingRef.current) return;
    const hour = stepRef.current;
    setSongs((current) => {
      const notes = current[cityIdRef.current].notes.slice();
      notes[hour] = midi;
      return { ...current, [cityIdRef.current]: { ...current[cityIdRef.current], notes } };
    });
  }

  function jump(index: number) {
    const engine = engineRef.current;
    engine?.jump(index);
    setStep(index);
    if (!playing) engine?.previewStep();
  }

  function write(voice: number, index: number, velocity: number) {
    setSongs((current) => ({
      ...current,
      [cityId]: { ...current[cityId], drums: writeCell(current[cityId].drums, voice, index, velocity) },
    }));
  }

  function writeNote(hour: number, currentNote: number | null) {
    const midi = currentNote == null ? armed : null;
    if (midi != null) engineRef.current?.previewSynth(midi);
    setSongs((current) => {
      const notes = current[cityId].notes.slice();
      notes[hour] = midi;
      return { ...current, [cityId]: { ...current[cityId], notes } };
    });
  }

  function reset() {
    setSongs((current) => ({ ...current, [cityId]: emptySong() }));
  }

  function demo() {
    setSongs((current) => ({ ...current, [cityId]: demoSong(city) }));
  }

  function toggleRecord() {
    if (recordingRef.current) {
      void finishTake();
      return;
    }
    const engine = engineRef.current;
    if (!engine) return;
    loopedRef.current = false;
    recordingRef.current = true;
    setRecording(true);
    engine.jump(0);
    setStep(0);
    engine.startRecording();
    engine.play();
    setPlaying(true);
  }

  async function finishTake() {
    recordingRef.current = false;
    loopedRef.current = false;
    setRecording(false);
    const engine = engineRef.current;
    engine?.pause();
    setPlaying(false);
    const blob = await engine?.stopRecording();
    if (!blob || blob.size === 0) return;
    const url = URL.createObjectURL(blob);
    const label = cityById(cityIdRef.current).label;
    setTakes((current) => [{ id: Date.now(), url, city: label, type: blob.type }, ...current].slice(0, 6));
  }

  function toggleMute(id: string) {
    setMuted((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="app">
      <div className={switching ? "face is-switching" : "face"} data-city={cityId} data-phase={dayPhase(step)}>
        {cityId === "amsterdam" ? <span className="ripple" aria-hidden="true" /> : null}
        <header className="transport">
          <div className={`plate plate-${cityId}`}>
            <span>City Rhythm</span>
            <strong>{city.label}</strong>
          </div>
          <div className="seg" role="group" aria-label="City">
            {CITIES.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant="outline"
                aria-pressed={item.id === cityId}
                className={item.id === cityId ? "is-selected" : undefined}
                onClick={() => chooseCity(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            className={playing ? "play is-on" : "play"}
            aria-pressed={playing}
            aria-label={playing ? "Pause" : "Play"}
            onClick={togglePlay}
          >
            {playing ? <PauseMark /> : <PlayMark />}
          </Button>
          <p className="lcd" key={step}>
            {formatHour(step)}
            <span>:00</span>
          </p>
          <TempoDial city={cityId} value={bpm} resetValue={city.bpm} onChange={setBpm} />
          <Knob
            label="Level"
            kind={cityId === "london" ? "roundel" : cityId === "amsterdam" ? "bell" : "bullet"}
            size={48}
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            resetValue={82}
            onChange={(value) => setVolume(value / 100)}
          />
          <ScopeMeter engineRef={engineRef} vertical={cityId === "tokyo"} />
          <Button type="button" variant="outline" onClick={demo}>
            Demo
          </Button>
          <Button type="button" variant="outline" className="reset" onClick={reset}>
            Reset
          </Button>
          <button
            type="button"
            className={recording ? "record is-on" : "record"}
            aria-pressed={recording}
            onClick={toggleRecord}
          >
            <span className="record-cap" />
            <span>{recording ? "Recording" : "Record"}</span>
          </button>
        </header>
        <div className="workspace">
          <Sequencer
            city={cityId}
            voices={city.voices}
            pattern={song.drums}
            notes={song.notes}
            synthName={synth.name}
            step={step}
            muted={muted}
            onToggleMute={toggleMute}
            onPreview={(id) => {
              if (id === "synth" && song.notes[step] != null) engineRef.current?.previewSynth(song.notes[step]);
              else engineRef.current?.preview(id);
            }}
            onJump={jump}
            onWrite={write}
            onWriteNote={writeNote}
          />
          <SynthPanel
            city={cityId}
            name={synth.name}
            scale={synth.scale}
            armed={armed}
            cutoff={cutoff}
            decay={decay}
            cutoffDefault={synth.cutoff}
            decayDefault={synth.decay}
            onArm={playKey}
            onCutoff={setCutoff}
            onDecay={setDecay}
          />
        </div>
        {takes.length > 0 ? (
          <div className="takes">
            {takes.map((take) => (
              <div key={take.id} className="take">
                <span>{take.city}</span>
                <audio controls src={take.url} />
                <a href={take.url} download={`${take.city.toLowerCase().replaceAll(" ", "-")}.webm`}>
                  Save
                </a>
              </div>
            ))}
          </div>
        ) : null}
        <p className="credits">
          Credits: mostly CC0. Taiko by{" "}
          <a href="https://freesound.org/people/xtrgamr/sounds/441646/">xtrgamr</a>, CC BY 4.0. Bombo legüero by{" "}
          <a href="https://commons.wikimedia.org/wiki/File:Bombo_Leg%C3%BCero_Grave.ogg">ZappaMidiPF</a>, CC BY-SA 4.0.
        </p>
      </div>
    </div>
  );
}

function toHits(ids: string[], drums: number[][], notes: (number | null)[], muted: ReadonlySet<string>): StepHit[][] {
  const steps = drums[0]?.length ?? 24;
  const hits: StepHit[][] = Array.from({ length: steps }, () => []);
  ids.forEach((id, voice) => {
    const row = drums[voice] ?? [];
    for (let index = 0; index < steps; index += 1) {
      hits[index]?.push({ voice: id, velocity: row[index] ?? 0, muted: muted.has(id) });
    }
  });
  const synthMuted = muted.has("synth");
  for (let index = 0; index < steps; index += 1) {
    const note = notes[index];
    hits[index]?.push({
      voice: "synth",
      velocity: note == null ? 0 : 0.9,
      muted: synthMuted,
      note: note ?? undefined,
    });
  }
  return hits;
}

function PlayMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.2 1.1 L10.6 6 L2.2 10.9 Z" fill="currentColor" />
    </svg>
  );
}

function PauseMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <rect x="2" y="1" width="2.6" height="10" fill="currentColor" />
      <rect x="7.4" y="1" width="2.6" height="10" fill="currentColor" />
    </svg>
  );
}
