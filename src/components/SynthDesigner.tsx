import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  AMSTERDAM_PATCH, FILTER_TYPES, INIT_PATCH, LFO_TARGETS, OSC_MODES, PATCH_RANGES, WAVEFORMS, cutoffHz,
} from "@/synthPatch";
import type { PatchControl, SynthPatch } from "@/synthPatch";
import { envelopePoints, ENV_POINTS, moveEnvelope, waveform } from "./patchGeometry";
import type { Envelope, EnvelopePoint } from "./patchGeometry";
import { limit, plotGrid, plotPosition, trace, usePlot } from "./plots";

const WAVE_LABELS = { sine: "Sine", triangle: "Triangle", sawtooth: "Saw", square: "Square" };
const FILTER_LABELS = { lowpass: "Low-pass", highpass: "High-pass", bandpass: "Band-pass", notch: "Notch" };
const ROUTING_LABELS = { mix: "Mix", fm: "FM" };
const LFO_LABELS = { pitch: "Pitch", filter: "Filter", amp: "Amp" };
const BANKS = ["Voice", "Modulation", "Output"] as const;
type Bank = (typeof BANKS)[number];

const AMP_KEYS = ["attack", "decay", "sustain", "release"] as const;
const FILTER_KEYS = ["filterAttack", "filterDecay", "filterSustain", "filterRelease"] as const;

type Props = { patch: SynthPatch; onPatch: (patch: SynthPatch) => void };

