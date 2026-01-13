import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { useComments } from "../contexts/comment-context";

interface CommentButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const ToggleOverlayButton = ({ asChild, ...rest }: CommentButtonProps) => {
  const { toggleOverlay, overlayState } = useComments();
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-active={overlayState !== "inactive"}
      {...rest}
      onClick={(e) => {
        toggleOverlay();
        rest.onClick?.(e);
      }}
    />
  );
};

const ConfirmComments = ({ asChild, ...rest }: CommentButtonProps) => {
  const { confirmComments } = useComments();
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      {...rest}
      onClick={(e) => {
        confirmComments();
        rest.onClick?.(e);
      }}
    />
  );
};

const ResolveComments = ({ asChild, ...rest }: CommentButtonProps) => {
  const { resolveComments } = useComments();
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      {...rest}
      onClick={(e) => {
        resolveComments();
        rest.onClick?.(e);
      }}
    />
  );
};

export { ToggleOverlayButton, ConfirmComments, ResolveComments };
