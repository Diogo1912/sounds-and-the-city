import { useEffect, useRef } from "react";
import { Knob } from "@/components/Knob";
import { CITIES, SYNTH } from "@/kits";
import { noteName, pianoMidi, PIANO_KEYS } from "@/lib/notes";
import { CITY_PATCHES, FILTER_TYPES, INIT_PATCH, LFO_TARGETS, OSC_MODES, PATCH_RANGES, WAVEFORMS, cutoffHz } from "@/synthPatch";
import type { PatchControl, SynthPatch } from "@/synthPatch";
import { STEP_COUNT } from "@/lib/time";
import type { CSSProperties } from "react";
import type { CityId } from "@/types";

type Props = {
  city: CityId;
  name: string;
  octave: number;
  onOctave: (octave: number) => void;
  notes: (number | null)[];
  step: number;
  muted: boolean;
  onMute: () => void;
  onWriteNote: (step: number, note: number | null) => void;
  armed: number;
  patch: SynthPatch;
  onPatch: (patch: SynthPatch) => void;
  onArm: (midi: number) => void;
  onHold: (midi: number) => () => void;
};

const KIND = {
  "new-york": "bullet",
  amsterdam: "bell",
  tokyo: "ticket",
  london: "roundel",
} as const;

const LABELS: Record<string, string> = {
  mix: "Mix", fm: "FM", sine: "Sine", triangle: "Triangle", sawtooth: "Saw", square: "Square",
  lowpass: "Low-pass", highpass: "High-pass", bandpass: "Band-pass", notch: "Notch",
  pitch: "Pitch", filter: "Filter", amp: "Amplitude",
};

const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11, 12];
const BLACK_KEYS = [[1, 1], [3, 2], [6, 4], [8, 5], [10, 6]];

