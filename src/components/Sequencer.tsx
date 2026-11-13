import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { Glyph } from "@/components/Glyph";
import { Button } from "@/components/ui/button";
import { noteName } from "@/lib/notes";
import { dayPhase, formatHour } from "@/lib/time";
import type { CityId, Voice } from "@/types";

type Props = {
  voices: Voice[];
  pattern: number[][];
  notes: (number | null)[];
  city: CityId;
  synthName: string;
  step: number;
  muted: ReadonlySet<string>;
  onToggleMute: (id: string) => void;
  onPreview: (id: string) => void;
  onJump: (step: number) => void;
  onWrite: (voice: number, step: number, velocity: number) => void;
  onWriteNote: (step: number, midi: number | null) => void;
};

const HOURS = 24;

export function Sequencer({
  voices,
  pattern,
  notes,
  city,
  synthName,
  step,
  muted,
  onToggleMute,
  onPreview,
  onJump,
  onWrite,
  onWriteNote,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const painting = useRef<number | null>(null);

  useEffect(() => {
    const up = () => {
      painting.current = null;
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    const cell = scroller?.querySelector<HTMLElement>(".cell.is-playhead");
    if (!scroller || !cell) return;
    const origin = scroller.getBoundingClientRect().left;
    const cellLeft = scroller.scrollLeft + cell.getBoundingClientRect().left - origin;
    const cellRight = cellLeft + cell.offsetWidth;
    if (cellLeft >= scroller.scrollLeft + 8 && cellRight <= scroller.scrollLeft + scroller.clientWidth - 8) return;
    scroller.scrollLeft = cellLeft - 8;
  }, [step, pattern]);

  return (
    <div className="rack">
      <div className="name-col">
        <div className="corner" />
        {voices.map((voice, voiceIndex) => (
          <div
            key={voice.id}
            className={gutterClass(muted.has(voice.id), !muted.has(voice.id) && (pattern[voiceIndex]?.[step] ?? 0) > 0)}
          >
            <button type="button" className="track-name" onClick={() => onPreview(voice.id)}>
              <Glyph city={city} id={voice.id} />
              {voice.name}
            </button>
            <Button
              type="button"
              size="icon-xs"
              variant="outline"
              className={muted.has(voice.id) ? "mute is-on" : "mute"}
              aria-pressed={muted.has(voice.id)}
              aria-label={`${muted.has(voice.id) ? "Unmute" : "Mute"} ${voice.name}`}
              onClick={() => onToggleMute(voice.id)}
            >
              M
            </Button>
          </div>
        ))}
        <div className={gutterClass(muted.has("synth"), !muted.has("synth") && notes[step] != null)}>
          <button type="button" className="track-name" onClick={() => onPreview("synth")}>
            <Glyph city={city} id="synth" />
            {synthName}
          </button>
          <Button
            type="button"
            size="icon-xs"
            variant="outline"
            className={muted.has("synth") ? "mute is-on" : "mute"}
            aria-pressed={muted.has("synth")}
            aria-label={`${muted.has("synth") ? "Unmute" : "Mute"} ${synthName}`}
            onClick={() => onToggleMute("synth")}
          >
            M
          </Button>
        </div>
      </div>
      <div className="seq-scroll" ref={scrollRef}>
      <div className="seq-frame">
        <div className="seq" role="group" aria-label="Hours">
          <div className={`day-tint is-${dayPhase(step)}`} />
          {Array.from({ length: HOURS }, (_, hour) => (
            <button
              key={hour}
              type="button"
              className={hourClass("ruler", hour, hour === step)}
              aria-current={hour === step ? "step" : undefined}
              aria-label={`Go to ${formatHour(hour)}:00`}
              onClick={() => onJump(hour)}
            >
              {formatHour(hour)}
            </button>
          ))}
          {voices.map((voice, voiceIndex) => (
            <TrackRow
              key={voice.id}
              voice={voice}
              voiceIndex={voiceIndex}
              row={pattern[voiceIndex] ?? []}
              step={step}
              muted={muted.has(voice.id)}
              painting={painting}
              onWrite={onWrite}
            />
          ))}
          {Array.from({ length: HOURS }, (_, hour) => {
            const midi = notes[hour];
            return (
              <button
                key={hour}
                type="button"
                className={hourClass("cell note", hour, hour === step, midi != null, muted.has("synth"))}
                aria-pressed={midi != null}
                aria-label={`${synthName} ${formatHour(hour)}:00${midi != null ? `, ${noteName(midi)}` : ""}`}
                onClick={() => onWriteNote(hour, midi ?? null)}
              >
                {midi != null ? <em>{noteName(midi)}</em> : null}
              </button>
            );
          })}
          <div className="playhead" style={{ gridColumn: step + 1 }} />
        </div>
      </div>
      </div>
    </div>
  );
}

function TrackRow({
  voice,
  voiceIndex,
  row,
  step,
  muted,
  painting,
  onWrite,
}: {
  voice: Voice;
  voiceIndex: number;
  row: number[];
  step: number;
  muted: boolean;
  painting: { current: number | null };
  onWrite: (voice: number, step: number, velocity: number) => void;
}) {
  return (
    <>
      {Array.from({ length: HOURS }, (_, hour) => {
        const velocity = row[hour] ?? 0;
        return (
          <button
            key={hour}
            type="button"
                className={hourClass("cell", hour, hour === step, velocity > 0, muted, hour === step && velocity > 0)}
            style={{ "--v": String(velocity) } as CSSProperties}
            aria-pressed={velocity > 0}
            aria-label={`${voice.name} ${formatHour(hour)}:00, ${velocity > 0 ? "on" : "off"}`}
            onPointerDown={(event) => {
              if (event.pointerType === "touch") {
                onWrite(voiceIndex, hour, velocity > 0 ? 0 : 0.9);
                return;
              }
              event.preventDefault();
              const next = velocity > 0 ? 0 : 0.9;
              painting.current = next;
              onWrite(voiceIndex, hour, next);
            }}
            onPointerEnter={(event) => {
              if (painting.current === null || event.buttons === 0) return;
              onWrite(voiceIndex, hour, painting.current);
            }}
          >
            <span className="cell-fill" />
          </button>
        );
      })}
    </>
  );
}

function gutterClass(muted: boolean, hit: boolean): string {
  const names = ["gutter"];
  if (muted) names.push("is-muted");
  if (hit) names.push("is-hit");
  return names.join(" ");
}

function hourClass(base: string, hour: number, playhead: boolean, on = false, muted = false, hit = false): string {
  const names = [base];
  if (Math.floor(hour / 6) % 2 === 1) names.push("is-shade");
  if (playhead) names.push("is-playhead");
  if (on) names.push("is-on");
  if (hit) names.push("is-hit");
  if (muted) names.push("is-muted");
  return names.join(" ");
}
