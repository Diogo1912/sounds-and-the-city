import type { StepHit } from "../lib/rhythm.ts";
import { secondsPerStep } from "../lib/rhythm.ts";
import type { DrumId } from "../types.ts";
import { makeNoise, triggerDrum } from "./drums.ts";

type Transport = {
  bpm: number;
  steps: number;
  gate: number;
  volume: number;
};

export class Engine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer = 0;
  private nextTime = 0;
  private step = 0;
  private playing = false;
  private runId = 0;
  private bpm = 104;
  private stepCount = 24;
  private gate = 0.4;
  private volume = 0.82;
  private pattern: StepHit[][] = [];
  private queue: { index: number; when: number }[] = [];
  private onStep: (step: number) => void;

  constructor(onStep: (step: number) => void) {
    this.onStep = onStep;
  }

  setTransport(next: Transport): void {
    this.bpm = next.bpm;
    this.stepCount = next.steps;
    this.gate = next.gate;
    this.volume = next.volume;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
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
    this.runId += 1;
    const runId = this.runId;
    this.nextTime = ctx.currentTime + 0.05;
    this.timer = window.setInterval(() => this.tick(runId), 25);
    this.tick(runId);
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

  preview(drum: DrumId, velocity = 0.9): void {
    const ctx = this.ensure();
    if (ctx.state === "suspended") void ctx.resume();
    if (!this.master || !this.noise) return;
    triggerDrum(ctx, this.master, this.noise, drum, ctx.currentTime + 0.02, velocity);
  }

  previewStep(): void {
    const ctx = this.ensure();
    if (ctx.state === "suspended") void ctx.resume();
    if (!this.master || !this.noise) return;
    const time = ctx.currentTime + 0.02;
    for (const hit of this.pattern[this.step] ?? []) {
      if (!hit.muted && hit.velocity >= this.gate && hit.velocity > 0) {
        triggerDrum(ctx, this.master, this.noise, hit.drum, time, hit.velocity);
      }
    }
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
    compressor.threshold.value = -14;
    compressor.knee.value = 8;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.18;
    master.connect(compressor);
    compressor.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    this.noise = makeNoise(ctx);
    return ctx;
  }

  private tick(runId: number): void {
    if (!this.playing || runId !== this.runId || !this.ctx || !this.master || !this.noise) return;
    const ctx = this.ctx;
    const horizon = ctx.currentTime + 0.16;
    while (this.nextTime < horizon) {
      const when = this.nextTime;
      const count = this.pattern.length || this.stepCount;
      const index = ((this.step % count) + count) % count;
      for (const hit of this.pattern[index] ?? []) {
        if (!hit.muted && hit.velocity >= this.gate && hit.velocity > 0) {
          triggerDrum(ctx, this.master, this.noise, hit.drum, when, hit.velocity);
        }
      }
      this.queue.push({ index, when });
      this.step = (index + 1) % count;
      this.nextTime = when + secondsPerStep(this.bpm, count);
    }
    this.flush(ctx.currentTime);
  }

  private flush(now: number): void {
    while (this.queue.length > 0 && this.queue[0]!.when <= now + 0.02) {
      const item = this.queue.shift();
      if (item) this.onStep(item.index);
    }
  }
}
