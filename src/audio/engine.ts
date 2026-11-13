import { makeNoise, triggerVoice } from "./voices.ts";
import { secondsPerStep } from "../lib/time.ts";
import type { CityId, StepHit } from "../types.ts";

type Transport = {
  bpm: number;
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
      if (!hit.muted && hit.velocity > 0) {
        triggerVoice(ctx, this.master, this.noise, this.city, hit.voice, time, hit.velocity);
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
    compressor.threshold.value = -12;
    compressor.knee.value = 8;
    compressor.ratio.value = 3.5;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.2;
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
      const count = this.pattern.length || 16;
      const index = ((this.step % count) + count) % count;
      for (const hit of this.pattern[index] ?? []) {
        if (!hit.muted && hit.velocity > 0) {
          triggerVoice(ctx, this.master, this.noise, this.city, hit.voice, when, hit.velocity);
        }
      }
      this.queue.push({ index, when });
      this.step = (index + 1) % count;
      this.nextTime = when + secondsPerStep(this.bpm);
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
