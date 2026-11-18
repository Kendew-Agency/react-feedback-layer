import type { CommentEvents } from "./event.types";
import type { KnownError } from "./error.types";
import type {
  CommentOverlayState,
  CommentVisibility,
  Config,
} from "./overlay.types";

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
  /**
   * The id of the feedback session a comment belongs to
   */
  sessionId: string;
  /**
   * The id of the location where the comment was placed
   * @description A location is a logical place in your app, such as a page or
   * a screen. Comments are shown only at the location they were placed at.
   */
  locationId: string;
  /**
   * The id of the project a comment is connected to
   * @description useful for filtering comments by project
   */
  projectId?: string | undefined;
};

export type Status = "draft" | "published" | "resolved";

export type ConfirmedStatus = Extract<Status, "published" | "resolved">;

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
  draftComments: CommentWithStatus<"draft">[];
  comments: CommentWithStatus<"published">[];
  resolvedComments: CommentWithStatus<"resolved">[];
  allComments: CommentType[];
  /**
   * The comments at the current location, grouped by session id.
   * @description Contains one key per session that has at least one comment at
   * the current location, including sessions other than the active session.
   * The list order follows the loaded comment state. The entry of an active
   * draft session follows the `draftVisibility` config. The record is empty
   * when the provider has no `locationId`. Comments without a `locationId`
   * are excluded.
   */
  commentsBySession: Record<string, CommentType[]>;

  config: Config | undefined;
  changeOverlayState: (state: CommentOverlayState) => void;
  overlayState: CommentOverlayState;
  updateComment: (
    id: string,
    newComment: Pick<CommentType, "content">,
  ) => Promise<{ error: KnownError | null }>;
  deleteComment: (id: string) => Promise<{ error: KnownError | null }>;
  focusOnComment: (id: string | null) => void;
  registerComment: (position: Position, indicatorPosition?: Indicator) => void;
  getActiveComment: () => CommentType | undefined;
  toggleOverlay: () => void;
  currentUser: User | null;
  /**
   * Resolve a published comment. Requires a resolving session and permission
   */
  resolveComment: (id: string) => Promise<{ error: KnownError | null }>;
  /**
   * Reopen a resolved comment. Requires a resolving session and permission
   */
  reopenComment: (id: string) => Promise<{ error: KnownError | null }>;
  /**
   * Mirrors the `canResolveSession` prop of the session provider
   */
  canResolve: boolean;
  updateCommentVisibility: (visibility: Partial<CommentVisibility>) => void;
  triggerError: (error: KnownError) => void;
  events: CommentEvents;
};

export type CommentWithStatus<T extends Status> = Omit<
  CommentType,
  "status"
> & { status: T };
