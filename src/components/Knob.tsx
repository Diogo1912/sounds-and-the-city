import { useRef, useState } from "react";
import type { PointerEvent } from "react";

type Kind = "bullet" | "bell" | "roundel" | "tram" | "ticket";

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  resetValue: number;
  onChange: (value: number) => void;
  kind: Kind;
  size?: number;
  format?: (value: number) => string;
};

export function Knob({ label, value, min, max, resetValue, onChange, kind, size = 54, format }: Props) {
  const drag = useRef<{ y: number; value: number } | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const span = max - min || 1;
  const angle = -135 + ((value - min) / span) * 270;
  const shown = format ? format(value) : String(Math.round(value));

  function move(event: PointerEvent<HTMLButtonElement>) {
    if (!drag.current) return;
    const delta = drag.current.y - event.clientY;
    const next = clamp(drag.current.value + (delta / 110) * span, min, max);
    onChange(next);
    setTip(format ? format(next) : String(Math.round(next)));
  }

  return (
    <label className={`dial dial-${kind}`}>
      <button
        type="button"
        className="dial-face"
        style={{ width: size, height: size }}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
        aria-valuetext={shown}
        onPointerDown={(event) => {
          drag.current = { y: event.clientY, value };
          event.currentTarget.setPointerCapture(event.pointerId);
          setTip(shown);
        }}
        onPointerMove={move}
        onPointerUp={() => {
          drag.current = null;
          setTip(null);
        }}
        onDoubleClick={() => onChange(resetValue)}
      >
        <span className="dial-rotor" style={{ transform: `rotate(${angle}deg)` }} />
        {kind === "bullet" ? <span className="dial-num">{shown}</span> : null}
        {tip != null ? <span className="dial-tip">{label} {tip}</span> : null}
      </button>
      <span className="dial-label">{label}</span>
    </label>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
