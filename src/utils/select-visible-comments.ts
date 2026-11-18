import type { CommentType } from "../types/comment.types";
import type { DraftVisibility } from "../types/overlay.types";
import type { SessionStatus } from "../types/session.types";

/**
 * Falls back to "visible" for any value other than "hidden"
 */
export const normalizeDraftVisibility = (value: unknown): DraftVisibility =>
  value === "hidden" ? "hidden" : "visible";

type ActiveSession = { id: string; status: SessionStatus };

/**
 * A Located_Comment has a non-empty string locationId
 */
export const isLocated = (comment: {
  locationId?: unknown;
}): comment is { locationId: string } =>
  typeof comment.locationId === "string" && comment.locationId.length > 0;

/**
 * Treats a missing or empty location as missing
 */
export const normalizeLocationId = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const applyDraftFilter = (
  comments: CommentType[],
  session: ActiveSession,
  draftVisibility: unknown,
  currentUserId: string | undefined,
): CommentType[] => {
  if (
    session.status !== "draft" ||
    normalizeDraftVisibility(draftVisibility) !== "hidden"
  ) {
    return comments;
  }

  return comments.filter((comment) => {
    // Local drafts belong to the current user
    if (comment.status === "draft") {
      return true;
    }
    const authorId = comment.user?.id;
    return authorId === undefined || authorId === currentUserId;
  });
};

type SelectCommentsByLocationArgs = {
  comments: CommentType[];
  locationId: string | undefined;
};

/**
 * All Located_Comments at the location, across sessions. Order is preserved.
 * Returns [] when the location is missing or empty.
 */
export const selectCommentsByLocation = ({
  comments,
  locationId,
}: SelectCommentsByLocationArgs): CommentType[] => {
  const location = normalizeLocationId(locationId);
  if (location === undefined) {
    return [];
  }
  return comments.filter(
    (comment) => isLocated(comment) && comment.locationId === location,
  );
};

type SelectVisibleCommentsArgs = {
  comments: CommentType[];
  session: ActiveSession | null;
  locationId: string | undefined;
  draftVisibility?: unknown;
  currentUserId: string | undefined;
};

/**
 * Scopes comments to the active session and location, then applies the draft
 * visibility filter. `hideResolved` is applied afterwards by the renderer.
 */
export const selectVisibleComments = ({
  comments,
  session,
  locationId,
  draftVisibility = "visible",
  currentUserId,
}: SelectVisibleCommentsArgs): CommentType[] => {
  if (session === null) {
    return [];
  }

  const inSession = selectCommentsByLocation({ comments, locationId }).filter(
    (comment) => comment.sessionId === session.id,
  );

  return applyDraftFilter(inSession, session, draftVisibility, currentUserId);
};

type SelectCommentsBySessionArgs = SelectCommentsByLocationArgs & {
  session: ActiveSession | null;
  draftVisibility?: unknown;
  currentUserId: string | undefined;
};

/**
 * Groups the comments at the location by session id. The entry of the active
 * session gets the same draft filter as `selectVisibleComments`, other
 * sessions are not filtered. Sessions without comments are omitted.
 */
export const selectCommentsBySession = ({
  comments,
  locationId,
  session,
  draftVisibility = "visible",
  currentUserId,
}: SelectCommentsBySessionArgs): Record<string, CommentType[]> => {
  const grouped: Record<string, CommentType[]> = {};

  for (const comment of selectCommentsByLocation({ comments, locationId })) {
    const list = grouped[comment.sessionId];
    if (list) {
      list.push(comment);
    } else {
      grouped[comment.sessionId] = [comment];
    }
  }

  if (session !== null) {
    const active = grouped[session.id];
    if (active) {
      const filtered = applyDraftFilter(
        active,
        session,
        draftVisibility,
        currentUserId,
      );
      if (filtered.length === 0) {
        delete grouped[session.id];
      } else {
        grouped[session.id] = filtered;
      }
    }
  }

  return grouped;
};
