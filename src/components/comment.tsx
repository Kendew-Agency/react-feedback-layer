import {
  type CSSProperties,
  useState,
  type ButtonHTMLAttributes,
  type HTMLProps,
  type ReactNode,
} from "react";
import { useComments } from "../contexts/comment-context";
import { Slot } from "@radix-ui/react-slot";
import type { CommentType } from "../types";
import {
  CommentScopeContext,
  useCommentScope,
} from "../contexts/scoped-comment";

interface CommentRootProps extends HTMLProps<HTMLDivElement> {
  comment: CommentType;
  defaultDraft?: string;
  withPosition?: boolean;
  children?: ReactNode;
}

const CommentRoot = ({
  comment,
  defaultDraft,
  withPosition = true,
  children,
  ...rest
}: CommentRootProps) => {
  const { getActiveComment } = useComments();
  const isActive = getActiveComment()?.id === comment.id;

  const [draft, setDraft] = useState(defaultDraft ?? comment.content ?? "");

  const positionStyles: CSSProperties = {
    position: "absolute",
    top: comment.position.y,
    left: comment.position.x,
  };

  return (
    <CommentScopeContext.Provider
      value={{ comment, isActive, draft, setDraft }}
    >
      <div
        {...rest}
        data-comment={comment.id}
        data-active={isActive}
        style={{
          zIndex: isActive ? 40 : 30,
          ...(withPosition ? positionStyles : {}),
          ...(rest.style ?? {}),
        }}
      >
        {children}
      </div>
    </CommentScopeContext.Provider>
  );
};

interface CommentIndicatorProps extends HTMLProps<HTMLDivElement> {}

const CommentIndicator = ({ ...rest }: CommentIndicatorProps) => {
  const { comment, isActive } = useCommentScope();
  const { config } = useComments();

  if (!comment.indicator) return null;
  if (config?.indicatorVisibility === "active" && !isActive) return null;

  return (
    <div
      {...rest}
      data-parent={comment.id}
      style={{
        width: comment.indicator.width,
        height: comment.indicator.height,
        position: "absolute",
        top: 0 - comment.indicator.height,
        left: 0 - comment.indicator.width,
        zIndex: 1,
        pointerEvents: "none",
        border: "1px dashed black",
        ...rest.style,
      }}
    />
  );
};

interface CommentContentProps extends HTMLProps<HTMLParagraphElement> {
  asChild?: boolean;
}

const CommentContent = ({ asChild, ...rest }: CommentContentProps) => {
  const { draft } = useCommentScope();
  const Comp = asChild ? Slot : "p";

  return <Comp {...rest}>{draft}</Comp>;
};

interface CommentEditProps extends HTMLProps<HTMLTextAreaElement> {
  asChild?: boolean;
}

const CommentEdit = ({ asChild, ...rest }: CommentEditProps) => {
  const { draft, setDraft } = useCommentScope();
  const Comp = asChild ? Slot : "textarea";

  return (
    <Comp
      {...rest}
      value={rest.value ?? draft}
      name="commentEdit"
      placeholder="Write a comment..."
      onChange={(e) => {
        setDraft(e.target.value);
        rest.onChange?.(e);
      }}
    />
  );
};

interface CommentConfirmProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const CommentConfirm = ({ asChild, ...rest }: CommentConfirmProps) => {
  const { updateComment } = useComments();
  const { comment, draft } = useCommentScope();
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      {...rest}
      disabled={!draft}
      onClick={(e) => {
        updateComment(comment.id, { content: draft });
        rest.onClick?.(e);
      }}
    />
  );
};

interface CommentDeleteProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const CommentDelete = ({ asChild, ...rest }: CommentDeleteProps) => {
  const { deleteComment } = useComments();
  const { comment } = useCommentScope();
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      {...rest}
      onClick={(e) => {
        deleteComment(comment.id);
        rest.onClick?.(e);
      }}
    />
  );
};

