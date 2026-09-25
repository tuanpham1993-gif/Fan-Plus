import { serverMode } from "../features/http";
import React, { useEffect, useState } from "react";
import { useApp } from "../lib/store";
import { Link, navigate, useLocation } from "../lib/router";
import { repository } from "../services/repository";
import { DEMO_PASSWORD, categories } from "../domain/seed";
import { safeReturnPath } from "../domain/logic";
import { Icon, Button, Notice, Field } from "../components/ui";
export default function Auth({ mode }: { mode: string }) {
  const { params } = useLocation();
  const { setDb, notify } = useApp();
  const [name, setName] = useState(""),
    [email, setEmail] = useState(params.get("email") || ""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [resetToken, setResetToken] = useState<string | null>(null),
    [interests, setInterests] = useState<string[]>([]),
    [code, setCode] = useState(""),
    [devOtp, setDevOtp] = useState<string | null>(null),
    [emailSent, setEmailSent] = useState(false),
    [verified, setVerified] = useState(false);
  const title =
    mode === "login"
      ? "Welcome back to your worlds."
      : mode === "register"
        ? "Your next chapter starts here."
        : mode === "forgot"
          ? "Let's get you back in."
          : mode === "verify"
            ? "One small step before exploring."
            : "A fresh start, a new password.";
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        const db = await repository.login(email, password);
        setDb(db);
        const u = repository.currentUser(db);
        navigate(
          params.get("next")
            ? safeReturnPath(params.get("next"))
            : u?.role === "admin"
              ? "/admin"
              : "/dashboard",
        );
        notify("Welcome to your demo workspace.");
      } else if (mode === "register") {
        if (password !== confirm) throw new Error("Passwords do not match.");
        const result = await repository.register(
          name,
          email,
          password,
          interests,
        );
        setDb(result.db);
        // Auth remounts on route change (key={pathname} in App.tsx), so this
        // component's state does not survive the navigate below; the verify
        // page requests its own fresh code on mount instead of relying on it.
        navigate("/verify-email?email=" + encodeURIComponent(email));
      } else if (mode === "forgot") {
        setResetToken(await repository.forgot(email));
        setDone(true);
      } else if (mode === "reset") {
        if (password !== confirm) throw new Error("Passwords do not match.");
        await repository.resetPassword(params.get("token") || "", password);
        setDone(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please retry.");
    } finally {
      setBusy(false);
    }
  };
  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await repository.verifyEmail(email, code);
      setVerified(true);
      notify("Your email address has been verified.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "That code is incorrect.");
    } finally {
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please retry.");
    } finally {
      setBusy(false);
    }
  };
  // Navigating here loses the register step's in-memory devOtp/emailSent state
  // (Auth is remounted per route), and a deep link (e.g. from the header banner)
  // never had it in the first place, so always request a fresh code on arrival.
  useEffect(() => {
    if (mode !== "verify" || !serverMode || !email || verified) return;
    void (async () => {
      try {
        const r = await repository.resendVerification(email);
        setEmailSent(r.emailSent);
        setDevOtp(r.devOtp || null);
      } catch {
        // A silent best-effort request; the visible Resend button covers retry.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, email]);
  return (
    <div className="auth-layout">
      <div className="auth-art">
        <img
          src="/art/gaming.svg"
          alt="Original floating-island illustration"
          width="1280"
          height="900"
        />
        <div>
          <span className="eyebrow">SOME WORLDS JUST GET YOU.</span>
          <h2>
            Find a story.
            <br />
            Find your people.
            <br />
            <em>Find your place.</em>
          </h2>
          <p>Eight fandom worlds. One shared curiosity.</p>
        </div>
      </div>
      <div className="auth-form-wrap">
        <Link to="/" className="small-link">
          Back to discovery <Icon name="arrow" size={14} />
        </Link>
        <h1>{title}</h1>
        <p className="muted">
          {mode === "login"
            ? "Sign in to collect the stories you love."
            : mode === "register"
              ? serverMode
                ? "Create a server demo account. Use fictional details only."
                : "Create a local demo profile. Use fictional details only."
              : "This is a local frontend flow, not a live email service."}
        </p>
        {mode === "verify" ? (
          <>
            {verified ? (
              <>
                <Notice kind="success">
                  <strong>{email}</strong> is verified. You can now sign in.
                </Notice>
                <Link
                  to={"/login?email=" + encodeURIComponent(email)}
                  className="btn btn-primary"
                >
                  Continue to sign in <Icon name="arrow" size={16} />
                </Link>
              </>
            ) : !serverMode ? (
              <>
                <Notice>
                  Local demo accounts are verified automatically; there is no
                  browser-only email service.
                </Notice>
                <Link
                  to={"/login?email=" + encodeURIComponent(email)}
                  className="btn btn-primary"
                >
                  Continue to demo sign-in <Icon name="arrow" size={16} />
                </Link>
              </>
            ) : (
              <>
                <Notice>
                  {emailSent
                    ? "A 6-digit verification code was sent to " +
                      email +
                      ". Enter it below to activate your account."
                    : "Enter the verification code sent to " + email + "."}
                </Notice>
                {devOtp && (
                  <Notice kind="info">
                    Local/dev mode: no real mailbox is connected, so the code is
                    shown here instead of emailed: <code>{devOtp}</code>
                  </Notice>
                )}
                <form onSubmit={submitCode} className="stack-form">
                  <Field label="6-digit verification code">
                    <input
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="000000"
                    />
                  </Field>
                  {error && (
                    <p className="form-error" role="alert">
                      {error}
                    </p>
                  )}
                  <Button type="submit" busy={busy} disabled={code.length !== 6}>
                    Verify email <Icon name="check" size={16} />
                  </Button>
                </form>
                <button
                  type="button"
                  className="small-link"
                  onClick={() => void resend()}
                  disabled={busy}
                >
                  Resend code
                </button>
              </>
            )}
          </>
        ) : done ? (
          <>
            <Notice kind="success">
              {mode === "reset"
                ? "Password updated in this browser session. Sign in again with the new password."
                : "The demo reset request has been processed. No email has been sent."}
            </Notice>
            {mode === "forgot" && resetToken && (
              <Link
                className="btn btn-primary"
                to={"/reset-password?token=" + resetToken}
              >
                Open local reset link <Icon name="arrow" size={16} />
              </Link>
            )}
            {mode === "forgot" && !resetToken && (
              <p>
                Use one of the demo accounts or a profile created in this
                workspace to exercise the reset flow.
              </p>
            )}
            <Link className="text-link" to="/login">
              Return to sign in <Icon name="arrow" size={16} />
            </Link>
          </>
        ) : (
          <form onSubmit={submit} className="stack-form">
            {mode === "register" && (
              <Field label="Display name">
                <input
                  autoComplete="nickname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  required
                  placeholder="Your demo display name"
                />
              </Field>
            )}
            {mode !== "reset" && (
              <Field label="Email address">
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={254}
                  placeholder="you@example.com"
                />
              </Field>
            )}
            {mode !== "forgot" && (
              <>
                <Field
                  label={mode === "reset" ? "New password" : "Password"}
                  hint={
                    mode === "login"
                      ? undefined
                      : serverMode
                        ? "At least 12 characters. Do not reuse a real password."
                        : "At least 10 characters. Do not reuse a real password."
                  }
                >
                  <div className="password-field">
                    <input
                      type={show ? "text" : "password"}
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={mode === "login" ? 1 : serverMode ? 12 : 10}
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      aria-label={show ? "Hide password" : "Show password"}
                    >
                      {show ? "Hide" : "Show"}
                    </button>
                  </div>
                </Field>
                {mode !== "login" && (
                  <Field label="Confirm password">
                    <input
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      minLength={10}
                    />
                  </Field>
                )}
              </>
            )}
            {mode === "login" && (
              <Link className="small-link forgot-link" to="/forgot-password">
                Forgot your password?
              </Link>
            )}
            {mode === "register" && (
              <fieldset>
                <legend>Favorite categories (optional)</legend>
                <div className="preference-grid">
                  {categories.map((c) => (
                    <label
                      key={c.id}
                      className={
                        interests.includes(c.id)
                          ? "preference selected"
                          : "preference"
                      }
                    >
                      <input
                        type="checkbox"
                        checked={interests.includes(c.id)}
                        onChange={() =>
                          setInterests((s) =>
                            s.includes(c.id)
                              ? s.filter((x) => x !== c.id)
                              : [...s, c.id],
                          )
                        }
                      />
                      <Icon name={c.icon} size={16} />
                      {c.name}
                    </label>
                  ))}
                </div>
                <small>
                  We use this to recommend discoveries for you. Change it
                  anytime from your profile.
                </small>
              </fieldset>
            )}
            {mode === "register" && (
              <label className="check-row">
                <input required type="checkbox" />I understand this is a demo,
                will not enter sensitive information, and I agree to the{" "}
                <Link to="/terms" target="_blank" rel="noopener">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" target="_blank" rel="noopener">
                  Privacy Policy
                </Link>
                .
              </label>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" busy={busy}>
              {mode === "login"
                ? "Sign in"
                : mode === "register"
                  ? "Create demo profile"
                  : mode === "forgot"
                    ? "Create demo reset request"
                    : "Reset demo password"}
              <Icon name="arrow" size={17} />
            </Button>
          </form>
        )}
        {mode === "login" && (
          <>
            <p className="auth-alternate">
              New around here? <Link to="/register">Create a demo profile</Link>
            </p>
            <div className="demo-accounts">
              <span className="eyebrow">TRY A DEMO ACCOUNT</span>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("fan@fanhub.demo");
                    setPassword(DEMO_PASSWORD);
                  }}
                >
                  Fan account <Icon name="user" size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@fanhub.demo");
                    setPassword(DEMO_PASSWORD);
                  }}
                >
                  Admin account <Icon name="shield" size={15} />
                </button>
              </div>
              <small>
                Both use <code>{DEMO_PASSWORD}</code>. Click Sign in after
                choosing an account.
              </small>
            </div>
          </>
        )}
        {mode === "register" && (
          <p className="auth-alternate">
            Already exploring? <Link to="/login">Sign in</Link>
          </p>
        )}
        <div className="auth-note">
          <Icon name="shield" size={15} />
          <span>
            {serverMode
              ? "Extension identity is verified by Flask. Demo email verification and prizes are simulated; legacy catalog tools remain local."
              : "Demo identity is simulated in your browser. This is not production authentication."}
          </span>
        </div>
      </div>
    </div>
  );
}
