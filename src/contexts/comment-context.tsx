import {
  createContext,
  useContext,
  useEffect,
  useId,
  useReducer,
  useRef,
} from "react";
import {
  AddError,
  DeleteError,
  EditError,
  PermissionError,
  ReopenError,
  ResolveError,
  SessionStateError,
} from "../errors";
import { toKnownError } from "../lib/to-known-error";
import { tx } from "../lib/tx";
import type { ConfirmedComment } from "../types/comment.types";
import type {
  CommentType,
  CommentAction,
  CommentContext as CommentContextType,
  CommentOverlayProps,
  CommentOverlayState,
  CommentState,
  CommentVisibility,
  Indicator,
  Position,
  KnownError,
} from "../types";
import { hasStatus } from "../utils/hasStatus";
import { useCommentEvents } from "../lib/use-comment-events";
import { selectVisibleComments } from "../utils/select-visible-comments";
import { useSessionBridge } from "./feedback-session-context";
import { useOptionalCurrentUser } from "./user-context";

type ActionResult = { error: KnownError | null };

// Create the context for the comments
const CommentContext = createContext<CommentContextType | null>(null);

// The comment reducer
const commentReducer = (
  state: CommentState,
  action: CommentAction,
): CommentState => {
  switch (action.type) {
    case "REGISTER": {
      // Create a new id to handle both activeComment and the new comment
      const newId = `${state.config?.idPrefix ?? ""}${crypto.randomUUID()}`;
      return {
        ...state,
        overlayState: "editing",
        focussedComment: newId,
        comments: [
          ...state.comments,
          {
            id: newId,
            sessionId: action.sessionId,
            projectId: state.projectId,
            user: state.currentUser,
            position: {
              x: action.position.x,
              y: action.position.y,
            },
            content: "",
            createdAt: new Date(),
            status: "draft",
            indicator: action.indicatorPosition
              ? {
                  width: action.indicatorPosition?.width,
                  height: action.indicatorPosition?.height,
                }
              : null,
          },
        ],
      };
    }
    case "UPDATE_COMMENTS": {
      return {
        ...state,
        comments: action.comments,
      };
    }
    case "APPEND_COMMENT":
      return {
        ...state,
        comments: [...state.comments, action.comment],
      };
    case "DELETE":
      return {
        ...state,
        overlayState: "idle",
        focussedComment: null,
        comments: state.comments.filter((comment) => comment.id !== action.id),
      };
    case "EDIT":
      return {
        ...state,
        overlayState: "idle",
        focussedComment: null,
        comments: state.comments.map((comment) => {
          if (comment.id === action.id) {
            return { ...comment, ...action.newComment };
          }
          return comment;
        }),
      };
    case "FOCUS":
      return {
        ...state,
        overlayState: action.id === null ? "idle" : "editing",
        focussedComment: action.id,
      };
    case "TOGGLE_OVERLAY":
      return {
        ...state,
        overlayState: state.overlayState === "inactive" ? "idle" : "inactive",
      };
    case "CHANGE_OVERLAYSTATE":
      return {
        ...state,
        overlayState: action.to,
      };
    case "UPDATE_VISIBILITY":
      return {
        ...state,
        config: {
          ...state.config,
          commentVisibility: {
            ...state.config?.commentVisibility,
            ...action.visibility,
          },
        },
      };
    case "REPLACE_COMMENT":
      return {
        ...state,
        overlayState: "idle",
        focussedComment: null,
        comments: state.comments.map((comment) =>
          comment.id === action.id ? action.comment : comment,
        ),
      };
    default: {
      console.warn(`Unhandled action type, returning state`, action);
      return state;
    }
  }
};

/**
 * Comment context provider to provide the comments to the children components
 *
 * @param initialComments as the initial comments from the document
 */