interface CommentResolveProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const CommentResolve = ({ asChild, ...rest }: CommentResolveProps) => {
  const { resolveComment } = useComments();
  const { comment } = useCommentScope();
  const Comp = asChild ? Slot : "button";

  if (comment.status === "draft") {
    console.error(
      `A draft comment can not be resolved, remove this button from this comment: ${comment.id}`,
    );
    return null;
  }

  if (comment.status === "resolved") {
    console.error(
      `A resolved comment can not be resolved again, remove this button from this comment: ${comment.id}`,
    );
    return null;
  }

  return (
    <Comp
      {...rest}
      onClick={(e) => {
        resolveComment(comment.id);
        rest.onClick?.(e);
      }}
    />
  );
};

interface CommentReopenProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const CommentReopen = ({ asChild, ...rest }: CommentReopenProps) => {
  const { reopenComment } = useComments();
  const { comment } = useCommentScope();
  const Comp = asChild ? Slot : "button";

  if (comment.status === "draft") {
    console.error(
      `A draft comment can not be reopened, remove this button from this comment: ${comment.id}`,
    );
    return null;
  }

  if (comment.status === "published") {
    console.error(
      `A published comment can not be reopened, remove this button from this comment: ${comment.id}`,
    );
    return null;
  }

  return (
    <Comp
      {...rest}
      onClick={(e) => {
        reopenComment(comment.id);
        rest.onClick?.(e);
      }}
    />
  );
};

export const Comment = {
  /**
   * The root component for a comment, must be used to wrap all other comment components.
   *
   * @param comment as the current comment from the comments array
   * @param defaultDraft as the optional initial value for the comment edit state
   * @param withPosition as whether to inject positioning styles from the comment's position. Disable if you want to display the comment in a list. Defaults to true
   */
  // biome-ignore lint/style/useNamingConvention: Modular export
  Root: CommentRoot,
  /**
   * The comment indicator
   *
   * @description Shows a dashed line that indicates a section this comment relates to
   */
  // biome-ignore lint/style/useNamingConvention: Modular export
  Indicator: CommentIndicator,
  /**
   * The comment's static safed content
   *
   * @description Displays the comment's content as a `<p>` tag
   * @param asChild as whether to use the child as the base element instead of the default `<p>` tag. This allows for more flexibility
   */
  // biome-ignore lint/style/useNamingConvention: Modular export
  Content: CommentContent,
  /**
   * The comment's editable content
   *
   * @description A textarea to edit the comment's content
   * @param asChild as whether to use the child as the base element instead of the default `<textarea>` tag. This allows for more flexibility
   */
  // biome-ignore lint/style/useNamingConvention: Modular export
  Edit: CommentEdit,
  /**
   * Confirms the changes made to a comment
   *
   * @description Updates the comment's content with the current draft
   * @param asChild as whether to use the child as the base element instead of the default `<button>` tag. This allows for more flexibility
   */
  // biome-ignore lint/style/useNamingConvention: Modular export
  Confirm: CommentConfirm,
  /**
   * Deletes a comment
   *
   * @description Removes the comment from the comment list
   * @param asChild as whether to use the child as the base element instead of the default `<button>` tag. This allows for more flexibility
   */
  // biome-ignore lint/style/useNamingConvention: Modular export
  Delete: CommentDelete,
  /**
   * Resolves a comment
   *
   * @description Calls `resolveComment` for this comment. Renders nothing (and logs an error) for draft and resolved comments
   * @param asChild as whether to use the child as the base element instead of the default `<button>` tag. This allows for more flexibility
   */
  // biome-ignore lint/style/useNamingConvention: Modular export
  Resolve: CommentResolve,
  /**
   * Reopens a resolved comment
   *
   * @description Calls `reopenComment` for this comment. Renders nothing (and logs an error) for draft and published comments
   * @param asChild as whether to use the child as the base element instead of the default `<button>` tag. This allows for more flexibility
   */
  // biome-ignore lint/style/useNamingConvention: Modular export
  Reopen: CommentReopen,
};
