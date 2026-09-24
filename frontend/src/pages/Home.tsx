import React from 'react';
import { Link } from '../lib/router';
import { useApp } from '../lib/store';
import { Icon, ContentCard } from '../components/ui';
import { recommend } from '../domain/logic';

/** Editorial landing page. Counts and agenda entries come from the demo repository. */
export default function Home() {
  const { db, user } = useApp();
  if (!db) return null;
  const picks = recommend(db, user, 4);
  const agenda = [...db.events].sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 3);
  return <>
    <div className="issue-line"><span>THE FAN CULTURE JOURNAL</span><span>STORIES / PEOPLE / CULTURE</span></div>
    <section className="editorial-hero" aria-labelledby="home-title">
      <div className="editorial-copy">
        <span className="editorial-kicker">A PLACE FOR THE THINGS YOU LOVE</span>
        <h1 id="home-title">Fan culture,<br /><em>in focus.</em></h1>
        <p>Stories worth reading. Characters worth knowing. A considered guide to the worlds that bring us together.</p>
        <div className="hero-actions"><Link to="/explore" className="btn btn-primary">Explore the journal <Icon name="arrow" size={18}/></Link><Link to="/events" className="text-link">Find a gathering <Icon name="arrow" size={17}/></Link></div>
        <div className="editorial-index"><span>01 / 08</span><div><strong>Start with a world you know.</strong><span>Leave with something unexpected.</span></div></div>
      </div>
      <Link className="editorial-cover" to="/content/c01" aria-label="Read Neon Horizon: a city between two skies">
        <img src="/art/anime.svg" width="1280" height="900" fetchPriority="high" alt="Original geometric illustration of a doorway overlooking an imaginary city"/>
        <span className="cover-label">THE COVER STORY</span>
        <div className="cover-caption"><span>ANIME / NEON HORIZON</span><h2>A city between<br />two skies.</h2><p>A closer look at a world built around small acts of kindness.</p><span className="cover-action">Read the story <Icon name="arrow" size={19}/></span></div>
        <span className="cover-number" aria-hidden="true">01</span>
      </Link>
    </section>
    <section className="world-section editorial-worlds" aria-labelledby="world-heading">
      <div className="section-heading"><div><span className="eyebrow">THE DIRECTORY</span><h2 id="world-heading">Eight ways in.</h2></div><Link to="/explore" className="text-link">Browse everything <Icon name="arrow" size={17}/></Link></div>
      <div className="world-grid">{db.categories.slice(0, 8).map((cat, i) => <Link key={cat.id} to={'/explore?category=' + cat.id} className="world-tile"><span className="world-number">{String(i + 1).padStart(2, '0')}</span><span className="world-name">{cat.name}</span><Icon name="arrow" size={17}/></Link>)}</div>
    </section>
    <section className="content-section editorial-stories" aria-labelledby="stories-heading">
      <div className="section-heading"><div><span className="eyebrow">{user ? 'BASED ON YOUR INTERESTS' : 'SELECTED READING'}</span><h2 id="stories-heading">{user ? 'Your reading list.' : 'From the editorial desk.'}</h2></div><Link to="/explore?sort=latest" className="text-link">All stories <Icon name="arrow" size={17}/></Link></div>
      <div className="card-grid home-cards">{picks.map(({ content, reason }) => <ContentCard key={content.id} content={content} reason={user ? reason : undefined}/>)}</div>
    </section>
    <section className="editorial-agenda" aria-labelledby="agenda-heading"><div className="agenda-intro"><span className="eyebrow">OFF THE PAGE</span><h2 id="agenda-heading">Meet in<br /><em>real life.</em></h2><p>A place for screenings, workshops and shared interests.</p><Link to="/events" className="text-link">View the calendar <Icon name="arrow" size={17}/></Link><small>Sample events for this prototype, not real listings.</small></div><div className="agenda-list">{agenda.map(event => { const date = new Date(event.startsAt); return <Link to={'/events/' + event.id} className="agenda-item" key={event.id}><span className="agenda-date"><strong>{new Intl.DateTimeFormat('en', { day: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(date)}</strong><span>{new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(date)}</span></span><span className="agenda-details"><small>{event.city}</small><h3>{event.title}</h3><span>{event.venue}</span></span><Icon name="arrow" size={21}/></Link>; })}</div></section>
    <section className="editorial-contribute"><div><span className="eyebrow">WRITTEN BY FANS, FOR FANS</span><h2>There is room for your perspective.</h2><p>Essays, field notes and personal discoveries. Share a story with the editorial team.</p></div><Link to="/submit" className="btn btn-primary">Submit a story <Icon name="arrow" size={18}/></Link></section>
  </>;
}
