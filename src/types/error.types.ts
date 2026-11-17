import type {
  AddError,
  ConfirmError,
  DeleteError,
  EditError,
  PermissionError,
  ReopenError,
  ResolveError,
  SessionCreateError,
  SessionResolveError,
  SessionStateError,
  StartResolvingError,
} from "../errors";

export type OverlayErrorCode =
  | "RESOLVE_ERROR"
  | "CONFIRM_ERROR"
  | "UNKNOWN_ERROR"
  | "INSERT_ERROR"
  | "SESSION_CREATE_ERROR"
  | "ADD_ERROR"
  | "EDIT_ERROR"
  | "DELETE_ERROR"
  | "SESSION_STATE_ERROR"
  | "REOPEN_ERROR"
  | "START_RESOLVING_ERROR"
  | "SESSION_RESOLVE_ERROR"
  | "PERMISSION_ERROR";

export type KnownError =
  | ConfirmError
  | ResolveError
  | SessionCreateError
  | AddError
  | EditError
  | DeleteError
  | SessionStateError
  | ReopenError
  | StartResolvingError
  | SessionResolveError
  | PermissionError;
