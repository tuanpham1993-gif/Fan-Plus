import { serverMode } from "../features/http.js";
import React, { useEffect, useState } from "react";
import { useApp } from "../lib/store.js";
import { Link, navigate, useLocation } from "../lib/router.js";
import { repository } from "../services/repository.js";
import { DEMO_PASSWORD, categories } from "../domain/seed.js";
import { safeReturnPath } from "../domain/logic.js";
import { Icon, Button, Notice, Field } from "../components/ui.js";
export default function Auth({ mode }) {
    const { params } = useLocation();
    const { setDb, notify } = useApp();
    const [name, setName] = useState(""), [email, setEmail] = useState(params.get("email") || ""), [password, setPassword] = useState(""), [confirm, setConfirm] = useState(""), [show, setShow] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [done, setDone] = useState(false), [resetToken, setResetToken] = useState(null), [interests, setInterests] = useState([]), [code, setCode] = useState(""), [devOtp, setDevOtp] = useState(null), [emailSent, setEmailSent] = useState(false), [verified, setVerified] = useState(false);
    const title = mode === "login"
        ? "Welcome back to your worlds."
        : mode === "register"
            ? "Your next chapter starts here."
            : mode === "forgot"
                ? "Let's get you back in."
                : mode === "verify"
                    ? "One small step before exploring."
                    : "A fresh start, a new password.";
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            if (mode === "login") {
                const db = await repository.login(email, password);
                setDb(db);
                const u = repository.currentUser(db);
                navigate(params.get("next")
                    ? safeReturnPath(params.get("next"))
                    : u?.role === "admin"
                        ? "/admin"
                        : "/dashboard");
                notify("Welcome to your demo workspace.");
            }
            else if (mode === "register") {
                if (password !== confirm)
                    throw new Error("Passwords do not match.");
                const result = await repository.register(name, email, password, interests);
                setDb(result.db);
                // Auth remounts on route change (key={pathname} in App.tsx), so this
                // component's state does not survive the navigate below; the verify
                // page requests its own fresh code on mount instead of relying on it.
                navigate("/verify-email?email=" + encodeURIComponent(email));
            }
            else if (mode === "forgot") {
                setResetToken(await repository.forgot(email));
                setDone(true);
            }
            else if (mode === "reset") {
                if (password !== confirm)
                    throw new Error("Passwords do not match.");
                await repository.resetPassword(params.get("token") || "", password);
                setDone(true);
            }
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Please retry.");
        }
        finally {
            setBusy(false);
        }
    };
    const submitCode = async (e) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            await repository.verifyEmail(email, code);
            setVerified(true);
            notify("Your email address has been verified.");
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "That code is incorrect.");
        }
        finally {
            setBusy(false);
        }
    };
    const resend = async () => {
        setBusy(true);
        setError("");
        try {
            const r = await repository.resendVerification(email);
            setEmailSent(r.emailSent);
            setDevOtp(r.devOtp || null);
            notify("A new verification code has been sent.");
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Please retry.");
        }
        finally {
            setBusy(false);
        }
    };
    // Navigating here loses the register step's in-memory devOtp/emailSent state
    // (Auth is remounted per route), and a deep link (e.g. from the header banner)
    // never had it in the first place, so always request a fresh code on arrival.
    useEffect(() => {
        if (mode !== "verify" || !serverMode || !email || verified)
            return;
        void (async () => {
            try {
                const r = await repository.resendVerification(email);
                setEmailSent(r.emailSent);
                setDevOtp(r.devOtp || null);
            }
            catch {
                // A silent best-effort request; the visible Resend button covers retry.
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, email]);
    return (React.createElement("div", { className: "auth-layout" },
        React.createElement("div", { className: "auth-art" },
            React.createElement("img", { src: "/art/gaming.svg", alt: "Original floating-island illustration", width: "1280", height: "900" }),
            React.createElement("div", null,
                React.createElement("span", { className: "eyebrow" }, "SOME WORLDS JUST GET YOU."),
                React.createElement("h2", null,
                    "Find a story.",
                    React.createElement("br", null),
                    "Find your people.",
                    React.createElement("br", null),
                    React.createElement("em", null, "Find your place.")),
                React.createElement("p", null, "Eight fandom worlds. One shared curiosity."))),
        React.createElement("div", { className: "auth-form-wrap" },
            React.createElement(Link, { to: "/", className: "small-link" },
                "Back to discovery ",
                React.createElement(Icon, { name: "arrow", size: 14 })),
            React.createElement("h1", null, title),
            React.createElement("p", { className: "muted" }, mode === "login"
                ? "Sign in to collect the stories you love."
                : mode === "register"
                    ? serverMode
                        ? "Create a server demo account. Use fictional details only."
                        : "Create a local demo profile. Use fictional details only."
                    : "This is a local frontend flow, not a live email service."),
            mode === "verify" ? (React.createElement(React.Fragment, null, verified ? (React.createElement(React.Fragment, null,
                React.createElement(Notice, { kind: "success" },
                    React.createElement("strong", null, email),
                    " is verified. You can now sign in."),
                React.createElement(Link, { to: "/login?email=" + encodeURIComponent(email), className: "btn btn-primary" },
                    "Continue to sign in ",
                    React.createElement(Icon, { name: "arrow", size: 16 })))) : !serverMode ? (React.createElement(React.Fragment, null,
                React.createElement(Notice, null, "Local demo accounts are verified automatically; there is no browser-only email service."),
                React.createElement(Link, { to: "/login?email=" + encodeURIComponent(email), className: "btn btn-primary" },
                    "Continue to demo sign-in ",
                    React.createElement(Icon, { name: "arrow", size: 16 })))) : (React.createElement(React.Fragment, null,
                React.createElement(Notice, null, emailSent
                    ? "A 6-digit verification code was sent to " +
                        email +
                        ". Enter it below to activate your account."
                    : "Enter the verification code sent to " + email + "."),
                devOtp && (React.createElement(Notice, { kind: "info" },
                    "Local/dev mode: no real mailbox is connected, so the code is shown here instead of emailed: ",
                    React.createElement("code", null, devOtp))),
                React.createElement("form", { onSubmit: submitCode, className: "stack-form" },
                    React.createElement(Field, { label: "6-digit verification code" },
                        React.createElement("input", { inputMode: "numeric", pattern: "[0-9]{6}", maxLength: 6, required: true, value: code, onChange: (e) => setCode(e.target.value.replace(/\D/g, "")), placeholder: "000000" })),
                    error && (React.createElement("p", { className: "form-error", role: "alert" }, error)),
                    React.createElement(Button, { type: "submit", busy: busy, disabled: code.length !== 6 },
                        "Verify email ",
                        React.createElement(Icon, { name: "check", size: 16 }))),
                React.createElement("button", { type: "button", className: "small-link", onClick: () => void resend(), disabled: busy }, "Resend code"))))) : done ? (React.createElement(React.Fragment, null,
                React.createElement(Notice, { kind: "success" }, mode === "reset"
                    ? "Password updated in this browser session. Sign in again with the new password."
                    : "The demo reset request has been processed. No email has been sent."),
                mode === "forgot" && resetToken && (React.createElement(Link, { className: "btn btn-primary", to: "/reset-password?token=" + resetToken },
                    "Open local reset link ",
                    React.createElement(Icon, { name: "arrow", size: 16 }))),
                mode === "forgot" && !resetToken && (React.createElement("p", null, "Use one of the demo accounts or a profile created in this workspace to exercise the reset flow.")),
                React.createElement(Link, { className: "text-link", to: "/login" },
                    "Return to sign in ",
                    React.createElement(Icon, { name: "arrow", size: 16 })))) : (React.createElement("form", { onSubmit: submit, className: "stack-form" },
                mode === "register" && (React.createElement(Field, { label: "Display name" },
                    React.createElement("input", { autoComplete: "nickname", value: name, onChange: (e) => setName(e.target.value), maxLength: 60, required: true, placeholder: "Your demo display name" }))),
                mode !== "reset" && (React.createElement(Field, { label: "Email address" },
                    React.createElement("input", { type: "email", autoComplete: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true, maxLength: 254, placeholder: "you@example.com" }))),
                mode !== "forgot" && (React.createElement(React.Fragment, null,
                    React.createElement(Field, { label: mode === "reset" ? "New password" : "Password", hint: mode === "login"
                            ? undefined
                            : serverMode
                                ? "At least 12 characters. Do not reuse a real password."
                                : "At least 10 characters. Do not reuse a real password." },
                        React.createElement("div", { className: "password-field" },
                            React.createElement("input", { type: show ? "text" : "password", autoComplete: mode === "login" ? "current-password" : "new-password", value: password, onChange: (e) => setPassword(e.target.value), required: true, minLength: mode === "login" ? 1 : serverMode ? 12 : 10, maxLength: 128 }),
                            React.createElement("button", { type: "button", onClick: () => setShow((s) => !s), "aria-label": show ? "Hide password" : "Show password" }, show ? "Hide" : "Show"))),
                    mode !== "login" && (React.createElement(Field, { label: "Confirm password" },
                        React.createElement("input", { type: show ? "text" : "password", autoComplete: "new-password", value: confirm, onChange: (e) => setConfirm(e.target.value), required: true, minLength: 10 }))))),
                mode === "login" && (React.createElement(Link, { className: "small-link forgot-link", to: "/forgot-password" }, "Forgot your password?")),
                mode === "register" && (React.createElement("fieldset", null,
                    React.createElement("legend", null, "Favorite categories (optional)"),
                    React.createElement("div", { className: "preference-grid" }, categories.map((c) => (React.createElement("label", { key: c.id, className: interests.includes(c.id)
                            ? "preference selected"
                            : "preference" },
                        React.createElement("input", { type: "checkbox", checked: interests.includes(c.id), onChange: () => setInterests((s) => s.includes(c.id)
                                ? s.filter((x) => x !== c.id)
                                : [...s, c.id]) }),
                        React.createElement(Icon, { name: c.icon, size: 16 }),
                        c.name)))),
                    React.createElement("small", null, "We use this to recommend discoveries for you. Change it anytime from your profile."))),
                mode === "register" && (React.createElement("label", { className: "check-row" },
                    React.createElement("input", { required: true, type: "checkbox" }),
                    "I understand this is a demo, will not enter sensitive information, and I agree to the",
                    " ",
                    React.createElement(Link, { to: "/terms", target: "_blank", rel: "noopener" }, "Terms of Service"),
                    " ",
                    "and",
                    " ",
                    React.createElement(Link, { to: "/privacy", target: "_blank", rel: "noopener" }, "Privacy Policy"),
                    ".")),
                error && (React.createElement("p", { className: "form-error", role: "alert" }, error)),
                React.createElement(Button, { type: "submit", busy: busy },
                    mode === "login"
                        ? "Sign in"
                        : mode === "register"
                            ? "Create demo profile"
                            : mode === "forgot"
                                ? "Create demo reset request"
                                : "Reset demo password",
                    React.createElement(Icon, { name: "arrow", size: 17 })))),
            mode === "login" && (React.createElement(React.Fragment, null,
                React.createElement("p", { className: "auth-alternate" },
                    "New around here? ",
                    React.createElement(Link, { to: "/register" }, "Create a demo profile")),
                React.createElement("div", { className: "demo-accounts" },
                    React.createElement("span", { className: "eyebrow" }, "TRY A DEMO ACCOUNT"),
                    React.createElement("div", null,
                        React.createElement("button", { type: "button", onClick: () => {
                                setEmail("fan@fanhub.demo");
                                setPassword(DEMO_PASSWORD);
                            } },
                            "Fan account ",
                            React.createElement(Icon, { name: "user", size: 15 })),
                        React.createElement("button", { type: "button", onClick: () => {
                                setEmail("admin@fanhub.demo");
                                setPassword(DEMO_PASSWORD);
                            } },
                            "Admin account ",
                            React.createElement(Icon, { name: "shield", size: 15 }))),
                    React.createElement("small", null,
                        "Both use ",
                        React.createElement("code", null, DEMO_PASSWORD),
                        ". Click Sign in after choosing an account.")))),
            mode === "register" && (React.createElement("p", { className: "auth-alternate" },
                "Already exploring? ",
                React.createElement(Link, { to: "/login" }, "Sign in"))),
            React.createElement("div", { className: "auth-note" },
                React.createElement(Icon, { name: "shield", size: 15 }),
                React.createElement("span", null, serverMode
                    ? "Extension identity is verified by Flask. Demo email verification and prizes are simulated; legacy catalog tools remain local."
                    : "Demo identity is simulated in your browser. This is not production authentication.")))));
}
