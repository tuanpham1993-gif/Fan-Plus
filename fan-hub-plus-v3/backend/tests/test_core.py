import pytest, hashlib
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from fanhub.models import *
from fanhub import core, lore, security
from manage import seed_demo

@pytest.fixture
def state(tmp_path):
    engine, factory = database('sqlite:///' + str(tmp_path / 'test.db'))
    Base.metadata.create_all(engine)
    with factory.begin() as db:
        seed_demo(db)
    yield factory
    engine.dispose()

@pytest.fixture
def data():
    return dict(title='A thoughtful test review', subject='Original sample film', body='This is an original review with enough detail to discuss the sound design.', topic='movies', format='post', mediaUrl='', rating=4, spoiler=False)


def transact(factory, fn):
    with factory.begin() as db:
        return fn(db)


def person(db, role='member'):
    return db.get(User, 'u-' + role)


def new_post(state, data):
    return transact(state, lambda db: core.save_post(db, person(db), data))


def approved(state, data):
    p = new_post(state, data)
    transact(state, lambda db: core.moderate(db, person(db, 'admin'), p['id'], {'decision': 'published', 'version': 1, 'reason': ''}))
    return p['id']


def test_pending_not_public(state, data):
    p = new_post(state, data)
    with state() as db:
        assert p['id'] not in [x['id'] for x in core.social(db, None)['posts']]
        assert p['id'] in [x['id'] for x in core.social(db, person(db))['posts']]


def test_guest_cannot_post(state, data):
    with pytest.raises(core.Fault) as e:
        transact(state, lambda db: core.save_post(db, None, data))
    assert e.value.status == 401


@pytest.mark.parametrize('patch', [{'rating': 6}, {'rating': True}, {'topic': 'unknown'}, {'format': 'embed'}, {'format': 'video', 'mediaUrl': 'javascript:alert(1)'}, {'format': 'soundtrack', 'mediaUrl': ''}, {'body': 'short'}, {'spoiler': 'yes'}, {'title': ''}, {'authorId': 'u-admin'}])
def test_validation(state, data, patch):
    with pytest.raises(core.Fault):
        new_post(state, {**data, **patch})


def test_nonadmin_cannot_approve(state, data):
    p = new_post(state, data)
    with pytest.raises(core.Fault):
        transact(state, lambda db: core.moderate(db, person(db), p['id'], {'decision': 'published', 'version': 1}))


def test_admin_post_publishes_immediately(state, data):
    p = transact(state, lambda db: core.save_post(db, person(db, 'admin'), data))
    assert p['status'] == 'published'
    with state() as db:
        assert p['id'] in [x['id'] for x in core.social(db, None)['posts']]


def test_requested_categories_and_media_types(state, data):
    for topic in ['soundtrack', 'anime', 'gaming', 'movies', 'tv', 'kpop', 'comic', 'manga', 'cosplay']:
        p = new_post(state, {**data, 'topic': topic})
        assert p['topic'] == topic and p['status'] == 'pending'
    video = new_post(state, {**data, 'format': 'video', 'mediaUrl': 'https://cdn.example.test/demo.webm'})
    audio = new_post(state, {**data, 'topic': 'soundtrack', 'format': 'soundtrack', 'mediaUrl': '/media/orbit.wav'})
    assert video['format'] == 'video' and video['mediaUrl'].startswith('https://')
    assert audio['format'] == 'soundtrack' and audio['mediaUrl'] == '/media/orbit.wav'


def test_duplicate_moderation(state, data):
    ident = approved(state, data)
    with pytest.raises(core.Fault) as e:
        transact(state, lambda db: core.moderate(db, person(db, 'admin'), ident, {'decision': 'published', 'version': 1}))
    assert e.value.status == 409


def test_edit_sends_back_to_review(state, data):
    ident = approved(state, data)
    edited = transact(state, lambda db: core.save_post(db, person(db), {**data, 'version': 2}, ident))
    assert edited['status'] == 'pending' and edited['version'] == 3


def test_ownership(state, data):
    ident = approved(state, data)
    with pytest.raises(core.Fault):
        transact(state, lambda db: core.save_post(db, db.get(User, 'sample-ha'), {**data, 'version': 2}, ident))


def test_reaction_replace_remove(state, data):
    ident = approved(state, data)
    for kind in ['like', 'like', 'heart']:
        transact(state, lambda db: core.react(db, person(db), ident, {'kind': kind}))
    with state() as db:
        rows = db.scalars(select(Reaction).where(Reaction.post_id == ident)).all()
        assert len(rows) == 1 and rows[0].kind == 'heart'
    transact(state, lambda db: core.react(db, person(db), ident, {'kind': None}))
    with state() as db:
        assert not db.get(Reaction, (ident, 'u-member'))


