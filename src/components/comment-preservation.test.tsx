import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import fc from "fast-check";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CommentContextProvider,
  useComments,
} from "../contexts/comment-context";
import { FeedbackSessionProvider } from "../contexts/feedback-session-context";
import type { CommentType, ConfirmedComment } from "../types";
import type { InitialFeedbackSession } from "../types/session.types";
import { Comment } from "./comment";

/**
 * Preservation: behavior outside the bug condition. Single instance per
 * comment, no assertions on Comment.Content during pending typing. These
 * tests must PASS on unfixed code and keep passing after the fix.
 */

const SESSION_ID = "s1";

const makeSession = (
  status: InitialFeedbackSession["status"] = "draft",
): InitialFeedbackSession => ({
  id: SESSION_ID,
  type: "feedback",
  status,
  createdAt: new Date(0),
  createdBy: "u1",
  participantIds: [],
});

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

type Callbacks = {
  onAdd?: (c: ConfirmedComment) => Promise<void>;
  onEdit?: (c: ConfirmedComment) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onResolve?: (c: ConfirmedComment) => Promise<void>;
  onReopen?: (c: ConfirmedComment) => Promise<void>;
};

const Providers = ({
  comment,
  sessionStatus = "draft",
  callbacks = {},
  children,
}: {
  comment: CommentType;
  sessionStatus?: InitialFeedbackSession["status"];
  callbacks?: Callbacks;
  children: ReactNode;
}) => (
  <FeedbackSessionProvider
    initialSession={makeSession(sessionStatus)}
    canResolveSession
  >
    <CommentContextProvider
      // Draft comments are cast: the type only allows confirmed comments
      initialComments={[comment as ConfirmedComment]}
      locationId="loc"
      {...callbacks}
    >
      {children}
    </CommentContextProvider>
  </FeedbackSessionProvider>
);

/** Renders a single instance whose comment prop follows provider state */
const Connected = ({
  fallback,
  defaultDraft,
}: {
  fallback: CommentType;
  defaultDraft?: string | undefined;
}) => {
  const { allComments } = useComments();
  const current = allComments.find((c) => c.id === fallback.id) ?? fallback;
  return (
    <Comment.Root
      comment={current}
      withPosition={false}
      {...(defaultDraft === undefined ? {} : { defaultDraft })}
    >
      <div data-testid="content">
        <Comment.Content />
      </div>
      <Comment.Indicator data-testid="indicator" />
      <Comment.Edit data-testid="edit" />
      <Comment.Confirm data-testid="confirm">Confirm</Comment.Confirm>
      <Comment.Delete data-testid="delete">Delete</Comment.Delete>
      <Comment.Resolve data-testid="resolve">Resolve</Comment.Resolve>
      <Comment.Reopen data-testid="reopen">Reopen</Comment.Reopen>
    </Comment.Root>
  );
};

/** Renders a single instance driven directly by the comment prop */
const Direct = ({ comment }: { comment: CommentType }) => (
  <Providers comment={comment}>
    <Comment.Root comment={comment} withPosition={false}>
      <Comment.Edit data-testid="edit" />
      <Comment.Confirm data-testid="confirm">Confirm</Comment.Confirm>
    </Comment.Root>
  </Providers>
);

const noop = () => undefined;

type R = ReturnType<typeof render>;

const editValue = (r: R) =>
  (r.getByTestId("edit") as HTMLTextAreaElement).value;

const type = (r: R, value: string) =>
  act(() => {
    fireEvent.change(r.getByTestId("edit"), { target: { value } });
  });

