import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session
from app.models import Base, User, Category, Resource, utcnow
from app.common.security import hash_password

@pytest.fixture(scope="session")
def password_hash(): return hash_password("TestPassword!26")

@pytest.fixture
def db():
    engine = create_engine("sqlite://")
    @event.listens_for(engine,"connect")
    def enable_fk(connection,_):connection.execute("PRAGMA foreign_keys=ON")
    Base.metadata.create_all(engine)
    with Session(engine, expire_on_commit=False) as session:
        yield session
        session.rollback()
    engine.dispose()

@pytest.fixture
def people(db,password_hash):
    result={}
    for role,uid in (("admin","admin"),("member","alice"),("member","bob")):
        result[uid]=User(id=uid,email=uid+"@test.example",display_name=uid.title(),role=role,password_hash=password_hash,verified_at=utcnow())
        db.add(result[uid])
    db.add(Category(id="anime",slug="anime",name="Anime"))
    db.add(Category(id="gaming",slug="gaming",name="Gaming"))
    db.commit()
    return result

@pytest.fixture
def content(db,people):
    resource=Resource(id="r1",slug="story",title="Original story",summary="A fictional story for testing.",body_markdown="Original text",kind="article",category_id="anime",author_id="admin",status="published",published_at=utcnow(),release_year=2026)
    db.add(resource);db.commit();return resource
