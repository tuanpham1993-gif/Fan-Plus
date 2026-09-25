"""Pure application services; permission checks here are independent of the UI."""
from __future__ import annotations
import hashlib, hmac, re, secrets, unicodedata
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, update, delete, or_
from .models import User, Post, Comment, Reaction, Report, Audit, Campaign, Prize, Entry, Winner, now, uid

class Fault(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def text(value, low: int, high: int, name: str) -> str:
    if not isinstance(value, str) or not low <= len(value.strip()) <= high:
        raise Fault(f'{name} must contain {low}-{high} characters.')
    return value.strip()


def fields(data: dict, allowed: set[str]):
    if not isinstance(data, dict) or set(data) - allowed:
        raise Fault('Unknown fields or invalid JSON object.')


def member(user: User | None, admin: bool = False) -> User:
    if not user:
        raise Fault('Please sign in.', 401)
    if user.suspended or not user.verified:
        raise Fault('An active, verified account is required.', 403)
    if admin and user.role != 'admin':
        raise Fault('Administrator permission required.', 403)
    return user


def lock(db, model, identity):
    row = db.execute(select(model).where(list(model.__table__.primary_key.columns)[0] == identity).with_for_update().execution_options(populate_existing=True)).scalar_one_or_none()
    if row is None:
        raise Fault('This item is not available.', 404)
    return row


def audit(db, user, target, event, detail=None):
    db.add(Audit(actor_id=user.id if user else None, target=target, event=event, detail=detail or {}))


def public_user(u):
    if not u:
        return None
    return {'id': u.id, 'name': u.name, 'email': u.email, 'role': u.role, 'suspended': u.suspended, 'verified': u.verified, 'avatar': '', 'bio': '', 'city': '', 'favoriteFandoms': [], 'favoriteCategories': [], 'createdAt': u.created_at}


def public_post(db, p):
    return {'id': p.id, 'authorId': p.author_id, 'authorName': db.get(User, p.author_id).name, 'title': p.title, 'subject': p.subject, 'body': p.body, 'topic': p.topic, 'spoiler': p.spoiler, 'rating': p.rating, 'status': p.status, 'reason': p.reason, 'version': p.version, 'createdAt': p.created_at, 'sample': p.sample}


def social(db, user):
    q = select(Post).order_by(Post.created_at.desc())
    if not user or user.role != 'admin':
        q = q.where(or_(Post.status == 'published', Post.author_id == (user.id if user else '')))
    posts = db.scalars(q.limit(250)).all()
    ids = [p.id for p in posts]
    comments = db.scalars(select(Comment).where(Comment.post_id.in_(ids)).order_by(Comment.created_at).limit(2000)).all() if ids else []
    reactions = db.scalars(select(Reaction).where(Reaction.post_id.in_(ids))).all() if ids else []
    reports = db.scalars(select(Report).order_by(Report.created_at.desc()).limit(250)).all() if user and user.role == 'admin' else []
    return {'posts': [public_post(db, p) for p in posts], 'comments': [{'id': c.id, 'postId': c.post_id, 'authorId': c.author_id, 'authorName': db.get(User, c.author_id).name, 'body': '[Comment removed]' if c.hidden else c.body, 'parentId': c.parent_id, 'createdAt': c.created_at, 'hidden': c.hidden} for c in comments], 'reactions': [{'postId': r.post_id, 'userId': r.user_id, 'kind': r.kind} for r in reactions], 'reports': [{'id': r.id, 'postId': r.post_id, 'commentId': r.comment_id, 'userId': r.user_id, 'reason': r.reason, 'resolved': r.resolved} for r in reports]}


def validate_post(data):
    if data.get('topic') not in {'anime', 'movies', 'music'}:
        raise Fault('Choose a supported topic.')
    if type(data.get('spoiler')) is not bool or type(data.get('rating')) is not int or not 0 <= data['rating'] <= 5:
        raise Fault('Invalid spoiler flag or rating.')
    return dict(title=text(data.get('title'), 5, 140, 'Title'), subject=text(data.get('subject'), 1, 100, 'Subject'), body=text(data.get('body'), 20, 8000, 'Post'), topic=data['topic'], spoiler=data['spoiler'], rating=data['rating'])


def save_post(db, user, data, post_id=None):
    member(user)
    fields(data, {'title', 'subject', 'body', 'topic', 'spoiler', 'rating'} | ({'version'} if post_id else set()))
    values = validate_post(data)
    if post_id:
        p = lock(db, Post, post_id)
        if p.author_id != user.id:
            raise Fault('Only the author can edit this post.', 403)
        if type(data.get('version')) is not int or p.version != data['version']:
            raise Fault('The post changed. Refresh before editing.', 409)
        for k, v in values.items():
            setattr(p, k, v)
        p.status, p.reason, p.version = 'pending', '', p.version + 1
    else:
        p = Post(author_id=user.id, **values)
        db.add(p)
    db.flush()
    audit(db, user, p.id, 'post.submitted')
    return public_post(db, p)


def moderate(db, user, post_id, data):
    member(user, True)
    fields(data, {'decision', 'version', 'reason'})
    p = lock(db, Post, post_id)
    if p.author_id == user.id:
        raise Fault('An author cannot approve their own post.', 403)
    if p.status != 'pending' or type(data.get('version')) is not int or p.version != data['version']:
        raise Fault('This review has already changed.', 409)
    if data.get('decision') not in {'published', 'rejected'}:
        raise Fault('Choose publish or reject.')
    reason = text(data.get('reason', ''), 5 if data['decision'] == 'rejected' else 0, 500, 'Review note')
    # Compare-and-swap also protects SQLite, whose FOR UPDATE is a no-op.
    count = db.execute(update(Post).where(Post.id == p.id, Post.status == 'pending', Post.version == data['version']).values(status=data['decision'], reason=reason, version=p.version + 1)).rowcount
    if count != 1:
        raise Fault('Another moderator completed this review.', 409)
    audit(db, user, p.id, 'post.' + data['decision'], {'reason': reason})
    return {'ok': True}


def remove_post(db, user, post_id):
    member(user)
    p = lock(db, Post, post_id)
    if user.id != p.author_id and user.role != 'admin':
        raise Fault('You cannot remove another author\'s post.', 403)
    p.status, p.version = 'hidden', p.version + 1
    audit(db, user, p.id, 'post.hidden')
    return {'ok': True}


def published(db, post_id):
    p = lock(db, Post, post_id)
    if p.status != 'published':
        raise Fault('This post is not public.', 404)
    return p


def react(db, user, post_id, data):
    member(user)
    fields(data, {'kind'})
    kind = data.get('kind')
    if kind not in {'like', 'heart', None}:
        raise Fault('Unsupported reaction.')
    published(db, post_id)
    old = db.get(Reaction, (post_id, user.id))
    if old and kind:
        old.kind = kind
    elif old:
        db.delete(old)
    elif kind:
        db.add(Reaction(post_id=post_id, user_id=user.id, kind=kind))
    return {'ok': True}


def comment(db, user, post_id, data):
    member(user)
    fields(data, {'body', 'parentId'})
    published(db, post_id)
    body = text(data.get('body'), 1, 1000, 'Comment')
    parent = data.get('parentId')
    if parent:
        c = db.get(Comment, parent)
        if not c or c.post_id != post_id or c.parent_id or c.hidden:
            raise Fault('Reply to a visible top-level comment in this post.')
    c = Comment(post_id=post_id, author_id=user.id, parent_id=parent, body=body)
    db.add(c); db.flush()
    return {'id': c.id}


def remove_comment(db, user, comment_id):
    member(user)
    c = lock(db, Comment, comment_id)
    if c.author_id != user.id and user.role != 'admin':
        raise Fault('You cannot remove this comment.', 403)
    c.hidden = True
    audit(db, user, c.id, 'comment.hidden')
    return {'ok': True}


def report(db, user, post_id, data):
    member(user)
    fields(data, {'reason', 'commentId'})
    published(db, post_id)
    cid = data.get('commentId')
    if cid:
        c = db.get(Comment, cid)
        if not c or c.post_id != post_id or c.hidden:
            raise Fault('Comment not found.', 404)
    exists = db.scalar(select(Report.id).where(Report.user_id == user.id, Report.post_id == post_id, Report.comment_id == cid, Report.resolved.is_(False)))
    if exists:
        raise Fault('Your report is already awaiting review.', 409)
    db.add(Report(post_id=post_id, comment_id=cid, user_id=user.id, reason=text(data.get('reason'), 5, 500, 'Reason')))
    return {'ok': True}


def resolve_report(db, user, report_id, data):
    member(user, True)
    fields(data, {'hide'})
    if type(data.get('hide')) is not bool:
        raise Fault('Choose hide or dismiss.')
    r = lock(db, Report, report_id)
    if r.resolved:
        return {'ok': True}
    if data['hide']:
        if r.comment_id:
            lock(db, Comment, r.comment_id).hidden = True
        else:
            p = lock(db, Post, r.post_id)
            p.status, p.version = 'hidden', p.version + 1
    r.resolved = True
    audit(db, user, r.id, 'report.resolved', {'hide': data['hide']})
    return {'ok': True}


def sha(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def quarter(at=None):
    local = (at or datetime.now(timezone.utc)).astimezone(timezone(timedelta(hours=7)))
    month = ((local.month - 1) // 3) * 3 + 1
    start = datetime(local.year, month, 1, tzinfo=local.tzinfo)
    end = datetime(local.year + (month == 10), 1 if month == 10 else month + 3, 1, tzinfo=local.tzinfo)
    iso = lambda d: d.astimezone(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
    return {'id': f'{local.year}-Q{(month+2)//3}', 'title': f'Quarter {(month+2)//3} / {local.year}', 'opens_at': iso(start), 'closes_at': iso(end), 'draw_at': iso(end + timedelta(hours=20))}


def create_campaign(db, at=None):
    q = quarter(at)
    old = db.get(Campaign, q['id'])
    if old:
        return old
    seed = secrets.token_hex(32)
    c = Campaign(**q, status='open', demo=True, terms_version=q['id'] + '-demo-v1', private_seed=seed, seed_commitment=sha(seed))
    db.add(c); db.flush()
    for rank, title, subtitle, kind in [(1, 'A journey to South Korea', 'Illustrative travel prize / not a booked trip', 'seoul'), (2, 'A slow weekend in Da Lat', 'Illustrative getaway / itinerary not confirmed', 'dalat'), (3, 'An evening at the cinema', 'Illustrative cinema ticket / venue not confirmed', 'cinema')]:
        db.add(Prize(id=c.id + '-prize-' + str(rank), campaign_id=c.id, rank=rank, title=title, subtitle=subtitle, kind=kind))
    audit(db, None, c.id, 'demo.created')
    return c


def get_campaign(db, campaign_id):
    if campaign_id == 'current':
        campaign_id = quarter()['id']
    c = db.get(Campaign, campaign_id)
    if not c:
        raise Fault('No campaign has been opened for this quarter. Ask the administrator to create a demo campaign.', 404)
    return c


def public_campaign(db, user, campaign_id):
    c = get_campaign(db, campaign_id)
    entries = db.scalars(select(Entry).where(Entry.campaign_id == c.id)).all()
    mine = next((e for e in entries if user and e.user_id == user.id), None)
    prizes = db.scalars(select(Prize).where(Prize.campaign_id == c.id).order_by(Prize.rank)).all()
    winners = db.scalars(select(Winner).where(Winner.campaign_id == c.id).order_by(Winner.rank)).all()
    events = db.scalars(select(Audit).where(Audit.target == c.id).order_by(Audit.created_at)).all()
    return {'id': c.id, 'title': c.title, 'opensAt': c.opens_at, 'closesAt': c.closes_at, 'drawAt': c.draw_at, 'status': c.status, 'demo': c.demo, 'termsVersion': c.terms_version, 'seedCommitment': c.seed_commitment, 'snapshotHash': c.snapshot_hash, 'seedReveal': c.seed_reveal, 'prizes': [{'id': p.id, 'rank': p.rank, 'title': p.title, 'subtitle': p.subtitle, 'kind': p.kind} for p in prizes], 'entryCount': len(entries), 'myEntry': {'ticket': mine.ticket, 'userId': mine.user_id, 'joinedAt': mine.joined_at, 'termsVersion': mine.terms_version} if mine else None, 'winners': [{'ticket': w.ticket, 'prizeId': w.prize_id, 'rank': w.rank} for w in winners], 'snapshot': c.snapshot or [], 'audit': [{'event': a.event, 'at': a.created_at} for a in events]}


def demo_only(c):
    if not c.demo:
        raise Fault('Live prize campaigns are disabled in this kit. Organizer/legal/operational approval is required.', 403)


def enter(db, user, campaign_id, data, at=None):
    member(user)
    fields(data, {'agree'})
    if user.role == 'admin':
        raise Fault('Organizers cannot enter the draw.', 403)
    if data.get('agree') is not True:
        raise Fault('Confirm the published demo rules and eligibility.')
    c = lock(db, Campaign, campaign_id); demo_only(c)
    # This no-op UPDATE obtains a write lock also on SQLite before reading entries.
    db.execute(update(Campaign).where(Campaign.id == c.id).values(status=Campaign.status))
    db.refresh(c)
    old = db.scalar(select(Entry).where(Entry.campaign_id == c.id, Entry.user_id == user.id))
    if old:
        return {'ticket': old.ticket, 'alreadyEntered': True}
    moment = at or datetime.now(timezone.utc)
    parse = lambda s: datetime.fromisoformat(s.replace('Z', '+00:00'))
    if c.status != 'open' or not parse(c.opens_at) <= moment < parse(c.closes_at):
        raise Fault('The entry window is closed.', 409)
    e = Entry(ticket=secrets.token_hex(12).upper(), campaign_id=c.id, user_id=user.id, terms_version=c.terms_version)
    db.add(e); db.flush()
    audit(db, user, c.id, 'entry.accepted')
    return {'ticket': e.ticket, 'alreadyEntered': False}


def freeze(db, user, campaign_id):
    member(user, True)
    c = lock(db, Campaign, campaign_id); demo_only(c)
    changed = db.execute(update(Campaign).where(Campaign.id == c.id, Campaign.status == 'open').values(status='locked')).rowcount
    if changed != 1:
        raise Fault('This campaign is already locked or drawn.', 409)
    # A frozen snapshot is immutable. No post-freeze disqualification or reroll API.
    tickets = sorted(db.scalars(select(Entry.ticket).join(User, Entry.user_id == User.id).where(Entry.campaign_id == c.id, User.verified.is_(True), User.suspended.is_(False), User.role == 'member')).all())
    if not tickets:
        raise Fault('At least one eligible entry is required.', 409)
    c.snapshot, c.snapshot_hash = tickets, sha('\n'.join(tickets))
    audit(db, user, c.id, 'demo.snapshot.locked', {'count': len(tickets), 'hash': c.snapshot_hash})
    return {'ok': True}


def rank_tickets(seed, snapshot_hash, tickets):
    key = bytes.fromhex(seed)
    return sorted(tickets, key=lambda t: (hmac.new(key, (snapshot_hash + '|' + t).encode(), hashlib.sha256).hexdigest(), t))


def draw(db, user, campaign_id):
    member(user, True)
    c = lock(db, Campaign, campaign_id); demo_only(c)
    if c.status == 'drawn':
        return public_campaign(db, user, campaign_id)
    if c.status != 'locked' or not c.snapshot:
        raise Fault('Lock the entry snapshot first.', 409)
    changed = db.execute(update(Campaign).where(Campaign.id == c.id, Campaign.status == 'locked').values(status='drawn')).rowcount
    if changed != 1:
        raise Fault('Another administrator completed this draw.', 409)
    if sha('\n'.join(c.snapshot)) != c.snapshot_hash or sha(c.private_seed) != c.seed_commitment:
        raise Fault('The integrity record does not match. Stop and investigate.', 409)
    tickets = rank_tickets(c.private_seed, c.snapshot_hash, c.snapshot)
    prizes = db.scalars(select(Prize).where(Prize.campaign_id == c.id).order_by(Prize.rank)).all()
    for ticket, prize in zip(tickets, prizes):
        entry = db.get(Entry, ticket)
        db.add(Winner(campaign_id=c.id, rank=prize.rank, prize_id=prize.id, ticket=ticket, user_id=entry.user_id))
    c.seed_reveal = c.private_seed
    audit(db, user, c.id, 'demo.draw.recorded')
    db.flush()
    return public_campaign(db, user, campaign_id)
