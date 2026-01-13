import type { ElementType } from "react";
import { useComments } from "../contexts/comment-context";
import type { Comment as CommentType } from "../types";

type CommentRendererProps = {
  //biome-ignore lint/style/useNamingConvention: This props is usd as a component
  Comment: ElementType<{ comment: CommentType }>;
  //biome-ignore lint/style/useNamingConvention: This props is usd as a component
  DraftComment: ElementType<{ comment: CommentType }>;
};

/**
 *
 * @param
 * @returns
 */
export const CommentRenderer = ({
  Comment,
  DraftComment,
}: CommentRendererProps) => {
  const { comments, draftComments, overlayState } = useComments();

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
    </>
  );
};
