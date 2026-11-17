import { Fragment, useEffect, useRef, useState } from "react";
import type { CSSProperties, RefObject } from "react";
import type { Engine } from "@/audio/engine";
import { noteName, PIANO_KEYS, pianoMidi } from "@/lib/notes";
import { formatStep, STEP_COUNT } from "@/lib/time";
import type { Voice } from "@/types";
import { plotGrid, trace, usePlot } from "./plots";

const STEPS = Array.from({ length: STEP_COUNT }, (_, step) => step);
export type Take = { id: number; url: string; extension: string };

type HeaderProps = {
  step: number;
  bpm: number;
  changeBpm: (bpm: number) => void;
  volume: number;
  changeVolume: (volume: number) => void;
  playing: boolean;
  togglePlay: () => void;
  recording: boolean;
  savingTake: boolean;
  toggleRecord: () => void;
  takes: Take[];
  recordError: string;
  engineRef: RefObject<Engine | null>;
};

export function StationHeader({
  step, bpm, changeBpm, volume, changeVolume, playing, togglePlay,
  recording, savingTake, toggleRecord, takes, recordError, engineRef,
}: HeaderProps) {
  const [bpmDraft, setBpmDraft] = useState(String(bpm));
  const [takeId, setTakeId] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const take = takes.find((item) => item.id === takeId) ?? takes[0];
  const waveform = useRef(new Uint8Array(256));
  const scope = usePlot((ctx, width, height, accent) => {
    plotGrid(ctx, width, height);
    const analyser = engineRef.current?.getAnalyser();
    const data = waveform.current;
    analyser?.getByteTimeDomainData(data);
    trace(ctx, width, height, accent, (x) => analyser
      ? 0.5 + (128 - (data[Math.round(x * (data.length - 1))] ?? 128)) / 160
      : 0.5);
  }, true);

  useEffect(() => setBpmDraft(String(bpm)), [bpm]);
  useEffect(() => {
    setTakeId(null);
    setListening(false);
    setPlaybackError("");
  }, [takes]);
  useEffect(() => {
    if (playing || recording) audioRef.current?.pause();
  }, [playing, recording]);

  function saveBpm() {
    const value = Number(bpmDraft);
    const next = bpmDraft.trim() && Number.isFinite(value) ? Math.min(180, Math.max(60, Math.round(value))) : bpm;
    setBpmDraft(String(next));
    changeBpm(next);
  }

  async function toggleTake() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    setPlaybackError("");
    try {
      await audio.play();
    } catch {
      setPlaybackError("Couldn’t play this take.");
    }
  }

  return (
    <header className="station-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
        <div><h1>sounds and the city</h1><small>Amsterdam</small></div>
      </div>
      <div className="top-scope">
        <div className="scope-wave"><canvas ref={scope} aria-hidden="true" /></div>
        <div className="scope-clock" aria-label={`Step ${step + 1} of ${STEP_COUNT}`}>
          <div className="beat-lights" aria-hidden="true">
            {[0, 1, 2, 3].map((beat) => <i key={beat} className={playing && Math.floor(step / 4) === beat ? "lit" : ""} />)}
          </div>
          <span>{formatStep(step)}<small>/{STEP_COUNT}</small></span>
        </div>
      </div>
      <div className="transport-actions" role="group" aria-label="Transport">
        <button type="button" className="switch play-switch" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} aria-pressed={playing}>
          <span className={playing ? "pause-icon" : "play-icon"} aria-hidden="true" />
        </button>
        <label className="tempo-readout">
          <input type="number" aria-label="Tempo in BPM" min="60" max="180" value={bpmDraft}
            onChange={(event) => setBpmDraft(event.currentTarget.value)}
            onBlur={saveBpm} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
          <span>BPM</span>
        </label>
        <label className="master-level"><span>Master</span>
          <input type="range" min="0" max="100" aria-label="Master volume" value={Math.round(volume * 100)}
            style={{ "--fill": `${volume * 100}%` } as CSSProperties}
            onChange={(event) => changeVolume(event.currentTarget.valueAsNumber / 100)} />
        </label>
      </div>
      <div className="record-actions" role="group" aria-label="Recording">
        <button type="button" className="switch record-switch" aria-pressed={recording} disabled={savingTake} onClick={toggleRecord}>
          <i aria-hidden="true" />{recording ? "Stop" : savingTake ? "Saving" : "Record"}
        </button>
        {takes.length > 1 ? (
          <select className="socket take-choice" aria-label="Choose recorded take" value={take?.id}
            onChange={(event) => { setTakeId(Number(event.currentTarget.value)); setListening(false); }}>
            {takes.map((item, index) => <option key={item.id} value={item.id}>Take {takes.length - index}</option>)}
          </select>
        ) : null}
        <button type="button" className="switch" disabled={!take || playing || recording}
          onClick={() => void toggleTake()}>{listening ? "Pause take" : "Listen"}</button>
        {take ? (
          <a className="switch" href={take.url} download={`amsterdam-${take.id}.${take.extension}`}>Save</a>
        ) : <button type="button" className="switch" disabled>Save</button>}
      </div>
      {take ? <audio key={take.id} ref={audioRef} src={take.url} onPlay={() => setListening(true)}
        onPause={() => setListening(false)} onEnded={() => setListening(false)} /> : null}
      {recordError || playbackError ? <p className="transport-status" role="status">{recordError || playbackError}</p> : null}
    </header>
  );
}

