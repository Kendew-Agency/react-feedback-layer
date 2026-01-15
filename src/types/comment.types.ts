import type { CommentOverlayState, CommentVisibility } from "./overlay.types";

export type CommentType = {
  /**
   * The unique identifier of a comment
   */
  id: string;
  /**
   * The postion of a comment
   * @description the postion holds both the x and y coordinates of a comment
   */
  position: Position;
  /**
   * The content of a comment
   */
  content: string;
  /**
   * The user who created the comment
   */
  user: User | null;
  /**
   * The date when the comment was created
   */
  createdAt: Date;
  /**
   * The date when the comment was resolved
   */
  resolvedAt?: Date;
  /**
   * The state of a comment tracking what the comment is currently doing
   * @description This value will be omitted when sending the comment to your DB
   */
  status: Status;
  /**
   * An indicator to show the user where the comment is located
   * @description shows a box around the content a comment is tied to
   */
  indicator?: Indicator | null;
};

type Status = "draft" | "published" | "resolving" | "resolved";

type ConfirmedStatus = Extract<Status, "published" | "resolved">;

export type ConfirmedComment = Omit<CommentType, "status"> & {
  status: ConfirmedStatus;
};

export type Indicator = {
  /**
   * The width of the indicator
   */
  width: number;
  /**
   * The height of the indicator
   */
  height: number;
};

export type Position = {
  /**
   * The comment position on the x axis
   */
  x: number;
  /**
   * The comment position on the y axis
   */
  y: number;
};

export type User = {
  /**
   * The user ID. This is used to identify the user in your database.
   * @description This is optional, but it is recommended to establish a connection to the user in your DB.
   */
  id?: string;
  /**
   * The name of the user. This is used to display the user's name in the UI.
   */
  name: string;
  /**
   * The avatar of the user if supported. This will fall back to user initials.
   */
  avatar?: string;
};

export type CommentContext = {
  draftComments: CommentType[];
  comments: CommentType[];
  resolvingComments: CommentType[];
  resolvedComments: CommentType[];
  allComments: CommentType[];

  toggleResolvingComment: (id: string) => void;
  changeOverlayState: (state: CommentOverlayState) => void;
  overlayState: CommentOverlayState;
  updateComment: (id: string, newComment: Pick<CommentType, "content">) => void;
  deleteComment: (id: string) => void;
  focusOnComment: (id: string | null) => void;
  registerComment: (position: Position, indicatorPosition?: Indicator) => void;
  getActiveComment: () => CommentType | undefined;
  toggleOverlay: () => void;
  confirmComments: () => Promise<{
    error: Error | DOMException | null;
  }>;
  currentUser: User | null;
  resolveComments: () => Promise<{
    error: Error | DOMException | null;
  }>;
  commentVisibility: CommentVisibility;
  updateCommentVisibility: (visibility: Partial<CommentVisibility>) => void;
};
