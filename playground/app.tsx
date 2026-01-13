import { CommentWrapper } from "./features/comments/comment-wrapper";

export const App = () => {
  return (
    <main
      style={{
        height: "100vh",
      }}
    >
      <CommentWrapper>
        <h1>Lorem ipsum, dolor sit amet consectetur adipisicing elit.</h1>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem dolores
          eligendi, hic minus, nostrum, maiores rerum ex veniam molestiae porro
          quibusdam esse temporibus nulla ab culpa.
        </p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem dolores
          eligendi, hic minus, nostrum, maiores rerum ex veniam molestiae porro
          quibusdam esse temporibus nulla ab culpa.
        </p>
      </CommentWrapper>
    </main>
  );
};