def test_comments_and_reply_depth(state, data):
    ident = approved(state, data)
    c = transact(state, lambda db: core.comment(db, person(db), ident, {'body': '<script>alert(1)</script>', 'parentId': None}))
    r = transact(state, lambda db: core.comment(db, person(db), ident, {'body': 'A thoughtful reply', 'parentId': c['id']}))
    with pytest.raises(core.Fault):
        transact(state, lambda db: core.comment(db, person(db), ident, {'body': 'Too deep', 'parentId': r['id']}))
    transact(state, lambda db: core.remove_comment(db, person(db), c['id']))
    with state() as db:
        public = core.social(db, None)
        assert '[Comment removed]' in [x['body'] for x in public['comments']]


def test_reply_wrong_post(state, data):
    ident = approved(state, data)
    with pytest.raises(core.Fault):
        transact(state, lambda db: core.comment(db, person(db), ident, {'body': 'wrong parent', 'parentId': 'comment-seed'}))


def test_report_and_hide(state, data):
    ident = approved(state, data)
    transact(state, lambda db: core.report(db, person(db), ident, {'reason': 'Personal information exposure', 'commentId': None}))
    with state() as db:
        report_id = db.scalar(select(Report.id).where(Report.post_id == ident))
        assert core.social(db, person(db))['reports'] == []
    with pytest.raises(core.Fault):
        transact(state, lambda db: core.report(db, person(db), ident, {'reason': 'Duplicate reason', 'commentId': None}))
    transact(state, lambda db: core.resolve_report(db, person(db, 'admin'), report_id, {'hide': True}))
    with state() as db:
        assert db.get(Post, ident).status == 'hidden'


def test_suspended_cannot_interact(state):
    with state.begin() as db:
        u = person(db); u.suspended = True
        with pytest.raises(core.Fault):
            core.react(db, u, 'post-city', {'kind': 'like'})


def test_unverified_cannot_interact(state, data):
    with state.begin() as db:
        u = person(db); u.verified = False
        with pytest.raises(core.Fault):
            core.save_post(db, u, data)


def test_quarter_timezone_boundary():
    assert core.quarter(datetime(2026, 9, 30, 16, 59, tzinfo=timezone.utc))['id'] == '2026-Q3'
    assert core.quarter(datetime(2026, 9, 30, 17, 0, tzinfo=timezone.utc))['id'] == '2026-Q4'
    q = core.quarter(datetime(2026, 12, 31, 18, 0, tzinfo=timezone.utc))
    assert q['id'] == '2027-Q1' and q['closes_at'].startswith('2027-03-31T17')


def enter_all(state):
    ident = core.quarter()['id']
    for uid in ['u-member', 'sample-minh', 'sample-linh', 'sample-ha']:
        transact(state, lambda db: core.enter(db, db.get(User, uid), ident, {'agree': True}))
    return ident


def test_entry_idempotent(state):
    ident = core.quarter()['id']
    a = transact(state, lambda db: core.enter(db, person(db), ident, {'agree': True}))
    b = transact(state, lambda db: core.enter(db, person(db), ident, {'agree': True}))
    assert a['ticket'] == b['ticket'] and b['alreadyEntered']


@pytest.mark.parametrize('role,agree', [('admin', True), ('member', False)])
def test_entry_policy(state, role, agree):
    with pytest.raises(core.Fault):
        transact(state, lambda db: core.enter(db, person(db, role), core.quarter()['id'], {'agree': agree}))


def test_entry_closed(state):
    with pytest.raises(core.Fault):
        transact(state, lambda db: core.enter(db, person(db), core.quarter()['id'], {'agree': True}, datetime.now(timezone.utc) + timedelta(days=150)))


def test_real_prizes_disabled(state):
    ident = core.quarter()['id']
    with state.begin() as db:
        db.get(Campaign, ident).demo = False
    with pytest.raises(core.Fault):
        transact(state, lambda db: core.enter(db, person(db), ident, {'agree': True}))


def test_freeze_requires_entries_and_rolls_back(state):
    ident = core.quarter()['id']
    with pytest.raises(core.Fault):
        transact(state, lambda db: core.freeze(db, person(db, 'admin'), ident))
    with state() as db:
        assert db.get(Campaign, ident).status == 'open'


def test_draw_record_and_proof(state):
    ident = enter_all(state)
    transact(state, lambda db: core.freeze(db, person(db, 'admin'), ident))
    result = transact(state, lambda db: core.draw(db, person(db, 'admin'), ident))
    assert len(result['winners']) == 3 and len(set(w['ticket'] for w in result['winners'])) == 3
    assert core.sha(result['seedReveal']) == result['seedCommitment']
    assert core.sha('\n'.join(result['snapshot'])) == result['snapshotHash']
    ranked = core.rank_tickets(result['seedReveal'], result['snapshotHash'], result['snapshot'])
    assert [w['ticket'] for w in result['winners']] == ranked[:3]
    repeated = transact(state, lambda db: core.draw(db, person(db, 'admin'), ident))
    assert repeated['winners'] == result['winners']


