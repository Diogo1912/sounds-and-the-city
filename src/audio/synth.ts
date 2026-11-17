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
  const attackEnd = time + patch.attack / 1000;
  const decayEnd = attackEnd + patch.decay / 1000;
  const sustain = patch.sustain / 100;
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
  filter.connect(amp);
  const tremolo = ctx.createGain();
  amp.connect(tremolo);
  tremolo.connect(output);
  const fade = ctx.createGain();
  output.connect(fade);
  fade.connect(dest);

  function envelope(param: AudioParam, peak: number) {
    param.setValueAtTime(0, time);
    param.linearRampToValueAtTime(peak, attackEnd);
    param.linearRampToValueAtTime(peak * sustain, decayEnd);
  }
  envelope(amp.gain, 1);
  envelope(filter.detune, patch.filterEnv * 100);

  const sources: AudioScheduledSourceNode[] = [];
  const nodes: AudioNode[] = [filter, amp, tremolo, output, fade];
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
    },
    release(when) {
      if (released || stopping) return;
      released = true;
      const at = Math.max(time + 0.001, when, ctx.currentTime);
      const end = at + patch.release / 1000;
      const value = at < attackEnd
        ? (at - time) / (attackEnd - time)
        : at < decayEnd
          ? 1 + (sustain - 1) * (at - attackEnd) / (decayEnd - attackEnd)
          : sustain;
      for (const [param, peak] of [[amp.gain, 1], [filter.detune, patch.filterEnv * 100]] as const) {
        param.cancelScheduledValues(at);
        if (at <= decayEnd) param.linearRampToValueAtTime(value * peak, at);
        else param.setValueAtTime(value * peak, at);
        param.linearRampToValueAtTime(0, end);
      }
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
