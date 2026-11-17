import type { CommentType } from "../../../../src/types";
import styles from "../styles.module.scss";
import { Comment as CommentComp } from "../../../../src/components/comment";
import { CustomButtom } from "../../../components/button";
import {
  useComments,
  useCommentScope,
  useFeedbackSession,
} from "../../../../src";

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
  const { session, canResolve } = useFeedbackSession();
  const canManageComments = canResolve && session?.status === "resolving";

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
      {canManageComments && comment.status === "published" ? (
        <CommentComp.Resolve>Resolve comment</CommentComp.Resolve>
      ) : null}
      {canManageComments && comment.status === "resolved" ? (
        <CommentComp.Reopen>Reopen comment</CommentComp.Reopen>
      ) : null}
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

const ResolvedComment = ({ comment }: { comment: CommentType }) => {
  const { session, canResolve } = useFeedbackSession();
  const canManageComments = canResolve && session?.status === "resolving";
  return (
    <CommentComp.Root comment={comment} style={{ background: "green" }}>
      <CommentComp.Indicator style={{ border: "2px dashed red" }} />
      <CommentComp.Content />
      {canManageComments ? (
        <CommentComp.Reopen>Reopen comment</CommentComp.Reopen>
      ) : null}
    </CommentComp.Root>
  );
};

export { Comment, DraftComment, ResolvedComment };
