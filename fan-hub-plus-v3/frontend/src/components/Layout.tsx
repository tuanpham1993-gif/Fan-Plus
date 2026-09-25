import { LoreDock, LoreFab, openLore } from "../features/Lore";
import { serverMode } from "../features/http";
import React, { useEffect, useState } from "react";
import { Link, navigate, useLocation } from "../lib/router";
import { useApp } from "../lib/store";
import { repository } from "../services/repository";
import { Icon, Button, Modal } from "./ui";
export function Logo() {
  return (
    <Link to="/" className="brand" aria-label="Fan Hub Plus home">
      <span>
        fan<span className="brand-light">hub</span>
        <sup>+</sup>
      </span>
    </Link>
  );
}
const nav = [
  ["/", "Discover"],
  ["/explore", "Explore"],
  ["/community", "Community"],
  ["/events", "Events"],
  ["/giveaways", "Quarterly gifts"],
];
export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const {
    user,
    db,
    theme,
    toggleTheme,
    fontScale,
    setFontScale,
    spoilerSafe,
    toggleSpoilers,
    notices,
    perform,
  } = useApp();
  const [menu, setMenu] = useState(false),
    [search, setSearch] = useState(false),
    [q, setQ] = useState("");
  useEffect(() => {
    setMenu(false);
    const el = document.getElementById("main");
    el?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const navLinks = nav.map(([to, label]) => (
    <Link
      key={to}
      to={to}
      aria-current={pathname === to ? "page" : undefined}
      className={pathname === to ? "active" : ""}
    >
      {label}
    </Link>
  ));
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="demo-strip">
        <span>
          <span className="live-dot" />
          {serverMode
            ? "Flask-connected extensions"
            : "Interactive preview"}{" "}
          <span className="strip-separator">/</span> Sample content and
          illustrative rewards
        </span>
        <Link to="/privacy">
          About this demo <Icon name="arrow" size={12} />
        </Link>
      </div>
      {serverMode && user && user.verified === false && (
        <div className="demo-strip verify-strip">
          <span>
            <Icon name="info" size={14} />
            Verify your email to post, comment or enter giveaways.
          </span>
          <Link to={"/verify-email?email=" + encodeURIComponent(user.email)}>
            Verify now <Icon name="arrow" size={12} />
          </Link>
        </div>
      )}
      <header className="site-header">
        <div className="header-inner">
          <Logo />
          <nav className="desktop-nav" aria-label="Main navigation">
            {navLinks}
          </nav>
          <div className="header-tools">
            <button className="lore-header-button" onClick={() => openLore()}>
              <Icon name="chat" size={17} />
              <span>Ask Lore</span>
            </button>
            <button
              className="search-trigger"
              onClick={() => setSearch(true)}
              aria-label="Search all worlds"
            >
              <Icon name="search" size={18} />
              <span>Find your world</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button
              className="icon-btn theme-toggle"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} />
            </button>
            <details className="preferences">
              <summary className="icon-btn" aria-label="Reading preferences">
                <Icon name="filter" />
              </summary>
              <div className="preferences-panel">
                <strong>Make yourself comfortable</strong>
                <label>
                  Text size
                  <select
                    value={fontScale}
                    onChange={(e) => setFontScale(Number(e.target.value))}
                  >
                    <option value={1}>100% - Default</option>
                    <option value={1.125}>112.5% - Large</option>
                    <option value={1.25}>125% - Larger</option>
                  </select>
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={spoilerSafe}
                    onChange={toggleSpoilers}
                  />
                  Spoiler-safe reading
                </label>
                <small>Preferences are saved on this device.</small>
              </div>
            </details>
            {user ? (
              <details className="account-menu">
                <summary className="avatar" aria-label="Account menu">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" />
                  ) : (
                    user.name.slice(0, 2).toUpperCase()
                  )}
                </summary>
                <div>
                  <strong>{user.name}</strong>
                  <Link to="/dashboard">Dashboard</Link>
                  <Link to="/collection">My collection</Link>
                  <Link to="/profile">Profile</Link>
                  {user.role === "admin" && (
                    <Link to="/admin">Catalog admin (V1 demo)</Link>
                  )}
                  <button
                    onClick={async () => {
                      await perform(() => repository.logout());
                      navigate("/");
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </details>
            ) : (
              <Link
                to="/login"
                className="btn btn-small btn-primary desktop-signin"
              >
                Sign in <Icon name="arrow" size={15} />
              </Link>
            )}
            <button
              className="icon-btn mobile-menu-button"
              onClick={() => setMenu(true)}
              aria-label="Open navigation"
            >
              <Icon name="menu" />
            </button>
          </div>
        </div>
      </header>
      <main id="main" className="main-container" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo />
            <p>
              All your worlds.
              <br />
              One place to belong.
            </p>
            <span className="footer-caption">
              Built for curiosity. Made for fans.
            </span>
          </div>
          <div>
            <h2>Discover</h2>
            <Link to="/explore">All worlds</Link>
            <Link to="/characters">Characters</Link>
            <Link to="/media">Media room</Link>
            <Link to="/events">Events & calendar</Link>
            <Link to="/releases">Upcoming releases</Link>
          </div>
          <div>
            <h2>Your space</h2>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/collection">My collection</Link>
            <Link to="/community">Community conversations</Link>
            <Link to="/submit">Submit a catalog story</Link>
            <Link to="/feedback">Send feedback</Link>
          </div>
          <div>
            <h2>Fan Hub Plus</h2>
            <Link to="/assistant">Lore Master</Link>
            <Link to="/giveaways">Quarterly gifts</Link>
            <Link to="/showcase">Collectible showcase</Link>
            <Link to="/sitemap">Sitemap</Link>
            <Link to="/privacy">Privacy & demo notes</Link>
            <Link to="/admin">Editorial workspace</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>Fan Hub Plus / Learning prototype / 2026</span>
          <span>Showcase only. No purchases or payments.</span>
        </div>
      </footer>
      <LoreDock />
      <LoreFab />
      <div className="toast-stack" aria-live="polite">
        {notices.map((n) => (
          <div
            key={n.id}
            role={n.kind === "error" ? "alert" : "status"}
            className={`toast toast-${n.kind}`}
          >
            <Icon name={n.kind === "error" ? "info" : "check"} size={19} />
            {n.message}
          </div>
        ))}
      </div>
      <Modal
        open={menu}
        onClose={() => setMenu(false)}
        title="Your next universe"
      >
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navLinks}
          <Link to="/media">Media room</Link>
          <Link to="/characters">Characters</Link>
          <Link to="/collection">My collection</Link>
          <Link to="/profile">Profile & preferences</Link>
          <div className="mobile-reading">
            <strong>Reading comfort</strong>
            <label className="field">
              <span>Mobile text size</span>
              <select
                value={fontScale}
                onChange={(e) => setFontScale(Number(e.target.value))}
              >
                <option value={1}>100% - Default</option>
                <option value={1.125}>112.5% - Large</option>
                <option value={1.25}>125% - Larger</option>
              </select>
            </label>
            <Button variant="secondary" onClick={toggleTheme}>
              Use {theme === "dark" ? "light" : "dark"} theme{" "}
              <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
            </Button>
            <label className="check-row">
              <input
                type="checkbox"
                checked={spoilerSafe}
                onChange={toggleSpoilers}
              />
              Spoiler-safe reading
            </label>
          </div>
          {user?.role === "admin" && (
            <Link to="/admin">Editorial workspace</Link>
          )}
          {user ? (
            <Button
              variant="secondary"
              onClick={async () => {
                await perform(() => repository.logout());
                setMenu(false);
                navigate("/");
              }}
            >
              Sign out <Icon name="logout" size={17} />
            </Button>
          ) : (
            <Link className="btn btn-primary" to="/login">
              Sign in
            </Link>
          )}
        </nav>
      </Modal>
      <Modal
        open={search}
        onClose={() => setSearch(false)}
        title="Where will curiosity take you?"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(false);
            navigate("/explore?q=" + encodeURIComponent(q.trim()));
          }}
        >
          <label className="sr-only" htmlFor="global-search">
            Search all content
          </label>
          <div className="search-box">
            <Icon name="search" />
            <input
              autoFocus
              id="global-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Stories, fandoms, characters..."
            />
            <button type="submit" className="icon-btn" aria-label="Search">
              <Icon name="arrow" />
            </button>
          </div>
        </form>
        <p className="subtle-label">JUMP INTO A WORLD</p>
        <div className="chip-list">
          {db?.categories.map((c) => (
            <button
              key={c.id}
              className="chip"
              onClick={() => {
                setSearch(false);
                navigate("/explore?category=" + c.id);
              }}
            >
              <Icon name={c.icon} size={15} />
              {c.name}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
