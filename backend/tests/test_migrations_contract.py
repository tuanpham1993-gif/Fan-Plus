import json
from pathlib import Path
from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine,inspect
from sqlalchemy.schema import CreateTable
from sqlalchemy.dialects import mysql
from app.models import Base
ROOT=Path(__file__).resolve().parents[1]

def test_migration_upgrade_and_downgrade_sqlite(tmp_path,monkeypatch):
    url='sqlite:///'+str(tmp_path/'migration.db')
    monkeypatch.setenv('DATABASE_URL',url)
    config=Config(str(ROOT/'alembic.ini'))
    command.upgrade(config,'head')
    engine=create_engine(url)
    assert set(inspect(engine).get_table_names())==set(Base.metadata.tables)|{'alembic_version'}
    command.downgrade(config,'base')
    assert inspect(engine).get_table_names()==['alembic_version']
    engine.dispose()

def test_mysql_ddl_compiles_not_live_database():
    for table in Base.metadata.sorted_tables:
        assert 'CREATE TABLE' in str(CreateTable(table).compile(dialect=mysql.dialect()))

def test_openapi_local_references_and_endpoints():
    spec=json.loads((ROOT/'openapi.json').read_text())
    assert sum(len(v) for v in spec['paths'].values())==42
    assert '201' in spec['paths']['/api/v1/feedback']['post']['responses']
    assert spec['paths']['/api/v1/admin/resources']['post']['x-required-role']=='admin'
    assert spec['paths']['/api/v1/auth/login']['post']['requestBody']
    def visit(value):
        if isinstance(value,dict):
            if '$ref' in value:
                target=spec
                for part in value['$ref'][2:].split('/'):target=target[part]
            for nested in value.values():visit(nested)
        if isinstance(value,list):
            for nested in value:visit(nested)
    visit(spec)

def test_mysql_offline_migration_preserves_circular_foreign_keys(monkeypatch):
    import io
    buffer=io.StringIO()
    config=Config(str(ROOT/'alembic.ini'),output_buffer=buffer)
    monkeypatch.setenv('DATABASE_URL','mysql+pymysql://test:test@localhost/fanhub')
    command.upgrade(config,'head',sql=True)
    sql=buffer.getvalue()
    assert 'ALTER TABLE media_assets ADD CONSTRAINT fk_media_assets_owner_id_users' in sql
    assert 'ALTER TABLE users ADD CONSTRAINT fk_users_avatar_media_id_media_assets' in sql
