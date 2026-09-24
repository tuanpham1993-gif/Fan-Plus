import React, { useState } from 'react';
import { useApp } from '../lib/store.js';
import { Link, navigate, useLocation } from '../lib/router.js';
import { repository } from '../services/repository.js';
import { DEMO_PASSWORD } from '../domain/seed.js';
import { safeReturnPath } from '../domain/logic.js';
import { Icon, Button, Notice, Field } from '../components/ui.js';
export default function Auth({ mode }) {
    const { params } = useLocation();
    const { setDb, notify } = useApp();
    const [name, setName] = useState(''), [email, setEmail] = useState(params.get('email') || ''), [password, setPassword] = useState(''), [confirm, setConfirm] = useState(''), [show, setShow] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [done, setDone] = useState(false), [resetToken, setResetToken] = useState(null);
    const title = mode === 'login' ? 'Welcome back to your worlds.' : mode === 'register' ? 'Your next chapter starts here.' : mode === 'forgot' ? 'Let\'s get you back in.' : mode === 'verify' ? 'One small step before exploring.' : 'A fresh start, a new password.';
    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            if (mode === 'login') {
                const db = await repository.login(email, password);
                setDb(db);
                const u = repository.currentUser(db);
                navigate(params.get('next') ? safeReturnPath(params.get('next')) : u?.role === 'admin' ? '/admin' : '/dashboard');
                notify('Welcome to your demo workspace.');
            }
            else if (mode === 'register') {
                if (password !== confirm)
                    throw new Error('Passwords do not match.');
                setDb(await repository.register(name, email, password));
                navigate('/verify-email?email=' + encodeURIComponent(email));
            }
            else if (mode === 'forgot') {
                setResetToken(await repository.forgot(email));
                setDone(true);
            }
            else if (mode === 'reset') {
                if (password !== confirm)
                    throw new Error('Passwords do not match.');
                await repository.resetPassword(params.get('token') || '', password);
                setDone(true);
            }
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Please retry.');
        }
        finally {
            setBusy(false);
        }
    };
    return React.createElement("div", { className: "auth-layout" },
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
            React.createElement("p", { className: "muted" }, mode === 'login' ? 'Sign in to collect the stories you love.' : mode === 'register' ? 'Create a local demo profile. Use fictional details only.' : 'This is a local frontend flow, not a live email service.'),
            mode === 'verify' ? React.createElement(React.Fragment, null,
                React.createElement(Notice, null, "No verification email has been sent. In the complete application, the backend must generate, email and validate a one-time verification token."),
                React.createElement("p", null,
                    "Demo profile created for ",
                    React.createElement("strong", null, email),
                    ". You can now exercise the local sign-in flow."),
                React.createElement(Link, { to: '/login?email=' + encodeURIComponent(email), className: "btn btn-primary" },
                    "Continue to demo sign-in ",
                    React.createElement(Icon, { name: "arrow", size: 16 }))) : done ? React.createElement(React.Fragment, null,
                React.createElement(Notice, { kind: "success" }, mode === 'reset' ? 'Password updated in this browser session. Sign in again with the new password.' : 'The demo reset request has been processed. No email has been sent.'),
                mode === 'forgot' && resetToken && React.createElement(Link, { className: "btn btn-primary", to: '/reset-password?token=' + resetToken },
                    "Open local reset link ",
                    React.createElement(Icon, { name: "arrow", size: 16 })),
                mode === 'forgot' && !resetToken && React.createElement("p", null, "Use one of the demo accounts or a profile created in this workspace to exercise the reset flow."),
                React.createElement(Link, { className: "text-link", to: "/login" },
                    "Return to sign in ",
                    React.createElement(Icon, { name: "arrow", size: 16 }))) : React.createElement("form", { onSubmit: submit, className: "stack-form" },
                mode === 'register' && React.createElement(Field, { label: "Display name" },
                    React.createElement("input", { autoComplete: "nickname", value: name, onChange: e => setName(e.target.value), maxLength: 60, required: true, placeholder: "Your demo display name" })),
                mode !== 'reset' && React.createElement(Field, { label: "Email address" },
                    React.createElement("input", { type: "email", autoComplete: "email", value: email, onChange: e => setEmail(e.target.value), required: true, maxLength: 254, placeholder: "you@example.com" })),
                mode !== 'forgot' && React.createElement(React.Fragment, null,
                    React.createElement(Field, { label: mode === 'reset' ? 'New password' : 'Password', hint: mode === 'login' ? undefined : 'At least 10 characters. Do not reuse a real password.' },
                        React.createElement("div", { className: "password-field" },
                            React.createElement("input", { type: show ? 'text' : 'password', autoComplete: mode === 'login' ? 'current-password' : 'new-password', value: password, onChange: e => setPassword(e.target.value), required: true, minLength: mode === 'login' ? 1 : 10, maxLength: 128 }),
                            React.createElement("button", { type: "button", onClick: () => setShow(s => !s), "aria-label": show ? 'Hide password' : 'Show password' }, show ? 'Hide' : 'Show'))),
                    mode !== 'login' && React.createElement(Field, { label: "Confirm password" },
                        React.createElement("input", { type: show ? 'text' : 'password', autoComplete: "new-password", value: confirm, onChange: e => setConfirm(e.target.value), required: true, minLength: 10 }))),
                mode === 'login' && React.createElement(Link, { className: "small-link forgot-link", to: "/forgot-password" }, "Forgot your password?"),
                mode === 'register' && React.createElement("label", { className: "check-row" },
                    React.createElement("input", { required: true, type: "checkbox" }),
                    "I understand this is a demo and will not enter sensitive information."),
                error && React.createElement("p", { className: "form-error", role: "alert" }, error),
                React.createElement(Button, { type: "submit", busy: busy },
                    mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create demo profile' : mode === 'forgot' ? 'Create demo reset request' : 'Reset demo password',
                    React.createElement(Icon, { name: "arrow", size: 17 }))),
            mode === 'login' && React.createElement(React.Fragment, null,
                React.createElement("p", { className: "auth-alternate" },
                    "New around here? ",
                    React.createElement(Link, { to: "/register" }, "Create a demo profile")),
                React.createElement("div", { className: "demo-accounts" },
                    React.createElement("span", { className: "eyebrow" }, "TRY A DEMO ACCOUNT"),
                    React.createElement("div", null,
                        React.createElement("button", { type: "button", onClick: () => { setEmail('fan@fanhub.demo'); setPassword(DEMO_PASSWORD); } },
                            "Fan account ",
                            React.createElement(Icon, { name: "user", size: 15 })),
                        React.createElement("button", { type: "button", onClick: () => { setEmail('admin@fanhub.demo'); setPassword(DEMO_PASSWORD); } },
                            "Admin account ",
                            React.createElement(Icon, { name: "shield", size: 15 }))),
                    React.createElement("small", null,
                        "Both use ",
                        React.createElement("code", null, DEMO_PASSWORD),
                        ". Click Sign in after choosing an account."))),
            mode === 'register' && React.createElement("p", { className: "auth-alternate" },
                "Already exploring? ",
                React.createElement(Link, { to: "/login" }, "Sign in")),
            React.createElement("div", { className: "auth-note" },
                React.createElement(Icon, { name: "shield", size: 15 }),
                React.createElement("span", null, "Demo identity is simulated in your browser. This is not production authentication."))));
}
