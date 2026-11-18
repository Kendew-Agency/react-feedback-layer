import type { ConfirmedComment, FeedbackSession } from "../../../src/types";

// Minimal IndexedDB wrapper for the playground. Two object stores mimic the
// tables a real backend would have. The database is seeded when it is created
// and can be thrown away with resetDb().
const DB_NAME = "comment-layer-playground";
const DB_VERSION = 2;
const SESSIONS = "sessions";
const COMMENTS = "comments";

const SEED_SESSION_ID = "session_playground_1";

const SEED_SESSION: FeedbackSession = {
  id: SEED_SESSION_ID,
  type: "feedback",
  status: "draft",
  createdAt: new Date("2026-01-19T10:50:00.000Z"),
  createdBy: "user_1",
  participantIds: ["user_1"],
  confirmedAt: new Date("2026-01-19T10:55:00.000Z"),
  projectId: "proj_1234",
};

const SEED_USER = { id: "user_1", name: "John Doe" };

function seedComment(
  n: number,
  locationId: string,
  content: string,
  status: ConfirmedComment["status"] = "published",
): ConfirmedComment {
  const createdAt = new Date(Date.UTC(2026, 0, 19, 10, 51, n));
  return {
    id: `k_seed_${n}`,
    user: SEED_USER,
    position: { x: 200 + n * 60, y: 200 + n * 70 },
    sessionId: SEED_SESSION_ID,
    locationId,
    content,
    createdAt,
    status,
    ...(status === "resolved"
      ? { resolvedAt: new Date(createdAt.getTime() + 60_000) }
      : {}),
    indicator: { width: 120, height: 24 },
  };
}

// Three comments at page-a, two at page-b and four at page-c.
const SEED_COMMENTS: ConfirmedComment[] = [
  seedComment(1, "page-a", "Dejuner"),
  seedComment(2, "page-a", "15 minutes", "resolved"),
  seedComment(3, "page-a", "Header is too tall"),
  seedComment(4, "page-b", "Wrong label"),
  seedComment(5, "page-b", "Low contrast"),
  seedComment(6, "page-c", "Typo in title"),
  seedComment(7, "page-c", "Align with grid"),
  seedComment(8, "page-c", "Missing icon", "resolved"),
  seedComment(9, "page-c", "Button too small"),
];

let dbPromise: Promise<IDBDatabase> | null = null;

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      // Version 1 stores have no locationId. Replace them with the v2 seed.
      for (const name of Array.from(db.objectStoreNames)) {
        db.deleteObjectStore(name);
      }
      const sessions = db.createObjectStore(SESSIONS, { keyPath: "id" });
      const comments = db.createObjectStore(COMMENTS, { keyPath: "id" });
      comments.createIndex("sessionId", "sessionId");
      comments.createIndex("locationId", "locationId");
      sessions.add(SEED_SESSION);
      for (const comment of SEED_COMMENTS) comments.add(comment);
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

type Stores = { sessions: IDBObjectStore; comments: IDBObjectStore };

/**
 * Runs `work` in one transaction over both stores. When `work` throws, the
 * transaction is aborted so nothing is written.
 */
export async function withDb<T>(
  mode: IDBTransactionMode,
  work: (stores: Stores) => Promise<T>,
): Promise<T> {
  const db = await openDb();
  const tx = db.transaction([SESSIONS, COMMENTS], mode);
  const done = new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  done.catch(() => {
    // Errors surface through the awaited `done` or the thrown error below.
  });
  try {
    const result = await work({
      sessions: tx.objectStore(SESSIONS),
      comments: tx.objectStore(COMMENTS),
    });
    await done;
    return result;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      // The transaction already finished.
    }
    throw error;
  }
}

export async function resetDb(): Promise<void> {
  const db = await dbPromise;
  db?.close();
  dbPromise = null;
  await requestToPromise(indexedDB.deleteDatabase(DB_NAME));
}

/** The most recently created session, or null when there is none. */
export async function getLatestSession(): Promise<FeedbackSession | null> {
  return withDb("readonly", async ({ sessions }) => {
    const all = await requestToPromise<FeedbackSession[]>(sessions.getAll());
    all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return all[0] ?? null;
  });
}

/** Comments of one session across all locations. */
export async function getCommentsBySession(
  sessionId: string,
): Promise<ConfirmedComment[]> {
  return withDb("readonly", ({ comments }) =>
    requestToPromise<ConfirmedComment[]>(
      comments.index("sessionId").getAll(sessionId),
    ),
  );
}
