import type { OverlayErrorCode } from "./types/error.types";

class BaseError extends Error {
  code: OverlayErrorCode;
  status: number;
  constructor(
    message: string,
    code: OverlayErrorCode = "UNKNOWN_ERROR",
    status = 500,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
  }
}

export class UnknownError extends BaseError {
  constructor(message = "Unknown Error") {
    super(message, "UNKNOWN_ERROR", 500);
  }
}

export class InsertError extends BaseError {
  constructor(message = "An error occured while inserting your comments") {
    super(message, "INSERT_ERROR", 500);
  }
}

/** Error for resolving a single comment (`onResolve`). */
export class ResolveError extends BaseError {
  constructor(message = "An error occured while resolving your comment") {
    super(message, "RESOLVE_ERROR", 500);
  }
}

/** Session confirmation error (`onConfirm`). */
export class ConfirmError extends BaseError {
  constructor(message = "An error occured while confirming your session") {
    super(message, "CONFIRM_ERROR", 500);
  }
}

export class SessionCreateError extends BaseError {
  constructor(message = "An error occured while creating your session") {
    super(message, "SESSION_CREATE_ERROR", 500);
  }
}

export class AddError extends BaseError {
  constructor(message = "An error occured while adding your comment") {
    super(message, "ADD_ERROR", 500);
  }
}

export class EditError extends BaseError {
  constructor(message = "An error occured while editing your comment") {
    super(message, "EDIT_ERROR", 500);
  }
}

export class DeleteError extends BaseError {
  constructor(message = "An error occured while deleting your comment") {
    super(message, "DELETE_ERROR", 500);
  }
}

export class SessionStateError extends BaseError {
  constructor(
    message = "This action is not allowed in the current session state",
  ) {
    super(message, "SESSION_STATE_ERROR", 500);
  }
}

export class ReopenError extends BaseError {
  constructor(message = "An error occured while reopening your comment") {
    super(message, "REOPEN_ERROR", 500);
  }
}

export class StartResolvingError extends BaseError {
  constructor(
    message = "An error occured while starting the resolution of your session",
  ) {
    super(message, "START_RESOLVING_ERROR", 500);
  }
}

/** Error for resolving a session (`onResolveSession`). */
export class SessionResolveError extends BaseError {
  constructor(message = "An error occured while resolving your session") {
    super(message, "SESSION_RESOLVE_ERROR", 500);
  }
}

export class PermissionError extends BaseError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, "PERMISSION_ERROR", 500);
  }
}
