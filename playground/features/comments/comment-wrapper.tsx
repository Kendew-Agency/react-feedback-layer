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

export const CommentWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <CommentContextProvider
      onConfirm={sendCommentsToDataBase}
      initialComments={[
        {
          id: "ef7b1033-2bd3-4de3-9f68-d5976b996edd",
          user: {
            name: "John Doe",
          },
          position: {
            x: 686,
            y: 74.5625,
          },
          indicator: {
            width: 100,
            height: 30,
          },
          content: "Lorem ipsum dolor sit amet",
          createdAt: new Date(),
          status: "published",
        },
        {
          id: "73fbb580-da2b-4e48-a094-ec568613669a",
          user: {
            name: "John Doe",
          },
          position: {
            x: 369,
            y: 21.5625,
          },
          content: "Lorem ipsum",
          createdAt: new Date(),
          status: "resolved",
        },
      ]}
      currentUser={{
        name: "John Doe",
      }}
      onResolve={resolveCommentsInDataBase}
      initialOverlayState="idle"
      config={{
        idPrefix: "k_",
        indicatorVisibility: "active",
      }}
    >
      <CommentOverlay>
        <CommentRenderer
          Comment={Comment}
          DraftComment={DraftComment}
          ResolvedComment={ResolvedComment}
          ResolvingComment={ResolvingComment}
        />
        {children}
      </CommentOverlay>
      <CommentToolbar />
    </CommentContextProvider>
  );
};
