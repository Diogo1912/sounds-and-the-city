import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Sequencer } from "@/components/Sequencer";
import { Engine } from "@/audio/engine";
import { CITIES, cityById, clonePattern, writeCell } from "@/kits";
import { loadPatterns, loadSettings, savePatterns, saveSettings } from "@/lib/settings";
import { barSeconds, formatStep } from "@/lib/time";
import type { CityId, StepHit } from "@/types";

type Hover = { voice: number; step: number } | null;

export default function App() {
  const stored = useState(loadSettings)[0];
  const [cityId, setCityId] = useState<CityId>(stored.cityId);
  const [bpm, setBpm] = useState(stored.bpm);
  const [volume, setVolume] = useState(stored.volume);
  const [patterns, setPatterns] = useState(loadPatterns);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [muted, setMuted] = useState<ReadonlySet<string>>(() => new Set());
  const [hover, setHover] = useState<Hover>(null);
  const engineRef = useRef<Engine | null>(null);
  const playingRef = useRef(false);
  const stepRef = useRef(0);

  const city = cityById(cityId);
  const pattern = patterns[cityId];

  const hits = useMemo(() => toHits(city.voices.map((voice) => voice.id), pattern, muted), [city, pattern, muted]);

  useEffect(() => {
    const engine = new Engine(setStep);
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setCity(cityId);
  }, [cityId]);

  useEffect(() => {
    engineRef.current?.setTransport({ bpm, volume });
  }, [bpm, volume]);

  useEffect(() => {
    engineRef.current?.setPattern(hits);
  }, [hits]);

  useEffect(() => {
    saveSettings({ cityId, bpm, volume });
  }, [cityId, bpm, volume]);

  useEffect(() => {
    savePatterns(patterns);
  }, [patterns]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("[data-slot='slider']")) return;
      if (event.key === " ") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        nudge(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        nudge(-1);
      }
    }
    function togglePlay() {
      const engine = engineRef.current;
      if (!engine) return;
      if (playingRef.current) {
        engine.pause();
        setPlaying(false);
      } else {
        engine.play();
        setPlaying(true);
      }
    }
    function nudge(delta: number) {
      const next = (stepRef.current + delta + 16) % 16;
      const engine = engineRef.current;
      engine?.jump(next);
      setStep(next);
      if (!playingRef.current) engine?.previewStep();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function togglePlay() {
    const engine = engineRef.current;
    if (!engine) return;
    if (playing) {
      engine.pause();
      setPlaying(false);
    } else {
      engine.play();
      setPlaying(true);
    }
  }

  function chooseCity(id: CityId) {
    if (id === cityId) return;
    const next = cityById(id);
    setCityId(id);
    setBpm(next.bpm);
    setMuted(new Set());
    setHover(null);
    setStep(0);
    engineRef.current?.jump(0);
  }

  function jump(index: number) {
    const engine = engineRef.current;
    engine?.jump(index);
    setStep(index);
    if (!playing) engine?.previewStep();
  }

  function write(voice: number, index: number, velocity: number) {
    setPatterns((current) => ({ ...current, [cityId]: writeCell(current[cityId], voice, index, velocity) }));
  }

  function reset() {
    setPatterns((current) => ({ ...current, [cityId]: clonePattern(city.pattern) }));
  }

  function toggleMute(id: string) {
    setMuted((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const sounding = soundingNames(city.voices, pattern, step, muted);
  const hoverText = describeHover(city.voices, pattern, hover);

  return (
    <div className="app">
      <div className="face">
        <header className="head">
          <div>
            <h1>City Rhythm</h1>
            <p className="sub">Four city kits</p>
          </div>
          <div className="seg" role="group" aria-label="City">
            {CITIES.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant="outline"
                aria-pressed={item.id === cityId}
                className={item.id === cityId ? "is-selected" : undefined}
                onClick={() => chooseCity(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </header>

        <section className="deck" aria-label="Transport">
          <div className="readout">
            <p className="clock">{formatStep(step)}</p>
            <p className="period">Step</p>
            <p className="when">
              {city.label} · {barSeconds(bpm).toFixed(1)}s / bar
            </p>
          </div>
          <div className="transport">
            <Button
              type="button"
              className="play"
              aria-pressed={playing}
              aria-label={playing ? "Pause" : "Play"}
              onClick={togglePlay}
            >
              {playing ? <PauseMark /> : <PlayMark />}
            </Button>
            <label className="fader">
              <span>
                Tempo <b>{bpm}</b>
              </span>
              <Slider
                min={60}
                max={180}
                step={1}
                value={[bpm]}
                aria-label="Tempo"
                onValueChange={(value) => setBpm(value[0] ?? bpm)}
              />
              <span className="fader-meta">Quarter note</span>
            </label>
            <label className="fader">
              <span>
                Level <b>{Math.round(volume * 100)}</b>
              </span>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[Math.round(volume * 100)]}
                aria-label="Level"
                onValueChange={(value) => setVolume((value[0] ?? 82) / 100)}
              />
              <span className="fader-meta">Output</span>
            </label>
            <div className="fader steps">
              <span>Pattern</span>
              <Button type="button" variant="outline" onClick={reset}>
                Reset
              </Button>
            </div>
          </div>
        </section>

        <p className="caption">{city.note}</p>

        <Sequencer
          voices={city.voices}
          pattern={pattern}
          step={step}
          muted={muted}
          onToggleMute={toggleMute}
          onPreview={(id) => engineRef.current?.preview(id)}
          onJump={jump}
          onWrite={write}
          onHover={setHover}
        />

        <footer className="foot">
          <div>
            <p className="line">{hoverText ?? `${formatStep(step)}  ${sounding}`}</p>
            <p className="line dim">Click a pad to write the bar. Click a name to hear it. Synthesized, no samples.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function toHits(ids: string[], pattern: number[][], muted: ReadonlySet<string>): StepHit[][] {
  const steps = pattern[0]?.length ?? 16;
  const hits: StepHit[][] = Array.from({ length: steps }, () => []);
  ids.forEach((id, voice) => {
    const row = pattern[voice] ?? [];
    for (let index = 0; index < steps; index += 1) {
      hits[index]?.push({ voice: id, velocity: row[index] ?? 0, muted: muted.has(id) });
    }
  });
  return hits;
}

function soundingNames(
  voices: { id: string; name: string }[],
  pattern: number[][],
  step: number,
  muted: ReadonlySet<string>,
): string {
  const names = voices.filter((voice, index) => !muted.has(voice.id) && (pattern[index]?.[step] ?? 0) > 0).map((voice) => voice.name);
  return names.length > 0 ? names.join("  ") : "rest";
}

function describeHover(
  voices: { name: string; hint: string }[],
  pattern: number[][],
  hover: Hover,
): string | null {
  if (!hover) return null;
  const voice = voices[hover.voice];
  const velocity = pattern[hover.voice]?.[hover.step] ?? 0;
  if (!voice) return null;
  return `${formatStep(hover.step)}  ${voice.name}  ${voice.hint}  ${velocity > 0 ? "on" : "off"}`;
}

function PlayMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.2 1.1 L10.6 6 L2.2 10.9 Z" fill="currentColor" />
    </svg>
  );
}

function PauseMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <rect x="2" y="1" width="2.6" height="10" fill="currentColor" />
      <rect x="7.4" y="1" width="2.6" height="10" fill="currentColor" />
    </svg>
  );
}
