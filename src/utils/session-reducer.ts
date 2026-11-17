import type { ConfirmedComment } from "../types/comment.types";
import type {
  ActiveFeedbackSession,
  FeedbackSession,
  SessionOperationState,
} from "../types/session.types";

export type SessionReducerState = {
  session: ActiveFeedbackSession | null;
  sessionState: SessionOperationState;
};

export type SessionAction =
  | { type: "SESSION_CREATED"; session: FeedbackSession }
  | { type: "SESSION_CONFIRMED"; confirmedAt: Date }
  | { type: "SESSION_RESOLVING_STARTED" }
  | { type: "SESSION_RESOLVED"; resolvedAt: Date }
  | { type: "COMMENT_COMMITTED"; comment: ConfirmedComment }
  | { type: "COMMENT_STATUS_CHANGED"; comment: ConfirmedComment }
  | { type: "COMMENT_REMOVED"; commentId: string }
  | { type: "SET_OPERATION_STATE"; to: SessionOperationState };

export const initialSessionReducerState: SessionReducerState = {
  session: null,
  sessionState: "idle",
};

const withSession = (
  state: SessionReducerState,
  session: ActiveFeedbackSession,
): SessionReducerState => ({ ...state, session });

type Handler<T extends SessionAction["type"]> = (
  state: SessionReducerState,
  action: Extract<SessionAction, { type: T }>,
) => SessionReducerState;

const onSessionCreated: Handler<"SESSION_CREATED"> = (state, action) => {
  // A new session is always a draft without comments or end dates.
  const { confirmedAt: _c, resolvedAt: _r, ...rest } = action.session;
  return withSession(state, {
    ...rest,
    participantIds: [...action.session.participantIds],
    status: "draft",
    comments: [],
  });
};

const onSessionConfirmed: Handler<"SESSION_CONFIRMED"> = (state, action) => {
  const { session } = state;
  if (!session || session.status !== "draft") return state;
  return withSession(state, {
    ...session,
    status: "confirmed",
    confirmedAt: action.confirmedAt,
  });
};

const onResolvingStarted: Handler<"SESSION_RESOLVING_STARTED"> = (state) => {
  const { session } = state;
  if (!session || session.status !== "confirmed") return state;
  return withSession(state, { ...session, status: "resolving" });
};

const onSessionResolved: Handler<"SESSION_RESOLVED"> = (state, action) => {
  const { session } = state;
  if (!session || session.status !== "resolving") return state;
  return withSession(state, {
    ...session,
    status: "resolved",
    resolvedAt: action.resolvedAt,
  });
};

const onCommentCommitted: Handler<"COMMENT_COMMITTED"> = (state, action) => {
  const { session } = state;
  if (!session || session.status !== "draft") return state;
  const { comment } = action;
  const exists = session.comments.some((c) => c.id === comment.id);
  const comments = exists
    ? session.comments.map((c) => (c.id === comment.id ? comment : c))
    : [...session.comments, comment];
  const userId = comment.user?.id;
  const participantIds =
    userId !== undefined && !session.participantIds.includes(userId)
      ? [...session.participantIds, userId]
      : session.participantIds;
  return withSession(state, { ...session, comments, participantIds });
};

const onCommentStatusChanged: Handler<"COMMENT_STATUS_CHANGED"> = (
  state,
  action,
) => {
  const { session } = state;
  if (!session || session.status !== "resolving") return state;
  const { comment } = action;
  return withSession(state, {
    ...session,
    comments: session.comments.map((c) => (c.id === comment.id ? comment : c)),
  });
};

const onCommentRemoved: Handler<"COMMENT_REMOVED"> = (state, action) => {
  const { session } = state;
  if (!session || session.status !== "draft") return state;
  return withSession(state, {
    ...session,
    comments: session.comments.filter((c) => c.id !== action.commentId),
  });
};

const onSetOperationState: Handler<"SET_OPERATION_STATE"> = (state, action) => {
  if (state.sessionState === action.to) return state;
  return { ...state, sessionState: action.to };
};

export const sessionReducer = (
  state: SessionReducerState,
  action: SessionAction,
): SessionReducerState => {
  switch (action.type) {
    case "SESSION_CREATED":
      return onSessionCreated(state, action);
    case "SESSION_CONFIRMED":
      return onSessionConfirmed(state, action);
    case "SESSION_RESOLVING_STARTED":
      return onResolvingStarted(state, action);
    case "SESSION_RESOLVED":
      return onSessionResolved(state, action);
    case "COMMENT_COMMITTED":
      return onCommentCommitted(state, action);
    case "COMMENT_STATUS_CHANGED":
      return onCommentStatusChanged(state, action);
    case "COMMENT_REMOVED":
      return onCommentRemoved(state, action);
    case "SET_OPERATION_STATE":
      return onSetOperationState(state, action);
    default:
      return state;
  }
};
