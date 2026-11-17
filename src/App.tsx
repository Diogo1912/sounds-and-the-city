import { useEffect, useMemo, useRef, useState } from "react";
import { DrumGrid, Piano, SampleGrid, StationHeader } from "@/components/InstrumentPanels";
import type { Take } from "@/components/InstrumentPanels";
import { SynthDesigner } from "@/components/SynthDesigner";
import { Credits } from "@/components/Credits";
import { Engine } from "@/audio/engine";
import { AMSTERDAM_VOICES, demoSong, emptySong, writeCell } from "@/kits";
import { loadPatch, loadSettings, loadSong, savePatch, saveSettings, saveSong } from "@/lib/settings";
import type { SynthPatch } from "@/synthPatch";
import { STEP_COUNT } from "@/lib/time";
import { PIANO_KEYS, pianoMidi } from "@/lib/notes";
import type { StepHit } from "@/types";

export default function App() {
  const stored = useState(loadSettings)[0];
  const [bpm, setBpm] = useState(stored.bpm);
  const [volume, setVolume] = useState(stored.volume);
  const [song, setSong] = useState(loadSong);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [muted, setMuted] = useState<ReadonlySet<string>>(() => new Set());
  const [patch, setPatch] = useState(loadPatch);
  const [octave, setOctave] = useState(4);
  const octaveRef = useRef(octave);
  const [armed, setArmed] = useState(() => pianoMidi(octave));
  const [recording, setRecording] = useState(false);
  const [takes, setTakes] = useState<Take[]>([]);
  const [recordError, setRecordError] = useState("");
  const [savingTake, setSavingTake] = useState(false);
  const [activeNotes, setActiveNotes] = useState<ReadonlyMap<number, number>>(() => new Map());
  const engineRef = useRef<Engine | null>(null);
  const playingRef = useRef(false);
  const stepRef = useRef(0);
  const recordingRef = useRef(false);
  const takesRef = useRef<Take[]>([]);

  const hits = useMemo(
    () => toHits(AMSTERDAM_VOICES.map((voice) => voice.id), song.drums, song.notes, muted),
    [song, muted],
  );

  useEffect(() => {
    const engine = new Engine(setStep, () => {
      if (recordingRef.current) void finishTake();
    });
    engine.preload();
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setTransport({ bpm, volume });
  }, [bpm, volume]);

  useEffect(() => {
    engineRef.current?.setSynth(patch);
  }, [patch]);

  useEffect(() => {
    savePatch(patch);
  }, [patch]);

  useEffect(() => {
    engineRef.current?.setPattern(hits);
  }, [hits]);

  useEffect(() => {
    saveSettings({ bpm, volume });
  }, [bpm, volume]);

  useEffect(() => {
    saveSong(song);
  }, [song]);

  useEffect(() => {
    const urls = new Set(takes.map((take) => take.url));
    for (const take of takesRef.current) if (!urls.has(take.url)) URL.revokeObjectURL(take.url);
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
    const held = new Map<string, () => void>();
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (target instanceof HTMLElement && target.closest("input, select, textarea, dialog, [contenteditable], [role='slider']")) return;
      if (event.key === " " && target instanceof HTMLElement && target.closest("button, a, audio")) return;
      if (event.key === " ") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        jump((stepRef.current + 1) % STEP_COUNT);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        jump((stepRef.current - 1 + STEP_COUNT) % STEP_COUNT);
      } else {
        const keyIndex = PIANO_KEYS.indexOf(event.key.toLowerCase());
        if (keyIndex < 0) return;
        event.preventDefault();
        if (event.repeat || held.has(event.code)) return;
        held.set(event.code, holdKey(pianoMidi(octaveRef.current, keyIndex)));
      }
    }
    function onKeyUp(event: KeyboardEvent) {
      held.get(event.code)?.();
      held.delete(event.code);
    }
    function releaseKeys() {
      for (const release of held.values()) release();
      held.clear();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", releaseKeys);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", releaseKeys);
      releaseKeys();
    };
  }, []);

  function togglePlay() {
    const engine = engineRef.current;
    if (!engine) return;
    if (recordingRef.current) {
      void finishTake();
    } else if (playingRef.current) {
      engine.pause();
      setPlaying(false);
    } else {
      engine.play();
      setPlaying(true);
    }
  }

  function changeOctave(next: number) {
    octaveRef.current = next;
    setOctave(next);
    setArmed(pianoMidi(next));
  }

  function editPatch(next: SynthPatch) {
    engineRef.current?.setSynth(next);
    setPatch(next);
  }

  function playKey(midi: number) {
    armKey(midi);
    engineRef.current?.previewSynth(midi);
  }

  function holdKey(midi: number): () => void {
    armKey(midi);
    const releaseVoice = engineRef.current?.holdSynth(midi);
    setActiveNotes((current) => new Map(current).set(midi, (current.get(midi) ?? 0) + 1));
    return () => {
      releaseVoice?.();
      setActiveNotes((current) => {
        const next = new Map(current);
        const count = next.get(midi) ?? 0;
        if (count <= 1) next.delete(midi);
        else next.set(midi, count - 1);
        return next;
      });
    };
  }

  function armKey(midi: number) {
    setArmed(midi);
    if (!recordingRef.current) return;
    const hour = stepRef.current;
    setSong((current) => {
      const notes = current.notes.slice();
      notes[hour] = midi;
      return { ...current, notes };
    });
  }

  function jump(index: number) {
    if (recordingRef.current) return;
    const engine = engineRef.current;
    engine?.jump(index);
    setStep(index);
    if (!playingRef.current) engine?.previewStep();
  }

  function write(voice: number, index: number, velocity: number) {
    setSong((current) => ({ ...current, drums: writeCell(current.drums, voice, index, velocity) }));
  }

  function writeNote(hour: number, currentNote: number | null) {
    const midi = currentNote == null ? armed : null;
    if (midi != null) engineRef.current?.previewSynth(midi);
    setSong((current) => {
      const notes = current.notes.slice();
      notes[hour] = midi;
      return { ...current, notes };
    });
  }

  function reset() {
    setSong(emptySong());
  }

  function demo() {
    setSong(demoSong());
  }

  function toggleRecord() {
    if (recordingRef.current) {
      void finishTake();
      return;
    }
    const engine = engineRef.current;
    if (!engine || savingTake) return;
    setRecordError("");
    if (!engine.startRecording()) {
      setRecordError("Audio recording is unavailable in this browser.");
      return;
    }
    recordingRef.current = true;
    setRecording(true);
    engine.jump(0);
    setStep(0);
    engine.play();
    setPlaying(true);
  }

  async function finishTake() {
    recordingRef.current = false;
    setRecording(false);
    setSavingTake(true);
    const engine = engineRef.current;
    engine?.pause();
    setPlaying(false);
    try {
      const blob = await engine?.stopRecording();
      if (!blob || blob.size === 0) {
        setRecordError("No audio was captured.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const extension = blob.type.includes("mp4") ? "m4a"
        : blob.type.includes("ogg") ? "ogg"
          : blob.type.includes("webm") ? "webm" : "audio";
      setTakes((current) => [{ id: Date.now(), url, extension }, ...current].slice(0, 6));
    } finally {
      setSavingTake(false);
    }
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
    <main className="station">
      <StationHeader
        step={step}
        bpm={bpm} changeBpm={setBpm} volume={volume} changeVolume={setVolume}
        playing={playing} togglePlay={togglePlay} recording={recording} savingTake={savingTake}
        toggleRecord={toggleRecord} takes={takes} recordError={recordError} engineRef={engineRef}
      />
      <div className="instrument-grid">
        <DrumGrid
          pattern={song.drums} voices={AMSTERDAM_VOICES} step={step} muted={muted}
          preview={(id) => engineRef.current?.preview(id)} mute={toggleMute}
          jump={jump} write={write} demo={demo} reset={reset}
        />
        <SynthDesigner patch={patch} onPatch={editPatch} audition={() => engineRef.current?.previewSynth(armed)} />
        <SampleGrid />
        <Piano
          octave={octave} changeOctave={changeOctave}
          armed={armed} active={activeNotes} notes={song.notes} step={step} muted={muted.has("synth")}
          toggleMute={() => toggleMute("synth")} play={playKey} hold={holdKey} writeNote={writeNote}
        />
      </div>
      <Credits />
    </main>
  );
}

function toHits(ids: string[], drums: number[][], notes: (number | null)[], muted: ReadonlySet<string>): StepHit[][] {
  const steps = STEP_COUNT;
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

