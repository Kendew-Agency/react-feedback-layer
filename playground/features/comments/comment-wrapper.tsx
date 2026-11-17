import type { ReactNode } from "react";
import { CommentOverlay } from "../../../src";
import { CommentRenderer } from "../../../src";
import {
  CommentContextProvider,
  FeedbackSessionProvider,
  UserProvider,
} from "../../../src";
import type {
  ConfirmedComment,
  InitialFeedbackSession,
} from "../../../src/types";
import {
  addCommentToDataBase,
  confirmSessionInDataBase,
  createSessionInDataBase,
  deleteCommentFromDataBase,
  editCommentInDataBase,
  reopenCommentInDataBase,
  resolveCommentInDataBase,
  resolveSessionInDataBase,
  startResolvingInDataBase,
} from "./server";
import { Comment, DraftComment, ResolvedComment } from "./_components/comment";
import { CommentToolbar } from "./_components/toolbar";
import { CommentList } from "./_components/comment-list";
import { EventListener } from "../../components/event-listener";

const PLAYGROUND_SESSION_ID = "session_playground_1";
const PLAYGROUND_USER = { id: "user_1", name: "John Doe" };

/**
 * Set to false to verify that starting and completing the resolution, and
 * resolving and reopening comments, are refused with a permission error.
 */
export const canResolveSession = true;

const INITIAL_COMMENTS: ConfirmedComment[] = [
  {
    id: "k_d1ddbfc0-f5d6-44ba-999c-b41cd0963799",
    user: {
      name: "John Doe",
    },
    position: {
      x: 380.171875,
      y: 447.6015625,
    },
    sessionId: PLAYGROUND_SESSION_ID,
    content: "Dejuner",
    createdAt: new Date("2026-01-19T10:51:01.133Z"),
    status: "published",
    indicator: {
      width: 123.67578125,
      height: 22.1015625,
    },
  },
  {
    id: "k_82d11006-1153-4dce-8d19-e47cd5824e94",
    user: {
      name: "John Doe",
    },
    position: {
      x: 907.40625,
      y: 1034.87890625,
    },
    sessionId: PLAYGROUND_SESSION_ID,
    content: "15 minutes",
    createdAt: new Date("2026-01-19T10:51:12.088Z"),
    status: "resolved",
    indicator: {
      width: 171.37890625,
      height: 38.79296875,
    },
  },
];

const INITIAL_SESSION: InitialFeedbackSession = {
  id: PLAYGROUND_SESSION_ID,
  type: "feedback",
  status: "resolving",
  createdAt: new Date("2026-01-19T10:50:00.000Z"),
  createdBy: PLAYGROUND_USER.id,
  participantIds: [PLAYGROUND_USER.id],
  confirmedAt: new Date("2026-01-19T10:55:00.000Z"),
  projectId: "proj_1234",
  comments: INITIAL_COMMENTS,
};

export const CommentWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <UserProvider user={PLAYGROUND_USER}>
      <FeedbackSessionProvider
        initialSession={INITIAL_SESSION}
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
        <CommentContextProvider
          initialComments={INITIAL_COMMENTS}
          currentUser={PLAYGROUND_USER}
          projectId="proj_1234"
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
      </FeedbackSessionProvider>
    </UserProvider>
  );
};