const text = fc.stringMatching(/^[a-z0-9]{1,12}$/).filter((s) => s !== "old");

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(noop);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Comment.Edit initial value (3.1)", () => {
  it("starts with defaultDraft ?? comment.content ?? ''", () => {
    fc.assert(
      fc.property(
        fc.option(fc.string({ maxLength: 12 }), { nil: undefined }),
        fc.option(fc.stringMatching(/^[a-z0-9]{0,12}$/), { nil: undefined }),
        (defaultDraft, content) => {
          cleanup();
          const comment = makeComment({
            content: content as string,
            status: "draft",
          });
          const r = render(
            <Providers comment={comment}>
              <Connected fallback={comment} defaultDraft={defaultDraft} />
            </Providers>,
          );
          expect(editValue(r)).toBe(defaultDraft ?? content ?? "");
        },
      ),
      { numRuns: 25 },
    );
  });
});

describe("Comment.Confirm disabled state (3.2)", () => {
  it("is disabled for an empty draft and enabled otherwise", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z0-9]{1,12}$/),
        fc.boolean(),
        (value, clear) => {
          cleanup();
          const r = render(<Direct comment={makeComment()} />);
          const confirm = r.getByTestId("confirm") as HTMLButtonElement;
          expect(confirm.disabled).toBe(false);
          type(r, value);
          expect(confirm.disabled).toBe(false);
          if (clear) {
            type(r, "");
            expect(confirm.disabled).toBe(true);
          }
        },
      ),
      { numRuns: 15 },
    );
  });

  it("is disabled for a draft comment with empty content", () => {
    const r = render(
      <Direct comment={makeComment({ status: "draft", content: "" })} />,
    );
    expect((r.getByTestId("confirm") as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("Comment.Confirm saves the draft (3.3)", () => {
  it("calls update with (id, { content: draft }) and shows saved content", async () => {
    await fc.assert(
      fc.asyncProperty(text, async (next) => {
        cleanup();
        const comment = makeComment();
        const onEdit = vi.fn(async (_c: ConfirmedComment) => noop());
        const r = render(
          <Providers comment={comment} callbacks={{ onEdit }}>
            <Connected fallback={comment} />
          </Providers>,
        );
        type(r, next);
        fireEvent.click(r.getByTestId("confirm"));
        await waitFor(() => expect(onEdit).toHaveBeenCalledTimes(1));
        const saved = onEdit.mock.calls[0]?.[0];
        expect(saved?.id).toBe(comment.id);
        expect(saved?.content).toBe(next);
        await waitFor(() =>
          expect(r.getByTestId("content").textContent).toBe(next),
        );
      }),
      { numRuns: 10 },
    );
  });

  it("confirming a draft comment calls onAdd and shows saved content", async () => {
    await fc.assert(
      fc.asyncProperty(text, async (next) => {
        cleanup();
        const comment = makeComment({ status: "draft", content: "" });
        const onAdd = vi.fn(async (_c: ConfirmedComment) => noop());
        const r = render(
          <Providers comment={comment} callbacks={{ onAdd }}>
            <Connected fallback={comment} />
          </Providers>,
        );
        type(r, next);
        fireEvent.click(r.getByTestId("confirm"));
        await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
        const saved = onAdd.mock.calls[0]?.[0];
        expect(saved?.id).toBe(comment.id);
        expect(saved?.content).toBe(next);
        expect(saved?.status).toBe("published");
        await waitFor(() =>
          expect(r.getByTestId("content").textContent).toBe(next),
        );
      }),
      { numRuns: 10 },
    );
  });
});

describe("Unsaved typing survives non-content prop changes (3.4)", () => {
  it("keeps typing when position, status or indicator change", () => {
    const changes = fc.record({
      x: fc.integer({ min: 0, max: 500 }),
      y: fc.integer({ min: 0, max: 500 }),
      status: fc.constantFrom("draft", "published", "resolved"),
      indicator: fc.option(
        fc.record({
          width: fc.integer({ min: 1, max: 200 }),
          height: fc.integer({ min: 1, max: 200 }),
        }),
        { nil: undefined },
      ),
    });
    fc.assert(
      fc.property(text, changes, (typed, change) => {
        cleanup();
        const r = render(<Direct comment={makeComment()} />);
        type(r, typed);
        const next = makeComment({
          position: { x: change.x, y: change.y },
          status: change.status,
          ...(change.indicator ? { indicator: change.indicator } : {}),
        } as Partial<CommentType>);
        r.rerender(<Direct comment={next} />);
        expect(editValue(r)).toBe(typed);
      }),
      { numRuns: 25 },
    );
  });
});

describe("Other compound components (3.5, 3.6)", () => {
  it("Delete calls onDelete with the comment id", async () => {
    const comment = makeComment();
    const onDelete = vi.fn(async (_id: string) => noop());
    const r = render(
      <Providers comment={comment} callbacks={{ onDelete }}>
        <Connected fallback={comment} />
      </Providers>,
    );
    fireEvent.click(r.getByTestId("delete"));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("c1"));
  });

  it("Resolve resolves a published comment in a resolving session", async () => {
    vi.spyOn(console, "error").mockImplementation(noop);
    const comment = makeComment();
    const onResolve = vi.fn(async (_c: ConfirmedComment) => noop());
    const r = render(
      <Providers
        comment={comment}
        sessionStatus="resolving"
        callbacks={{ onResolve }}
      >
        <Connected fallback={comment} />
      </Providers>,
    );
    expect(r.queryByTestId("reopen")).toBeNull();
    fireEvent.click(r.getByTestId("resolve"));
    await waitFor(() => expect(onResolve).toHaveBeenCalledTimes(1));
    expect(onResolve.mock.calls[0]?.[0]).toMatchObject({
      id: "c1",
      status: "resolved",
    });
  });

  it("Reopen reopens a resolved comment in a resolving session", async () => {
    vi.spyOn(console, "error").mockImplementation(noop);
    const comment = makeComment({
      status: "resolved",
      resolvedAt: new Date(0),
    } as Partial<CommentType>);
    const onReopen = vi.fn(async (_c: ConfirmedComment) => noop());
    const r = render(
      <Providers
        comment={comment}
        sessionStatus="resolving"
        callbacks={{ onReopen }}
      >
        <Connected fallback={comment} />
      </Providers>,
    );
    expect(r.queryByTestId("resolve")).toBeNull();
    fireEvent.click(r.getByTestId("reopen"));
    await waitFor(() => expect(onReopen).toHaveBeenCalledTimes(1));
    expect(onReopen.mock.calls[0]?.[0]).toMatchObject({
      id: "c1",
      status: "published",
    });
  });

  it("Resolve and Reopen render nothing and log an error for a draft comment", () => {
    const error = vi.spyOn(console, "error").mockImplementation(noop);
    const comment = makeComment({ status: "draft", content: "" });
    const r = render(
      <Providers comment={comment}>
        <Connected fallback={comment} />
      </Providers>,
    );
    expect(r.queryByTestId("resolve")).toBeNull();
    expect(r.queryByTestId("reopen")).toBeNull();
    expect(error).toHaveBeenCalled();
  });

  it("Indicator renders with the comment's size, or nothing without one", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 300 }),
        fc.integer({ min: 1, max: 300 }),
        (width, height) => {
          cleanup();
          const withIndicator = makeComment({
            indicator: { width, height },
          } as Partial<CommentType>);
          const r = render(
            <Providers comment={withIndicator}>
              <Connected fallback={withIndicator} />
            </Providers>,
          );
          const el = r.getByTestId("indicator");
          expect(el.getAttribute("data-parent")).toBe("c1");
          expect(el.style.width).toBe(`${width}px`);
          expect(el.style.height).toBe(`${height}px`);
          cleanup();
          const without = makeComment();
          const r2 = render(
            <Providers comment={without}>
              <Connected fallback={without} />
            </Providers>,
          );
          expect(r2.queryByTestId("indicator")).toBeNull();
        },
      ),
      { numRuns: 15 },
    );
  });
});
