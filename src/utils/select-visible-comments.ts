import type { CommentType } from "../types/comment.types";
import type { DraftVisibility } from "../types/overlay.types";
import type { SessionStatus } from "../types/session.types";

/**
 * Falls back to "visible" for any value other than "hidden"
 */
export const normalizeDraftVisibility = (value: unknown): DraftVisibility =>
  value === "hidden" ? "hidden" : "visible";

type SelectVisibleCommentsArgs = {
  comments: CommentType[];
  session: { id: string; status: SessionStatus } | null;
  draftVisibility?: unknown;
  currentUserId: string | undefined;
};

/**
 * Scopes comments to the active session, then applies the draft visibility
 * filter. `hideResolved` is applied afterwards by the renderer.
 */
export const selectVisibleComments = ({
  comments,
  session,
  draftVisibility = "visible",
  currentUserId,
}: SelectVisibleCommentsArgs): CommentType[] => {
  if (session === null) {
    return [];
  }

  const inSession = comments.filter(
    (comment) => comment.sessionId === session.id,
  );

  if (
    session.status !== "draft" ||
    normalizeDraftVisibility(draftVisibility) !== "hidden"
  ) {
    return inSession;
  }

  return inSession.filter((comment) => {
    // Local drafts belong to the current user
    if (comment.status === "draft") {
      return true;
    }
    const authorId = comment.user?.id;
    return authorId === undefined || authorId === currentUserId;
  });
};
