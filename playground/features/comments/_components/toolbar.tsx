import {
  ConfirmComments,
  ResolveComments,
  ToggleOverlayButton,
  useComments,
} from "../../../../src";
import { CustomButtom } from "../../../components/button";
import styles from "../styles.module.scss";
export const CommentToolbar = () => {
  const { overlayState, draftComments, resolvingComments } = useComments();
  const isActive = overlayState !== "inactive";
  return (
    <div className={styles.toolbar}>
      <ToggleOverlayButton asChild>
        <CustomButtom variant={isActive ? "secondary" : "default"}>
          {isActive ? "Disable" : "Activate"} overlay
        </CustomButtom>
      </ToggleOverlayButton>
      {draftComments?.length ? (
        <ConfirmComments asChild>
          <CustomButtom variant="secondary">Confirm comments</CustomButtom>
        </ConfirmComments>
      ) : null}
      {resolvingComments?.length ? (
        <ResolveComments asChild>
          <CustomButtom>Resolve comments</CustomButtom>
        </ResolveComments>
      ) : null}
    </div>
  );
};
