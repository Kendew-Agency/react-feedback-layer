import type { ActiveFeedbackSession } from "../types/session.types";
import { isLocated } from "./select-visible-comments";
import { isSessionType } from "./session-type";

/**
 * Session comments that count for session-level checks. Unlocated_Comments
 * are ignored so a hidden comment cannot block a transition.
 */
const locatedComments = (session: ActiveFeedbackSession) =>
  session.comments.filter(isLocated);

/**
 * Returns a refusal message when the session cannot be confirmed, else null.
 * Counts the comments of all locations.
 */
export const confirmRefusal = (
  session: ActiveFeedbackSession | null,
  localDrafts: number,
): string | null => {
  if (!session || session.status !== "draft") return "session is not a draft";
  if (localDrafts > 0) return "a local draft comment exists";
  if (locatedComments(session).length === 0) return "session has no comments";
  if (!isSessionType(session.type)) return "unknown session type";
  return null;
};

/**
 * Returns a refusal message when the session cannot be resolved, else null.
 * Checks the comments of all locations.
 */
export const resolveRefusal = (
  session: ActiveFeedbackSession | null,
): string | null => {
  if (session?.status !== "resolving") return "session is not resolving";
  return locatedComments(session).some((c) => c.status === "published")
    ? "a comment is still published"
    : null;
};

/** Sums the local draft counts reported by all providers */
export const sumCounts = (counts: Map<string, number>): number => {
  let total = 0;
  for (const count of counts.values()) total += count;
  return total;
};
