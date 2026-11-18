import { Link, usePathname } from "./components/router";
import { SessionShell } from "./features/comments/session-shell";
import { PageA } from "./pages/page-a";
import { PageB } from "./pages/page-b";
import { PageC } from "./pages/page-c";

const Page = ({ pathname }: { pathname: string }) => {
  if (pathname === "/page-b") return <PageB />;
  if (pathname === "/page-c") return <PageC />;
  return <PageA />;
};

export const App = () => {
  const pathname = usePathname();

  return (
    <main style={{ height: "100vh" }}>
      <SessionShell>
        <nav style={{ display: "flex", gap: 16, padding: 10 }}>
          <Link to="/page-a">Page A</Link>
          <Link to="/page-b">Page B</Link>
          <Link to="/page-c">Page C</Link>
        </nav>
        <Page pathname={pathname} />
      </SessionShell>
    </main>
  );
};