export function SynthDesigner({ patch, onPatch }: Props) {
  const [bank, setBank] = useState<Bank>("Voice");
  const [filterEnvelope, setFilterEnvelope] = useState(false);
  const activeHandle = useRef<{ point: EnvelopePoint; pointer: number } | null>(null);
  const keys = filterEnvelope ? FILTER_KEYS : AMP_KEYS;
  const envelope: Envelope = { attack: patch[keys[0]], decay: patch[keys[1]], sustain: patch[keys[2]], release: patch[keys[3]] };
  const points = envelopePoints(envelope);

  function update<K extends keyof SynthPatch>(key: K, value: SynthPatch[K]) {
    onPatch({ ...patch, [key]: value });
  }

  function changeEnvelope(next: Envelope) {
    onPatch({ ...patch, [keys[0]]: next.attack, [keys[1]]: next.decay, [keys[2]]: next.sustain, [keys[3]]: next.release });
  }

  const oscillator = usePlot((ctx, width, height, accent) => {
    plotGrid(ctx, width, height);
    const freqA = 2 ** (patch.tuneA / 12);
    const freqB = patch.mode === "fm" ? freqA * patch.fmRatio * 2 ** (patch.detuneB / 1200)
      : 2 ** (patch.tuneB / 12 + patch.detuneB / 1200);
    const mix = patch.mix / 100;
    const depth = patch.fmDepth / 100;
    trace(ctx, width, height, "#8096be", (x) => 0.5 - 0.22 * waveform(patch.waveB, x * freqB * 2));
    trace(ctx, width, height, accent, (x) => {
      const b = waveform(patch.waveB, x * freqB * 2);
      const a = waveform(patch.waveA, x * freqA * 2 + (patch.mode === "fm" ? depth * b : 0));
      return 0.5 - 0.36 * (patch.mode === "fm" ? a : a * (1 - mix) + b * mix);
    });
  });

  const filter = usePlot((ctx, width, height, accent) => {
    plotGrid(ctx, width, height);
    const response = frequencyResponse(patch, Math.max(100, Math.ceil(width)));
    trace(ctx, width, height, accent, (x) => {
      const db = response[Math.min(response.length - 1, Math.round(x * (response.length - 1)))] ?? -16;
      return limit((14 - db) / 58, 0.05, 0.96);
    });
  });

  const envelopePlot = usePlot((ctx, width, height, accent) => {
    plotGrid(ctx, width, height);
    const outline = Object.values(points);
    ctx.beginPath();
    outline.forEach(([x, y], index) => {
      if (!index) ctx.moveTo(x * width, y * height);
      else ctx.lineTo(x * width, y * height);
    });
    ctx.closePath();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.12;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    outline.forEach(([x, y], index) => {
      if (!index) ctx.moveTo(x * width, y * height);
      else ctx.lineTo(x * width, y * height);
    });
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  });

  function slider(key: PatchControl, label: string, format = percent) {
    const [min, max, step] = PATCH_RANGES[key];
    return <Control key={key} label={label} value={patch[key]} min={min} max={max} step={step} format={format}
      onChange={(value) => update(key, value)} />;
  }

  return (
    <section className="module synth-module" aria-label="Synth editor">
      <header className="module-heading">
        <h2>Synthesizer</h2>
        <div className="module-actions">
          <select
            className="socket preset-choice" value="" aria-label="Load synth preset"
            onChange={(event) => {
              onPatch(event.currentTarget.value === "amsterdam" ? { ...AMSTERDAM_PATCH } : { ...INIT_PATCH });
            }}
          >
            <option value="" disabled>Presets</option>
            <option value="amsterdam">Amsterdam pluck</option>
            <option value="init">Init · Sine</option>
          </select>
          <button className="switch reset-patch" type="button" onClick={() => onPatch({ ...AMSTERDAM_PATCH })}>Reset patch</button>
        </div>
      </header>

      <div className="synth-displays">
        <section className="graphic oscillator-display" aria-label="Oscillators">
          <div className="graphic-title">
            <h3>Oscillators</h3>
            <Option label="Oscillator routing" value={patch.mode} values={OSC_MODES} names={ROUTING_LABELS} change={(value) => update("mode", value)} />
          </div>
          <div className="screen wave-display">
            <canvas ref={oscillator} aria-hidden="true" />
          </div>
          <div className="wave-choices">
            <label><span>A</span><Option label="Waveform A" value={patch.waveA} values={WAVEFORMS} names={WAVE_LABELS} change={(value) => update("waveA", value)} /></label>
            <label><span>B</span><Option label="Waveform B" value={patch.waveB} values={WAVEFORMS} names={WAVE_LABELS} change={(value) => update("waveB", value)} /></label>
          </div>
        </section>

        <section className="graphic" aria-label="Filter">
          <div className="graphic-title">
            <h3>Filter</h3>
            <Option label="Filter type" value={patch.filter} values={FILTER_TYPES} names={FILTER_LABELS} change={(value) => update("filter", value)} />
          </div>
          <div
            className="screen filter-display"
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              const [x, y] = plotPosition(event);
              onPatch({ ...patch, cutoff: Math.round(x * 100), resonance: Math.round((1 - y) * 100) });
            }}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
              const [x, y] = plotPosition(event);
              onPatch({ ...patch, cutoff: Math.round(x * 100), resonance: Math.round((1 - y) * 100) });
            }}
          >
            <canvas ref={filter} aria-hidden="true" />
            <span className="plot-marker" aria-hidden="true" style={{ left: `${limit(patch.cutoff, 3, 97)}%`, top: `${limit(100 - patch.resonance, 6, 94)}%` }} />
          </div>
          <div className="filter-controls">
            {slider("cutoff", "Cutoff", hz)}
            {slider("resonance", "Resonance")}
          </div>
        </section>

        <section className="graphic env-graphic" aria-label="Envelope designer">
          <div className="graphic-title">
            <h3>Envelope</h3>
            <select className="socket" aria-label="Envelope target" value={filterEnvelope ? "filter" : "amp"} onChange={(event) => setFilterEnvelope(event.currentTarget.value === "filter")}>
              <option value="amp">Amp</option>
              <option value="filter">Filter</option>
            </select>
          </div>
          <div
            className="screen envelope-display"
            onPointerMove={(event) => {
              const held = activeHandle.current;
              if (held?.pointer !== event.pointerId) return;
              const [x, y] = plotPosition(event);
              changeEnvelope(moveEnvelope(envelope, held.point, x, y));
            }}
            onLostPointerCapture={() => { activeHandle.current = null; }}
          >
            <canvas ref={envelopePlot} aria-hidden="true" />
            {ENV_POINTS.map((point) => (
              <button
                key={point} type="button" className="plot-marker env-point"
                style={{ left: `${points[point][0] * 100}%`, top: `${points[point][1] * 100}%` }}
                aria-label={`${point === "decay" ? "Decay and sustain" : point} envelope handle`}
                onPointerDown={(event) => {
                  if (event.button !== 0) return;
                  event.preventDefault();
                  activeHandle.current = { point, pointer: event.pointerId };
                  event.currentTarget.parentElement?.setPointerCapture(event.pointerId);
                }}
                onKeyDown={(event) => {
                  const [x, y] = points[point];
                  const dx = event.key === "ArrowLeft" ? -0.012 : event.key === "ArrowRight" ? 0.012 : 0;
                  const dy = event.key === "ArrowUp" ? -0.035 : event.key === "ArrowDown" ? 0.035 : 0;
                  if (!dx && !dy) return;
                  event.preventDefault();
                  changeEnvelope(moveEnvelope(envelope, point, x + dx, y + dy));
                }}
              />
            ))}
          </div>
          <div className="env-values" role="group" aria-label="Envelope values">
            {keys.map((key, index) => {
              const [min, max, step] = PATCH_RANGES[key];
              const name = ["Attack", "Decay", "Sustain", "Release"][index]!;
              return (
                <label key={key}>
                  <span aria-hidden="true">{name[0]}</span>
                  <input
                    type="number" aria-label={`${filterEnvelope ? "Filter " : "Amp "}${name.toLowerCase()}${index === 2 ? ", percent" : ", milliseconds"}`}
                    min={min} max={max} step={step} value={patch[key]}
                    onChange={(event) => {
                      const value = event.currentTarget.valueAsNumber;
                      if (Number.isFinite(value)) update(key, limit(value, min, max));
                    }}
                  />
                </label>
              );
            })}
          </div>
        </section>
      </div>

      <div className="parameter-bank">
        <div className="bank-switch" role="group" aria-label="Synth parameter group">
          {BANKS.map((name) => (
            <button key={name} type="button" className="switch" aria-pressed={name === bank} onClick={() => setBank(name)}>{name}</button>
          ))}
        </div>
        <div className="bank-controls" aria-label={`${bank} controls`}>
          {bank === "Voice" ? <>
            {slider("tuneA", "Tune A", semitones)}
            {patch.mode === "mix" ? slider("tuneB", "Tune B", semitones) : slider("fmRatio", "FM ratio", (value) => `${value}×`)}
            {slider("detuneB", "Fine B", (value) => `${value}¢`)}
            {patch.mode === "mix" ? slider("mix", "A / B", (value) => `${100 - value}:${value}`) : slider("fmDepth", "FM depth")}
            {slider("sub", "Sub")}
            {slider("noise", "Noise")}
          </> : bank === "Modulation" ? <>
            <label className="parameter option-parameter"><span>LFO wave</span><Option label="LFO waveform" value={patch.lfoWave} values={WAVEFORMS} names={WAVE_LABELS} change={(value) => update("lfoWave", value)} /></label>
            <label className="parameter option-parameter"><span>LFO target</span><Option label="LFO target" value={patch.lfoTarget} values={LFO_TARGETS} names={LFO_LABELS} change={(value) => update("lfoTarget", value)} /></label>
            {slider("lfoRate", "LFO rate", (value) => `${value} Hz`)}
            {slider("lfoDepth", "LFO depth")}
            {slider("filterEnv", "Filter env", semitones)}
            {slider("keyTrack", "Key track")}
          </> : <>
            {slider("drive", "Drive")}
            {slider("pan", "Pan", (value) => value === 0 ? "C" : `${Math.abs(value)}${value < 0 ? "L" : "R"}`)}
            {slider("gate", "Gate")}
            {slider("level", "Level")}
          </>}
        </div>
      </div>
    </section>
  );
}

