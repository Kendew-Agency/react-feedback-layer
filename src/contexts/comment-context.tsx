import { createContext, useContext, useEffect, useReducer } from "react";
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
} from "../types";
import { tx } from "../lib/tx";
import { hasStatus } from "../utils/hasStatus";

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
        overlayState: "editing",
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
        commentVisibility: {
          ...state.commentVisibility,
          ...action.visibility,
        },
      };
    case "RESET_DRAFT_COMMENTS": {
      return {
        ...state,
        comments: state.comments.filter(
          (comment) => comment.status !== "draft",
        ),
        focussedComment: null,
      };
    }
    case "RESET_RESOLVING_COMMENTS":
      return {
        ...state,
        comments: state.comments.filter(
          (comment) => comment.status !== "resolving",
        ),
        focussedComment: null,
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
  onConfirm,
  onResolve,
  currentUser,
  subscription,
  config,
  onError,
}: CommentOverlayProps) => {
  const [state, dispatch] = useReducer(commentReducer, {
    comments: initialComments || [],
    overlayState: initialOverlayState || "inactive",
    currentUser,
    focussedComment: null,
    commentVisibility: {
      showResolved: false,
      showResolving: true,
    },
    config,
  } satisfies CommentState);

  // Replace the initial comments with the comments from the listen query
  useEffect(() => {
    if (!subscription) return;

    subscription.subscribe((update: CommentType[]) => {
      dispatch({ type: "UPDATE_COMMENTS", comments: update });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [subscription]);

  const registerComment = (
    position: Position,
    indicatorPosition?: Indicator,
  ) => {
    dispatch({
      type: "REGISTER",
      position: position,
      indicatorPosition: indicatorPosition || null,
    });
  };

  // Delete a comment from the context
  const deleteComment = (id: string) => {
    dispatch({ type: "DELETE", id });
  };

  // Update a comment in the context
  const updateComment = (
    id: string,
    newComment: Pick<CommentType, "content">,
  ) => {
    dispatch({ type: "EDIT", id, newComment });
  };

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

  /**
   * Get all draft comments from the context
   *
   * @returns the draft comments
   */
  const getDraftComments = () => {
    return state.comments.filter(hasStatus("draft"));
  };

  /**
   * Get all confirmed comments from the context
   *
   * @returns the confirmed comments
   */
  const getConfirmedComments = () => {
    return state.comments.filter(hasStatus("published"));
  };

  /**
   * Get all resolving comments from the context
   *
   * @returns the resolving comments
   */
  const getResolvingComments = () => {
    return state.comments.filter(hasStatus("resolving"));
  };

  /**
   * Get all resolved comments from the context
   *
   * @returns the resolved comments
   */
  const getResolvedComments = () => {
    return state.comments.filter(hasStatus("resolved"));
  };

  const toggleResolvingComment = (id: string) => {
    const comment = state.comments.find((comment) => comment.id === id);
    dispatch({
      type: "EDIT",
      id,
      newComment: {
        status: comment?.status === "resolving" ? "published" : "resolving",
      },
    });
  };

  const confirmComments = async () => {
    dispatch({ type: "CHANGE_OVERLAYSTATE", to: "saving" });
    const draftComments = getDraftComments();
    const { error } = await tx.executeAsync(async () =>
      onConfirm(
        draftComments.map((c) => ({
          ...c,
          status: "published",
        })),
      ),
    );

    if (error) {
      dispatch({ type: "CHANGE_OVERLAYSTATE", to: "error" });
      if (onError) {
        onError(error);
      }
      return { error };
    }

    dispatch({ type: "CHANGE_OVERLAYSTATE", to: "idle" });
    dispatch({ type: "RESET_DRAFT_COMMENTS" });
    return { error: null };
  };

  const resolveComments = async () => {
    dispatch({ type: "CHANGE_OVERLAYSTATE", to: "resolving" });
    const resolvingComments = getResolvingComments();

    const { error } = await tx.executeAsync(async () =>
      onResolve(
        resolvingComments.map((c) => ({
          ...c,
          status: "resolved",
        })),
      ),
    );
    if (error) {
      dispatch({ type: "CHANGE_OVERLAYSTATE", to: "error" });
      if (onError) {
        onError(error);
      }
      return { error };
    }

    dispatch({ type: "RESET_RESOLVING_COMMENTS" });
    dispatch({ type: "CHANGE_OVERLAYSTATE", to: "idle" });
    return { error: null };
  };

  const updateCommentVisibility = (visibility: Partial<CommentVisibility>) => {
    dispatch({ type: "UPDATE_VISIBILITY", visibility });
  };

  const changeOverlayState = (state: CommentOverlayState) => {
    dispatch({ type: "CHANGE_OVERLAYSTATE", to: state });
  };

  return (
    <CommentContext.Provider
      value={{
        draftComments: getDraftComments(),
        comments: getConfirmedComments(),
        resolvingComments: getResolvingComments(),
        resolvedComments: getResolvedComments(),
        allComments: state.comments,

        config: state.config,
        changeOverlayState,
        toggleResolvingComment,
        overlayState: state.overlayState,
        deleteComment,
        updateComment,
        focusOnComment,
        registerComment,
        getActiveComment,
        toggleOverlay,
        confirmComments,
        currentUser,
        resolveComments,
        commentVisibility: state.commentVisibility,
        updateCommentVisibility,
      }}
    >
      {children}
    </CommentContext.Provider>
  );
};

export const useComments = () => {
  const context = useContext(CommentContext);
  if (!context) {
    throw new Error("useComments must be used within a CommentContextProvider");
  }
  return context;
};
