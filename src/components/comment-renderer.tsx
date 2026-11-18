import type { ElementType } from "react";
import { useComments } from "../contexts/comment-context";
import type { CommentType } from "../types";

type CommentRendererProps = {
  //biome-ignore lint/style/useNamingConvention: This props is used as a component
  Comment: ElementType<{ comment: CommentType }>;
  //biome-ignore lint/style/useNamingConvention: This props is used as a component
  DraftComment: ElementType<{ comment: CommentType }>;
  //biome-ignore lint/style/useNamingConvention: This props is used as a component
  ResolvedComment: ElementType<{ comment: CommentType }>;
};

/**
 * Comment rendering component
 * @remarks
 * This component is used to render all comments based on their state.
 * This component is optional and the samen could be built using the `useComments()` hook
 *
 * @param Comment - Component for all open comments
 * @param DraftComment - Component for all draft comments
 * @param ResolvedComment - Component for all resolved comments
 * @returns mapped arrays of all comment types
 * @description This component is used to render all comments based on their type
 * @example
 * ```tsx
 * <CommentRenderer
 *  Comment={MyCommentComponent}
 *  DraftComment={MyDraftCommentComponent}
 *  ResolvedComment={MyResolvedCommentComponent}
 * />
 * ```
 */
export const CommentRenderer = ({
  Comment,
  DraftComment,
  ResolvedComment,
}: CommentRendererProps) => {
  const { comments, draftComments, overlayState, resolvedComments, config } =
    useComments();

  if (overlayState === "inactive") return null;

  return (
    <>
      {/* Renders all draft comments */}
      {draftComments.map((comment) => {
        return <DraftComment key={comment.id} comment={comment} />;
      })}
      {/* Renders all exsisting comments */}
      {comments.map((comment) => {
        return <Comment key={comment.id} comment={comment} />;
      })}
      {/* Renders all resolved comments */}
      {resolvedComments.map((comment) => {
        if (config?.commentVisibility?.hideResolved) return null;
        return <ResolvedComment key={comment.id} comment={comment} />;
      })}
    </>
  );
};
