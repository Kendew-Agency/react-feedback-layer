import type { Comment, Indicator, Position } from "./comment.types";
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
      comments: Comment[];
    }
  | {
      type: "EDIT";
      id: string;
      newComment: Partial<Comment>;
    }
  | {
      type: "REGISTER";
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
      type: "RESET_DRAFT_COMMENTS";
    }
  | {
      type: "UPDATE_VISIBILITY";
      visibility: Partial<CommentVisibility>;
    };
