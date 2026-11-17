import { loadDrumSamples, trackMix } from "./samples.ts";
import type { DrumSample } from "./samples.ts";
import { missedSteps } from "./timing.ts";
import { startSynthVoice } from "./synth.ts";
import type { SynthVoice } from "./synth.ts";
import { makeNoise, triggerVoice } from "./voices.ts";
import { AMSTERDAM_PATCH } from "../synthPatch.ts";
import type { SynthPatch } from "../synthPatch.ts";
import { STEP_COUNT, secondsPerStep } from "../lib/time.ts";
import type { StepHit } from "../types.ts";

const START_LEAD = 0.012;
const LOOKAHEAD = 0.06;
const POLL_MS = 12;

type Transport = {
  bpm: number;
  volume: number;
};

export class Engine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private noise: AudioBuffer | null = null;
  private recorder: MediaRecorder | null = null;
  private recordChunks: Blob[] = [];
  private recordStepsLeft: number | null = null;
  private recordDest: MediaStreamAudioDestinationNode | null = null;
  private patch = AMSTERDAM_PATCH;
  private synthVoices = new Map<SynthVoice, boolean>();
  private samples = new Map<string, DrumSample>();
  private active = new Map<string, { source: AudioBufferSourceNode; choke: GainNode; start: number; end: number }>();
  private drumBus: GainNode | null = null;
  private recordEndTime: number | null = null;
  private timer = 0;
  private nextTime = 0;
  private step = 0;
  private playing = false;
  private runId = 0;
  private bpm = 108;
  private volume = 0.82;
  private pattern: StepHit[][] = [];
  private queue: { index: number; when: number }[] = [];
  private onStep: (step: number) => void;
  private onRecordingEnd: () => void;

  constructor(onStep: (step: number) => void, onRecordingEnd: () => void) {
    this.onStep = onStep;
    this.onRecordingEnd = onRecordingEnd;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  preload(): void {
    const ctx = this.ensure();
    void loadDrumSamples(ctx, (track, sample) => this.samples.set(track, sample));
  }

  setSynth(patch: SynthPatch): void {
    const previous = this.patch;
    this.patch = patch;
    if (previous.cutoff !== patch.cutoff || previous.resonance !== patch.resonance || previous.level !== patch.level || previous.pan !== patch.pan) {
      for (const voice of this.synthVoices.keys()) voice.updateMix(patch);
    }
  }

  setTransport(next: Transport): void {
    this.bpm = next.bpm;
    this.volume = next.volume;
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
  }

  setPattern(pattern: StepHit[][]): void {
    this.pattern = pattern;
    if (pattern.length > 0 && this.step >= pattern.length) this.step = 0;
  }

  play(): void {
    if (this.playing) return;
    const ctx = this.ensure();
    this.playing = true;
    const runId = ++this.runId;
    const start = () => {
      if (!this.playing || runId !== this.runId) return;
      this.nextTime = ctx.currentTime + START_LEAD;
      this.timer = window.setInterval(() => this.tick(runId), POLL_MS);
      this.tick(runId);
    };
    if (ctx.state !== "running") void ctx.resume().then(start, () => this.pause());
    else start();
  }

  pause(): void {
    this.playing = false;
    this.runId += 1;
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = 0;
    }
    const now = this.ctx?.currentTime ?? 0;
    this.step = this.queue.find((item) => item.when > now)?.index ?? this.step;
    this.queue = [];
    this.stopDrums();
    this.stopSynthVoices(true);
  }

  jump(index: number): void {
    this.step = index;
    this.queue = [];
    this.stopDrums();
    this.stopSynthVoices(true);
    if (this.playing && this.ctx) this.nextTime = this.ctx.currentTime + START_LEAD;
  }

  private stopDrums(): void {
    const bus = this.drumBus;
    if (!bus || !this.ctx) return;
    this.drumBus = null;
    bus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.003);
    window.setTimeout(() => bus.disconnect(), 30);
  }

  preview(voice: string, velocity = 0.9): void {
    const ctx = this.ensure();
    if (ctx.state === "suspended") void ctx.resume();
    if (!this.master || !this.noise) return;
    this.playHit(ctx, this.master, ctx.currentTime + 0.004, { voice, velocity, muted: false });
  }

  previewStep(): void {
    const ctx = this.ensure();
    if (ctx.state === "suspended") void ctx.resume();
    if (!this.master || !this.noise) return;
    const time = ctx.currentTime + 0.004;
    for (const hit of this.pattern[this.step] ?? []) {
      this.playHit(ctx, this.master, time, hit);
    }
  }

  previewSynth(midi: number): void {
    const ctx = this.ensure();
    if (ctx.state === "suspended") void ctx.resume();
    const time = ctx.currentTime + 0.005;
    const gate = secondsPerStep(this.bpm) * this.patch.gate / 100;
    this.playSynth(midi, time, 0.9, false)?.release(time + gate);
  }

  holdSynth(midi: number): () => void {
    const ctx = this.ensure();
    if (ctx.state === "suspended") void ctx.resume();
    const voice = this.playSynth(midi, ctx.currentTime + 0.005, 0.9, false);
    return () => voice?.release(ctx.currentTime);
  }

  startRecording(): boolean {
    const ctx = this.ensure();
    if (!this.compressor || this.recorder || typeof MediaRecorder === "undefined") return false;
    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((mime) => MediaRecorder.isTypeSupported(mime));
    this.recordChunks = [];
    const dest = ctx.createMediaStreamDestination();
    try {
      const recorder = new MediaRecorder(dest.stream, mimeType ? { mimeType } : undefined);
      this.compressor.connect(dest);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.recordChunks.push(event.data);
      };
      recorder.start();
      this.recordDest = dest;
      this.recorder = recorder;
      this.recordStepsLeft = STEP_COUNT;
      this.recordEndTime = null;
      return true;
    } catch {
      try {
        this.compressor.disconnect(dest);
      } catch {
        // Construction can fail before the recording tap is connected.
      }
      dest.stream.getTracks().forEach((track) => track.stop());
      return false;
    }
  }

  stopRecording(): Promise<Blob> {
    const recorder = this.recorder;
    this.recordStepsLeft = null;
    this.recordEndTime = null;
    if (!recorder) return Promise.resolve(new Blob());
    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(this.recordChunks, { type: recorder.mimeType || "application/octet-stream" });
        if (this.recordDest) {
          this.compressor?.disconnect(this.recordDest);
          this.recordDest.stream.getTracks().forEach((track) => track.stop());
        }
        this.recordDest = null;
        this.recorder = null;
        this.recordChunks = [];
        resolve(blob);
      };
      if (recorder.state !== "inactive") recorder.stop();
      else resolve(new Blob());
    });
  }

  dispose(): void {
    this.pause();
    this.stopSynthVoices();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.noise = null;
  }

  private ensure(): AudioContext {
    if (this.ctx) return this.ctx;
    const ctx = new AudioContext({ latencyHint: "interactive" });
    const master = ctx.createGain();
    master.gain.value = this.volume;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -12;
    compressor.knee.value = 8;
    compressor.ratio.value = 3.5;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.2;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.72;
    master.connect(compressor);
    compressor.connect(analyser);
    analyser.connect(ctx.destination);
    this.analyser = analyser;
    this.ctx = ctx;
    this.master = master;
    this.compressor = compressor;
    this.noise = makeNoise(ctx);
    return ctx;
  }

  private tick(runId: number): void {
    if (!this.playing || runId !== this.runId || !this.ctx || !this.master) return;
    const ctx = this.ctx;
    if (!this.drumBus) {
      this.drumBus = ctx.createGain();
      this.drumBus.connect(this.master);
    }
    const duration = secondsPerStep(this.bpm);
    const count = this.pattern.length || STEP_COUNT;
    const now = ctx.currentTime;
    const skipped = missedSteps(this.nextTime, now, duration);
    const advance = this.recordStepsLeft === null ? skipped : Math.min(skipped, this.recordStepsLeft);
    if (advance > 0) {
      this.step = (this.step + advance) % count;
      this.nextTime += advance * duration;
      if (this.recordStepsLeft !== null) this.recordStepsLeft -= advance;
    }
    while (this.nextTime < now + LOOKAHEAD) {
      if (this.recordStepsLeft === 0) {
        this.recordEndTime = this.nextTime;
        this.nextTime = Infinity;
        break;
      }
      if (this.recordStepsLeft !== null) this.recordStepsLeft -= 1;
      const when = Math.max(this.nextTime, now + 0.003);
      const index = this.step;
      for (const hit of this.pattern[index] ?? []) {
        this.playHit(ctx, this.drumBus, when, hit);
      }
      this.queue.push({ index, when });
      this.step = (index + 1) % count;
      this.nextTime += duration;
    }
    this.flush(now);
    if (this.recordEndTime !== null && this.recordEndTime <= now) {
      this.recordEndTime = null;
      this.onRecordingEnd();
    }
  }

  private playHit(ctx: AudioContext, dest: AudioNode, time: number, hit: StepHit): void {
    if (hit.muted || hit.velocity <= 0) return;
    if (hit.voice === "synth" && hit.note != null) {
      const start = Math.max(time, ctx.currentTime);
      const gate = secondsPerStep(this.bpm) * this.patch.gate / 100;
      this.playSynth(hit.note, start, hit.velocity, true)?.release(start + gate);
      return;
    }
    const key = hit.voice;
    const sample = this.samples.get(key);
    if (sample) {
      this.playSample(ctx, dest, key, sample, time, hit.velocity);
      return;
    }
    if (!this.noise) return;
    triggerVoice(ctx, dest, this.noise, hit.voice, time, hit.velocity);
  }

  private playSynth(midi: number, time: number, velocity: number, sequenced: boolean): SynthVoice | undefined {
    const { ctx, master, noise } = this;
    if (!ctx || !master || !noise || !Number.isFinite(midi) || midi < 0 || midi > 127) return;
    if (this.synthVoices.size >= 12) {
      const oldest = this.synthVoices.keys().next().value;
      if (oldest) {
        oldest.stop(ctx.currentTime);
        this.synthVoices.delete(oldest);
      }
    }
    const voice = startSynthVoice(ctx, master, noise, this.patch, midi, time, velocity, () => {
      this.synthVoices.delete(voice);
    });
    this.synthVoices.set(voice, sequenced);
    return voice;
  }

  private stopSynthVoices(sequencedOnly = false): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const [voice, sequenced] of this.synthVoices) {
      if (!sequencedOnly || sequenced) {
        voice.stop(now);
        this.synthVoices.delete(voice);
      }
    }
  }

  private flush(now: number): void {
    while (this.queue.length > 0 && this.queue[0]!.when <= now) {
      const item = this.queue.shift();
      if (item) this.onStep(item.index);
    }
  }

  private playSample(ctx: AudioContext, dest: AudioNode, key: string, sample: DrumSample, time: number, velocity: number): void {
    const previous = this.active.get(key);
    if (previous && time < previous.end) {
      if (time <= previous.start) {
        previous.choke.gain.setValueAtTime(0, time);
        previous.source.stop(time);
      } else {
        const fadeEnd = Math.min(previous.end, time + 0.012);
        previous.choke.gain.setValueAtTime(1, time);
        previous.choke.gain.linearRampToValueAtTime(0, fadeEnd);
        previous.source.stop(fadeEnd);
      }
    }
    const mix = trackMix(key);
    const level = Math.min(1.6, Math.max(0.001, velocity) * mix.gain);
    const source = ctx.createBufferSource();
    source.buffer = sample.buffer;
    const gain = ctx.createGain();
    const choke = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(level, time + 0.0015);
    gain.gain.setValueAtTime(level, time + mix.hold * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, time + mix.hold);
    source.connect(gain);
    gain.connect(choke);
    choke.connect(dest);
    const end = time + Math.min(mix.hold + 0.01, sample.buffer.duration - sample.offset);
    const voice = { source, choke, start: time, end };
    this.active.set(key, voice);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      choke.disconnect();
      if (this.active.get(key) === voice) this.active.delete(key);
    };
    source.start(time, sample.offset);
    source.stop(end);
  }
}
