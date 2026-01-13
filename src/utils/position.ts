import type { Position } from "../types";

export const getRelativePos = (e: PointerEvent, el: HTMLElement): Position => {
  const rect = el.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
};

export const normalizeRect = (a: Position, b: Position) => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const width = Math.abs(b.x - a.x);
  const height = Math.abs(b.y - a.y);
  return { x, y, width, height };
};
