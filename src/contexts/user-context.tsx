import * as React from "react";
import type { User } from "../types/comment.types";
import type {
  UserContextType,
  UserProviderProps,
} from "../types/user.types";

const UserContext = React.createContext<UserContextType | undefined>(
  undefined,
);

export const UserProvider = ({ user, children }: UserProviderProps) => {
  const value = React.useMemo<UserContextType>(
    () => ({ currentUser: user }),
    [user],
  );
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

/**
 * Returns the current user, or null when nobody is signed in.
 * Throws when used outside <UserProvider />.
 */
export const useCurrentUser = (): User | null => {
  const ctx = React.useContext(UserContext);
  if (!ctx) {
    throw new Error("useCurrentUser must be used within <UserProvider />");
  }
  return ctx.currentUser;
};

/**
 * Internal. Returns undefined when there is no <UserProvider />, so callers
 * can fall back to their own `currentUser` prop.
 */
export const useOptionalCurrentUser = (): User | null | undefined => {
  const ctx = React.useContext(UserContext);
  return ctx ? ctx.currentUser : undefined;
};
