import type { ReactNode } from "react";
import type { User } from "./comment.types";

export type UserProviderProps = {
  /** The current user, or null when nobody is signed in */
  user: User | null;
  children: ReactNode;
};

/**
 * Value held by the user context
 */
export type UserContextType = {
  currentUser: User | null;
};
