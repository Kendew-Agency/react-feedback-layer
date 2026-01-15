import type { CommentType } from "../../../../src/types";
import styles from "../styles.module.scss";
import { Comment as CommentComp } from "../../../../src/components/comment";
import { CustomButtom } from "../../../components/button";
import { useComments, useCommentScope } from "../../../../src";

const Comment = ({ comment }: { comment: CommentType }) => {
  return (
    <CommentComp.Root comment={comment} className={styles.comment}>
      <CommentComp.Indicator style={{ border: "2px dashed red" }} />
      <CommentInside />
    </CommentComp.Root>
  );
};

const CommentInside = () => {
  const { comment } = useCommentScope();
  const { getActiveComment, focusOnComment } = useComments();

  const isActive = getActiveComment()?.id === comment.id;

  if (!isActive) {
    return (
      <CustomButtom onClick={() => focusOnComment(comment.id)}>
        {comment.user?.name}
      </CustomButtom>
    );
  }

  return (
    <div className={styles.comment}>
      <div className={styles.head}>
        <div className={styles.user}>{comment.user?.name || "Anonymous"}</div>
        <div>{comment.createdAt.toLocaleDateString()}</div>
      </div>
      <p>{comment.content}</p>
      <CommentComp.Resolve>Resolve comment</CommentComp.Resolve>
    </div>
  );
};

const DraftComment = ({ comment }: { comment: CommentType }) => {
  return (
    <CommentComp.Root comment={comment}>
      <CommentComp.Indicator style={{ border: "2px dashed red" }} />
      <DraftCommentInside />
    </CommentComp.Root>
  );
};

const DraftCommentInside = () => {
  const { comment } = useCommentScope();
  const { getActiveComment, focusOnComment } = useComments();

  const isActive = getActiveComment()?.id === comment.id;

  if (!isActive) {
    return (
      <CustomButtom onClick={() => focusOnComment(comment.id)}>
        {comment.user?.name}
      </CustomButtom>
    );
  }

  return (
    <div className={styles.comment}>
      <div className={styles.head}>
        <div className={styles.user}>{comment.user?.name || "Anonymous"}</div>
        <div>{comment.createdAt.toLocaleDateString()}</div>
      </div>
      <CommentComp.Edit />
      <CommentComp.Delete asChild>
        <CustomButtom variant="destructive">Delete</CustomButtom>
      </CommentComp.Delete>
      <CommentComp.Confirm asChild>
        <CustomButtom>Confirm</CustomButtom>
      </CommentComp.Confirm>
    </div>
  );
};

const ResolvingComment = ({ comment }: { comment: CommentType }) => {
  return (
    <CommentComp.Root comment={comment} style={{ background: "blue" }}>
      <CommentComp.Indicator style={{ border: "2px dashed red" }} />
      <CommentComp.Content />
      <CommentComp.Resolve>Unresolve comment</CommentComp.Resolve>
    </CommentComp.Root>
  );
};

const ResolvedComment = ({ comment }: { comment: CommentType }) => {
  return (
    <CommentComp.Root comment={comment} style={{ background: "green" }}>
      <CommentComp.Indicator style={{ border: "2px dashed red" }} />
      <CommentComp.Content />
    </CommentComp.Root>
  );
};

export { Comment, DraftComment, ResolvingComment, ResolvedComment };
