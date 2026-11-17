import type {
  ActiveFeedbackSession,
  SessionStatus,
  SessionType,
} from "../types/session.types";

export const SESSION_TYPES = ["feedback"] as const;

export const isSessionType = (value: unknown): value is SessionType =>
  SESSION_TYPES.includes(value as SessionType);

/**
 * Behavior that depends on the session type. Keyed by `type`, so a future
 * "rework" type is added here and in the `SessionType` union only.
 */
export type SessionTypeHandler = {
  type: SessionType;
};

export const SESSION_TYPE_HANDLERS: Record<SessionType, SessionTypeHandler> = {
  feedback: { type: "feedback" },
};

const SESSION_STATUSES: readonly SessionStatus[] = [
  "draft",
  "confirmed",
  "resolving",
  "resolved",
];

/**
 * Returns the session when it has a valid status, otherwise null.
 * `comments` defaults to an empty array.
 */
export const parseInitialSession = (
  value: unknown,
): ActiveFeedbackSession | null => {
  if (value === null || typeof value !== "object") return null;

  const status = (value as { status?: unknown }).status;
  if (!SESSION_STATUSES.includes(status as SessionStatus)) return null;

  const session = value as Partial<ActiveFeedbackSession>;
  return {
    ...(value as ActiveFeedbackSession),
    comments: session.comments ?? [],
  };
};
