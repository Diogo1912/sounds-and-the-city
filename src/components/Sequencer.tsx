import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { formatHour } from "@/lib/time";
import type { Voice } from "@/types";

type Props = {
  voices: Voice[];
  pattern: number[][];
  step: number;
  muted: ReadonlySet<string>;
  onToggleMute: (id: string) => void;
  onPreview: (id: string) => void;
  onJump: (step: number) => void;
  onWrite: (voice: number, step: number, velocity: number) => void;
};

const HOURS = 24;

export function Sequencer({ voices, pattern, step, muted, onToggleMute, onPreview, onJump, onWrite }: Props) {
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
    <div className="seq-scroll" ref={scrollRef}>
      <div className="seq-frame">
        <div className="seq" role="group" aria-label="Hours">
          <div className="corner" />
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
              onToggleMute={onToggleMute}
              onPreview={onPreview}
              onWrite={onWrite}
            />
          ))}
          <div className="playhead" style={{ gridColumn: step + 2 }} />
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
  onToggleMute,
  onPreview,
  onWrite,
}: {
  voice: Voice;
  voiceIndex: number;
  row: number[];
  step: number;
  muted: boolean;
  painting: { current: number | null };
  onToggleMute: (id: string) => void;
  onPreview: (id: string) => void;
  onWrite: (voice: number, step: number, velocity: number) => void;
}) {
  return (
    <>
      <div className={muted ? "gutter is-muted" : "gutter"}>
        <button type="button" className="track-name" onClick={() => onPreview(voice.id)}>
          {voice.name}
        </button>
        <Button
          type="button"
          size="icon-xs"
          variant="outline"
          className={muted ? "mute is-on" : "mute"}
          aria-pressed={muted}
          aria-label={`${muted ? "Unmute" : "Mute"} ${voice.name}`}
          onClick={() => onToggleMute(voice.id)}
        >
          M
        </Button>
      </div>
      {Array.from({ length: HOURS }, (_, hour) => {
        const velocity = row[hour] ?? 0;
        return (
          <button
            key={hour}
            type="button"
            className={hourClass("cell", hour, hour === step, velocity > 0, muted)}
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

function hourClass(base: string, hour: number, playhead: boolean, on = false, muted = false): string {
  const names = [base];
  if (Math.floor(hour / 6) % 2 === 1) names.push("is-shade");
  if (playhead) names.push("is-playhead");
  if (on) names.push("is-on");
  if (muted) names.push("is-muted");
  return names.join(" ");
}