export const CommentContextProvider = ({
  children,
  /**
   * The initial comment coming from Sanity
   */
  initialComments,
  /**
   * Initial state of the comment overlay
   * This is used to determine the initial state of the comment overlay
   * @default "inactive"
   */
  initialOverlayState,
  currentUser: currentUserProp,
  subscription,
  config = {
    commentVisibility: {
      hideResolved: false,
    },
  },
  projectId,
  onError,
  onAdd,
  onEdit,
  onDelete,
  onResolve,
  onReopen,
}: CommentOverlayProps) => {
  const hostRef = useRef({ onAdd, onEdit, onDelete, onResolve, onReopen });
  hostRef.current = { onAdd, onEdit, onDelete, onResolve, onReopen };

  // Throws without a FeedbackSessionProvider
  const bridge = useSessionBridge();
  const bridgeRef = useRef(bridge);
  bridgeRef.current = bridge;
  // Read through a ref so a changed permission applies to the next call
  const canResolveRef = useRef(bridge.canResolve);
  canResolveRef.current = bridge.canResolve;

  const contextUser = useOptionalCurrentUser();
  const currentUser =
    contextUser !== undefined ? contextUser : (currentUserProp ?? null);
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  // The reducer reads the latest user so REGISTER attributes drafts correctly
  const [state, dispatch] = useReducer(
    (current: CommentState, action: CommentAction) =>
      commentReducer(
        { ...current, currentUser: currentUserRef.current },
        action,
      ),
    undefined,
    (): CommentState => ({
      comments: initialComments ?? bridge.session?.comments ?? [],
      overlayState: initialOverlayState || "inactive",
      currentUser,
      focussedComment: null,
      config,
      projectId,
    }),
  );

  const { events, emit } = useCommentEvents();

  // Track focus changes and emit event
  const prevFocusRef = useRef<string | null>(null);
  useEffect(() => {
    if (state.focussedComment !== prevFocusRef.current) {
      const comment = state.comments.find(
        (c) => c.id === state.focussedComment,
      );
      emit("onFocusChange", state.focussedComment, comment);
      prevFocusRef.current = state.focussedComment;
    }
  }, [state.focussedComment, state.comments, emit]);

  // Replace the initial comments with the comments from the listen query
  useEffect(() => {
    if (!subscription) return;

    subscription.subscribe((data) => {
      dispatch({ type: "APPEND_COMMENT", comment: data });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [subscription]);

  const registerComment = (
    position: Position,
    indicatorPosition?: Indicator,
  ) => {
    const session = bridgeRef.current.session;
    if (session?.status !== "draft") {
      onError?.(new SessionStateError());
      return;
    }
    dispatch({
      type: "REGISTER",
      sessionId: session.id,
      position: position,
      indicatorPosition: indicatorPosition || null,
    });
  };

  // Emit onCommentRegistered after state updates with new draft
  const prevCommentsLengthRef = useRef(state.comments.length);
  useEffect(() => {
    if (state.comments.length > prevCommentsLengthRef.current) {
      const lastComment = state.comments[state.comments.length - 1];
      if (lastComment && lastComment.status === "draft") {
        emit("onCommentRegistered", lastComment);
      }
    }
    prevCommentsLengthRef.current = state.comments.length;
  }, [state.comments, emit]);

  // Report the number of local drafts so the session can refuse to confirm
  const providerId = useId();
  const localDraftCount = state.comments.filter(hasStatus("draft")).length;
  useEffect(() => {
    bridgeRef.current.setLocalDraftCount(providerId, localDraftCount);
  }, [providerId, localDraftCount]);
  useEffect(
    () => () => bridgeRef.current.setLocalDraftCount(providerId, 0),
    [providerId],
  );

  // Report a failure once and hand it back to the caller
  const fail = (error: KnownError): ActionResult => {
    onError?.(error);
    return { error };
  };

  const findComment = (id: string) =>
    state.comments.find((comment) => comment.id === id);

  const addComment = async (
    draft: CommentType,
    content: string,
  ): Promise<ActionResult> => {
    if (content.trim().length === 0) {
      return fail(new AddError("content is empty"));
    }
    const persisted: ConfirmedComment = {
      ...draft,
      content,
      status: "published",
    };
    const { onAdd } = hostRef.current;
    dispatch({ type: "CHANGE_OVERLAYSTATE", to: "saving" });
    if (onAdd) {
      const { error } = await tx.executeAsync(async () => onAdd(persisted));
      if (error) {
        dispatch({ type: "CHANGE_OVERLAYSTATE", to: "editing" });
        return fail(toKnownError(error, AddError));
      }
    }
    dispatch({ type: "REPLACE_COMMENT", id: draft.id, comment: persisted });
    bridgeRef.current.commitComment(persisted);
    emit("onCommentAdded", persisted);
    return { error: null };
  };

  const editComment = async (
    comment: CommentType,
    content: string,
  ): Promise<ActionResult> => {
    if (content === comment.content) return { error: null };
    const updated: ConfirmedComment = {
      ...comment,
      content,
      status: "published",
    };
    const { onEdit } = hostRef.current;
    if (onEdit) {
      const { error } = await tx.executeAsync(async () => onEdit(updated));
      if (error) return fail(toKnownError(error, EditError));
    }
    dispatch({ type: "REPLACE_COMMENT", id: comment.id, comment: updated });
    bridgeRef.current.commitComment(updated);
    emit("onCommentEdited", updated);
    return { error: null };
  };

  const updateComment = async (
    id: string,
    newComment: Pick<CommentType, "content">,
  ): Promise<ActionResult> => {
    const session = bridgeRef.current.session;
    if (session?.status !== "draft") {
      return fail(new SessionStateError());
    }
    const comment = findComment(id);
    if (!comment) return fail(new EditError("comment not found"));
    if (comment.status === "draft") {
      if (comment.sessionId !== session.id) {
        return fail(new SessionStateError());
      }
      return addComment(comment, newComment.content);
    }
    if (comment.status === "published") {
      return editComment(comment, newComment.content);
    }
    return fail(new EditError("a resolved comment cannot be edited"));
  };

  const removePersisted = async (id: string): Promise<ActionResult> => {
    const { onDelete } = hostRef.current;
    if (onDelete) {
      const { error } = await tx.executeAsync(async () => onDelete(id));
      if (error) return fail(toKnownError(error, DeleteError));
    }
    bridgeRef.current.removeComment(id);
    dispatch({ type: "DELETE", id });
    emit("onCommentDeleted", id);
    return { error: null };
  };

  const deleteComment = async (id: string): Promise<ActionResult> => {
    if (bridgeRef.current.session?.status !== "draft") {
      return fail(new SessionStateError());
    }
    const comment = findComment(id);
    if (!comment) return fail(new DeleteError("comment not found"));
    if (comment.status === "draft") {
      dispatch({ type: "DELETE", id });
      emit("onCommentDeleted", id);
      return { error: null };
    }
    return removePersisted(id);
  };

  // Comment ids with a resolve or reopen call in flight
  const statusInFlightRef = useRef(new Set<string>());

  // Returns the comment to change, or a result when the call must stop
  const guardStatusChange = (
    id: string,
    from: "published" | "resolved",
    failure: new (message?: string) => KnownError,
  ): ActionResult | { comment: CommentType } => {
    // Permission is checked before anything else
    if (!canResolveRef.current) return fail(new PermissionError());
    if (bridgeRef.current.session?.status !== "resolving") {
      return fail(new SessionStateError());
    }
    const comment = findComment(id);
    if (!comment) return fail(new failure("comment not found"));
    if (comment.status !== from) return { error: null };
    if (statusInFlightRef.current.has(id)) return { error: null };
    return { comment };
  };

  const changeStatus = async (
    id: string,
    step: {
      from: "published" | "resolved";
      build: (comment: CommentType) => ConfirmedComment;
      call: ((comment: ConfirmedComment) => Promise<void>) | undefined;
      failure: new (message?: string) => KnownError;
      event: "onCommentResolved" | "onCommentReopened";
    },
  ): Promise<ActionResult> => {
    const guard = guardStatusChange(id, step.from, step.failure);
    if (!("comment" in guard)) return guard;

    statusInFlightRef.current.add(id);
    try {
      const next = step.build(guard.comment);
      if (step.call) {
        const { call } = step;
        const { error } = await tx.executeAsync(async () => call(next));
        if (error) return fail(toKnownError(error, step.failure));
      }
      dispatch({ type: "REPLACE_COMMENT", id, comment: next });
      bridgeRef.current.commitCommentStatus(next);
      emit(step.event, next);
      return { error: null };
    } finally {
      statusInFlightRef.current.delete(id);
    }
  };

  const resolveComment = (id: string): Promise<ActionResult> =>
    changeStatus(id, {
      from: "published",
      build: (comment) => ({
        ...comment,
        status: "resolved",
        resolvedAt: new Date(),
      }),
      call: hostRef.current.onResolve,
      failure: ResolveError,
      event: "onCommentResolved",
    });

  const reopenComment = (id: string): Promise<ActionResult> =>
    changeStatus(id, {
      from: "resolved",
      build: (comment) => {
        const { resolvedAt: _resolvedAt, ...rest } = comment;
        return { ...rest, status: "published" };
      },
      call: hostRef.current.onReopen,
      failure: ReopenError,
      event: "onCommentReopened",
    });

  const getActiveComment = () => {
    return state.comments.find(
      (comment) => comment.id === state.focussedComment,
    );
  };

  const focusOnComment = (id: string | null) => {
    dispatch({ type: "FOCUS", id });
  };

  const toggleOverlay = () => {
    dispatch({ type: "TOGGLE_OVERLAY" });
  };

  // Scope to the active session and apply the draft filter before splitting
  const visibleComments = selectVisibleComments({
    comments: state.comments,
    session: bridge.session
      ? { id: bridge.session.id, status: bridge.session.status }
      : null,
    draftVisibility: state.config?.draftVisibility,
    currentUserId: currentUser?.id,
  });

  const updateCommentVisibility = (visibility: Partial<CommentVisibility>) => {
    dispatch({ type: "UPDATE_VISIBILITY", visibility });
  };

  const changeOverlayState = (state: CommentOverlayState) => {
    dispatch({ type: "CHANGE_OVERLAYSTATE", to: state });
  };

  const triggerError = (error: KnownError) => {
    if (onError) {
      onError(error);
    }
  };

  return (
    <CommentContext.Provider
      value={{
        draftComments: visibleComments.filter(hasStatus("draft")),
        comments: visibleComments.filter(hasStatus("published")),
        resolvedComments: visibleComments.filter(hasStatus("resolved")),
        allComments: visibleComments,

        config: state.config,
        changeOverlayState,
        overlayState: state.overlayState,
        deleteComment,
        updateComment,
        focusOnComment,
        registerComment,
        getActiveComment,
        toggleOverlay,
        currentUser,
        resolveComment,
        reopenComment,
        canResolve: bridge.canResolve,
        updateCommentVisibility,

        triggerError,
        events,
      }}
    >
      {children}
    </CommentContext.Provider>
  );
};

export const useComments = () => {
  // Fails early with a message naming FeedbackSessionProvider
  useSessionBridge();
  const context = useContext(CommentContext);
  if (!context) {
    throw new Error("useComments must be used within a CommentContextProvider");
  }
  return context;
};
