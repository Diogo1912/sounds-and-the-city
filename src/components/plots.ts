import { useEffect, useRef } from "react";
import type { PointerEvent, RefObject } from "react";

type Plot = (context: CanvasRenderingContext2D, width: number, height: number, accent: string) => void;

export function usePlot(draw: Plot, animated = false): RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);

  useEffect(() => {
    drawRef.current = draw;
    if (!animated && canvasRef.current) render(canvasRef.current, draw);
  }, [draw, animated]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    function refresh() {
      if (!canvas) return;
      render(canvas, drawRef.current);
      if (animated && !motion.matches) frame = requestAnimationFrame(refresh);
    }

    function restart() {
      cancelAnimationFrame(frame);
      refresh();
    }

    const observer = new ResizeObserver(restart);
    observer.observe(canvas);
    motion.addEventListener("change", restart);
    restart();
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", restart);
      cancelAnimationFrame(frame);
    };
  }, [animated]);

  return canvasRef;
}

function render(canvas: HTMLCanvasElement, draw: Plot) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.clearRect(0, 0, width, height);
  draw(context, width, height, getComputedStyle(canvas).color);
}

export function plotGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(153, 174, 200, 0.11)";
  for (let column = 1; column < 8; column++) {
    const x = Math.round(width * column / 8) + 0.5;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let row = 1; row < 4; row++) {
    const y = Math.round(height * row / 4) + 0.5;
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
}

export function trace(
  ctx: CanvasRenderingContext2D, width: number, height: number,
  color: string, sample: (position: number) => number,
) {
  ctx.beginPath();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = color;
  const points = Math.max(100, Math.ceil(width));
  for (let i = 0; i <= points; i++) {
    const x = i / points;
    const y = height * sample(x);
    if (!i) ctx.moveTo(0, y);
    else ctx.lineTo(width * x, y);
  }
  ctx.stroke();
}

export function limit(value: number, low = 0, high = 1) {
  return Math.min(high, Math.max(low, value));
}

export function plotPosition(event: PointerEvent<HTMLElement>) {
  const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
  return [limit((event.clientX - left) / width), limit((event.clientY - top) / height)] as const;
}
