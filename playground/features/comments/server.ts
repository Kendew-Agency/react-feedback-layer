import type {
  ConfirmedComment,
  CreateSessionInput,
  FeedbackSession,
  SessionStatus,
  SessionType,
} from "../../../src/types";
import { requestToPromise, withDb } from "./db";

// Mocks server code on top of IndexedDB. Every function waits a random 100 to
// 500 ms, rejects with an Error on invalid input and writes nothing in that
// case. There is no host-side cascade: resolving a session changes no comment.
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
  if (!isNonEmptyString(comment.locationId)) {
    throw new Error("Comment location id must not be empty");
  }
}

async function loadSession(
  sessions: IDBObjectStore,
  sessionId: string,
  expected: SessionStatus,
): Promise<FeedbackSession> {
  const session = await requestToPromise<FeedbackSession | undefined>(
    sessions.get(sessionId),
  );
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  if (session.status !== expected) {
    throw new Error(
      `Session ${sessionId} is ${session.status}, expected ${expected}`,
    );
  }
  return session;
}

async function loadComment(
  comments: IDBObjectStore,
  commentId: string,
): Promise<ConfirmedComment> {
  const comment = await requestToPromise<ConfirmedComment | undefined>(
    comments.get(commentId),
  );
  if (!comment) throw new Error(`Comment not found: ${commentId}`);
  return comment;
}

async function transitionSession(
  sessionId: string,
  from: SessionStatus,
  patch: Partial<FeedbackSession>,
) {
  await withDb("readwrite", async ({ sessions }) => {
    const session = await loadSession(sessions, sessionId, from);
    await requestToPromise(sessions.put({ ...session, ...patch }));
  });
}

export async function createSessionInDataBase(
  input: CreateSessionInput,
): Promise<FeedbackSession> {
  await delay();
  assertSessionType(input?.type);
  const userId = input.user.id;
  const session: FeedbackSession = {
    id: crypto.randomUUID(),
    type: input.type,
    status: "draft",
    createdAt: new Date(),
    createdBy: userId ?? "anonymous",
    participantIds: userId ? [userId] : [],
    projectId: input.projectId,
  };
  await withDb("readwrite", ({ sessions }) =>
    requestToPromise(sessions.add(session)),
  );
  console.info("Created session:", session);
  return session;
}

export async function confirmSessionInDataBase(
  sessionId: string,
  type: SessionType,
): Promise<void> {
  await delay();
  assertSessionId(sessionId);
  assertSessionType(type);
  await transitionSession(sessionId, "draft", {
    status: "confirmed",
    confirmedAt: new Date(),
  });
  console.info("Confirmed session:", sessionId, type);
}

export async function startResolvingInDataBase(
  sessionId: string,
): Promise<void> {
  await delay();
  assertSessionId(sessionId);
  await transitionSession(sessionId, "confirmed", { status: "resolving" });
  console.info("Started resolving session:", sessionId);
}

export async function resolveSessionInDataBase(
  sessionId: string,
): Promise<void> {
  await delay();
  assertSessionId(sessionId);
  await transitionSession(sessionId, "resolving", {
    status: "resolved",
    resolvedAt: new Date(),
  });
  console.info("Resolved session:", sessionId);
}

export async function addCommentToDataBase(
  comment: ConfirmedComment,
): Promise<void> {
  await delay();
  assertComment(comment);
  await withDb("readwrite", async ({ sessions, comments }) => {
    const session = await loadSession(sessions, comment.sessionId, "draft");
    await requestToPromise(comments.add(comment));
    const userId = comment.user?.id;
    if (userId && !session.participantIds.includes(userId)) {
      await requestToPromise(
        sessions.put({
          ...session,
          participantIds: [...session.participantIds, userId],
        }),
      );
    }
  });
  console.info("Added comment:", comment);
}

export async function editCommentInDataBase(
  comment: ConfirmedComment,
): Promise<void> {
  await delay();
  assertComment(comment);
  await withDb("readwrite", async ({ sessions, comments }) => {
    await loadSession(sessions, comment.sessionId, "draft");
    await loadComment(comments, comment.id);
    await requestToPromise(comments.put(comment));
  });
  console.info("Edited comment:", comment);
}

export async function resolveCommentInDataBase(
  comment: ConfirmedComment,
): Promise<void> {
  await delay();
  assertComment(comment);
  await withDb("readwrite", async ({ sessions, comments }) => {
    await loadSession(sessions, comment.sessionId, "resolving");
    await loadComment(comments, comment.id);
    await requestToPromise(comments.put(comment));
  });
  console.info("Resolved comment:", comment);
}

export async function reopenCommentInDataBase(
  comment: ConfirmedComment,
): Promise<void> {
  await delay();
  assertComment(comment);
  await withDb("readwrite", async ({ sessions, comments }) => {
    await loadSession(sessions, comment.sessionId, "resolving");
    await loadComment(comments, comment.id);
    await requestToPromise(comments.put(comment));
  });
  console.info("Reopened comment:", comment);
}

export async function deleteCommentFromDataBase(
  commentId: string,
): Promise<void> {
  await delay();
  if (!isNonEmptyString(commentId)) {
    throw new Error("Comment id must not be empty");
  }
  await withDb("readwrite", async ({ sessions, comments }) => {
    const comment = await loadComment(comments, commentId);
    await loadSession(sessions, comment.sessionId, "draft");
    await requestToPromise(comments.delete(commentId));
  });
  console.info("Deleted comment:", commentId);
}
