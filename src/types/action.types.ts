import type { CommentType, Indicator, Position } from "./comment.types";
import type { CommentOverlayState, CommentVisibility } from "./overlay.types";

/**
 * Actions that can be performed on a comment
 */
export type CommentAction =
  | {
      type: "DELETE";
      id: string;
    }
  | {
      type: "UPDATE_COMMENTS";
      comments: CommentType[];
    }
  | {
      type: "APPEND_COMMENT";
      comment: CommentType;
    }
  | {
      type: "EDIT";
      id: string;
      newComment: Partial<CommentType>;
    }
  | {
      type: "REGISTER";
      sessionId: string;
      position: Position;
      indicatorPosition?: Indicator | null;
    }
  | {
      type: "FOCUS";
      id: string | null;
    }
  | {
      type: "TOGGLE_OVERLAY";
    }
  | {
      type: "CHANGE_OVERLAYSTATE";
      to: CommentOverlayState;
    }
  | {
      type: "REPLACE_COMMENT";
      id: string;
      comment: CommentType;
    }
  | {
      type: "UPDATE_VISIBILITY";
      visibility: Partial<CommentVisibility>;
    };