export function SynthPanel({
  city, name, octave, onOctave, notes, step, muted, onMute, onWriteNote, armed, patch, onPatch, onArm, onHold,
}: Props) {
  const kind = KIND[city];
  const defaults = CITY_PATCHES[city];
  const pointers = useRef(new Map<number, () => void>());

  useEffect(() => {
    const held = pointers.current;
    function releasePointers() {
      for (const release of held.values()) release();
      held.clear();
    }
    window.addEventListener("blur", releasePointers);
    return () => {
      window.removeEventListener("blur", releasePointers);
      releasePointers();
    };
  }, [city]);

  function releasePointer(pointerId: number) {
    pointers.current.get(pointerId)?.();
    pointers.current.delete(pointerId);
  }

  function set<K extends keyof SynthPatch>(key: K, value: SynthPatch[K]) {
    onPatch({ ...patch, [key]: value });
  }

  function dial(key: PatchControl, label: string, format: (value: number) => string, size = 40) {
    const [min, max, step] = PATCH_RANGES[key];
    return (
      <Knob
        label={label}
        kind={kind}
        size={size}
        min={min}
        max={max}
        step={step}
        value={patch[key]}
        resetValue={defaults[key]}
        onChange={(value) => set(key, value)}
        format={format}
      />
    );
  }

  function pianoKey(semitone: number, position?: number) {
    const midi = pianoMidi(octave, semitone);
    const black = position !== undefined;
    return (
      <button
        key={midi}
        type="button"
        className={`piano-key ${black ? "piano-black" : "piano-white"}`}
        style={black ? { "--key-position": position } as CSSProperties : undefined}
        aria-label={noteName(midi)}
        aria-pressed={midi === armed}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          pointers.current.set(event.pointerId, onHold(midi));
        }}
        onLostPointerCapture={(event) => releasePointer(event.pointerId)}
        onPointerUp={(event) => releasePointer(event.pointerId)}
        onPointerCancel={(event) => releasePointer(event.pointerId)}
        onClick={(event) => {
          if (event.detail === 0) onArm(midi);
        }}
      >
        <span>{black ? "" : noteName(midi)}</span>
        <kbd aria-hidden="true">{PIANO_KEYS[semitone]?.toUpperCase()}</kbd>
      </button>
    );
  }

  return (
    <section className="station-panel synth" aria-label={`${name} synth`}>
      <header className="panel-header">
        <h2>Synthesizer</h2>
        <span>{name}</span>
      </header>
      <div className="piano-panel">
        <div className="piano-actions">
          <div role="group" aria-label="Piano octave">
            <button type="button" className="synth-edit" aria-label="Octave down" disabled={octave <= 1} onClick={() => onOctave(octave - 1)}>−</button>
            <span>Octave {octave}</span>
            <button type="button" className="synth-edit" aria-label="Octave up" disabled={octave >= 6} onClick={() => onOctave(octave + 1)}>+</button>
          </div>
          <button type="button" className="synth-edit" aria-pressed={muted} onClick={onMute}>Mute lane</button>
        </div>
        <div className="piano" role="group" aria-label="Chromatic piano">
          {WHITE_KEYS.map((note) => pianoKey(note))}
          {BLACK_KEYS.map(([note, position]) => pianoKey(note!, position))}
        </div>
        <div className="note-lane" role="group" aria-label="Synth sequence">
          {Array.from({ length: STEP_COUNT }, (_, index) => {
            const midi = notes[index] ?? null;
            return (
              <button
                key={index}
                type="button"
                className={`note-step${index === step ? " is-playhead" : ""}`}
                aria-label={`Synth step ${index + 1}${midi !== null ? `, ${noteName(midi)}` : ""}`}
                aria-pressed={midi !== null}
                onClick={() => onWriteNote(index, midi)}
              >
                {midi === null ? index + 1 : noteName(midi)}
              </button>
            );
          })}
        </div>
      </div>
      <div className="synth-patch">
        <div className="patch-actions">
          <label>
            Preset
            <select
              value=""
              onChange={(event) => {
                const id = event.currentTarget.value;
                if (id === "init") onPatch({ ...INIT_PATCH });
                else {
                  const preset = CITIES.find((item) => item.id === id);
                  if (preset) onPatch({ ...CITY_PATCHES[preset.id] });
                }
              }}
            >
              <option value="" disabled>Load preset…</option>
              {CITIES.map((item) => (
                <option key={item.id} value={item.id}>{item.label} · {SYNTH[item.id].name}</option>
              ))}
              <option value="init">Init · Sine</option>
            </select>
          </label>
          <button type="button" className="synth-edit" onClick={() => onPatch({ ...defaults })}>
            Reset patch
          </button>
        </div>
        <div className="patch-groups">
          <fieldset>
            <legend>Oscillators</legend>
            <div className="patch-controls">
              <Choice label="Routing" value={patch.mode} options={OSC_MODES} onChange={(value) => set("mode", value)} />
              <Choice label="Wave A" value={patch.waveA} options={WAVEFORMS} onChange={(value) => set("waveA", value)} />
              <Choice label="Wave B" value={patch.waveB} options={WAVEFORMS} onChange={(value) => set("waveB", value)} />
              {dial("tuneA", "Tune A", semis)}
              {dial("detuneB", "Fine B", (value) => `${value} ct`)}
              {patch.mode === "mix" ? (
                <>{dial("tuneB", "Tune B", semis)}{dial("mix", "Osc mix", (value) => `${100 - value}:${value}`)}</>
              ) : (
                <>{dial("fmRatio", "FM ratio", (value) => `${value}×`)}{dial("fmDepth", "FM depth", percent)}</>
              )}
              {dial("sub", "Sub", percent)}
              {dial("noise", "Noise", percent)}
            </div>
          </fieldset>
          <fieldset>
            <legend>Filter</legend>
            <div className="patch-controls">
              <Choice label="Type" value={patch.filter} options={FILTER_TYPES} onChange={(value) => set("filter", value)} />
              {dial("cutoff", "Cutoff", (value) => `${Math.round(cutoffHz(value))} Hz`)}
              {dial("resonance", "Resonance", percent)}
              {dial("keyTrack", "Key tracking", percent)}
              {dial("filterEnv", "Env amount", semis)}
            </div>
          </fieldset>
          <fieldset>
            <legend>Filter envelope</legend>
            <div className="patch-controls">
              {dial("filterAttack", "Filter attack", ms)}
              {dial("filterDecay", "Filter decay", ms)}
              {dial("filterSustain", "Filter sustain", percent)}
              {dial("filterRelease", "Filter release", ms)}
            </div>
          </fieldset>
          <fieldset>
            <legend>Amp envelope</legend>
            <div className="patch-controls">
              {dial("attack", "Attack", ms)}
              {dial("decay", "Decay", ms)}
              {dial("sustain", "Sustain", percent)}
              {dial("release", "Release", ms)}
            </div>
          </fieldset>
          <fieldset>
            <legend>LFO</legend>
            <div className="patch-controls">
              <Choice label="Wave" value={patch.lfoWave} options={WAVEFORMS} onChange={(value) => set("lfoWave", value)} />
              <Choice label="Target" value={patch.lfoTarget} options={LFO_TARGETS} onChange={(value) => set("lfoTarget", value)} />
              {dial("lfoRate", "Rate", (value) => `${value} Hz`)}
              {dial("lfoDepth", "Depth", percent)}
            </div>
          </fieldset>
          <fieldset>
            <legend>Output</legend>
            <div className="patch-controls">
              {dial("gate", "Step gate", percent)}
              {dial("level", "Synth level", percent)}
              {dial("drive", "Drive", percent)}
              {dial("pan", "Pan", (value) => value === 0 ? "Center" : `${Math.abs(value)} ${value < 0 ? "L" : "R"}`)}
            </div>
          </fieldset>
        </div>
      </div>
    </section>
  );
}

function Choice<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => {
        const selected = options.find((option) => option === event.currentTarget.value);
        if (selected !== undefined) onChange(selected);
      }}>
        {options.map((option) => <option key={option} value={option}>{LABELS[option]}</option>)}
      </select>
    </label>
  );
}

function percent(value: number) {
  return `${value}%`;
}

function ms(value: number) {
  return `${value} ms`;
}

function semis(value: number) {
  return `${value} st`;
}
