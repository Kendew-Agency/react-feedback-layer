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

export class ResolveError extends BaseError {
  constructor(message = "An error occured while resolving your comments") {
    super(message, "RESOLVE_ERROR", 500);
  }
}

export class ConfirmError extends BaseError {
  constructor(message = "An error occured while confirming your comments") {
    super(message, "CONFIRM_ERROR", 500);
  }
}
