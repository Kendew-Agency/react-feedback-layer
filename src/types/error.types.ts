import type { ConfirmError, ResolveError } from "../errors";

export type OverlayErrorCode =
  | "RESOLVE_ERROR"
  | "CONFIRM_ERROR"
  | "UNKNOWN_ERROR";

export type KnownError = ConfirmError | ResolveError;
