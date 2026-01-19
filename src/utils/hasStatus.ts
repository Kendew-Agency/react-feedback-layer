import type { CommentType, CommentWithStatus, Status } from "../types";

export function hasStatus<T extends Status>(
  status: T,
): (comment: CommentType) => comment is CommentWithStatus<T> {
  return (comment): comment is CommentWithStatus<T> =>
    comment.status === status;
}
