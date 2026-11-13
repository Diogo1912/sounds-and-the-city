import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Engine } from "@/audio/engine";

type Props = {
  engineRef: RefObject<Engine | null>;
  vertical?: boolean;
};

export function ScopeMeter({ engineRef, vertical = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const bars = barsRef.current;
    if (!canvas || !bars) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let data = new Uint8Array(256);

    const draw = () => {
      const analyser = engineRef.current?.getAnalyser() ?? null;
      let level = 0;
      if (analyser) {
        if (data.length !== analyser.fftSize) data = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const sample of data) {
          const centered = (sample - 128) / 128;
          sum += centered * centered;
        }
        level = Math.min(1, Math.sqrt(sum / data.length) * 4.2);
        const width = canvas.width;
        const height = canvas.height;
        context.clearRect(0, 0, width, height);
        context.strokeStyle = getComputedStyle(canvas).color;
        context.lineWidth = 1.5;
        context.beginPath();
        const step = width / data.length;
        for (let index = 0; index < data.length; index += 1) {
          const y = ((255 - (data[index] ?? 128)) / 255) * height;
          if (index === 0) context.moveTo(0, y);
          else context.lineTo(index * step, y);
        }
        context.stroke();
      }
      const segments = bars.querySelectorAll("i");
      const lit = Math.round(level * segments.length);
      segments.forEach((segment, index) => {
        segment.classList.toggle("is-on", index < lit);
      });
      if (!reduced) frame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frame);
  }, [engineRef]);

  const count = vertical ? 12 : 10;
  return (
    <div className={vertical ? "meters is-vertical" : "meters"}>
      <canvas ref={canvasRef} className="scope" width={160} height={36} aria-hidden="true" />
      <div ref={barsRef} className="vu" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <i key={index} />
        ))}
      </div>
    </div>
  );
}
