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
            src="https://t4590011.p.clickup-attachments.com/t4590011/2ec29df2-af27-4667-bcd3-381e17b9b457/191225%20FR%20Onepager%20Dining%20Experience%20Black%20Pearls%20snijtekens.png?view=open"
            alt="alt"
          />
        </div>
      </CommentWrapper>
    </main>
  );
};