type DrumProps = {
  pattern: number[][];
  voices: Voice[];
  step: number;
  muted: ReadonlySet<string>;
  preview: (id: string) => void;
  mute: (id: string) => void;
  jump: (step: number) => void;
  write: (voice: number, step: number, velocity: number) => void;
  demo: () => void;
  reset: () => void;
};

export function DrumGrid({ pattern, voices, step, muted, preview, mute, jump, write, demo, reset }: DrumProps) {
  const paint = useRef<{ id: number; velocity: number } | null>(null);
  useEffect(() => {
    const end = (event: PointerEvent) => {
      if (paint.current?.id === event.pointerId) paint.current = null;
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  return (
    <section className="module drum-module" aria-label="Drum machine">
      <header className="module-heading">
        <h2>Drum machine</h2>
        <div className="module-actions">
          <button type="button" className="switch" onClick={demo}>Demo</button>
          <button type="button" className="switch" onClick={reset}>Clear</button>
        </div>
      </header>
      <div className="drum-matrix" role="group" aria-label="16-step drum grid">
        <span aria-hidden="true" />
        {STEPS.map((index) => (
          <button type="button" className="step-number" aria-label={`Go to step ${index + 1}`} key={index}
            aria-current={index === step ? "step" : undefined} onClick={() => jump(index)}>{index + 1}</button>
        ))}
        {voices.map((voice, row) => (
          <Fragment key={voice.id}>
            <div className="track-strip" data-muted={muted.has(voice.id)}>
              <button type="button" className="track-label" onClick={() => preview(voice.id)} title={`Preview ${voice.name}`}>{voice.name}</button>
              <button type="button" className="mute-switch" aria-label={`Mute ${voice.name}`} aria-pressed={muted.has(voice.id)} onClick={() => mute(voice.id)}>M</button>
            </div>
            {STEPS.map((index) => {
              const active = (pattern[row]?.[index] ?? 0) > 0;
              const velocity = active ? 0 : 0.9;
              return (
                <button type="button" key={index} className="drum-pad" aria-label={`${voice.name}, step ${index + 1}`}
                  aria-pressed={active} data-beat={Math.floor(index / 4) % 2} data-step={index === step}
                  data-muted={muted.has(voice.id)}
                  onPointerDown={(event) => {
                    if (event.pointerType === "touch" || event.button !== 0) return;
                    paint.current = { id: event.pointerId, velocity };
                    write(row, index, velocity);
                  }}
                  onPointerEnter={(event) => {
                    if (paint.current?.id === event.pointerId && (event.buttons & 1)) write(row, index, paint.current.velocity);
                  }}
                  onPointerUp={(event) => { if (event.pointerType === "touch") write(row, index, velocity); }}
                  onClick={(event) => { if (!event.detail) write(row, index, velocity); }}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </section>
  );
}

export function SampleGrid() {
  return (
    <section className="module sample-module" aria-label="Sample pads">
      <header className="module-heading">
        <h2>Sample pads</h2>
        <span className="module-label">No samples loaded</span>
      </header>
      <div className="sample-matrix" role="group" aria-label="Nine sample slots">
        {Array.from({ length: 9 }, (_, index) => (
          <button type="button" key={index} disabled className="sample-pad" aria-label={`Sample ${index + 1}, empty`}>
            <i aria-hidden="true" /><span>{formatStep(index)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

const BLACK_KEYS = new Map([[1, 1], [3, 2], [6, 4], [8, 5], [10, 6]]);
const WHITE_KEYS = new Map([0, 2, 4, 5, 7, 9, 11, 12].map((semitone, column) => [semitone, column + 1]));
type PianoProps = {
  octave: number; changeOctave: (octave: number) => void;
  armed: number; active: ReadonlyMap<number, number>; notes: (number | null)[]; step: number; muted: boolean;
  toggleMute: () => void; play: (midi: number) => void; hold: (midi: number) => () => void;
  writeNote: (step: number, note: number | null) => void;
};

export function Piano({ octave, changeOctave, armed, active, notes, step, muted, toggleMute, play, hold, writeNote }: PianoProps) {
  const pointers = useRef(new Map<number, () => void>());
  useEffect(() => {
    const held = pointers.current;
    function releaseAll() {
      for (const release of held.values()) release();
      held.clear();
    }
    window.addEventListener("blur", releaseAll);
    return () => {
      window.removeEventListener("blur", releaseAll);
      releaseAll();
    };
  }, [octave]);

  function release(id: number) {
    pointers.current.get(id)?.();
    pointers.current.delete(id);
  }

  return (
    <section className="module piano-module" aria-label="Piano and synth sequence">
      <header className="module-heading">
        <h2>Piano</h2>
        <div className="module-actions">
          <div className="octave-control" role="group" aria-label="Piano octave">
            <button type="button" className="switch" aria-label="Octave down" onClick={() => changeOctave(octave - 1)} disabled={octave <= 1}>−</button>
            <output aria-label="Current octave">C{octave}</output>
            <button type="button" className="switch" aria-label="Octave up" onClick={() => changeOctave(octave + 1)} disabled={octave >= 6}>+</button>
          </div>
          <button type="button" className="switch" aria-label="Mute synth sequence" aria-pressed={muted} onClick={toggleMute}>Mute</button>
        </div>
      </header>
      <div className="piano-bed">
        <div className="piano-keys" role="group" aria-label="Chromatic keyboard">
          {PIANO_KEYS.map((key, semitone) => {
            const black = BLACK_KEYS.get(semitone);
            const midi = pianoMidi(octave, semitone);
            return (
              <button type="button" key={midi} className={black ? "piano-key black-key" : "piano-key white-key"}
                style={{ "--key-position": black, gridColumn: WHITE_KEYS.get(semitone) } as CSSProperties}
                aria-label={noteName(midi)} aria-pressed={armed === midi} data-held={active.has(midi)}
                onPointerDown={(event) => {
                  if (event.button !== 0) return;
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  pointers.current.set(event.pointerId, hold(midi));
                }}
                onPointerUp={(event) => release(event.pointerId)}
                onPointerCancel={(event) => release(event.pointerId)}
                onLostPointerCapture={(event) => release(event.pointerId)}
                onClick={(event) => { if (!event.detail) play(midi); }}>
                <kbd aria-hidden="true">{key.toUpperCase()}</kbd>
                {!black ? <span aria-hidden="true">{noteName(midi)}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
      <div className="piano-sequence">
        <div className="lane-heading"><h3>Note sequence</h3><span>{noteName(armed)} selected</span></div>
        <div className="note-matrix" role="group" aria-label="16 synth steps">
          {STEPS.map((index) => {
            const midi = notes[index] ?? null;
            return (
              <button key={index} type="button" className="note-pad" aria-pressed={midi !== null}
                aria-label={`Synth step ${index + 1}${midi !== null ? `, ${noteName(midi)}` : ""}`}
                data-beat={Math.floor(index / 4) % 2} data-step={index === step} onClick={() => writeNote(index, midi)}>
                {midi === null ? index + 1 : noteName(midi)}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
