import { CommentWrapper } from "./features/comments/comment-wrapper";

export const App = () => {
  return (
    <main
      style={{
        height: "100vh",
      }}
    >
      <CommentWrapper>
        <div style={{ width: 1000 }}>
          <img
            style={{ width: "100%", userSelect: "none" }}
            draggable={false}
            src="/assets/example.png"
            alt="alt"
          />
        </div>
      </CommentWrapper>
    </main>
  );
};
