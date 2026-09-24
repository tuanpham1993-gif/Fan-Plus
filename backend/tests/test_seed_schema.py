from sqlalchemy import inspect,select,func
from app.models import Base,Resource,Category,User
from app.services.seed import seed_demo_data

def test_schema_has_expected_tables(db):
    assert len(Base.metadata.tables)==31
    assert set(inspect(db.bind).get_table_names())==set(Base.metadata.tables)

def test_seed_safe_and_idempotent(db):
    result=seed_demo_data(db,"SeedPassword!26");db.commit()
    assert "Seeded" in result
    assert db.scalar(select(func.count()).select_from(User))==2
    assert db.scalar(select(func.count()).select_from(Category))==8
    assert db.scalar(select(func.count()).select_from(Resource))==28
    assert "skipped" in seed_demo_data(db,"DifferentPassword!26")
