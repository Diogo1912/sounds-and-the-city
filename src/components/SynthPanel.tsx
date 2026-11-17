import { useEffect, useRef, useState } from "react";
import { Knob } from "@/components/Knob";
import { CITIES, SYNTH } from "@/kits";
import { noteName } from "@/lib/notes";
import { CITY_PATCHES, FILTER_TYPES, INIT_PATCH, LFO_TARGETS, OSC_MODES, PATCH_RANGES, WAVEFORMS, cutoffHz } from "@/synthPatch";
import type { PatchControl, SynthPatch } from "@/synthPatch";
import type { CityId } from "@/types";

type Props = {
  city: CityId;
  name: string;
  scale: number[];
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

export function SynthPanel({ city, name, scale, armed, patch, onPatch, onArm, onHold }: Props) {
  const kind = KIND[city];
  const defaults = CITY_PATCHES[city];
  const [expanded, setExpanded] = useState(false);
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

  return (
    <section className="synth" aria-label={`${name} synth`}>
      <div className="synth-strip">
        <p className="synth-name">{name}</p>
        {dial("cutoff", "Cutoff", (value) => `${Math.round(cutoffHz(value))} Hz`, 46)}
        {dial("decay", "Decay", ms, 46)}
        <button
          type="button"
          className="synth-edit"
          aria-expanded={expanded}
          aria-controls="synth-patch"
          onClick={() => setExpanded(!expanded)}
        >
          Edit synth
        </button>
        <div className="keys" role="group" aria-label={`${name} keyboard`}>
          {scale.map((midi) => (
            <button
              key={midi}
              type="button"
              className={midi === armed ? "key is-on" : "key"}
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
              {noteName(midi)}
            </button>
          ))}
        </div>
      </div>
      <div id="synth-patch" className="synth-patch" hidden={!expanded}>
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
              {dial("resonance", "Resonance", percent)}
              {dial("filterEnv", "Env amount", semis)}
            </div>
          </fieldset>
          <fieldset>
            <legend>Envelope</legend>
            <div className="patch-controls">
              {dial("attack", "Attack", ms)}
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
