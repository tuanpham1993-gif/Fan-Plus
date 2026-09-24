import json
from datetime import datetime
from pathlib import Path
from sqlalchemy import select
from app.models import User, UserSetting, Category, Fandom, FandomCategory, Resource, MediaAsset, EventDetail, CharacterProfile, MerchandiseItem, Genre, ResourceGenre, Tag, ResourceTag, utcnow
from app.common.security import hash_password
from .catalog import slugify

def seed_demo_data(db, password):
    """Idempotent initial seed only. Refuses to merge into a populated user database."""
    if db.scalar(select(User.id).limit(1)):
        return "Users already exist: seed skipped; no existing data changed."
    data = json.loads((Path(__file__).resolve().parents[2] / "seed" / "demo.json").read_text())
    for role, email in (("member", "fan@fanhub.demo"), ("admin", "admin@fanhub.demo")):
        user = User(id="demo-"+role, email=email, display_name="Demo "+role.title(), role=role, password_hash=hash_password(password), verified_at=utcnow())
        db.add(user)
    db.flush()
    for role in ("member", "admin"): db.add(UserSetting(user_id="demo-"+role))
    for order, c in enumerate(data["categories"]):
        db.add(Category(id=c["id"], slug=c["id"], name=c["name"], description=c.get("description", ""), sort_order=order))
    db.flush()
    fandoms = {}
    genres = {}
    tags = {}
    pairs = set()
    for c in data["contents"]:
        name = c.get("fandom")
        if name and name not in fandoms:
            f = Fandom(name=name, slug=slugify(name)); db.add(f); db.flush(); fandoms[name]=f.id
        if name and (name,c["categoryId"]) not in pairs:
            db.add(FandomCategory(fandom_id=fandoms[name], category_id=c["categoryId"])); pairs.add((name,c["categoryId"]))
    db.flush()
    for c in data["contents"]:
        asset = MediaAsset(owner_id="demo-admin", kind="image", storage_key=c["image"], mime_type="image/svg+xml", byte_size=0, approved=True, license_label="Original demo illustration", attribution="Fan Hub Plus development assets")
        # Reused cover paths point to one asset, not duplicate storage objects.
        existing = db.scalar(select(MediaAsset).where(MediaAsset.storage_key==c["image"]))
        if existing: asset=existing
        else: db.add(asset);db.flush()
        kind=c["type"]
        resource=Resource(id=c["id"],slug=slugify(c["title"]),title=c["title"],summary=c.get("description", c["title"]),body_markdown=c.get("body", ""),kind=kind,category_id=c["categoryId"],fandom_id=fandoms.get(c.get("fandom")),author_id="demo-admin",cover_media_id=asset.id,status="published",published_at=utcnow(),release_year=c.get("year"),has_spoilers=c.get("spoiler",False))
        db.add(resource);db.flush()
        if kind=="character": db.add(CharacterProfile(resource_id=resource.id,display_name=c["title"],biography_markdown=c.get("body","")))
        if kind=="merchandise": db.add(MerchandiseItem(resource_id=resource.id,maker="Fictional studio"))
        for field,Model,Link,cache,fk in (("genres",Genre,ResourceGenre,genres,"genre_id"),("tags",Tag,ResourceTag,tags,"tag_id")):
            for name in ([c["genre"]] if field=="genres" and c.get("genre") else c.get(field,[])):
                if name not in cache:
                    obj=Model(name=name);db.add(obj);db.flush();cache[name]=obj.id
                db.add(Link(resource_id=resource.id,**{fk:cache[name]}))
    from datetime import timezone
    for e in data["events"]:
        r=Resource(id=e["id"],slug=slugify(e["title"]),title=e["title"],summary=e["description"],kind="event",category_id=e["categoryId"],author_id="demo-admin",status="published",published_at=utcnow())
        db.add(r);db.flush()
        parse=lambda v:datetime.fromisoformat(v).astimezone(timezone.utc).replace(tzinfo=None)
        db.add(EventDetail(resource_id=r.id,city=e["city"],venue=e["venue"],latitude=e["lat"],longitude=e["lng"],starts_at=parse(e["startsAt"]),ends_at=parse(e["endsAt"]),timezone_name="Asia/Ho_Chi_Minh"))
    db.flush()
    return f"Seeded 2 users, {len(data['categories'])} categories, {len(data['contents'])} resources and {len(data['events'])} fictional events."
