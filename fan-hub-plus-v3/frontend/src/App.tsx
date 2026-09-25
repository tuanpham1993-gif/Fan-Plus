import React, { useEffect } from "react";
import { useApp } from "./lib/store";
import { useLocation } from "./lib/router";
import Layout from "./components/Layout";
import { Gate, Skeleton, Empty, Button } from "./components/ui";
const Community = React.lazy(() => import("./features/Community"));
const Giveaways = React.lazy(() => import("./features/Giveaways"));
const Knowledge = React.lazy(() =>
  import("./features/Lore").then((m) => ({ default: m.KnowledgePage })),
);
const Home = React.lazy(() => import("./pages/Home"));
const Explore = React.lazy(() => import("./pages/Explore"));
const Detail = React.lazy(() => import("./pages/Detail"));
const Events = React.lazy(() => import("./pages/Events"));
const Auth = React.lazy(() => import("./pages/Auth"));
const Account = React.lazy(() => import("./pages/Account"));
const Admin = React.lazy(() => import("./pages/Admin"));
const Assistant = React.lazy(() => import("./features/Lore"));
const Utility = React.lazy(() => import("./pages/Utility"));
const MemberProfile = React.lazy(() => import("./pages/MemberProfile"));
const Releases = React.lazy(() => import("./pages/Releases"));
export class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
  },
  {
    failed: boolean;
  }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("Fan Hub UI error:", error);
  }
  render() {
    return this.state.failed ? (
      <div className="main-container">
        <Empty
          title="Something interrupted the journey."
          description="Reload the page to try again. Your local data has not been reset."
        >
          <Button onClick={() => location.reload()}>Reload application</Button>
        </Empty>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  const { pathname } = useLocation();
  const { loading, error, reload, user } = useApp();
  useEffect(() => {
    const names: Record<string, string> = {
      "/": "Discover",
      "/explore": "Explore",
      "/events": "Events",
      "/showcase": "Showcase",
      "/dashboard": "Your workspace",
      "/collection": "Your collection",
      "/admin": "Editorial workspace",
      "/community": "Community",
      "/giveaways": "Quarterly gifts",
      "/assistant": "Lore Master",
    };
    document.title =
      (names[pathname] || "Explore your worlds") + " | Fan Hub Plus";
  }, [pathname]);
  let page: React.ReactNode;
  if (loading)
    page = (
      <div className="loading-page">
        <p className="eyebrow">OPENING YOUR UNIVERSE</p>
        <Skeleton cards={6} />
      </div>
    );
  else if (error)
    page = (
      <Empty title="We couldn't open the demo data." description={error}>
        <Button onClick={() => void reload()}>Try again</Button>
      </Empty>
    );
  else if (pathname === "/") page = <Home />;
  else if (
    ["/explore", "/media", "/characters", "/showcase"].includes(pathname)
  )
    page = <Explore key={pathname} mode={pathname.slice(1)} />;
  else if (pathname.startsWith("/content/") && pathname.split("/").length === 3)
    page = <Detail key={pathname} id={decodeURIComponent(pathname.slice(9))} />;
  else if (pathname === "/events") page = <Events />;
  else if (pathname.startsWith("/events/") && pathname.split("/").length === 3)
    page = <Events key={pathname} id={decodeURIComponent(pathname.slice(8))} />;
  else if (pathname === "/releases") page = <Releases />;
  else if (
    [
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/verify-email",
    ].includes(pathname)
  ) {
    const modes: Record<string, string> = {
      "/login": "login",
      "/register": "register",
      "/forgot-password": "forgot",
      "/reset-password": "reset",
      "/verify-email": "verify",
    };
    page = <Auth key={pathname} mode={modes[pathname]} />;
  } else if (
    ["/dashboard", "/collection", "/profile", "/submit"].includes(pathname)
  )
    page = (
      <Gate>
        <Account key={pathname + user?.id} mode={pathname.slice(1)} />
      </Gate>
    );
  else if (pathname === "/feedback") page = <Account mode="feedback" />;
  else if (pathname === "/admin")
    page = (
      <Gate admin>
        <Admin />
      </Gate>
    );
  else if (pathname === "/community")
    page = <Community key={user?.id || "visitor"} />;
  else if (
    pathname.startsWith("/community/member/") &&
    pathname.split("/").length === 4
  )
    page = (
      <MemberProfile
        key={pathname}
        id={decodeURIComponent(pathname.slice(19))}
      />
    );
  else if (pathname === "/giveaways")
    page = <Giveaways key={user?.id || "visitor"} />;
  else if (pathname.startsWith("/knowledge/"))
    page = (
      <Knowledge key={pathname} id={decodeURIComponent(pathname.slice(11))} />
    );
  else if (pathname === "/assistant")
    page = <Assistant key={user?.id || "visitor"} />;
  else
    page = (
      <Utility
        mode={
          pathname === "/sitemap"
            ? "sitemap"
            : pathname === "/privacy"
              ? "privacy"
              : pathname === "/terms"
                ? "terms"
                : "404"
        }
      />
    );
  return (
    <Layout>
      <React.Suspense
        fallback={
          <div className="loading-page">
            <Skeleton cards={3} />
          </div>
        }
      >
        {page}
      </React.Suspense>
    </Layout>
  );
}
