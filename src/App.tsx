import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Sequencer } from "@/components/Sequencer";
import { Engine } from "@/audio/engine";
import { DATASETS, datasetMeta } from "@/data/catalog";
import { loadDataset } from "@/data/load";
import {
  buildPattern,
  dayLengthSeconds,
  formatClock,
  formatDay,
  localClock,
  periodName,
  projectTracks,
  stepClock,
} from "@/lib/rhythm";
import type { ProjectedTrack } from "@/lib/rhythm";
import { loadSettings, saveSettings } from "@/lib/settings";
import type { LoadedDay, StepCount } from "@/types";

type Hover = { trackId: string; step: number } | null;
type Phase = "loading" | "ready" | "error";

export default function App() {
  const stored = useState(loadSettings)[0];
  const [datasetId, setDatasetId] = useState(stored.datasetId);
  const [bpm, setBpm] = useState(stored.bpm);
  const [steps, setSteps] = useState<StepCount>(stored.steps);
  const [gate, setGate] = useState(stored.gate);
  const [volume, setVolume] = useState(stored.volume);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [day, setDay] = useState<LoadedDay | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [muted, setMuted] = useState<ReadonlySet<string>>(() => new Set());
  const [hover, setHover] = useState<Hover>(null);
  const engineRef = useRef<Engine | null>(null);
  const playingRef = useRef(false);
  const stepRef = useRef(0);

  const meta = datasetMeta(datasetId);
  const visible = day?.id === datasetId ? day : null;
  const rows = useMemo(() => (visible ? projectTracks(visible.tracks, steps) : []), [visible, steps]);
  const clock = stepClock(step, steps);

  useEffect(() => {
    const engine = new Engine(setStep);
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setTransport({ bpm, steps, gate, volume });
  }, [bpm, steps, gate, volume]);

  useEffect(() => {
    engineRef.current?.setPattern(buildPattern(rows, muted));
  }, [rows, muted]);

  useEffect(() => {
    saveSettings({ datasetId, bpm, steps, gate, volume });
  }, [datasetId, bpm, steps, gate, volume]);

  useEffect(() => {
    let cancelled = false;
    loadDataset(datasetId).then(
      (loaded) => {
        if (cancelled) return;
        setDay(loaded);
        setPhase("ready");
        setStep(0);
        engineRef.current?.jump(0);
      },
      (reason: unknown) => {
        if (cancelled) return;
        setDay(null);
        setPhase("error");
        setError(reason instanceof Error ? reason.message : "Could not load");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [datasetId, attempt]);

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
      if (!engine || !visible) return;
      if (playingRef.current) {
        engine.pause();
        setPlaying(false);
      } else {
        engine.play();
        setPlaying(true);
      }
    }
    function nudge(delta: number) {
      if (!visible) return;
      const next = (stepRef.current + delta + steps) % steps;
      engineRef.current?.jump(next);
      setStep(next);
      if (!playingRef.current) engineRef.current?.previewStep();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, steps]);

  function chooseDataset(id: LoadedDay["id"]) {
    if (id === datasetId) return;
    setDatasetId(id);
    setMuted(new Set());
    setHover(null);
    setPhase("loading");
    setError(null);
  }

  function retry() {
    setPhase("loading");
    setError(null);
    setAttempt((value) => value + 1);
  }

  function togglePlay() {
    const engine = engineRef.current;
    if (!engine || !visible) return;
    if (playing) {
      engine.pause();
      setPlaying(false);
    } else {
      engine.play();
      setPlaying(true);
    }
  }

  function jump(index: number) {
    const engine = engineRef.current;
    engine?.jump(index);
    setStep(index);
    if (!playing) engine?.previewStep();
  }

  function toggleMute(id: string) {
    setMuted((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const readout = describe(rows, visible, steps, gate, muted, hover, step);

  return (
    <div className="app">
      <div className="face">
        <header className="head">
          <div>
            <h1>City Rhythm</h1>
            <p className="sub">24-hour step sequencer</p>
          </div>
          <div className="seg" role="group" aria-label="Dataset">
            {DATASETS.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant="outline"
                aria-pressed={item.id === datasetId}
                className={item.id === datasetId ? "is-selected" : undefined}
                onClick={() => chooseDataset(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </header>

        <section className="deck" aria-label="Transport">
          <div className="readout">
            <p className="clock">{visible ? formatClock(clock.hour, clock.minute) : "--:--"}</p>
            <p className="period">
              {visible ? (visible.id === "nyc-subway" ? periodName(clock.hour) : "UTC") : ""}
            </p>
            <p className="when">
              {visible ? (visible.day ? formatDay(visible.day) : "Past 24 hours") : phase === "loading" ? "Loading" : ""}
              {visible ? <span> · {meta.clock}</span> : null}
            </p>
          </div>

          <div className="transport">
            <Button
              type="button"
              className="play"
              disabled={!visible}
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
                min={70}
                max={160}
                step={1}
                value={[bpm]}
                aria-label="Tempo"
                onValueChange={(value) => setBpm(value[0] ?? bpm)}
              />
              <span className="fader-meta">{dayLengthSeconds(bpm).toFixed(1)}s / day</span>
            </label>
            <label className="fader">
              <span>
                Gate <b>{Math.round(gate * 100)}</b>
              </span>
              <Slider
                min={8}
                max={85}
                step={1}
                value={[Math.round(gate * 100)]}
                aria-label="Gate"
                onValueChange={(value) => setGate((value[0] ?? 40) / 100)}
              />
              <span className="fader-meta">Hits at or above</span>
            </label>
            <div className="fader steps">
              <span>Steps</span>
              <div className="seg" role="group" aria-label="Step count">
                {([24, 96] as const).map((count) => (
                  <Button
                    key={count}
                    type="button"
                    variant="outline"
                    aria-pressed={steps === count}
                    className={steps === count ? "is-selected" : undefined}
                    onClick={() => {
                      const clock = stepClock(step, steps);
                      const next = Math.min(count - 1, Math.round((clock.hour + clock.minute / 60) * (count / 24)));
                      setSteps(count);
                      setStep(next);
                      engineRef.current?.jump(next);
                    }}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>
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
          </div>
        </section>

        <p className="caption">{meta.note}</p>

        {visible ? (
          <Sequencer
            rows={rows}
            steps={steps}
            gate={gate}
            step={step}
            nowHour={visible.nowHour}
            muted={muted}
            onToggleMute={toggleMute}
            onPreview={(drum) => engineRef.current?.preview(drum)}
            onJump={jump}
            onHover={setHover}
          />
        ) : (
          <div className="seq-scroll status-well">
            {phase === "error" ? (
              <div className="status-copy">
                <p>Could not load this dataset.</p>
                <p>{error}</p>
                <Button type="button" variant="outline" onClick={retry}>
                  Retry
                </Button>
              </div>
            ) : (
              <p className="status-copy">Loading {meta.label}.</p>
            )}
          </div>
        )}

        <footer className="foot">
          <div>
            <p className="line">{visible ? readout : "—"}</p>
            <p className="line dim">
              <a href={meta.sourceUrl}>{meta.sourceName}</a>
              {" · "}
              Scaled per row. Solid cells play.
              {visible?.origin === "snapshot" && visible.liveError ? ` · Snapshot · ${visible.liveError}` : null}
            </p>
          </div>
          <p className="status" data-origin={visible?.origin ?? "snapshot"}>
            {visible ? (visible.origin === "live" ? "Live" : "Snapshot") : ""}
          </p>
        </footer>
      </div>
    </div>
  );
}

function describe(
  rows: ProjectedTrack[],
  day: LoadedDay | null,
  steps: StepCount,
  gate: number,
  muted: ReadonlySet<string>,
  hover: Hover,
  step: number,
): string {
  if (!day || rows.length === 0) return "—";
  const index = hover?.step ?? step;
  const clock = stepClock(index, steps);
  const time = formatClock(clock.hour, clock.minute);
  const row = hover ? rows.find((item) => item.track.id === hover.trackId) : loudest(rows, index, gate, muted);
  if (!row) return `${time}  rest`;
  const velocity = row.values[index] ?? 0;
  const plays = !muted.has(row.track.id) && velocity >= gate && velocity > 0;
  const local =
    row.track.timeZone && day.day ? `  ${localClock(day.day, clock.hour, clock.minute, row.track.timeZone)} local` : "";
  return `${time}${local}  ${row.track.name}  ${row.details[index] ?? ""}  ${row.track.drum}  ${plays ? "play" : "rest"}`;
}

function loudest(
  rows: ProjectedTrack[],
  index: number,
  gate: number,
  muted: ReadonlySet<string>,
): ProjectedTrack | null {
  const playing = rows.filter((row) => !muted.has(row.track.id) && (row.values[index] ?? 0) >= gate);
  playing.sort((a, b) => (b.values[index] ?? 0) - (a.values[index] ?? 0));
  return playing[0] ?? null;
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
