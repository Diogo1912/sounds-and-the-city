import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { formatStep } from "@/lib/time";
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
  onHover: (hover: { voice: number; step: number } | null) => void;
};

const STEPS = 16;

export function Sequencer({ voices, pattern, step, muted, onToggleMute, onPreview, onJump, onWrite, onHover }: Props) {
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
    if (cellLeft >= scroller.scrollLeft + 16 && cellRight <= scroller.scrollLeft + scroller.clientWidth - 16) return;
    scroller.scrollLeft = cellLeft - scroller.clientWidth / 2 + cell.offsetWidth / 2;
  }, [step, pattern]);

  return (
    <div className="seq-scroll" ref={scrollRef}>
      <div className="seq-frame">
        <div className="seq" role="group" aria-label="Step grid">
          <div className="corner" />
          {Array.from({ length: STEPS }, (_, index) => (
            <button
              key={index}
              type="button"
              className={index === step ? "ruler is-playhead" : "ruler"}
              aria-current={index === step ? "step" : undefined}
              aria-label={`Go to step ${formatStep(index)}`}
              onClick={() => onJump(index)}
            >
              {formatStep(index)}
            </button>
          ))}
          {voices.map((voice, voiceIndex) => {
            const isMuted = muted.has(voice.id);
            const row = pattern[voiceIndex] ?? [];
            return (
              <TrackRow
                key={voice.id}
                voice={voice}
                voiceIndex={voiceIndex}
                row={row}
                step={step}
                muted={isMuted}
                painting={painting}
                onToggleMute={onToggleMute}
                onPreview={onPreview}
                onWrite={onWrite}
                onHover={onHover}
              />
            );
          })}
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
  onHover,
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
  onHover: (hover: { voice: number; step: number } | null) => void;
}) {
  return (
    <>
      <div className={muted ? "gutter is-muted" : "gutter"}>
        <button type="button" className="track-name" onClick={() => onPreview(voice.id)}>
          <span>{voice.name}</span>
          <span className="drum">{voice.hint}</span>
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
      {Array.from({ length: STEPS }, (_, index) => {
        const velocity = row[index] ?? 0;
        const on = velocity > 0;
        return (
          <button
            key={index}
            type="button"
            className={cellClass(index === step, on, muted)}
            style={{ "--v": String(velocity) } as CSSProperties}
            aria-pressed={velocity > 0}
            aria-label={`${voice.name} step ${formatStep(index)}. ${velocity > 0 ? "On" : "Off"}.`}
            onPointerDown={(event) => {
              if (event.pointerType === "touch") {
                onWrite(voiceIndex, index, velocity > 0 ? 0 : 0.9);
                return;
              }
              event.preventDefault();
              const next = velocity > 0 ? 0 : 0.9;
              painting.current = next;
              onWrite(voiceIndex, index, next);
            }}
            onPointerEnter={(event) => {
              onHover({ voice: voiceIndex, step: index });
              if (painting.current === null || event.buttons === 0) return;
              onWrite(voiceIndex, index, painting.current);
            }}
            onPointerLeave={() => onHover(null)}
            onFocus={() => onHover({ voice: voiceIndex, step: index })}
            onBlur={() => onHover(null)}
          >
            <span className="cell-fill" />
          </button>
        );
      })}
    </>
  );
}

function cellClass(playhead: boolean, on: boolean, muted: boolean): string {
  const names = ["cell"];
  if (playhead) names.push("is-playhead");
  if (on) names.push("is-on");
  if (muted) names.push("is-muted");
  return names.join(" ");
}
