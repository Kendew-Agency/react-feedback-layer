import { type ReactNode, useEffect, useState } from "react";
import { FeedbackSessionProvider } from "../../../src";
import type { InitialFeedbackSession } from "../../../src/types";
import { CustomButtom } from "../../components/button";
import { getCommentsBySession, getLatestSession, resetDb } from "./db";
import {
  confirmSessionInDataBase,
  createSessionInDataBase,
  resolveSessionInDataBase,
  startResolvingInDataBase,
} from "./server";

export const PLAYGROUND_USER = { id: "user_1", name: "John Doe" };

/**
 * Set to false to verify that starting and completing the resolution, and
 * resolving and reopening comments, are refused with a permission error.
 */
export const canResolveSession = true;

type Loaded = { session: InitialFeedbackSession | undefined };

/**
 * Renders the session provider once, above the pages, so the same
 * active session stays mounted while the user navigates between locations.
 * Loads the latest session and its comments (all locations) from IndexedDB.
 */
export const SessionShell = ({ children }: { children: ReactNode }) => {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await getLatestSession();
      const comments = session ? await getCommentsBySession(session.id) : [];
      if (cancelled) return;
      setLoaded({ session: session ? { ...session, comments } : undefined });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const reset = async () => {
    await resetDb();
    window.location.reload();
  };

  if (!loaded) return <p>Loading from IndexedDB...</p>;

  return (
    <FeedbackSessionProvider
      {...(loaded.session ? { initialSession: loaded.session } : {})}
      projectId="proj_1234"
      canResolveSession={canResolveSession}
      onCreateSession={createSessionInDataBase}
      onConfirmSession={confirmSessionInDataBase}
      onStartResolving={startResolvingInDataBase}
      onResolveSession={resolveSessionInDataBase}
      onError={(e) => {
        console.error(e);
        alert(e.message);
      }}
    >
      {children}
      <div style={{ padding: "0 0 10px" }}>
        <CustomButtom variant="destructive" onClick={reset}>
          Reset DB
        </CustomButtom>
      </div>
    </FeedbackSessionProvider>
  );
};
