import { useCallback, useRef } from "react";
import type { Unsubscribe } from "../types/event.types";
import type { SessionEventMap } from "../types/session.types";

type Listeners = {
  [K in keyof SessionEventMap]: Set<SessionEventMap[K]>;
};

/**
 * The session events object exposed via useSession()
 * Each method accepts a callback and returns an unsubscribe function
 */
export type SessionEvents = {
  [K in keyof SessionEventMap]: (callback: SessionEventMap[K]) => Unsubscribe;
};

/**
 * Internal hook that creates the session event subscription system.
 * Returns both the public `events` object (for consumers) and
 * an `emit` function (for the provider to trigger events).
 */
export const useSessionEvents = () => {
  const listenersRef = useRef<Listeners>({
    onSessionCreated: new Set(),
    onSessionConfirmed: new Set(),
    onSessionResolving: new Set(),
    onSessionResolved: new Set(),
  });

  const subscribe = useCallback(
    <K extends keyof SessionEventMap>(
      event: K,
      callback: SessionEventMap[K],
    ): Unsubscribe => {
      listenersRef.current[event].add(callback);
      return () => {
        listenersRef.current[event].delete(callback);
      };
    },
    [],
  );

  const emit = useCallback(
    <K extends keyof SessionEventMap>(
      event: K,
      ...args: Parameters<SessionEventMap[K]>
    ) => {
      for (const listener of listenersRef.current[event]) {
        (listener as (...a: Parameters<SessionEventMap[K]>) => void)(...args);
      }
    },
    [],
  );

  const events: SessionEvents = {
    onSessionCreated: (callback) => subscribe("onSessionCreated", callback),
    onSessionConfirmed: (callback) => subscribe("onSessionConfirmed", callback),
    onSessionResolving: (callback) => subscribe("onSessionResolving", callback),
    onSessionResolved: (callback) => subscribe("onSessionResolved", callback),
  };

  return { events, emit };
};
