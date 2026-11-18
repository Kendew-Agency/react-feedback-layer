import { type ReactNode, useEffect, useState } from "react";

// Tiny pathname router for the playground. Navigation uses the History API,
// so switching routes unmounts and remounts the page without a reload.
const NAVIGATE_EVENT = "playground:navigate";

export function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const update = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", update);
    window.addEventListener(NAVIGATE_EVENT, update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener(NAVIGATE_EVENT, update);
    };
  }, []);

  return pathname;
}

export const Link = ({ to, children }: { to: string; children: ReactNode }) => (
  <a
    href={to}
    onClick={(event) => {
      event.preventDefault();
      if (window.location.pathname === to) return;
      window.history.pushState(null, "", to);
      window.dispatchEvent(new Event(NAVIGATE_EVENT));
    }}
  >
    {children}
  </a>
);
