import React from "react";
import { openLore } from "../features/Lore";
import { useHomeCatalog } from "../features/catalog/hooks";
import { useAuth } from "../features/auth/AuthProvider";
import { Link } from "../lib/router";
import { Icon, ContentCard, Notice, Skeleton } from "../components/ui";

export default function Home() {
  const { user } = useAuth();
  const {
    categories,
    picks,
    favoriteCategory,
    favoriteCategoryLabel,
    favoriteItems,
    loading,
    error,
    categoryWarning,
  } = useHomeCatalog(user);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow">
            <span className="tiny-orbit" />
            YOUR PEOPLE. YOUR PASSIONS.
          </div>
          <h1>
            All your worlds.
            <br />
            <em>One place</em>
            <br />
            to belong.
          </h1>
          <p>
            From the stories that stay with you to the communities that get you.
            Find your next obsession, right here.
          </p>
          <div className="hero-actions">
            <Link to="/explore" className="btn btn-primary">
              Find your universe <Icon name="arrow" size={18} />
            </Link>
            <Link to="/events" className="text-link">
              Meet your people <Icon name="external" size={15} />
            </Link>
          </div>
          <div className="hero-footnote">
            <div className="mini-worlds">
              <span><Icon name="gamepad" size={17} /></span>
              <span><Icon name="music" size={17} /></span>
              <span><Icon name="book" size={17} /></span>
            </div>
            <span>
              <strong>8 worlds. Endless possibilities.</strong>
              <br />A little something for every kind of fan.
            </span>
          </div>
        </div>

        <div className="hero-visual">
          <img
            className="hero-art"
            src="/art/anime.svg"
            alt="Original illustration of a glowing doorway into an imaginary city"
            width="1280"
            height="900"
            fetchPriority="high"
          />
          <div className="hero-orbit orbit-one" />
          <div className="visual-topline">
            <span><span className="live-dot" />THE DISCOVERY ISSUE</span>
            <span>THE COMMUNITY EDIT</span>
          </div>
          <div className="feature-float">
            <span className="feature-kicker">
              <Icon name="sparkles" size={13} />
              EDITOR'S SPOTLIGHT
            </span>
            <h2>
              Some worlds
              <br />
              feel like home.
            </h2>
            <Link to="/content/c01">
              Step inside Neon Horizon{" "}
              <span><Icon name="arrow" size={18} /></span>
            </Link>
          </div>
          <div className="visual-label">AN ORIGINAL FAN HUB WORLD</div>
        </div>
      </section>

      <section className="lore-inline">
        <span className="lore-monogram">L<span>m</span></span>
        <div>
          <span className="eyebrow">MEET YOUR READING COMPANION</span>
          <strong>A character, a story, a question that stays.</strong>
        </div>
        <button onClick={() => openLore("Tóm tắt cơ chế Vô Hạ Hạn của Gojo?")}>
          Ask Lore Master <Icon name="arrow" size={17} />
        </button>
      </section>

      <section className="world-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FOLLOW YOUR CURIOSITY</span>
            <h2>Choose your universe<span className="accent">.</span></h2>
          </div>
          <span className="section-aside">Different worlds. Same kind of passion.</span>
        </div>

        {categoryWarning && (
          <Notice>
            Category metadata could not be loaded from the API. The canonical
            SRS taxonomy is being shown. {categoryWarning}
          </Notice>
        )}

        <div className="world-grid">
          {categories.slice(0, 8).map((category, index) => (
            <Link
              key={category.id}
              to={`/explore?category=${category.id}`}
              className="world-tile"
              style={{ "--world-color": category.color } as React.CSSProperties}
            >
              <span className="world-number">0{index + 1}</span>
              <Icon name={category.icon} size={27} />
              <span>{category.name}</span>
              <Icon name="arrow" size={16} />
            </Link>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {user ? "CURATED FOR YOUR CURIOSITY" : "WORTH THE DEEP DIVE"}
            </span>
            <h2>
              {user ? "Your next great discovery" : "The discovery edit"}
              <span className="accent">.</span>
            </h2>
          </div>
          <Link to="/explore?sort_by=popular" className="text-link">
            Explore all stories <Icon name="arrow" size={17} />
          </Link>
        </div>

        {loading ? (
          <Skeleton cards={4} />
        ) : error ? (
          <Notice kind="error">Catalog content could not be loaded. {error}</Notice>
        ) : (
          <div className="card-grid home-cards">
            {picks.map(({ content, reason }) => (
              <ContentCard
                key={content.id}
                content={content}
                reason={user ? reason : undefined}
              />
            ))}
          </div>
        )}
      </section>

      {user && favoriteCategory && favoriteItems.length > 0 && (
        <section className="content-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">PERSONALIZED FOR YOU</span>
              <h2>
                Because you like {favoriteCategoryLabel}
                <span className="accent">.</span>
              </h2>
            </div>
            <Link
              to={`/explore?category=${favoriteCategory}&sort_by=popular`}
              className="text-link"
            >
              More {favoriteCategoryLabel} <Icon name="arrow" size={17} />
            </Link>
          </div>
          <div className="card-grid home-cards">
            {favoriteItems.slice(0, 4).map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                reason={`Because you like ${favoriteCategoryLabel}`}
              />
            ))}
          </div>
        </section>
      )}

      <section className="community-banner">
        <div className="community-graphic" aria-hidden="true">
          <div className="community-ring" />
          <Icon name="users" size={66} />
          <span className="floating-star star-one">+</span>
          <span className="floating-star star-two">+</span>
        </div>
        <div className="community-copy">
          <span className="eyebrow">BEYOND THE SCREEN</span>
          <h2>
            The story does not end
            <br />
            when the credits roll.
          </h2>
          <p>
            Share a film review, discuss an anime or talk about the song you
            cannot stop replaying. Your perspective belongs here.
          </p>
        </div>
        <Link to="/community" className="btn btn-secondary">
          Join the conversation <Icon name="arrow" size={17} />
        </Link>
      </section>

      <section className="bottom-duo">
        <Link to="/giveaways" className="duo-card">
          <span className="duo-icon"><Icon name="ticket" size={26} /></span>
          <div>
            <span className="eyebrow">MEMBER APPRECIATION / DEMO</span>
            <h3>Your next story, beyond the screen.</h3>
            <p>
              Explore the quarterly gifts concept. One free entry per account,
              no purchase and no real prizes in this demo.
            </p>
          </div>
          <Icon name="arrow" size={23} />
        </Link>
        <Link to="/assistant" className="duo-card">
          <span className="duo-icon purple"><Icon name="chat" size={26} /></span>
          <div>
            <span className="eyebrow">A LITTLE HELP EXPLORING</span>
            <h3>Meet Lore Master.</h3>
            <p>
              A little context for the worlds you love. Ask for a summary or an
              explanation, with sources beside the answer.
            </p>
          </div>
          <Icon name="arrow" size={23} />
        </Link>
      </section>
    </>
  );
}