type ControlProps = {
  label: string; value: number; min: number; max: number; step: number;
  format: (value: number) => string; onChange: (value: number) => void;
};

function Control({ label, value, min, max, step, format, onChange }: ControlProps) {
  return (
    <label className="parameter">
      <span className="parameter-label"><span>{label}</span><output>{format(value)}</output></span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        aria-label={label} aria-valuetext={format(value)}
        style={{ "--fill": `${100 * (value - min) / (max - min)}%` } as CSSProperties}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
      />
    </label>
  );
}

function Option<T extends string>({ label, value, values, names, change }: {
  label: string; value: T; values: readonly T[]; names: Record<T, string>; change: (value: T) => void;
}) {
  return (
    <select className="socket" aria-label={label} value={value} onChange={(event) => {
      const next = values.find((option) => option === event.currentTarget.value);
      if (next !== undefined) change(next);
    }}>
      {values.map((option) => <option key={option} value={option}>{names[option]}</option>)}
    </select>
  );
}

function percent(value: number) { return `${value}%`; }
function semitones(value: number) { return `${value} st`; }
function hz(value: number) {
  const freq = cutoffHz(value);
  return freq >= 1000 ? `${(freq / 1000).toFixed(1)}k` : `${Math.round(freq)}Hz`;
}

let responseFilter: BiquadFilterNode | undefined;
function frequencyResponse(patch: SynthPatch, size: number): Float32Array {
  const result = new Float32Array(size);
  if (typeof OfflineAudioContext === "undefined") return result;
  responseFilter ??= new OfflineAudioContext(1, 1, 48000).createBiquadFilter();
  responseFilter.type = patch.filter;
  responseFilter.frequency.value = cutoffHz(patch.cutoff);
  responseFilter.Q.value = patch.filter === "lowpass" || patch.filter === "highpass"
    ? patch.resonance * 0.18 : 0.7 * 16 ** (patch.resonance / 100);
  const frequency = Float32Array.from({ length: size }, (_, index) => cutoffHz(100 * index / (size - 1)));
  responseFilter.getFrequencyResponse(frequency, result, new Float32Array(size));
  return result.map((magnitude) => 20 * Math.log10(Math.max(0.0001, magnitude)));
}
