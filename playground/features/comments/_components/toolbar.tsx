import {
  ConfirmSession,
  CreateSession,
  ResolveSession,
  StartResolving,
  ToggleOverlayButton,
  useComments,
  useFeedbackSession,
} from "../../../../src";
import { CustomButtom } from "../../../components/button";
import { PLAYGROUND_USER } from "../session-shell";
import styles from "../styles.module.scss";
export const CommentToolbar = () => {
  const { overlayState } = useComments();
  const { session, canResolve } = useFeedbackSession();
  const isActive = overlayState !== "inactive";
  const status = session?.status;
  return (
    <div className={styles.toolbar}>
      <ToggleOverlayButton asChild>
        <CustomButtom variant={isActive ? "secondary" : "default"}>
          {isActive ? "Disable" : "Activate"} overlay
        </CustomButtom>
      </ToggleOverlayButton>
      {!session || status === "resolved" ? (
        <CreateSession asChild user={PLAYGROUND_USER}>
          <CustomButtom>Create session</CustomButtom>
        </CreateSession>
      ) : null}
      {status === "draft" ? (
        <ConfirmSession asChild>
          <CustomButtom variant="secondary">Confirm session</CustomButtom>
        </ConfirmSession>
      ) : null}
      {status === "confirmed" && canResolve ? (
        <StartResolving asChild>
          <CustomButtom>Start resolving</CustomButtom>
        </StartResolving>
      ) : null}
      {status === "resolving" && canResolve ? (
        <ResolveSession asChild>
          <CustomButtom>Resolve session</CustomButtom>
        </ResolveSession>
      ) : null}
    </div>
  );
};
