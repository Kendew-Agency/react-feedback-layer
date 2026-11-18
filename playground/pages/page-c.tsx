import { CommentWrapper } from "../features/comments/comment-wrapper";

export const PageC = () => (
  <CommentWrapper locationId="page-c">
    <div style={{ width: 1000, padding: 24, boxSizing: "border-box" }}>
      <h1>Page C</h1>
      <p>
        Confirm or resolve the session from this page. The check covers the
        comments of all three pages.
      </p>
    </div>
  </CommentWrapper>
);
