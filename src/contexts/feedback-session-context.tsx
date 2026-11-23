import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import {
  ConfirmError,
  PermissionError,
  SessionCreateError,
  SessionResolveError,
  SessionStateError,
  StartResolvingError,
} from "../errors";
import { toKnownError } from "../lib/to-known-error";
import { tx } from "../lib/tx";
import {
  type SessionEvents,
  useSessionEvents,
} from "../lib/use-session-events";
import type { ConfirmedComment, User } from "../types/comment.types";
import type { KnownError } from "../types/error.types";
import type {
  ActiveFeedbackSession,
  CreateSessionInput,
  FeedbackSession,
  InitialFeedbackSession,
  SessionOperationState,
  SessionType,
} from "../types/session.types";
import {
  confirmRefusal,
  resolveRefusal,
  sumCounts,
} from "../utils/session-guards";
import {
  initialSessionReducerState,
  type SessionAction,
  type SessionReducerState,
  sessionReducer,
} from "../utils/session-reducer";
import { isSessionType, parseInitialSession } from "../utils/session-type";

export type FeedbackSessionProviderProps = {
  children: ReactNode;
  /** Resume a session, for example after a reload */
  initialSession?: InitialFeedbackSession;
  /** Default project id sent to onCreateSession */
  projectId?: string;
  /**
   * Whether the current user may start the resolution of a session, resolve a
   * session, and resolve and reopen comments.
   * @default false
   */
  canResolveSession?: boolean;
  onCreateSession?: (input: CreateSessionInput) => Promise<FeedbackSession>;
  onConfirmSession?: (sessionId: string, type: SessionType) => Promise<void>;
  onStartResolving?: (sessionId: string) => Promise<void>;
  onResolveSession?: (sessionId: string) => Promise<void>;
  onError?: (error: KnownError) => void;
};

type ActionResult = { error: KnownError | null };

export type FeedbackSessionContextType = {
  session: ActiveFeedbackSession | null;
  sessionState: SessionOperationState;
  /** Mirrors the canResolveSession prop */
  canResolve: boolean;
  createSession: (options: {
    /** The user creating the session. Required, a missing user is refused */
    user: User;
    type?: SessionType;
    projectId?: string;
  }) => Promise<ActionResult>;
  confirmSession: () => Promise<ActionResult>;
  startResolving: () => Promise<ActionResult>;
  resolveSession: () => Promise<ActionResult>;
  events: SessionEvents;
};

/** Internal. Not exported from the package. */
export type SessionBridge = {
  session: ActiveFeedbackSession | null;
  canResolve: boolean;
  commitComment: (comment: ConfirmedComment) => void;
  commitCommentStatus: (comment: ConfirmedComment) => void;
  removeComment: (commentId: string) => void;
  setLocalDraftCount: (providerId: string, count: number) => void;
};

const FeedbackSessionContext = createContext<FeedbackSessionContextType | null>(
  null,
);
const SessionBridgeContext = createContext<SessionBridge | null>(null);

const MAX_PROJECT_ID_LENGTH = 128;

const isValidProjectId = (projectId: unknown): boolean =>
  projectId === undefined ||
  (typeof projectId === "string" &&
    projectId.length >= 1 &&
    projectId.length <= MAX_PROJECT_ID_LENGTH);

const pick = <T,>(value: T | undefined, fallback: T): T =>
  value !== undefined ? value : fallback;

const createRefusal = (
  type: unknown,
  projectId: unknown,
  inFlight: SessionOperationState,
  hasCallback: boolean,
  user: User | null | undefined,
): string | null => {
  if (!user) return "user is required";
  if (!isSessionType(type)) return "unknown session type";
  if (!isValidProjectId(projectId)) {
    return "projectId must be 1 to 128 characters";
  }
  if (inFlight === "creating") return "creation already in progress";
  if (!hasCallback) return "onCreateSession is not provided";
  return null;
};

