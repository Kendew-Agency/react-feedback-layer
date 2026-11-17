import type {
  ConfirmedComment,
  CreateSessionInput,
  FeedbackSession,
  SessionType,
} from "../../../src/types";

// Mocks server code. Every function waits a random 100 to 500 ms, rejects
// with an Error on invalid input and mutates nothing in that case.
// There is no host-side cascade: resolving a session changes no comment.

const MIN_DELAY_MS = 100;
const MAX_DELAY_MS = 500;
const SESSION_TYPES: readonly string[] = ["feedback"];

function delay(): Promise<void> {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assertSessionId(sessionId: string) {
  if (!isNonEmptyString(sessionId)) {
    throw new Error("Session id must not be empty");
  }
}

function assertSessionType(type: SessionType) {
  if (!SESSION_TYPES.includes(type)) {
    throw new Error(`Unknown session type: ${String(type)}`);
  }
}

function assertComment(comment: ConfirmedComment) {
  if (!comment || !isNonEmptyString(comment.id)) {
    throw new Error("Comment id must not be empty");
  }
  if (!isNonEmptyString(comment.sessionId)) {
    throw new Error("Comment session id must not be empty");
  }
}

export async function createSessionInDataBase(
  input: CreateSessionInput,
): Promise<FeedbackSession> {
  await delay();
  assertSessionType(input?.type);

  const userId = input.user?.id;
  const session: FeedbackSession = {
    id: crypto.randomUUID(),
    type: input.type,
    status: "draft",
    createdAt: new Date(),
    createdBy: userId ?? "anonymous",
    participantIds: userId ? [userId] : [],
    projectId: input.projectId,
  };
  console.info("Creating session:", session);
  return session;
}

export async function confirmSessionInDataBase(
  sessionId: string,
  type: SessionType,
): Promise<void> {
  await delay();
  assertSessionId(sessionId);
  assertSessionType(type);
  console.info("Confirming session:", sessionId, type);
}

export async function startResolvingInDataBase(
  sessionId: string,
): Promise<void> {
  await delay();
  assertSessionId(sessionId);
  console.info("Start resolving session:", sessionId);
}

export async function resolveSessionInDataBase(
  sessionId: string,
): Promise<void> {
  await delay();
  assertSessionId(sessionId);
  console.info("Resolving session:", sessionId);
}

export async function addCommentToDataBase(
  comment: ConfirmedComment,
): Promise<void> {
  await delay();
  assertComment(comment);
  console.info("Adding comment:", comment);
}

export async function editCommentInDataBase(
  comment: ConfirmedComment,
): Promise<void> {
  await delay();
  assertComment(comment);
  console.info("Editing comment:", comment);
}

export async function resolveCommentInDataBase(
  comment: ConfirmedComment,
): Promise<void> {
  await delay();
  assertComment(comment);
  console.info("Resolving comment:", comment);
}

export async function reopenCommentInDataBase(
  comment: ConfirmedComment,
): Promise<void> {
  await delay();
  assertComment(comment);
  console.info("Reopening comment:", comment);
}

export async function deleteCommentFromDataBase(
  commentId: string,
): Promise<void> {
  await delay();
  if (!isNonEmptyString(commentId)) {
    throw new Error("Comment id must not be empty");
  }
  console.info("Deleting comment:", commentId);
}
