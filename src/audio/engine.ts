import { loadSampleBuffers, sampleKey, trackMix } from "./samples.ts";
import { makeNoise, triggerSynth, triggerVoice } from "./voices.ts";
import { secondsPerStep } from "../lib/time.ts";
import type { CityId, StepHit } from "../types.ts";

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
  private recordDest: MediaStreamAudioDestinationNode | null = null;
  private cutoff = 0.5;
  private decay = 0.35;
  private samples = new Map<string, AudioBuffer>();
  private active = new Map<string, { source: AudioBufferSourceNode; gain: GainNode }>();
  private samplesReady: Promise<void> = Promise.resolve();
  private timer = 0;
  private nextTime = 0;
  private step = 0;
  private playing = false;
  private runId = 0;
  private bpm = 96;
  private volume = 0.82;
  private city: CityId = "new-york";
  private pattern: StepHit[][] = [];
  private queue: { index: number; when: number }[] = [];
  private onStep: (step: number) => void;

  constructor(onStep: (step: number) => void) {
    this.onStep = onStep;
  }

  setCity(city: CityId): void {
    this.city = city;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  preload(): void {
    const ctx = this.ensure();
    this.samplesReady = loadSampleBuffers(ctx).then((buffers) => {
      this.samples = buffers;
    });
  }

  setSynth(next: { cutoff: number; decay: number }): void {
    this.cutoff = next.cutoff;
    this.decay = next.decay;
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
    const ctx = this.ensure();
    if (ctx.state === "suspended") void ctx.resume();
    if (this.playing) return;
    this.playing = true;
    const runId = ++this.runId;
    void this.samplesReady.then(() => {
      if (!this.playing || runId !== this.runId) return;
      this.nextTime = ctx.currentTime + 0.05;
      this.timer = window.setInterval(() => this.tick(runId), 25);
      this.tick(runId);
    });
  }

  pause(): void {
    this.playing = false;
    this.runId += 1;
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = 0;
    }
    this.queue = [];
  }

  jump(index: number): void {
    this.step = index;
    this.queue = [];
    if (this.playing && this.ctx) this.nextTime = this.ctx.currentTime + 0.04;
  }

  preview(voice: string, velocity = 0.9): void {
    const ctx = this.ensure();
    if (ctx.state === "suspended") void ctx.resume();
    if (!this.master || !this.noise) return;
    triggerVoice(ctx, this.master, this.noise, this.city, voice, ctx.currentTime + 0.02, velocity);
  }

  previewStep(): void {
    const ctx = this.ensure();
    if (ctx.state === "suspended") void ctx.resume();
    if (!this.master || !this.noise) return;
    const time = ctx.currentTime + 0.02;
    for (const hit of this.pattern[this.step] ?? []) {
      this.playHit(ctx, this.master, time, hit);
    }
  }

  previewSynth(midi: number): void {
    const ctx = this.ensure();
    if (ctx.state === "suspended") void ctx.resume();
    if (!this.master) return;
    triggerSynth(ctx, this.master, this.city, midi, ctx.currentTime + 0.02, 0.9, this.cutoff, this.decay);
  }

  startRecording(): void {
    const ctx = this.ensure();
    if (!this.compressor || this.recorder) return;
    this.recordChunks = [];
    this.recordDest = ctx.createMediaStreamDestination();
    this.compressor.connect(this.recordDest);
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
    this.recorder = new MediaRecorder(this.recordDest.stream, { mimeType: mime });
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.recordChunks.push(event.data);
    };
    this.recorder.start();
  }

  stopRecording(): Promise<Blob> {
    const recorder = this.recorder;
    if (!recorder) return Promise.resolve(new Blob());
    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(this.recordChunks, { type: recorder.mimeType || "audio/webm" });
        if (this.recordDest) this.compressor?.disconnect(this.recordDest);
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
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.noise = null;
  }

  private ensure(): AudioContext {
    if (this.ctx) return this.ctx;
    const ctx = new AudioContext();
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
    if (!this.playing || runId !== this.runId || !this.ctx || !this.master || !this.noise) return;
    const ctx = this.ctx;
    const horizon = ctx.currentTime + 0.16;
    while (this.nextTime < horizon) {
      const when = this.nextTime;
      const count = this.pattern.length || 24;
      const index = ((this.step % count) + count) % count;
      for (const hit of this.pattern[index] ?? []) {
        this.playHit(ctx, this.master, when, hit);
      }
      this.queue.push({ index, when });
      this.step = (index + 1) % count;
      this.nextTime = when + secondsPerStep(this.bpm);
    }
    this.flush(ctx.currentTime);
  }

  private playHit(ctx: AudioContext, dest: AudioNode, time: number, hit: StepHit): void {
    if (hit.muted || hit.velocity <= 0) return;
    if (hit.voice === "synth" && hit.note != null) {
      triggerSynth(ctx, dest, this.city, hit.note, time, hit.velocity, this.cutoff, this.decay);
      return;
    }
    const key = sampleKey(this.city, hit.voice);
    const buffer = this.samples.get(key);
    if (buffer) {
      this.playSample(ctx, dest, key, buffer, time, hit.velocity);
      return;
    }
    if (!this.noise) return;
    triggerVoice(ctx, dest, this.noise, this.city, hit.voice, time, hit.velocity);
  }

  private flush(now: number): void {
    while (this.queue.length > 0 && this.queue[0]!.when <= now + 0.02) {
      const item = this.queue.shift();
      if (item) this.onStep(item.index);
    }
  }

  private playSample(ctx: AudioContext, dest: AudioNode, key: string, buffer: AudioBuffer, time: number, velocity: number): void {
    const previous = this.active.get(key);
    if (previous) {
      previous.gain.gain.cancelScheduledValues(time);
      previous.gain.gain.setValueAtTime(Math.max(previous.gain.gain.value, 0.0001), time);
      previous.gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.015);
      previous.source.stop(time + 0.02);
    }
    const mix = trackMix(key);
    const level = Math.min(1.6, Math.max(0.001, velocity) * mix.gain);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(level, time);
    gain.gain.setValueAtTime(level, time + mix.hold * 0.55);
    gain.gain.exponentialRampToValueAtTime(0.001, time + mix.hold);
    source.connect(gain);
    gain.connect(dest);
    source.start(time);
    source.stop(time + mix.hold + 0.02);
    this.active.set(key, { source, gain });
  }
}
