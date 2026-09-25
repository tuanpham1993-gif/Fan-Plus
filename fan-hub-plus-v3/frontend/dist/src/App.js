import React, { useEffect } from "react";
import { useApp } from "./lib/store.js";
import { useLocation } from "./lib/router.js";
import Layout from "./components/Layout.js";
import { Gate, Skeleton, Empty, Button } from "./components/ui.js";
const Community = React.lazy(() => import("./features/Community.js"));
const Giveaways = React.lazy(() => import("./features/Giveaways.js"));
const Knowledge = React.lazy(() => import("./features/Lore.js").then((m) => ({ default: m.KnowledgePage })));
const Home = React.lazy(() => import("./pages/Home.js"));
const Explore = React.lazy(() => import("./pages/Explore.js"));
const Detail = React.lazy(() => import("./pages/Detail.js"));
const Events = React.lazy(() => import("./pages/Events.js"));
const Auth = React.lazy(() => import("./pages/Auth.js"));
const Account = React.lazy(() => import("./pages/Account.js"));
const Admin = React.lazy(() => import("./pages/Admin.js"));
const Assistant = React.lazy(() => import("./features/Lore.js"));
const Utility = React.lazy(() => import("./pages/Utility.js"));
const Releases = React.lazy(() => import("./pages/Releases.js"));
export class ErrorBoundary extends React.Component {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    componentDidCatch(error) {
        console.error("Fan Hub UI error:", error);
    }
    render() {
        return this.state.failed ? (React.createElement("div", { className: "main-container" },
            React.createElement(Empty, { title: "Something interrupted the journey.", description: "Reload the page to try again. Your local data has not been reset." },
                React.createElement(Button, { onClick: () => location.reload() }, "Reload application")))) : (this.props.children);
    }
}
export default function App() {
    const { pathname } = useLocation();
    const { loading, error, reload, user } = useApp();
    useEffect(() => {
        const names = {
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
    let page;
    if (loading)
        page = (React.createElement("div", { className: "loading-page" },
            React.createElement("p", { className: "eyebrow" }, "OPENING YOUR UNIVERSE"),
            React.createElement(Skeleton, { cards: 6 })));
    else if (error)
        page = (React.createElement(Empty, { title: "We couldn't open the demo data.", description: error },
            React.createElement(Button, { onClick: () => void reload() }, "Try again")));
    else if (pathname === "/")
        page = React.createElement(Home, null);
    else if (["/explore", "/media", "/characters", "/showcase"].includes(pathname))
        page = React.createElement(Explore, { key: pathname, mode: pathname.slice(1) });
    else if (pathname.startsWith("/content/") && pathname.split("/").length === 3)
        page = React.createElement(Detail, { key: pathname, id: decodeURIComponent(pathname.slice(9)) });
    else if (pathname === "/events")
        page = React.createElement(Events, null);
    else if (pathname.startsWith("/events/") && pathname.split("/").length === 3)
        page = React.createElement(Events, { key: pathname, id: decodeURIComponent(pathname.slice(8)) });
    else if (pathname === "/releases")
        page = React.createElement(Releases, null);
    else if ([
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
    ].includes(pathname)) {
        const modes = {
            "/login": "login",
            "/register": "register",
            "/forgot-password": "forgot",
            "/reset-password": "reset",
            "/verify-email": "verify",
        };
        page = React.createElement(Auth, { key: pathname, mode: modes[pathname] });
    }
    else if (["/dashboard", "/collection", "/profile", "/submit"].includes(pathname))
        page = (React.createElement(Gate, null,
            React.createElement(Account, { key: pathname + user?.id, mode: pathname.slice(1) })));
    else if (pathname === "/feedback")
        page = React.createElement(Account, { mode: "feedback" });
    else if (pathname === "/admin")
        page = (React.createElement(Gate, { admin: true },
            React.createElement(Admin, null)));
    else if (pathname === "/community")
        page = React.createElement(Community, { key: user?.id || "visitor" });
    else if (pathname === "/giveaways")
        page = React.createElement(Giveaways, { key: user?.id || "visitor" });
    else if (pathname.startsWith("/knowledge/"))
        page = (React.createElement(Knowledge, { key: pathname, id: decodeURIComponent(pathname.slice(11)) }));
    else if (pathname === "/assistant")
        page = React.createElement(Assistant, { key: user?.id || "visitor" });
    else
        page = (React.createElement(Utility, { mode: pathname === "/sitemap"
                ? "sitemap"
                : pathname === "/privacy"
                    ? "privacy"
                    : "404" }));
    return (React.createElement(Layout, null,
        React.createElement(React.Suspense, { fallback: React.createElement("div", { className: "loading-page" },
                React.createElement(Skeleton, { cards: 3 })) }, page)));
}
