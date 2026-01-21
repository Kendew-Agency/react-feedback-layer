import type { ReactNode } from "react";
import { CommentOverlay } from "../../../src";
import { CommentRenderer } from "../../../src";
import { CommentContextProvider } from "../../../src";
import { resolveCommentsInDataBase, sendCommentsToDataBase } from "./server";
import {
  Comment,
  DraftComment,
  ResolvedComment,
  ResolvingComment,
} from "./_components/comment";
import { CommentToolbar } from "./_components/toolbar";
import { CommentList } from "./_components/comment-list";

export const CommentWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <CommentContextProvider
      onConfirm={sendCommentsToDataBase}
      initialComments={[
        {
          id: "k_d1ddbfc0-f5d6-44ba-999c-b41cd0963799",
          user: {
            name: "John Doe",
          },
          position: {
            x: 380.171875,
            y: 447.6015625,
          },
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
          content: "15 minutes",
          createdAt: new Date("2026-01-19T10:51:12.088Z"),
          status: "resolved",
          indicator: {
            width: 171.37890625,
            height: 38.79296875,
          },
        },
        {
          id: "k_b18a1d5e-e611-4994-91dd-e07060bcc5de",
          user: {
            name: "John Doe",
          },
          position: {
            x: 510.09765625,
            y: 733.484375,
          },
          content: "2 invite",
          createdAt: new Date("2026-01-19T10:52:14.684Z"),
          status: "published",
          indicator: {
            width: 65.59375,
            height: 22.5078125,
          },
        },
      ]}
      currentUser={{
        name: "John Doe",
      }}
      onResolve={resolveCommentsInDataBase}
      onError={(e) => {
        console.error(e);
      }}
      initialOverlayState="idle"
      config={{
        idPrefix: "k_",
      }}
    >
      <div style={{ display: "flex", gap: 10 }}>
        <CommentOverlay>
          <CommentRenderer
            Comment={Comment}
            DraftComment={DraftComment}
            ResolvedComment={ResolvedComment}
            ResolvingComment={ResolvingComment}
          />
          {children}
        </CommentOverlay>
        <CommentList />
      </div>
      <CommentToolbar />
    </CommentContextProvider>
  );
};
