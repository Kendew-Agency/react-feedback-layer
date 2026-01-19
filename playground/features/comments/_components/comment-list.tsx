import { useComments } from "../../../../src";
import { CustomButtom } from "../../../components/button";
import styles from "../styles.module.scss";

export const CommentList = () => {
  const { comments, focusOnComment, getActiveComment } = useComments();

  return (
    <div className={styles.list}>
      {comments.map((comment) => {
        const isActive = getActiveComment()?.id === comment.id;
        return (
          <div key={comment.id} className={styles.comment}>
            <p>{comment.user?.name}</p>
            <p>{comment.content}</p>
            <CustomButtom
              disabled={isActive}
              variant={isActive ? "secondary" : "default"}
              onClick={() => focusOnComment(comment.id)}
            >
              Show comment
            </CustomButtom>
          </div>
        );
      })}
    </div>
  );
};
