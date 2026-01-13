import { type CSSProperties, type ReactNode, useRef, useState } from "react";
import { useComments } from "../contexts/comment-context";
import type { Position } from "../types";
import { getRelativePos, normalizeRect } from "../utils/position";

const DRAG_THRESHOLD = 4;

export const CommentOverlay = ({ children }: { children: ReactNode }) => {
  const {
    overlayState,
    registerComment,
    focusOnComment,
    getActiveComment,
    changeOverlayState,
  } = useComments();
  const [preview, setPreview] = useState<null | {
    x: number;
    y: number;
    width: number;
    height: number;
  }>(null);

  const startRef = useRef<Position | null>(null);
  const draggingRef = useRef(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (overlayState === "editing") {
      alert(
        "Can not add a new comment. You are currently editing a comment. Please finish editing before adding a new one.",
      );
      return;
    }

    const el = overlayRef.current;
    if (!el) return;

    // capture pointer so we keep receiving move/up even if the pointer leaves the element
    el.setPointerCapture(e.pointerId);

    const start = getRelativePos(e.nativeEvent, el);
    startRef.current = start;
    draggingRef.current = false;
    setPreview(null);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = overlayRef.current;
    const start = startRef.current;
    if (!el || !start) return;

    const current = getRelativePos(e.nativeEvent, el);
    const dx = current.x - start.x;
    const dy = current.y - start.y;

    // decide when this becomes a “drag”
    if (!draggingRef.current && Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
      draggingRef.current = true;
    }

    if (draggingRef.current) {
      const rect = normalizeRect(start, current);
      setPreview(rect); // show selection box
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const el = overlayRef.current;
    const start = startRef.current;
    if (!el || !start) return;

    const end = getRelativePos(e.nativeEvent, el);

    // reset refs first
    startRef.current = null;

    if (!draggingRef.current) {
      // treat as click
      registerComment(start);
      return;
    }

    draggingRef.current = false;

    const rect = normalizeRect(start, end);

    // Ignore super tiny selections
    if (rect.width < DRAG_THRESHOLD && rect.height < DRAG_THRESHOLD) {
      registerComment(start);
      setPreview(null);
      return;
    }

    const commentPosition = {
      x: rect.x + rect.width,
      y: rect.y + rect.height,
    };

    // Here we use the normalized top-left as the comment position
    // and store width/height as indicator
    registerComment(commentPosition, {
      width: rect.width,
      height: rect.height,
    });

    setPreview(null);
  };

  if (overlayState === "inactive") return children;

  return (
    <div data-overlay style={{ position: "relative" }}>
      <div
        ref={overlayRef}
        // onClick={(e) => handleClick(e)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          ...OVERLAY_STYLES,
          ...(overlayState === "editing" && EDITING_STYLES),
        }}
      />
      {getActiveComment() && (
        // biome-ignore lint: This element should only handle clicks as a guard
        <div
          data-comment-guard
          onClick={() => {
            focusOnComment(null);
            changeOverlayState("idle");
          }}
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            inset: 0,
            zIndex: 20,
            isolation: "isolate",
          }}
        />
      )}
      {preview && (
        <div
          style={{
            position: "absolute",
            left: preview.x,
            top: preview.y,
            width: preview.width,
            height: preview.height,
            border: "1px dashed currentColor",
            pointerEvents: "none",
          }}
        />
      )}

      {children}
    </div>
  );
};

const OVERLAY_STYLES: CSSProperties = {
  width: "100%",
  height: "100%",
  position: "absolute",
  inset: 0,
  zIndex: 20,
  cursor: "crosshair",
  isolation: "isolate",
};

const EDITING_STYLES: CSSProperties = {
  pointerEvents: "none",
};
