import type { CommentType } from "./comment.types";

/**
 * Event map for comment-related events
 * Each key is an event name and the value is the callback signature
 */
export type CommentEventMap = {
  /**
   * Triggered when focus changes to a different comment
   * @param commentId - The id of the newly focused comment, or null if unfocused
   * @param comment - The focused comment object, or undefined if unfocused
   */
  onFocusChange: (
    commentId: string | null,
    comment: CommentType | undefined,
  ) => void;
  /**
   * Triggered when comments are confirmed (saved)
   * @param comments - The comments that were confirmed
   */
  onCommentsConfirmed: (comments: CommentType[]) => void;
  /**
   * Triggered when comments are resolved
   * @param comments - The comments that were resolved
   */
  onCommentsResolved: (comments: CommentType[]) => void;
  /**
   * Triggered when a comment is deleted
   * @param commentId - The id of the deleted comment
   */
  onCommentDeleted: (commentId: string) => void;
  /**
   * Triggered when a new comment is registered (draft created)
   * @param comment - The newly registered comment
   */
  onCommentRegistered: (comment: CommentType) => void;
};

/**
 * A function to unsubscribe from an event
 */
export type Unsubscribe = () => void;

/**
 * The events object exposed via useComments()
 * Each method accepts a callback and returns an unsubscribe function
 */
export type CommentEvents = {
  [K in keyof CommentEventMap]: (callback: CommentEventMap[K]) => Unsubscribe;
};
