import type { ElementType } from "react";
import { useComments } from "../contexts/comment-context";
import type { Comment as CommentType } from "../types";

type CommentRendererProps = {
  //biome-ignore lint/style/useNamingConvention: This props is used as a component
  Comment: ElementType<{ comment: CommentType }>;
  //biome-ignore lint/style/useNamingConvention: This props is used as a component
  DraftComment: ElementType<{ comment: CommentType }>;
  //biome-ignore lint/style/useNamingConvention: This props is used as a component
  ResolvingComment: ElementType<{ comment: CommentType }>;
  //biome-ignore lint/style/useNamingConvention: This props is used as a component
  ResolvedComment: ElementType<{ comment: CommentType }>;
};

/**
 *
 * @param
 * @returns
 */
export const CommentRenderer = ({
  Comment,
  DraftComment,
  ResolvingComment,
  ResolvedComment,
}: CommentRendererProps) => {
  const {
    comments,
    draftComments,
    overlayState,
    resolvedComments,
    resolvingComments,
  } = useComments();

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
      {/* Renders all resolving comments */}
      {resolvingComments.map((comment) => {
        return <ResolvingComment key={comment.id} comment={comment} />;
      })}
      {/* Renders all resolved comments */}
      {resolvedComments.map((comment) => {
        return <ResolvedComment key={comment.id} comment={comment} />;
      })}
    </>
  );
};