def test_one_entrant_one_prize(state):
    ident = core.quarter()['id']
    transact(state, lambda db: core.enter(db, person(db), ident, {'agree': True}))
    transact(state, lambda db: core.freeze(db, person(db, 'admin'), ident))
    result = transact(state, lambda db: core.draw(db, person(db, 'admin'), ident))
    assert len(result['winners']) == 1


def test_locked_no_more_entries(state):
    ident = core.quarter()['id']
    transact(state, lambda db: core.enter(db, person(db), ident, {'agree': True}))
    transact(state, lambda db: core.freeze(db, person(db, 'admin'), ident))
    with pytest.raises(core.Fault):
        transact(state, lambda db: core.enter(db, db.get(User, 'sample-ha'), ident, {'agree': True}))


def test_no_seed_leak_before_draw(state):
    with state() as db:
        public = core.public_campaign(db, None, 'current')
        assert 'privateSeed' not in public and 'private_seed' not in public and public['seedReveal'] is None
        assert public['myEntry'] is None


def test_draw_refuses_tamper(state):
    ident = enter_all(state)
    transact(state, lambda db: core.freeze(db, person(db, 'admin'), ident))
    with state.begin() as db:
        db.get(Campaign, ident).snapshot_hash = '0' * 64
    with pytest.raises(core.Fault):
        transact(state, lambda db: core.draw(db, person(db, 'admin'), ident))


def test_retrieval_and_spoilers(state):
    with state() as db:
        assert lore.retrieve(db, 'Explain Gojo Limitless')[0].id == 'gojo-limitless'
        assert 'spoiler-fixture' not in [d.id for d in lore.retrieve(db, 'Neon Horizon', True)]
        assert 'spoiler-fixture' in [d.id for d in lore.retrieve(db, 'Neon Horizon', False)]
        assert not lore.retrieve(db, 'Explain Gojo', True, 'Neon Horizon')
        assert not lore.retrieve(db, 'Summarize the movie Unknown Zebra 999')


def test_unpublished_not_retrieved(state):
    with state.begin() as db:
        db.get(Knowledge, 'gojo-limitless').status = 'draft'
    with state() as db:
        assert not lore.retrieve(db, 'Gojo Limitless')


def test_no_source_no_provider_call(state):
    class Never:
        def answer(self, *a):
            raise AssertionError('Must not call a model')
    result = transact(state, lambda db: lore.ask(db, 'test-owner', {'question': 'Unknown Zebra 999', 'spoilerSafe': True, 'topic': ''}, Never()))
    assert result['mode'] == 'no-source' and result['sources'] == []


def test_history_isolated_and_clear(state):
    transact(state, lambda db: lore.ask(db, 'owner1', {'question': 'Gojo', 'spoilerSafe': True, 'topic': ''}))
    with state() as db:
        assert len(lore.history(db, 'owner1')) == 2 and lore.history(db, 'owner2') == []
    transact(state, lambda db: lore.clear(db, 'owner1'))
    with state() as db:
        assert lore.history(db, 'owner1') == []


def test_followup_respects_filter(state):
    with state() as db:
        assert lore.retrieve(db, 'How does it work?', True, '', ['gojo-limitless'])[0].id == 'gojo-limitless'
        assert not lore.retrieve(db, 'How does it work?', True, 'Neon Horizon', ['gojo-limitless'])


def test_password_hash_and_session(state):
    digest = security.password_hash('test-safe-password-123')
    assert security.verify_password('test-safe-password-123', digest)
    assert not security.verify_password('wrong', digest)
    with state.begin() as db:
        u, token = security.login(db, {'email': 'fan@fanhub.demo', 'password': 'FanHubDemo!26'})
        db.flush()
        assert security.user_for_session(db, token).id == u.id
        assert db.get(AuthSession, core.sha(token)).token_hash != token


def test_register_does_not_elevate_role(state):
    with pytest.raises(core.Fault):
        transact(state, lambda db: security.register(db, {'name': 'Attacker', 'email': 'x@y.com', 'password': 'my test password 123', 'role': 'admin'}))


def test_rate_limiter(state):
    transact(state, lambda db: security.consume_rate(db, 'test', 1, at=1000))
    with pytest.raises(core.Fault) as e:
        transact(state, lambda db: security.consume_rate(db, 'test', 1, at=1000))
    assert e.value.status == 429
    transact(state, lambda db: security.consume_rate(db, 'test', 1, at=1061))
