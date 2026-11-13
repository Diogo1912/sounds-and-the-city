import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { CityId } from "@/types";

type Props = {
  city: CityId;
  value: number;
  resetValue: number;
  onChange: (value: number) => void;
};

const MIN = 60;
const MAX = 180;

export function TempoDial({ city, value, resetValue, onChange }: Props) {
  const drag = useRef<{ y: number; value: number } | null>(null);
  const [tip, setTip] = useState<number | null>(null);
  const angle = -140 + ((value - MIN) / (MAX - MIN)) * 280;

  function setFromPointer(event: PointerEvent<HTMLButtonElement>) {
    if (!drag.current) return;
    const delta = drag.current.y - event.clientY;
    const next = Math.round(Math.min(MAX, Math.max(MIN, drag.current.value + delta * 0.7)));
    onChange(next);
    setTip(next);
  }

  return (
    <div className={`tempo tempo-${city}`}>
      <button
        type="button"
        className="tempo-face"
        role="slider"
        aria-label="Tempo"
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={value}
        onPointerDown={(event) => {
          drag.current = { y: event.clientY, value };
          event.currentTarget.setPointerCapture(event.pointerId);
          setTip(value);
        }}
        onPointerMove={setFromPointer}
        onPointerUp={() => {
          drag.current = null;
          setTip(null);
        }}
        onDoubleClick={() => onChange(resetValue)}
      >
        {city === "tokyo" ? <Segments value={value} /> : null}
        {city === "london" ? <ClockHand angle={angle} /> : null}
        {city !== "tokyo" && city !== "london" ? (
          <span className="tempo-rotor" style={{ transform: `rotate(${angle}deg)` }} />
        ) : null}
        {city !== "tokyo" ? <span className="tempo-read">{value}</span> : null}
        {tip != null ? <span className="dial-tip">Tempo {tip}</span> : null}
      </button>
      <span className="dial-label">Tempo</span>
    </div>
  );
}

function ClockHand({ angle }: { angle: number }) {
  return (
    <svg className="clock-face" viewBox="0 0 100 100" aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => {
        const turn = (index / 12) * Math.PI * 2;
        const x1 = 50 + Math.sin(turn) * 38;
        const y1 = 50 - Math.cos(turn) * 38;
        const x2 = 50 + Math.sin(turn) * 44;
        const y2 = 50 - Math.cos(turn) * 44;
        return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
      <circle cx="50" cy="50" r="3" />
      <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "50px 50px" }}>
        <line x1="50" y1="54" x2="50" y2="18" />
      </g>
    </svg>
  );
}

const MASKS: Record<string, string> = {
  "0": "abcdef",
  "1": "bc",
  "2": "abged",
  "3": "abgcd",
  "4": "fgbc",
  "5": "afgcd",
  "6": "afgcde",
  "7": "abc",
  "8": "abcdefg",
  "9": "abcfg",
};

function Segments({ value }: { value: number }) {
  const text = String(value).padStart(3, "0");
  return (
    <span className="seg-row" aria-hidden="true">
      {text.split("").map((digit, index) => (
        <span key={index} className="seg7">
          {"abcdefg".split("").map((segment) => (
            <i key={segment} className={`lamp lamp-${segment}${MASKS[digit]?.includes(segment) ? " is-on" : ""}`} />
          ))}
        </span>
      ))}
    </span>
  );
}
