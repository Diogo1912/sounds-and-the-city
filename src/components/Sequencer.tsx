import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { formatClock, stepClock, type ProjectedTrack } from "@/lib/rhythm";
import type { DrumId, StepCount } from "@/types";

type Props = {
  rows: ProjectedTrack[];
  steps: StepCount;
  gate: number;
  step: number;
  nowHour: number | null;
  muted: ReadonlySet<string>;
  onToggleMute: (id: string) => void;
  onPreview: (drum: DrumId) => void;
  onJump: (step: number) => void;
  onHover: (hover: { trackId: string; step: number } | null) => void;
};

export function Sequencer({
  rows,
  steps,
  gate,
  step,
  nowHour,
  muted,
  onToggleMute,
  onPreview,
  onJump,
  onHover,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollRef.current;
    const cell = scroller?.querySelector<HTMLElement>(".cell.is-playhead");
    if (!scroller || !cell) return;
    const origin = scroller.getBoundingClientRect().left;
    const cellLeft = scroller.scrollLeft + cell.getBoundingClientRect().left - origin;
    const cellRight = cellLeft + cell.offsetWidth;
    const viewLeft = scroller.scrollLeft;
    const viewRight = viewLeft + scroller.clientWidth;
    if (cellLeft >= viewLeft + 16 && cellRight <= viewRight - 16) return;
    scroller.scrollLeft = cellLeft - scroller.clientWidth / 2 + cell.offsetWidth / 2;
  }, [step, steps, rows]);

  return (
    <div className="seq-scroll" ref={scrollRef}>
      <div className="seq-frame" data-steps={steps}>
        <div className="seq" role="group" aria-label="Step grid">
          <div className="corner" />
          {Array.from({ length: steps }, (_, index) => {
            const clock = stepClock(index, steps);
            const label = clock.minute === 0 ? formatClock(clock.hour, 0).slice(0, 2) : "";
            const isNow = nowHour === clock.hour && clock.minute === 0;
            return (
              <button
                key={index}
                type="button"
                className={index === step ? "ruler is-playhead" : "ruler"}
                aria-current={index === step ? "step" : undefined}
                aria-label={
                  isNow
                    ? `Go to ${formatClock(clock.hour, clock.minute)}, current hour`
                    : `Go to ${formatClock(clock.hour, clock.minute)}`
                }
                onClick={() => onJump(index)}
              >
                {isNow ? <i className="now-mark" /> : null}
                {label ? <span>{label}</span> : null}
              </button>
            );
          })}
          {rows.map((row) => {
            const isMuted = muted.has(row.track.id);
            return (
              <TrackRow
                key={row.track.id}
                row={row}
                steps={steps}
                gate={gate}
                step={step}
                muted={isMuted}
                onToggleMute={onToggleMute}
                onPreview={onPreview}
                onJump={onJump}
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
  row,
  steps,
  gate,
  step,
  muted,
  onToggleMute,
  onPreview,
  onJump,
  onHover,
}: {
  row: ProjectedTrack;
  steps: StepCount;
  gate: number;
  step: number;
  muted: boolean;
  onToggleMute: (id: string) => void;
  onPreview: (drum: DrumId) => void;
  onJump: (step: number) => void;
  onHover: (hover: { trackId: string; step: number } | null) => void;
}) {
  return (
    <>
      <div className={muted ? "gutter is-muted" : "gutter"}>
        <button type="button" className="track-name" onClick={() => onPreview(row.track.drum)}>
          <span>{row.track.name}</span>
          <span className="drum">{row.track.drum}</span>
        </button>
        <Button
          type="button"
          size="icon-xs"
          variant="outline"
          className={muted ? "mute is-on" : "mute"}
          aria-pressed={muted}
          aria-label={`${muted ? "Unmute" : "Mute"} ${row.track.name}`}
          onClick={() => onToggleMute(row.track.id)}
        >
          M
        </Button>
      </div>
      {row.values.map((velocity, index) => {
        const plays = !muted && velocity >= gate && velocity > 0;
        const clock = stepClock(index, steps);
        const time = formatClock(clock.hour, clock.minute);
        const detail = row.details[index] ?? "";
        return (
          <button
            key={index}
            type="button"
            className={cellClass(index === step, plays, muted)}
            style={{ "--v": String(velocity) } as CSSProperties}
            aria-label={`${row.track.name} ${time}. ${detail}. ${plays ? "Plays" : "Rest"}.`}
            onClick={() => onJump(index)}
            onMouseEnter={() => onHover({ trackId: row.track.id, step: index })}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover({ trackId: row.track.id, step: index })}
            onBlur={() => onHover(null)}
          >
            <span className="cell-fill" />
          </button>
        );
      })}
    </>
  );
}

function cellClass(playhead: boolean, plays: boolean, muted: boolean): string {
  const names = ["cell"];
  if (playhead) names.push("is-playhead");
  if (plays) names.push("is-on");
  if (muted) names.push("is-muted");
  return names.join(" ");
}
