import { useComments } from "../../../../src";
import styles from "../styles.module.scss";

export const CommentList = () => {
  const { comments, focusOnComment, getActiveComment } = useComments();

  return (
    <div className={styles.list}>
      {comments.map((comment) => {
        const isActive = getActiveComment()?.id === comment.id;
        return (
          // biome-ignore lint: This element should only handle mouseactions
          <div
            key={comment.id}
            className={styles.listComment}
            onMouseEnter={() => focusOnComment(comment.id)}
            // onMouseLeave={() => focusOnComment(null)}
            style={{
              backgroundColor: isActive
                ? "rgba(65, 64, 64, 0.38)"
                : "transparent",
            }}
          >
            <p>{comment.user?.name}</p>
            <p>{comment.content}</p>
          </div>
        );
      })}
    </div>
  );
};
