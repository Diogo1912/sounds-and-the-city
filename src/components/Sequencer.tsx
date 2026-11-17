import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { Glyph } from "@/components/Glyph";
import { Button } from "@/components/ui/button";
import { STEP_COUNT, STEPS_PER_BEAT, formatStep } from "@/lib/time";
import type { CityId, Voice } from "@/types";

type Props = {
  voices: Voice[];
  pattern: number[][];
  city: CityId;
  step: number;
  muted: ReadonlySet<string>;
  onToggleMute: (id: string) => void;
  onPreview: (id: string) => void;
  onJump: (step: number) => void;
  onWrite: (voice: number, step: number, velocity: number) => void;
};

const STEPS = Array.from({ length: STEP_COUNT }, (_, step) => step);

export function Sequencer({ voices, pattern, city, step, muted, onToggleMute, onPreview, onJump, onWrite }: Props) {
  const painting = useRef<{ pointer: number; velocity: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroll = scrollRef.current;
    const ruler = scroll?.querySelector<HTMLElement>(".ruler.is-playhead");
    if (!scroll || !ruler) return;
    const view = scroll.getBoundingClientRect();
    const target = ruler.getBoundingClientRect();
    if (target.left < view.left) scroll.scrollLeft -= view.left - target.left;
    if (target.right > view.right) scroll.scrollLeft += target.right - view.right;
  }, [step]);

  useEffect(() => {
    function endPaint(event: PointerEvent) {
      if (painting.current?.pointer === event.pointerId) painting.current = null;
    }
    window.addEventListener("pointerup", endPaint);
    window.addEventListener("pointercancel", endPaint);
    return () => {
      window.removeEventListener("pointerup", endPaint);
      window.removeEventListener("pointercancel", endPaint);
    };
  }, []);

  return (
    <div className="rack">
      <div className="name-col">
        <div className="corner" />
        {voices.map((voice, index) => {
          const isMuted = muted.has(voice.id);
          const active = (pattern[index]?.[step] ?? 0) > 0 && !isMuted;
          return (
            <div key={voice.id} className={`gutter${isMuted ? " is-muted" : ""}${active ? " is-hit" : ""}`}>
              <button type="button" className="track-name" onClick={() => onPreview(voice.id)}>
                <Glyph city={city} id={voice.id} />{voice.name}
              </button>
              <Button
                type="button" size="icon-xs" variant="outline"
                className={isMuted ? "mute is-on" : "mute"}
                aria-pressed={isMuted} aria-label={`Mute ${voice.name}`}
                onClick={() => onToggleMute(voice.id)}
              >
                M
              </Button>
            </div>
          );
        })}
      </div>
      <div className="seq-scroll" ref={scrollRef}>
        <div className="seq" role="group" aria-label="16 drum steps">
          {STEPS.map((index) => (
            <button
              key={index} type="button"
              className={stepClass("ruler", index, step)}
              aria-current={index === step ? "step" : undefined}
              aria-label={`Go to step ${index + 1}`}
              onClick={() => onJump(index)}
            >
              {formatStep(index)}
            </button>
          ))}
          {voices.map((voice, row) => STEPS.map((index) => {
            const velocity = pattern[row]?.[index] ?? 0;
            const next = velocity > 0 ? 0 : 0.9;
            return (
              <button
                key={`${voice.id}-${index}`}
                type="button"
                className={stepClass("cell", index, step, velocity > 0, muted.has(voice.id))}
                style={{ "--v": velocity } as CSSProperties}
                aria-pressed={velocity > 0}
                aria-label={`${voice.name}, step ${index + 1}`}
                onPointerDown={(event) => {
                  if (event.pointerType === "touch" || event.button !== 0) return;
                  painting.current = { pointer: event.pointerId, velocity: next };
                  onWrite(row, index, next);
                }}
                onPointerEnter={(event) => {
                  if (painting.current?.pointer !== event.pointerId || (event.buttons & 1) === 0) return;
                  onWrite(row, index, painting.current.velocity);
                }}
                onPointerUp={(event) => {
                  if (event.pointerType === "touch") onWrite(row, index, next);
                }}
                onClick={(event) => {
                  if (event.detail === 0) onWrite(row, index, next);
                }}
              >
                <span className="cell-fill" />
              </button>
            );
          }))}
        </div>
      </div>
    </div>
  );
}

function stepClass(base: string, index: number, playhead: number, on = false, muted = false): string {
  return [
    base,
    Math.floor(index / STEPS_PER_BEAT) % 2 === 1 && "is-shade",
    index === playhead && "is-playhead",
    on && "is-on",
    muted && "is-muted",
  ].filter(Boolean).join(" ");
}
