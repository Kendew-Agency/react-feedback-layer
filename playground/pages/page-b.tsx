import { CommentWrapper } from "../features/comments/comment-wrapper";

export const PageB = () => (
  <CommentWrapper locationId="page-b">
    <div style={{ width: 1000, padding: 24, boxSizing: "border-box" }}>
      <h1>Page B</h1>
      <p>
        This page has different content, but it belongs to the same feedback
        session as the other pages.
      </p>
    </div>
  </CommentWrapper>
);
