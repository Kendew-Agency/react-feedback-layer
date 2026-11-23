import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import fc from "fast-check";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  CommentContextProvider,
  useComments,
} from "../contexts/comment-context";
import { FeedbackSessionProvider } from "../contexts/feedback-session-context";
import type { CommentType, ConfirmedComment } from "../types";
import type { InitialFeedbackSession } from "../types/session.types";
import { Comment } from "./comment";

/**
 * Bug condition exploration: Comment.Content must render the saved
 * `comment.content`, not the local draft. These tests are expected to FAIL on
 * unfixed code.
 */

const SESSION_ID = "s1";

const session: InitialFeedbackSession = {
  id: SESSION_ID,
  type: "feedback",
  status: "draft",
  createdAt: new Date(0),
  createdBy: "u1",
  participantIds: [],
};

const makeComment = (overrides: Partial<CommentType> = {}): CommentType => ({
  id: "c1",
  position: { x: 0, y: 0 },
  content: "old",
  user: null,
  createdAt: new Date(0),
  status: "published",
  sessionId: SESSION_ID,
  locationId: "loc",
  ...overrides,
});

const Providers = ({
  comment,
  children,
}: {
  comment: CommentType;
  children: ReactNode;
}) => (
  <FeedbackSessionProvider initialSession={session}>
    <CommentContextProvider // Draft comments are cast: the type only allows confirmed comments
      initialComments={[comment as ConfirmedComment]}
      locationId="loc"
    >
      {children}
    </CommentContextProvider>
  </FeedbackSessionProvider>
);

const Instance = ({
  name,
  comment,
}: {
  name: string;
  comment: CommentType;
}) => (
  <div data-testid={name}>
    <Comment.Root comment={comment} withPosition={false}>
      <div data-testid={`${name}-content`}>
        <Comment.Content />
      </div>
      <Comment.Edit data-testid={`${name}-edit`} />
      <Comment.Confirm data-testid={`${name}-confirm`}>Confirm</Comment.Confirm>
    </Comment.Root>
  </div>
);

const TwoInstances = ({ comment }: { comment: CommentType }) => (
  <Providers comment={comment}>
    <Instance name="a" comment={comment} />
    <Instance name="b" comment={comment} />
  </Providers>
);

const content = (r: ReturnType<typeof render>, name: string) =>
  r.getByTestId(`${name}-content`).textContent;

const type = (r: ReturnType<typeof render>, name: string, value: string) =>
  act(() => {
    fireEvent.change(r.getByTestId(`${name}-edit`), { target: { value } });
  });

const text = fc.stringMatching(/^[a-z0-9]{1,12}$/).filter((s) => s !== "old");

afterEach(cleanup);

describe("Comment.Content shows saved content (bug condition)", () => {
  it("(a) other instance shows content confirmed in instance A", async () => {
    await fc.assert(
      fc.asyncProperty(text, async (next) => {
        cleanup();
        const comment = makeComment();
        // The comment prop of both instances comes from provider state
        const Connected = () => {
          const { allComments } = useComments();
          const current = allComments.find((c) => c.id === "c1") ?? comment;
          return (
            <>
              <Instance name="a" comment={current} />
              <Instance name="b" comment={current} />
            </>
          );
        };
        const r = render(
          <Providers comment={comment}>
            <Connected />
          </Providers>,
        );
        type(r, "a", next);
        fireEvent.click(r.getByTestId("a-confirm"));
        await waitFor(() => expect(content(r, "a")).toBe(next));
        expect(content(r, "b")).toBe(next);
      }),
      { numRuns: 10 },
    );
  });

  it("(b) shows changed comment.content after rerender", () => {
    fc.assert(
      fc.property(text, (next) => {
        cleanup();
        const r = render(<TwoInstances comment={makeComment()} />);
        r.rerender(<TwoInstances comment={makeComment({ content: next })} />);
        expect(content(r, "a")).toBe(next);
        expect(content(r, "b")).toBe(next);
      }),
      { numRuns: 10 },
    );
  });

  it("(c) typing without confirm keeps saved content", () => {
    fc.assert(
      fc.property(text, (typed) => {
        cleanup();
        const r = render(<TwoInstances comment={makeComment()} />);
        type(r, "a", typed);
        expect(content(r, "a")).toBe("old");
        expect(content(r, "b")).toBe("old");
      }),
      { numRuns: 10 },
    );
  });

  it("(d) typing into a draft comment leaves content empty until confirm", () => {
    fc.assert(
      fc.property(text, (typed) => {
        cleanup();
        const r = render(
          <TwoInstances
            comment={makeComment({ status: "draft", content: "" })}
          />,
        );
        type(r, "a", typed);
        expect(content(r, "a")).toBe("");
        expect(content(r, "b")).toBe("");
      }),
      { numRuns: 10 },
    );
  });
});
