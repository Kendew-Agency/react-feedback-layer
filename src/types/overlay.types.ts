import type { ReactNode } from "react";
import type { CommentType, ConfirmedComment, User } from "./comment.types";

export type CommentState = {
  /**
   * All confirmed comments
   * @description This is used to track all confirmed comments
   */
  comments: CommentType[];
  /**
   * The state of the comment overlay
   * @description This value is used to track the state of the comment overlay
   * @see CommentOverlayState
   */
  overlayState: CommentOverlayState;
  /**
   * The current loged in user.
   * @description This data will be included when a user adds a comment
   */
  currentUser: User | null;
  /**
   * The visibility of the different type of comments
   * @description This is used to temporarily hide comments of a certain type if a user whishes a cleaner view
   * @see CommentVisibility
   */
  commentVisibility: CommentVisibility;
  /**
   * Track the focussed comment when editing or adding a comment
   * The comment key will be stored in this state
   */
  focussedComment: string | null;
  /**
   * Any error that occurs during comment operations
   * The value can be used to display an error message to the user
   */
  error?: Error;
};

/**
 * The state of the comment overlay
 * @description This is used to track the state of the comment overlay
 */
export type CommentOverlayState =
  | "idle"
  | "editing"
  | "saving"
  | "error"
  | "resolving"
  | "inactive";

export type CommentVisibility = {
  /**
   * Show comments that are marked as resolved
   * @default false
   */
  showResolved: boolean;
  /**
   * Show comments that are being resolved
   * @default true
   */
  showResolving: boolean;
};

export type CommentOverlayProps = {
  /**
   * Initial comments present when opening the comment overlay
   * @description These comments usually come from your database
   */
  initialComments?: ConfirmedComment[];
  /**
   * The current user
   *
   * @description This is used to identify the user in your database. If you can not provide a user, comments will be added anonymously
   * @default null
   */
  currentUser: User | null;
  /**
   * The children of the comment overlay
   * @description This is where the comments will be rendered
   */
  children: ReactNode;
  /**
   * The state of the overlay on initial render
   * @default "inactive"
   */
  initialState?: CommentOverlayState;
  /**
   * Realtime subscription if supported by you DB
   */
  subscription?: Suscription;
  mode?: "onConfirm";
  /**
   * Callback with all newly confirmed comments
   *
   * @param comments as the comments pushed by the user
   */
  onConfirm: (comments: ConfirmedComment[]) => Promise<void>;
  /**
   * Callback to handle resolved comments
   *
   * @param comments as the comments that are marked as resolved
   */
  onResolve: (comments: ConfirmedComment[]) => Promise<void>;
};

type Suscription = {
  subscribe: (update: unknown) => void;
  unsubscribe: () => void;
};

// type ModeWithConfirmation =
//   | {
//       mode: "onConfirm";
//       /**
//        * Callback with all newly confirmed comments
//        *
//        * @param comments as the comments pushed by the user
//        * @returns void
//        */
//       onConfirm?: (comments: Comment[]) => Promise<void>;
//       onAdd?: never;
//     }
//   | {
//       mode: "onAdd";
//       /**
//        * Callback with the newly added comment
//        *
//        * @param comment The comment that was added
//        * @returns void
//        */
//       onCommentAdd?: (comment: Comment) => Promise<void>;
//       onConfirm?: never;
//     };
