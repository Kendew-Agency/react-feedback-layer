import type { ReactNode } from "react";
import type { CommentType, ConfirmedComment, User } from "./comment.types";
import type { KnownError } from "./error.types";

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
   * Track the focussed comment when editing or adding a comment
   * The comment key will be stored in this state
   */
  focussedComment: string | null;
  /**
   * Any error that occurs during comment operations
   * The value can be used to display an error message to the user
   */
  error?: Error;
  /**
   * Optional configuration for the comment layer
   */
  config?: Config | undefined;
};

/**
 * The state of the comment overlay
 * @description This is used to track the state of the comment overlay
 */
export type CommentOverlayState =
  | "idle"
  | "editing"
  | "saving"
  | "resolving"
  | "inactive";

export type CommentVisibility = {
  /**
   * Hide comments that are marked as resolved
   * @default false
   */
  hideResolved?: boolean;
  /**
   * Hide comments that are being resolved
   * @default false
   */
  hideResolving?: boolean;
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
  initialOverlayState?: CommentOverlayState;
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
  /**
   * Callback to handle errors
   *
   * @param error as the error that occurred
   */
  onError?: (error: KnownError) => void;
  /**
   * Optional configuration for the comment layer
   */
  config?: Config;
};

type Suscription = {
  subscribe: (update: unknown) => void;
  unsubscribe: () => void;
};

export type Config = {
  /**
   * A custom prefix for the comment ids
   * @example
   * ```ts
   * idPrefix: "proj_a_" // Results in id="proj_a_a096e551-9822-4d10-876c-70651be36c70"
   * ```
   */
  idPrefix?: string;
  /**
   * The visibility of the comment indicator
   * @default 'always'
   */
  indicatorVisibility?: "always" | "active";
  /**
   * Mode of the comment overlay
   * @default "onConfirm"
   */
  mode?: "onConfirm";
  /**
   * The visibility of the different type of comments
   * @description This is used to temporarily hide comments of a certain type if a user whishes a cleaner view
   * @see CommentVisibility
   */
  commentVisibility?: CommentVisibility;
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
