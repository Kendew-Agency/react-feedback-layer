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

export { ToggleOverlayButton };