export const FeedbackSessionProvider = ({
  children,
  initialSession,
  projectId,
  canResolveSession = false,
  onCreateSession,
  onConfirmSession,
  onStartResolving,
  onResolveSession,
  onError,
}: FeedbackSessionProviderProps) => {
  // Parsed once. An invalid value starts with no session and is reported
  // from the mount effect below.
  const initialParsedRef = useRef<ActiveFeedbackSession | null | undefined>(
    undefined,
  );
  if (initialParsedRef.current === undefined) {
    initialParsedRef.current =
      initialSession === undefined ? null : parseInitialSession(initialSession);
  }

  const [state, dispatch] = useReducer(
    sessionReducer,
    initialParsedRef.current,
    (session): SessionReducerState => ({
      ...initialSessionReducerState,
      session,
    }),
  );

  // Synchronous mirror of the reducer state, so guards and events see the
  // result of a dispatch in the same tick.
  const stateRef = useRef<SessionReducerState>({
    ...initialSessionReducerState,
    session: initialParsedRef.current,
  });
  const apply = useCallback((action: SessionAction) => {
    stateRef.current = sessionReducer(stateRef.current, action);
    dispatch(action);
  }, []);

  const canResolveRef = useRef(canResolveSession);
  canResolveRef.current = canResolveSession;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const inFlightRef = useRef<SessionOperationState>("idle");
  const localDraftCountsRef = useRef(new Map<string, number>());

  const { events, emit } = useSessionEvents();

  const report = useCallback((error: KnownError) => {
    onErrorRef.current?.(error);
  }, []);

  // Report an invalid initialSession once on mount.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount only
  useEffect(() => {
    if (initialSession !== undefined && initialParsedRef.current === null) {
      report(new SessionStateError("initialSession has an invalid status"));
    }
  }, []);

  const createSession = useCallback<
    FeedbackSessionContextType["createSession"]
  >(
    async (options) => {
      const type = options?.type ?? "feedback";
      const user = options?.user;
      const sessionProjectId = pick(options?.projectId, projectId);

      const refusal = createRefusal(
        type,
        sessionProjectId,
        inFlightRef.current,
        onCreateSession !== undefined,
        user,
      );
      if (refusal !== null || !onCreateSession) {
        const error = new SessionCreateError(refusal ?? undefined);
        report(error);
        return { error };
      }

      inFlightRef.current = "creating";
      apply({ type: "SET_OPERATION_STATE", to: "creating" });
      try {
        const input: CreateSessionInput = {
          type,
          user: user as User,
          projectId: sessionProjectId,
        };
        const { data, error } = await tx.executeAsync(async () =>
          onCreateSession(input),
        );
        if (error || !data) {
          const known = toKnownError(error, SessionCreateError);
          report(known);
          return { error: known };
        }
        apply({
          type: "SESSION_CREATED",
          session: { ...data, status: "draft", type },
        });
        const created = stateRef.current.session;
        if (created) emit("onSessionCreated", created);
        return { error: null };
      } finally {
        inFlightRef.current = "idle";
        apply({ type: "SET_OPERATION_STATE", to: "idle" });
      }
    },
    [apply, emit, onCreateSession, projectId, report],
  );

  const confirmSession = useCallback<
    FeedbackSessionContextType["confirmSession"]
  >(async () => {
    if (inFlightRef.current === "confirming") return { error: null };

    const session = stateRef.current.session;
    const refusal = confirmRefusal(
      session,
      sumCounts(localDraftCountsRef.current),
    );
    if (refusal !== null || !session) {
      const error = new SessionStateError(refusal ?? undefined);
      report(error);
      return { error };
    }

    inFlightRef.current = "confirming";
    apply({ type: "SET_OPERATION_STATE", to: "confirming" });
    try {
      if (onConfirmSession) {
        const { error } = await tx.executeAsync(async () =>
          onConfirmSession(session.id, session.type),
        );
        if (error) {
          const known = toKnownError(error, ConfirmError);
          report(known);
          return { error: known };
        }
      }
      apply({ type: "SESSION_CONFIRMED", confirmedAt: new Date() });
      const confirmed = stateRef.current.session;
      if (confirmed) emit("onSessionConfirmed", confirmed);
      return { error: null };
    } finally {
      inFlightRef.current = "idle";
      apply({ type: "SET_OPERATION_STATE", to: "idle" });
    }
  }, [apply, emit, onConfirmSession, report]);

  const refuse = useCallback(
    (error: KnownError): ActionResult => {
      report(error);
      return { error };
    },
    [report],
  );

  // Shared flow for the two resolution transitions. Guards run in order:
  // permission, in-flight, status.
  const runTransition = useCallback(
    async (step: {
      pending: SessionOperationState;
      guard: (session: ActiveFeedbackSession | null) => string | null;
      call: ((sessionId: string) => Promise<void>) | undefined;
      failure: new (message?: string) => KnownError;
      commit: () => void;
    }): Promise<ActionResult> => {
      if (!canResolveRef.current) return refuse(new PermissionError());
      if (inFlightRef.current === step.pending) return { error: null };

      const session = stateRef.current.session;
      const refusal = step.guard(session);
      if (refusal !== null || !session) {
        return refuse(new SessionStateError(refusal ?? undefined));
      }

      inFlightRef.current = step.pending;
      apply({ type: "SET_OPERATION_STATE", to: step.pending });
      try {
        const call = step.call;
        if (call) {
          const { error } = await tx.executeAsync(async () => call(session.id));
          if (error) return refuse(toKnownError(error, step.failure));
        }
        step.commit();
        return { error: null };
      } finally {
        inFlightRef.current = "idle";
        apply({ type: "SET_OPERATION_STATE", to: "idle" });
      }
    },
    [apply, refuse],
  );

  const startResolving = useCallback<
    FeedbackSessionContextType["startResolving"]
  >(
    () =>
      runTransition({
        pending: "startingResolution",
        guard: (session) =>
          session?.status === "confirmed" ? null : "session is not confirmed",
        call: onStartResolving,
        failure: StartResolvingError,
        commit: () => {
          apply({ type: "SESSION_RESOLVING_STARTED" });
          const resolving = stateRef.current.session;
          if (resolving) emit("onSessionResolving", resolving);
        },
      }),
    [apply, emit, onStartResolving, runTransition],
  );

  const resolveSession = useCallback<
    FeedbackSessionContextType["resolveSession"]
  >(
    () =>
      runTransition({
        pending: "completingResolution",
        guard: resolveRefusal,
        call: onResolveSession,
        failure: SessionResolveError,
        commit: () => {
          apply({ type: "SESSION_RESOLVED", resolvedAt: new Date() });
          const resolved = stateRef.current.session;
          if (resolved) emit("onSessionResolved", resolved);
        },
      }),
    [apply, emit, onResolveSession, runTransition],
  );

  const commitComment = useCallback(
    (comment: ConfirmedComment) =>
      apply({ type: "COMMENT_COMMITTED", comment }),
    [apply],
  );
  const commitCommentStatus = useCallback(
    (comment: ConfirmedComment) =>
      apply({ type: "COMMENT_STATUS_CHANGED", comment }),
    [apply],
  );
  const removeComment = useCallback(
    (commentId: string) => apply({ type: "COMMENT_REMOVED", commentId }),
    [apply],
  );
  const setLocalDraftCount = useCallback(
    (providerId: string, count: number) => {
      if (count > 0) localDraftCountsRef.current.set(providerId, count);
      else localDraftCountsRef.current.delete(providerId);
    },
    [],
  );

  const bridge = useMemo<SessionBridge>(
    () => ({
      session: state.session,
      canResolve: canResolveSession,
      commitComment,
      commitCommentStatus,
      removeComment,
      setLocalDraftCount,
    }),
    [
      state.session,
      canResolveSession,
      commitComment,
      commitCommentStatus,
      removeComment,
      setLocalDraftCount,
    ],
  );

  const value: FeedbackSessionContextType = {
    session: state.session,
    sessionState: state.sessionState,
    canResolve: canResolveSession,
    createSession,
    confirmSession,
    startResolving,
    resolveSession,
    events,
  };

  return (
    <FeedbackSessionContext.Provider value={value}>
      <SessionBridgeContext.Provider value={bridge}>
        {children}
      </SessionBridgeContext.Provider>
    </FeedbackSessionContext.Provider>
  );
};

export const useFeedbackSession = (): FeedbackSessionContextType => {
  const context = useContext(FeedbackSessionContext);
  if (!context) {
    throw new Error(
      "useFeedbackSession must be used within a FeedbackSessionProvider",
    );
  }
  return context;
};

/** Internal. Not exported from src/index.ts. */
export const useSessionBridge = (): SessionBridge => {
  const bridge = useContext(SessionBridgeContext);
  if (!bridge) {
    throw new Error(
      "CommentContextProvider must be used within a FeedbackSessionProvider",
    );
  }
  return bridge;
};
