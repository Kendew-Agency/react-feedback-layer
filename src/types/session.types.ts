import type { ConfirmedComment, User } from "./comment.types";

/**
 * Discriminator for the kind of session.
 * Adding "rework" later is a change to this union only.
 */
export type SessionType = "feedback";

export type SessionStatus = "draft" | "confirmed" | "resolving" | "resolved";

/**
 * The pending operation of the session provider
 */
export type SessionOperationState =
  | "idle"
  | "creating"
  | "confirming"
  | "startingResolution"
  | "completingResolution";

export type FeedbackSession = {
  id: string;
  type: SessionType;
  status: SessionStatus;
  createdAt: Date;
  /** The id of the user who created the session, never a user object */
  createdBy: string;
  /** Ids of the users that took part in the session. May be empty */
  participantIds: string[];
  confirmedAt?: Date;
  resolvedAt?: Date;
  projectId?: string | undefined;
  /** Reserved for a future rework session. No behavior depends on it. */
  sourceSessionId?: string | undefined;
};

/**
 * The session as held by the provider, with its persisted comments
 */
export type ActiveFeedbackSession = FeedbackSession & {
  comments: ConfirmedComment[];
};

/**
 * Accepted by `initialSession`. `comments` is optional for convenience
 */
export type InitialFeedbackSession = FeedbackSession & {
  comments?: ConfirmedComment[];
};

/**
 * Input passed to `onCreateSession`
 */
export type CreateSessionInput = {
  type: SessionType;
  user: User;
  projectId?: string | undefined;
};

/**
 * Event map for session-related events
 */
export type SessionEventMap = {
  /** Triggered when a new draft session was created */
  onSessionCreated: (session: ActiveFeedbackSession) => void;
  /** Triggered when the session was confirmed */
  onSessionConfirmed: (session: ActiveFeedbackSession) => void;
  /** Triggered when the session moved to resolving */
  onSessionResolving: (session: ActiveFeedbackSession) => void;
  /** Triggered when the session was resolved */
  onSessionResolved: (session: ActiveFeedbackSession) => void;
};
