import {
  useState,
  type ButtonHTMLAttributes,
  type HTMLProps,
  type ReactNode,
} from "react";
import { useComments } from "../contexts/comment-context";
import { Slot } from "@radix-ui/react-slot";
import type { Comment as CommentType } from "../types";
import {
  CommentScopeContext,
  useCommentScope,
} from "../contexts/scoped-comment";

interface CommentRootProps extends HTMLProps<HTMLDivElement> {
  comment: CommentType;
  children?: ReactNode;
  defaultDraft?: string;
}

const CommentRoot = ({
  comment,
  children,
  defaultDraft,
  ...rest
}: CommentRootProps) => {
  const { getActiveComment } = useComments();
  const isActive = getActiveComment()?.id === comment.id;

  const [draft, setDraft] = useState(defaultDraft ?? comment.content ?? "");

  return (
    <CommentScopeContext.Provider
      value={{ comment, isActive, draft, setDraft }}
    >
      <div
        {...rest}
        data-comment={comment.id}
        data-active={isActive}
        style={{
          top: comment.position.y,
          left: comment.position.x,
          position: "absolute",
          zIndex: isActive ? 40 : 30,
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
  const { comment } = useCommentScope();

  if (!comment.indicator) return null;

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
  const { toggleResolvingComment } = useComments();
  const { comment } = useCommentScope();
  const Comp = asChild ? Slot : "button";

  if (comment.status === "draft") {
    console.error(
      `A draft comment can not be marked as resolving, remove this button from this comment: ${comment.id}`,
    );
    return null;
  }

  if (comment.status === "resolved") {
    console.error(
      `A resolved comment can not be marked as resolving, remove this button from this comment: ${comment.id}`,
    );
    return null;
  }

  return (
    <Comp
      {...rest}
      onClick={(e) => {
        toggleResolvingComment(comment.id);
        rest.onClick?.(e);
      }}
    />
  );
};

export const Comment = {
  // biome-ignore lint/style/useNamingConvention: Modular export
  Root: CommentRoot,
  // biome-ignore lint/style/useNamingConvention: Modular export
  Indicator: CommentIndicator,
  // biome-ignore lint/style/useNamingConvention: Modular export
  Content: CommentContent,
  // biome-ignore lint/style/useNamingConvention: Modular export
  Edit: CommentEdit,
  // biome-ignore lint/style/useNamingConvention: Modular export
  Confirm: CommentConfirm,
  // biome-ignore lint/style/useNamingConvention: Modular export
  Delete: CommentDelete,
  // biome-ignore lint/style/useNamingConvention: Modular export
  Resolve: CommentResolve,
};
