"""Explicit local setup and editorial ingestion commands; never a public endpoint."""
import argparse, json, os
from pathlib import Path
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass
from sqlalchemy import select, delete
from sqlalchemy.schema import CreateTable, CreateIndex
from sqlalchemy.dialects import mysql
from fanhub.models import *
from fanhub import core, security

ROOT = Path(__file__).resolve().parent


def seed_demo(db):
    seed = json.loads((ROOT / 'seed/demo.json').read_text(encoding='utf-8'))
    people = [('u-member', 'Alex Morgan', 'fan@fanhub.demo', 'member'), ('u-admin', 'Studio Admin', 'admin@fanhub.demo', 'admin'), ('sample-minh', 'Minh Anh', 'minh@sample.invalid', 'member'), ('sample-linh', 'Linh Tran', 'linh@sample.invalid', 'member'), ('sample-ha', 'Ha Nguyen', 'ha@sample.invalid', 'member')]
    for ident, name, email, role in people:
        if not db.get(User, ident):
            db.add(User(id=ident, name=name, email=email, role=role, verified=True, password_hash=security.password_hash('FanHubDemo!26' if ident.startswith('u-') else os.urandom(32).hex())))
    db.flush()
    for p in seed['social']['posts']:
        if not db.get(Post, p['id']):
            db.add(Post(id=p['id'], author_id=p['authorId'], title=p['title'], subject=p['subject'], body=p['body'], topic=p['topic'], content_type=p.get('format', 'post'), media_url=p.get('mediaUrl', ''), spoiler=p['spoiler'], rating=p['rating'], status=p['status'], reason=p['reason'], version=p['version'], sample=True, created_at=p['createdAt']))
    db.flush()
    for c in seed['social']['comments']:
        if not db.get(Comment, c['id']):
            db.add(Comment(id=c['id'], post_id=c['postId'], author_id=c['authorId'], parent_id=c['parentId'], body=c['body'], hidden=c['hidden'], created_at=c['createdAt']))
    for r in seed['social']['reactions']:
        if not db.get(Reaction, (r['postId'], r['userId'])):
            db.add(Reaction(post_id=r['postId'], user_id=r['userId'], kind=r['kind']))
    ingest(db, seed['knowledge'], replace=False)
    core.create_campaign(db)


def ingest(db, items, replace=True):
    if not isinstance(items, list) or len(items) > 1000:
        raise ValueError('Input must be a list with at most 1,000 source notes.')
    for item in items:
        core.fields(item, {'id', 'title', 'topic', 'aliases', 'body', 'spoilerLevel', 'status', 'sourceLabel', 'sample', 'relatedPath'})
        ident = core.text(item.get('id'), 1, 80, 'Source ID')
        if not __import__('re').fullmatch(r'[a-z0-9-]+', ident):
            raise ValueError('Source IDs use lowercase letters, digits and hyphens.')
        if item.get('status') not in ('draft', 'published') or type(item.get('spoilerLevel')) is not int or item['spoilerLevel'] < 0 or type(item.get('sample')) is not bool:
            raise ValueError('Invalid source metadata.')
        aliases = item.get('aliases', [])
        if not isinstance(aliases, list) or len(aliases) > 30 or not all(isinstance(a, str) and 1 <= len(a) <= 100 for a in aliases):
            raise ValueError('Invalid aliases.')
        related = item.get('relatedPath')
        if related and (not related.startswith('/content/') or len(related) > 250):
            raise ValueError('Only local catalog links are accepted.')
        values = dict(title=core.text(item.get('title'), 3, 200, 'Title'), topic=core.text(item.get('topic'), 1, 100, 'Topic'), aliases=aliases, body=core.text(item.get('body'), 20, 20000, 'Source text'), spoiler_level=item['spoilerLevel'], status=item['status'], source_label=core.text(item.get('sourceLabel'), 5, 500, 'Provenance'), sample=item['sample'], related_path=related)
        old = db.get(Knowledge, ident)
        if old and replace:
            for k, v in values.items():
                setattr(old, k, v)
        elif not old:
            db.add(Knowledge(id=ident, **values))
    db.flush()


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('init-demo', help='Create local schema and sample data; never run against a production database.')
    sub.add_parser('open-quarter', help='Create the current calendar-quarter DEMO campaign; no reset/reroll.')
    verify = sub.add_parser('verify-user'); verify.add_argument('email')
    ingest_p = sub.add_parser('ingest'); ingest_p.add_argument('json_file')
    sub.add_parser('schema-mysql')
    sub.add_parser('prune', help='Delete chat records older than 30 days and rate counters older than 2 days.')
    args = parser.parse_args()
    if args.command == 'schema-mysql':
        destination = ROOT / 'schema/mysql.sql'; destination.parent.mkdir(exist_ok=True)
        with destination.open('w', encoding='utf-8') as out:
            out.write('-- V3 EXTENSION BASELINE ONLY. No data. Apply to a new database.\n')
            for table in Base.metadata.sorted_tables:
                out.write(str(CreateTable(table).compile(dialect=mysql.dialect())) + ';\n')
                for index in table.indexes:
                    out.write(str(CreateIndex(index).compile(dialect=mysql.dialect())) + ';\n')
        print(destination); return
    engine, factory = database(os.environ.get('DATABASE_URL', 'sqlite:///fanhub-demo.db'))
    if args.command == 'init-demo':
        Base.metadata.create_all(engine)
        with factory.begin() as db:
            seed_demo(db)
        print('Demo initialized. Sample member/admin passwords: FanHubDemo!26. Never use this database publicly.')
    elif args.command == 'open-quarter':
        with factory.begin() as db:
            c = core.create_campaign(db)
            print(c.id, c.status, 'DEMO ONLY; existing results unchanged.')
    elif args.command == 'verify-user':
        with factory.begin() as db:
            u = db.scalar(select(User).where(User.email == args.email.lower()))
            if not u:
                raise ValueError('Account not found.')
            u.verified = True
        print('Administrator verification recorded. This did not send an email.')
    elif args.command == 'ingest':
        with factory.begin() as db:
            ingest(db, json.loads(Path(args.json_file).read_text(encoding='utf-8')))
        print('Editorial notes ingested. Publication and source accuracy are operator responsibilities.')
    elif args.command == 'prune':
        from datetime import datetime, timezone, timedelta
        import time
        cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat().replace('+00:00', 'Z')
        with factory.begin() as db:
            db.execute(delete(ChatMessage).where(ChatMessage.created_at < cutoff))
            # Window keys differ; daily slot rows are very small and may be removed,
            # so retain both contemporary day and minute ranges using a safe bound.
            minute_cutoff = int(time.time()) // 60 - 2880
            day_cutoff = int(time.time()) // 86400 - 2
            db.execute(delete(RateBucket).where((RateBucket.minute < day_cutoff) | ((RateBucket.minute > 1000000) & (RateBucket.minute < minute_cutoff))))
            expiry = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
            db.execute(delete(AuthSession).where(AuthSession.expires_at < expiry))
        print('Expired records pruned.')
    engine.dispose()

if __name__ == '__main__':
    main()
