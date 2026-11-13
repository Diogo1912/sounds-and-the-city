import type { ReactNode } from "react";
import type { CityId } from "@/types";

type Props = { city: CityId; id: string };

export function Glyph({ city, id }: Props) {
  return (
    <svg className="glyph" viewBox="0 0 16 16" aria-hidden="true">
      {mark(city, id)}
    </svg>
  );
}

function mark(city: CityId, id: string): ReactNode {
  const key = `${city}:${id}`;
  if (key === "new-york:subway") return <Train />;
  if (key === "new-york:horn") return <Cab />;
  if (key === "new-york:turnstile") return <Turnstile />;
  if (key === "new-york:steam") return <Radiator />;
  if (key === "new-york:chime") return <Bell />;
  if (key === "new-york:hammer") return <Hammer />;
  if (key === "new-york:synth") return <Wave kind="square" />;
  if (key === "amsterdam:tram") return <Tram />;
  if (key === "amsterdam:bell") return <BikeBell />;
  if (key === "amsterdam:cobbles") return <Cobbles />;
  if (key === "amsterdam:canal") return <Waves />;
  if (key === "amsterdam:carillon") return <Carillon />;
  if (key === "amsterdam:bridge") return <Bridge />;
  if (key === "amsterdam:synth") return <Wave kind="pluck" />;
  if (key === "tokyo:train") return <Train />;
  if (key === "tokyo:crossing") return <Cross />;
  if (key === "tokyo:gate") return <Gate />;
  if (key === "tokyo:rail") return <Rail />;
  if (key === "tokyo:door") return <Door />;
  if (key === "tokyo:bowl") return <Bowl />;
  if (key === "tokyo:synth") return <Wave kind="fm" />;
  if (key === "london:bell") return <Bell />;
  if (key === "london:tube") return <Tunnel />;
  if (key === "london:cab") return <Cab />;
  if (key === "london:bus") return <BusBell />;
  if (key === "london:rain") return <Rain />;
  if (key === "london:diesel") return <Engine />;
  return <Wave kind="organ" />;
}

function Train() {
  return (
    <>
      <rect x="2" y="3" width="12" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 8h12M5 11v2M11 11v2" stroke="currentColor" strokeWidth="1.2" />
    </>
  );
}

function Cab() {
  return <path d="M2 10h12v2H2zM3 10l2-3h5l2 3M5 7V5h3" fill="none" stroke="currentColor" strokeWidth="1.2" />;
}

function Turnstile() {
  return <path d="M4 3v10M8 3v10M12 3v10M3 6h10" fill="none" stroke="currentColor" strokeWidth="1.2" />;
}

function Radiator() {
  return <path d="M3 3v10M6 3v10M9 3v10M12 3v10M2 3h12M2 13h12" fill="none" stroke="currentColor" strokeWidth="1.2" />;
}

function Bell() {
  return <path d="M8 2v2M4 9a4 4 0 0 1 8 0H4zM6 12h4" fill="none" stroke="currentColor" strokeWidth="1.2" />;
}

function Hammer() {
  return <path d="M8 6v8M4 6l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.2" />;
}

function Tram() {
  return (
    <>
      <rect x="3" y="4" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 4V2M5 8h2M9 8h2M4 14h2M10 14h2" stroke="currentColor" strokeWidth="1.2" />
    </>
  );
}

function BikeBell() {
  return (
    <>
      <circle cx="8" cy="8" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
    </>
  );
}

function Cobbles() {
  return (
    <>
      <rect x="2" y="3" width="5" height="4" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <rect x="9" y="3" width="5" height="4" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <rect x="2" y="9" width="5" height="4" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <rect x="9" y="9" width="5" height="4" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </>
  );
}

function Waves() {
  return <path d="M2 6c2 0 2 2 4 2s2-2 4-2 2 2 4 2M2 11c2 0 2 2 4 2s2-2 4-2 2 2 4 2" fill="none" stroke="currentColor" strokeWidth="1.2" />;
}

function Carillon() {
  return <path d="M3 3h10M5 3v2a2 2 0 0 0 0 4M8 3v2a2 2 0 0 0 0 4M11 3v2a2 2 0 0 0 0 4" fill="none" stroke="currentColor" strokeWidth="1.2" />;
}

function Bridge() {
  return <path d="M1 11h14M2 11c0-4 3-6 6-6s6 2 6 6" fill="none" stroke="currentColor" strokeWidth="1.2" />;
}

function Cross() {
  return <path d="M4 4l8 8M12 4L4 12" fill="none" stroke="currentColor" strokeWidth="1.4" />;
}

function Gate() {
  return <path d="M2 12h12M3 12V4h2v8M3 5h9" fill="none" stroke="currentColor" strokeWidth="1.2" />;
}

function Rail() {
  return <path d="M2 5h12M2 11h12M4 5v6M8 5v6M12 5v6" fill="none" stroke="currentColor" strokeWidth="1.2" />;
}

function Door() {
  return (
    <>
      <rect x="3" y="2" width="10" height="12" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 2v12M10 8h1" stroke="currentColor" strokeWidth="1.2" />
    </>
  );
}

function Bowl() {
  return <path d="M3 6h10c0 4-2 6-5 6s-5-2-5-6zM8 12v2" fill="none" stroke="currentColor" strokeWidth="1.2" />;
}

function Tunnel() {
  return <path d="M2 13V8a6 6 0 0 1 12 0v5M5 13V9M11 13V9" fill="none" stroke="currentColor" strokeWidth="1.2" />;
}

function BusBell() {
  return (
    <>
      <circle cx="8" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 11v3M6 14h4" stroke="currentColor" strokeWidth="1.2" />
    </>
  );
}

function Rain() {
  return <path d="M4 2v4M8 3v5M12 2v4M5 10v3M9 9v4M13 10v3" fill="none" stroke="currentColor" strokeWidth="1.2" />;
}

function Engine() {
  return <path d="M2 6h8v6H2zM10 8h3v2h-3M4 6V4M7 6V4M12 4h2v2" fill="none" stroke="currentColor" strokeWidth="1.2" />;
}

function Wave({ kind }: { kind: "square" | "pluck" | "fm" | "organ" }) {
  if (kind === "square") return <path d="M2 10V5h4v6h4V5h4v5" fill="none" stroke="currentColor" strokeWidth="1.2" />;
  if (kind === "pluck") return <path d="M2 12l4-8 2 5 2-3 4 6" fill="none" stroke="currentColor" strokeWidth="1.2" />;
  if (kind === "fm") return <path d="M2 8c1.5-4 2.5-4 4 0s2.5 4 4 0 2.5-4 4 0" fill="none" stroke="currentColor" strokeWidth="1.2" />;
  return <path d="M3 12V4M6 12V6M9 12V3M12 12V7" fill="none" stroke="currentColor" strokeWidth="1.4" />;
}
