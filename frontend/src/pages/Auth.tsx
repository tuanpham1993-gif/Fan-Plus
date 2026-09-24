import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { Link, navigate, useLocation } from '../lib/router';
import { repository } from '../services/repository';
import { DEMO_PASSWORD } from '../domain/seed';
import { safeReturnPath } from '../domain/logic';
import { Icon, Button, Notice, Field } from '../components/ui';
export default function Auth({ mode }: {
    mode: string;
}) {
    const { params } = useLocation();
    const { setDb, notify } = useApp();
    const [name, setName] = useState(''), [email, setEmail] = useState(params.get('email') || ''), [password, setPassword] = useState(''), [confirm, setConfirm] = useState(''), [show, setShow] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [done, setDone] = useState(false), [resetToken, setResetToken] = useState<string | null>(null);
    const title = mode === 'login' ? 'Welcome back to your worlds.' : mode === 'register' ? 'Your next chapter starts here.' : mode === 'forgot' ? 'Let\'s get you back in.' : mode === 'verify' ? 'One small step before exploring.' : 'A fresh start, a new password.';
    const submit = async (e: React.FormEvent) => { e.preventDefault(); setError(''); setBusy(true); try {
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
    } };
    return <div className="auth-layout"><div className="auth-art"><img src="/art/gaming.svg" alt="Original floating-island illustration" width="1280" height="900"/><div><span className="eyebrow">SOME WORLDS JUST GET YOU.</span><h2>Find a story.<br />Find your people.<br /><em>Find your place.</em></h2><p>Eight fandom worlds. One shared curiosity.</p></div></div><div className="auth-form-wrap"><Link to="/" className="small-link">Back to discovery <Icon name="arrow" size={14}/></Link><h1>{title}</h1><p className="muted">{mode === 'login' ? 'Sign in to collect the stories you love.' : mode === 'register' ? 'Create a local demo profile. Use fictional details only.' : 'This is a local frontend flow, not a live email service.'}</p>{mode === 'verify' ? <><Notice>No verification email has been sent. In the complete application, the backend must generate, email and validate a one-time verification token.</Notice><p>Demo profile created for <strong>{email}</strong>. You can now exercise the local sign-in flow.</p><Link to={'/login?email=' + encodeURIComponent(email)} className="btn btn-primary">Continue to demo sign-in <Icon name="arrow" size={16}/></Link></> : done ? <><Notice kind="success">{mode === 'reset' ? 'Password updated in this browser session. Sign in again with the new password.' : 'The demo reset request has been processed. No email has been sent.'}</Notice>{mode === 'forgot' && resetToken && <Link className="btn btn-primary" to={'/reset-password?token=' + resetToken}>Open local reset link <Icon name="arrow" size={16}/></Link>}{mode === 'forgot' && !resetToken && <p>Use one of the demo accounts or a profile created in this workspace to exercise the reset flow.</p>}<Link className="text-link" to="/login">Return to sign in <Icon name="arrow" size={16}/></Link></> : <form onSubmit={submit} className="stack-form">{mode === 'register' && <Field label="Display name"><input autoComplete="nickname" value={name} onChange={e => setName(e.target.value)} maxLength={60} required placeholder="Your demo display name"/></Field>}{mode !== 'reset' && <Field label="Email address"><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} placeholder="you@example.com"/></Field>}{mode !== 'forgot' && <><Field label={mode === 'reset' ? 'New password' : 'Password'} hint={mode === 'login' ? undefined : 'At least 10 characters. Do not reuse a real password.'}><div className="password-field"><input type={show ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === 'login' ? 1 : 10} maxLength={128}/><button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? 'Hide' : 'Show'}</button></div></Field>{mode !== 'login' && <Field label="Confirm password"><input type={show ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={10}/></Field>}</>}{mode === 'login' && <Link className="small-link forgot-link" to="/forgot-password">Forgot your password?</Link>}{mode === 'register' && <label className="check-row"><input required type="checkbox"/>I understand this is a demo and will not enter sensitive information.</label>}{error && <p className="form-error" role="alert">{error}</p>}<Button type="submit" busy={busy}>{mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create demo profile' : mode === 'forgot' ? 'Create demo reset request' : 'Reset demo password'}<Icon name="arrow" size={17}/></Button></form>}{mode === 'login' && <><p className="auth-alternate">New around here? <Link to="/register">Create a demo profile</Link></p><div className="demo-accounts"><span className="eyebrow">TRY A DEMO ACCOUNT</span><div><button type="button" onClick={() => { setEmail('fan@fanhub.demo'); setPassword(DEMO_PASSWORD); }}>Fan account <Icon name="user" size={15}/></button><button type="button" onClick={() => { setEmail('admin@fanhub.demo'); setPassword(DEMO_PASSWORD); }}>Admin account <Icon name="shield" size={15}/></button></div><small>Both use <code>{DEMO_PASSWORD}</code>. Click Sign in after choosing an account.</small></div></>}{mode === 'register' && <p className="auth-alternate">Already exploring? <Link to="/login">Sign in</Link></p>}<div className="auth-note"><Icon name="shield" size={15}/><span>Demo identity is simulated in your browser. This is not production authentication.</span></div></div></div>;
}
