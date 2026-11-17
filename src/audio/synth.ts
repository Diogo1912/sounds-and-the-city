import { cutoffHz } from "../synthPatch.ts";
import type { SynthPatch } from "../synthPatch.ts";

export type SynthVoice = {
  updateMix: (patch: SynthPatch) => void;
  release: (when: number) => void;
  stop: (when: number) => void;
};

export function startSynthVoice(
  ctx: BaseAudioContext,
  dest: AudioNode,
  noise: AudioBuffer,
  patch: SynthPatch,
  midi: number,
  time: number,
  velocity: number,
  onEnded: () => void,
): SynthVoice {
  time = Math.max(time, ctx.currentTime);
  const base = 440 * 2 ** ((midi - 69) / 12);
  const filter = ctx.createBiquadFilter();
  filter.type = patch.filter;
  const cutoff = (value: number) => Math.min(cutoffHz(value), ctx.sampleRate * 0.45);
  const resonance = (value: number) => filter.type === "lowpass" || filter.type === "highpass"
    ? value * 0.18
    : 0.7 * 16 ** (value / 100);
  filter.frequency.value = cutoff(patch.cutoff);
  filter.Q.value = resonance(patch.resonance);
  const amp = ctx.createGain();
  amp.gain.value = 0;
  const output = ctx.createGain();
  const velocityGain = 0.26 * Math.min(1, Math.max(0, velocity));
  output.gain.value = velocityGain * patch.level / 100;
  const nodes: AudioNode[] = [filter, amp, output];
  if (patch.drive > 0) {
    const shaper = ctx.createWaveShaper();
    const amount = 1 + 9 * patch.drive / 100;
    const norm = Math.tanh(amount);
    shaper.curve = Float32Array.from({ length: 257 }, (_, index) => Math.tanh((index / 128 - 1) * amount) / norm);
    shaper.oversample = "2x";
    filter.connect(shaper);
    shaper.connect(amp);
    nodes.push(shaper);
  } else {
    filter.connect(amp);
  }
  const tremolo = ctx.createGain();
  amp.connect(tremolo);
  tremolo.connect(output);
  const fade = ctx.createGain();
  const pan = ctx.createStereoPanner();
  pan.pan.value = patch.pan / 100;
  output.connect(pan);
  pan.connect(fade);
  fade.connect(dest);
  nodes.push(tremolo, pan, fade);

  const releaseAmp = scheduleEnvelope(amp.gain, time, 0, 1, patch.attack, patch.decay, patch.sustain, patch.release);
  const tracking = (midi - 60) * patch.keyTrack;
  const releaseFilter = scheduleEnvelope(
    filter.detune, time, tracking, patch.filterEnv * 100,
    patch.filterAttack, patch.filterDecay, patch.filterSustain, patch.filterRelease,
  );

  const sources: AudioScheduledSourceNode[] = [];
  const pitched: OscillatorNode[] = [];

  function oscillator(wave: OscillatorType, hz: number) {
    const node = ctx.createOscillator();
    node.type = wave;
    node.frequency.value = hz;
    sources.push(node);
    return node;
  }

  function scale(source: AudioNode, amount: number) {
    const gain = ctx.createGain();
    gain.gain.value = amount;
    source.connect(gain);
    nodes.push(gain);
    return gain;
  }

  const carrierHz = base * 2 ** (patch.tuneA / 12);
  const carrier = oscillator(patch.waveA, carrierHz);
  pitched.push(carrier);
  if (patch.mode === "fm") {
    carrier.connect(filter);
    if (patch.fmDepth > 0) {
      const mod = oscillator(patch.waveB, carrierHz * patch.fmRatio * 2 ** (patch.detuneB / 1200));
      pitched.push(mod);
      scale(mod, 8 * patch.fmDepth / 100 * carrierHz).connect(carrier.frequency);
    }
  } else {
    scale(carrier, 1 - patch.mix / 100).connect(filter);
    if (patch.mix > 0) {
      const second = oscillator(patch.waveB, base * 2 ** (patch.tuneB / 12 + patch.detuneB / 1200));
      pitched.push(second);
      scale(second, patch.mix / 100).connect(filter);
    }
  }

  if (patch.sub > 0) {
    const sub = oscillator("sine", carrierHz / 2);
    pitched.push(sub);
    scale(sub, 0.65 * patch.sub / 100).connect(filter);
  }
  if (patch.noise > 0) {
    const hiss = ctx.createBufferSource();
    hiss.buffer = noise;
    hiss.loop = true;
    sources.push(hiss);
    scale(hiss, 0.5 * patch.noise / 100).connect(filter);
  }

  if (patch.lfoDepth > 0) {
    const lfo = oscillator(patch.lfoWave, patch.lfoRate);
    if (patch.lfoTarget === "pitch") {
      for (const node of pitched) scale(lfo, 2 * patch.lfoDepth).connect(node.detune);
    } else if (patch.lfoTarget === "filter") {
      scale(lfo, 24 * patch.lfoDepth).connect(filter.detune);
    } else {
      const depth = patch.lfoDepth / 200;
      tremolo.gain.value = 1 - depth;
      scale(lfo, depth).connect(tremolo.gain);
    }
  }

  carrier.onended = () => {
    for (const node of [...sources, ...nodes]) node.disconnect();
    onEnded();
  };
  for (const source of sources) source.start(time);

  let stopping = false;
  let released = false;
  return {
    updateMix(next) {
      const now = ctx.currentTime;
      filter.frequency.setTargetAtTime(cutoff(next.cutoff), now, 0.015);
      filter.Q.setTargetAtTime(resonance(next.resonance), now, 0.015);
      output.gain.setTargetAtTime(velocityGain * next.level / 100, now, 0.015);
      pan.pan.setTargetAtTime(next.pan / 100, now, 0.015);
    },
    release(when) {
      if (released || stopping) return;
      released = true;
      const at = Math.max(time + 0.001, when, ctx.currentTime);
      const end = releaseAmp(at);
      releaseFilter(at);
      for (const source of sources) source.stop(end);
    },
    stop(when) {
      if (stopping) return;
      stopping = true;
      const end = when < time ? when : when + 0.01;
      // Silence future notes and fade notes that have started.
      fade.gain.setValueAtTime(when < time ? 0 : 1, when);
      if (end > when) fade.gain.linearRampToValueAtTime(0, end);
      for (const source of sources) source.stop(end);
    },
  };
}

function scheduleEnvelope(
  param: AudioParam,
  start: number,
  baseline: number,
  depth: number,
  attackMs: number,
  decayMs: number,
  sustainPercent: number,
  releaseMs: number,
) {
  const attack = attackMs / 1000;
  const decay = decayMs / 1000;
  const sustain = sustainPercent / 100;
  const peakTime = start + attack;
  const sustainTime = peakTime + decay;
  param.setValueAtTime(baseline, start);
  param.linearRampToValueAtTime(baseline + depth, peakTime);
  param.linearRampToValueAtTime(baseline + depth * sustain, sustainTime);

  return (at: number) => {
    const position = at < peakTime ? (at - start) / attack
      : at < sustainTime ? 1 + (sustain - 1) * (at - peakTime) / decay
      : sustain;
    const value = baseline + depth * position;
    param.cancelScheduledValues(at);
    if (at <= sustainTime) param.linearRampToValueAtTime(value, at);
    else param.setValueAtTime(value, at);
    const end = at + releaseMs / 1000;
    param.linearRampToValueAtTime(baseline, end);
    return end;
  };
}
