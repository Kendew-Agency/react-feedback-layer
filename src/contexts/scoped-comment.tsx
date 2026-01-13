import * as React from "react";
import type { Comment as CommentType } from "../types";

type CommentScope = {
  comment: CommentType;
  isActive: boolean;
  draft: string;
  setDraft: React.Dispatch<React.SetStateAction<string>>;
};

export const CommentScopeContext = React.createContext<CommentScope | null>(
  null,
);

export function useCommentScope() {
  const ctx = React.useContext(CommentScopeContext);
  if (!ctx) {
    throw new Error("Comment.* must be used within <Comment.Root />");
  }
  return ctx;
}
