import type { ReactNode } from "react";
import {
  CommentContextProvider,
  CommentOverlay,
  CommentRenderer,
  useFeedbackSession,
} from "../../../src";
import { EventListener } from "../../components/event-listener";
import { Comment, DraftComment, ResolvedComment } from "./_components/comment";
import { CommentList } from "./_components/comment-list";
import { CommentToolbar } from "./_components/toolbar";
import {
  addCommentToDataBase,
  deleteCommentFromDataBase,
  editCommentInDataBase,
  reopenCommentInDataBase,
  resolveCommentInDataBase,
} from "./server";
import { PLAYGROUND_USER } from "./session-shell";

/**
 * Renders the comment layer for one location. Must be used inside a
 * SessionShell. The initial comments come from the active session, which
 * holds the comments of all locations.
 */
export const CommentWrapper = ({
  children,
  locationId,
}: {
  children: ReactNode;
  locationId: string;
}) => {
  const { session } = useFeedbackSession();

  return (
    <CommentContextProvider
      locationId={locationId}
      initialComments={session?.comments ?? []}
      currentUser={PLAYGROUND_USER}
      projectId="proj_1234"
      // The comment already carries its locationId, so the DB stores it as is.
      onAdd={addCommentToDataBase}
      onEdit={editCommentInDataBase}
      onResolve={resolveCommentInDataBase}
      onReopen={reopenCommentInDataBase}
      onDelete={deleteCommentFromDataBase}
      onError={(e) => {
        console.error(e);
        alert(e.message);
      }}
      initialOverlayState="idle"
      config={{
        idPrefix: "k_",
        indicatorVisibility: "active",
      }}
    >
      <EventListener />
      <div style={{ display: "flex", gap: 10 }}>
        <CommentOverlay>
          <CommentRenderer
            Comment={Comment}
            DraftComment={DraftComment}
            ResolvedComment={ResolvedComment}
          />
          {children}
        </CommentOverlay>
        <CommentList />
      </div>
      <CommentToolbar />
    </CommentContextProvider>
  );
};
