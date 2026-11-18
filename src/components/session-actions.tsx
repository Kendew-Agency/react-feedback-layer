import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { useFeedbackSession } from "../contexts/feedback-session-context";
import type { User } from "../types/comment.types";

interface SessionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

interface CreateSessionProps extends SessionButtonProps {
  /** The user creating the session */
  user: User;
}

const CreateSession = ({ asChild, user, ...rest }: CreateSessionProps) => {
  const { createSession } = useFeedbackSession();
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      {...rest}
      onClick={(e) => {
        void createSession({ user });
        rest.onClick?.(e);
      }}
    />
  );
};

const ConfirmSession = ({ asChild, ...rest }: SessionButtonProps) => {
  const { confirmSession } = useFeedbackSession();
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      {...rest}
      onClick={(e) => {
        void confirmSession();
        rest.onClick?.(e);
      }}
    />
  );
};

const StartResolving = ({ asChild, ...rest }: SessionButtonProps) => {
  const { startResolving } = useFeedbackSession();
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      {...rest}
      onClick={(e) => {
        void startResolving();
        rest.onClick?.(e);
      }}
    />
  );
};

const ResolveSession = ({ asChild, ...rest }: SessionButtonProps) => {
  const { resolveSession } = useFeedbackSession();
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      {...rest}
      onClick={(e) => {
        void resolveSession();
        rest.onClick?.(e);
      }}
    />
  );
};

export { CreateSession, ConfirmSession, StartResolving, ResolveSession };
