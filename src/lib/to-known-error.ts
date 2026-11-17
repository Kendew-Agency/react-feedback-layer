import type { KnownError } from "../types/error.types";

/**
 * Normalizes an unknown rejection into an instance of the given error class.
 * An Error with a non-empty message keeps its message; anything else falls
 * through to the class default message.
 */
export const toKnownError = <E extends KnownError>(
  reason: unknown,
  ErrorClass: new (message?: string) => E,
): E => {
  const message =
    reason instanceof Error && reason.message.length > 0
      ? reason.message
      : undefined;
  return new ErrorClass(message);
};
