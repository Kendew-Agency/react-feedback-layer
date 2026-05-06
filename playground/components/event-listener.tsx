import { useEffect } from "react";
import { useComments } from "../../src";

export const EventListener = () => {
  const { events } = useComments();

  useEffect(() => {
    const unsubscribe = events.onFocusChange((commentId) => {
      console.info("Focus shifted to: ", commentId);
    });

    return unsubscribe; // cleanup on unmount
  }, [events]);

  return null;
};
