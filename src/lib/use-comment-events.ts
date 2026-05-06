import { useCallback, useRef } from "react";
import type {
  CommentEventMap,
  CommentEvents,
  Unsubscribe,
} from "../types/event.types";

type Listeners = {
  [K in keyof CommentEventMap]: Set<CommentEventMap[K]>;
};

/**
 * Internal hook that creates the event subscription system.
 * Returns both the public `events` object (for consumers) and
 * an `emit` function (for the provider to trigger events).
 */
export const useCommentEvents = () => {
  const listenersRef = useRef<Listeners>({
    onFocusChange: new Set(),
    onCommentsConfirmed: new Set(),
    onCommentsResolved: new Set(),
    onCommentDeleted: new Set(),
    onCommentRegistered: new Set(),
  });

  const subscribe = useCallback(
    <K extends keyof CommentEventMap>(
      event: K,
      callback: CommentEventMap[K],
    ): Unsubscribe => {
      listenersRef.current[event].add(callback);
      return () => {
        listenersRef.current[event].delete(callback);
      };
    },
    [],
  );

  const emit = useCallback(
    <K extends keyof CommentEventMap>(
      event: K,
      ...args: Parameters<CommentEventMap[K]>
    ) => {
      for (const listener of listenersRef.current[event]) {
        (listener as (...a: Parameters<CommentEventMap[K]>) => void)(...args);
      }
    },
    [],
  );

  const events: CommentEvents = {
    onFocusChange: (callback) => subscribe("onFocusChange", callback),
    onCommentsConfirmed: (callback) =>
      subscribe("onCommentsConfirmed", callback),
    onCommentsResolved: (callback) => subscribe("onCommentsResolved", callback),
    onCommentDeleted: (callback) => subscribe("onCommentDeleted", callback),
    onCommentRegistered: (callback) =>
      subscribe("onCommentRegistered", callback),
  };

  return { events, emit };
};
