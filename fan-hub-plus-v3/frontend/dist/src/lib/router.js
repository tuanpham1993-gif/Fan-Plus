import React, { useSyncExternalStore } from "react";
const EVENT = "fanhub:navigate";
const browserPort = {
    read: () => window.location.pathname + window.location.search,
    push: (to, replace) => {
        window.history[replace ? "replaceState" : "pushState"]({}, "", to);
        window.dispatchEvent(new Event(EVENT));
    },
    subscribe: (listener) => {
        window.addEventListener("popstate", listener);
        window.addEventListener(EVENT, listener);
        return () => {
            window.removeEventListener("popstate", listener);
            window.removeEventListener(EVENT, listener);
        };
    },
};
let port = browserPort;
/** Configure once before mounting. Used by the offline UI integration harness, not by production startup. */
export function configureNavigationPort(next) {
    port = next;
}
export const currentPath = () => port.read();
const subscribe = (listener) => port.subscribe(listener);
export function useLocation() {
    const value = useSyncExternalStore(subscribe, currentPath);
    const url = new URL(value, "https://fanhub.invalid");
    return {
        pathname: url.pathname,
        search: url.search,
        params: url.searchParams,
    };
}
export function navigate(to, replace = false) {
    if (!to.startsWith("/") || to.startsWith("//") || to.includes("\\"))
        throw new Error("Router requires a same-origin absolute path.");
    port.push(to, replace);
}
export function Link({ to, onClick, children, ...props }) {
    return (React.createElement("a", { href: to, ...props, onClick: (e) => {
            onClick?.(e);
            if (!e.defaultPrevented &&
                e.button === 0 &&
                !e.metaKey &&
                !e.ctrlKey &&
                !e.shiftKey &&
                !e.altKey &&
                (!props.target || props.target === "_self") &&
                !props.download) {
                e.preventDefault();
                navigate(to);
            }
        } }, children));
}
